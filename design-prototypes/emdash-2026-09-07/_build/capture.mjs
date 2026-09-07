#!/usr/bin/env node
// Screenshot a local HTML file with headless Chrome over the DevTools protocol.
// No dependencies: uses Node's built-in WebSocket (Node 22+) and fetch.
//
//   node capture.mjs <file.html> <out.png> [--width 1440] [--dpr 1]
//                    [--full | --height 900] [--scroll 0] [--reduced-motion]
//                    [--accent #hex] [--eval "js expression"]
//
// --accent sets --publication-accent on <html> before capture (test hostile
// hexes). --eval prints the JSON result of an expression after load (use it to
// read computed colours or document height); pass "-" as <out.png> to skip
// the screenshot. Console errors and uncaught exceptions are echoed to stderr.
//
// --full captures the whole document. Chrome silently corrupts full-page
// captures past ~16384 device pixels, so --full lowers dpr to 1 when the page
// is taller than 8000 CSS px and a page that still exceeds the
// limit is split into sequential 8000px bands named out-1.png, out-2.png... A fixed-position
// element paints only once in a full-page shot, so designs with fixed panels
// must also be captured as viewport shots at scroll offsets.

import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const LIMIT = 16384;

const args = process.argv.slice(2);
if (args.length < 2) { console.error("usage: capture.mjs <file.html> <out.png> [options]"); process.exit(1); }
const [file, out] = args;
const opt = (name, def) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : def; };
const flag = (name) => args.includes("--" + name);
const width = Number(opt("width", 1440));
let dpr = Number(opt("dpr", 1));
const full = flag("full");
const height = Number(opt("height", 900));
const scroll = Number(opt("scroll", 0));
const reduced = flag("reduced-motion");
const accent = opt("accent", null);
const evalExpr = opt("eval", null);

const profile = mkdtempSync(join(tmpdir(), "capture-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
  "--disable-gpu", "--allow-file-access-from-files", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });

let port;
await new Promise((res, rej) => {
  chrome.stderr.on("data", (d) => {
    const m = String(d).match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
    if (m) { port = m[1]; res(); }
  });
  chrome.on("exit", (c) => rej(new Error("chrome exited " + c)));
  setTimeout(() => rej(new Error("chrome did not start")), 15000);
});

const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0; const pending = new Map(); const events = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (m.method) {
    events.push(m);
    if (m.method === "Runtime.exceptionThrown") console.error("EXCEPTION:", m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) console.error("CONSOLE " + m.params.type + ":", m.params.args.map((a) => a.value ?? a.description).join(" "));
  }
};
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await send("Page.enable");
  await send("Runtime.enable");
  if (reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: dpr, mobile: width < 700 });
  await send("Page.navigate", { url: pathToFileURL(resolve(file)).href });
  for (let i = 0; i < 100 && !events.some((e) => e.method === "Page.loadEventFired"); i++) await sleep(50);
  if (accent) await evaluate(`document.documentElement.style.setProperty("--publication-accent", ${JSON.stringify(accent)}); true`);
  await evaluate("document.fonts.ready.then(() => true)");
  if (evalExpr) console.log(JSON.stringify(await evaluate(evalExpr)));
  if (out === "-") { process.exitCode = 0; throw Object.assign(new Error("skip"), { skip: true }); }
  // Prime scroll-triggered reveals, then return to the requested offset.
  await evaluate("(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 800) { window.scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); } window.scrollTo(0, 0); return true; })()");
  await sleep(450); // let scroll-driven transitions settle after priming

  // Viewport shots must not use captureBeyondViewport: under mobile emulation
  // it expands the capture surface, which displaces sticky/fixed elements and
  // fires IntersectionObservers for content that is not actually on screen.
  const capture = async (clip, path, beyond = true) => {
    const shot = await send("Page.captureScreenshot", { format: "png", clip, captureBeyondViewport: beyond, fromSurface: true });
    writeFileSync(path, Buffer.from(shot.data, "base64"));
  };
  if (full) {
    const docH = await evaluate("Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))");
    if (docH > 8000 && dpr > 1) dpr = 1;
    if (docH * dpr <= LIMIT) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: docH, deviceScaleFactor: dpr, mobile: width < 700 });
      await sleep(150);
      await capture({ x: 0, y: 0, width, height: docH, scale: 1 }, out);
      console.log(`full page ${width}x${docH} @${dpr}x -> ${out}`);
    } else {
      // Too tall for one surface: write sequential bands out-1.png, out-2.png, ...
      const band = 8000, n = Math.ceil(docH / band);
      await send("Emulation.setDeviceMetricsOverride", { width, height: band, deviceScaleFactor: dpr, mobile: width < 700 });
      await sleep(150);
      for (let i = 0; i < n; i++) {
        const y = i * band, h = Math.min(band, docH - y);
        await evaluate(`window.scrollTo(0, ${y}); true`); await sleep(120);
        const path = out.replace(/\.png$/, `-${i + 1}.png`);
        await capture({ x: 0, y, width, height: h, scale: 1 }, path);
        console.log(`band ${i + 1}/${n} y=${y} h=${h} -> ${path}`);
      }
    }
  } else {
    if (scroll) { await evaluate(`window.scrollTo(0, ${scroll}); true`); await sleep(150); }
    const y = await evaluate("window.scrollY");
    await capture({ x: 0, y, width, height, scale: 1 }, out, false);
    console.log(`viewport ${width}x${height} @${dpr}x, scrollY=${y} -> ${out}`);
  }
} catch (e) {
  if (!e.skip) throw e;
} finally {
  ws.close(); chrome.kill();
  // Chrome may still be writing its profile for a moment after SIGTERM.
  await new Promise((r) => chrome.on("exit", r));
  for (let i = 0; i < 5; i++) { try { rmSync(profile, { recursive: true, force: true }); break; } catch { await sleep(200); } }
}
