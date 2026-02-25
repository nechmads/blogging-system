/**
 * Clerk webhook handler.
 *
 * Receives Clerk webhook events, verifies the Svix signature,
 * and sends email notifications via Resend.
 *
 * Setup:
 * 1. Go to Clerk Dashboard > Webhooks > Add Endpoint
 * 2. URL: https://hotmetalapp.com/webhooks/clerk
 * 3. Subscribe to: waitlist_entry.created
 * 4. Copy the Signing Secret → `wrangler secret put CLERK_WEBHOOK_SECRET`
 * 5. Set RESEND_API_KEY via `wrangler secret put RESEND_API_KEY`
 * 6. Set NOTIFICATION_EMAIL in wrangler.jsonc vars (not a secret)
 */

import { Hono } from "hono";
import { Webhook } from "svix";
import { Resend } from "resend";
import type { AppEnv } from "../server";

const webhooks = new Hono<AppEnv>();

webhooks.post("/clerk", async (c) => {
  const secret = c.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET not configured");
    return c.json({ error: "Webhook not configured" }, 500);
  }

  const svixId = c.req.header("svix-id");
  const svixTimestamp = c.req.header("svix-timestamp");
  const svixSignature = c.req.header("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: "Missing svix headers" }, 400);
  }

  const body = await c.req.text();

  let payload: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof payload;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return c.json({ error: "Invalid signature" }, 400);
  }

  if (payload.type === "waitlistEntry.created") {
    const email = (payload.data.email_address ?? payload.data.emailAddress) as
      | string
      | undefined;
    console.log(
      `[Webhook] New waitlist entry: ${email ?? "unknown"}`,
      JSON.stringify(payload.data),
    );

    try {
      await sendWaitlistNotification(c.env, email);
    } catch (err) {
      console.error("Failed to send waitlist notification email:", err);
      // Don't return error to Clerk — we received the webhook successfully
    }
  } else {
    console.log(`[Webhook] Unhandled event type: ${payload.type}`);
  }

  return c.json({ received: true });
});

async function sendWaitlistNotification(
  env: Pick<Env, "RESEND_API_KEY" | "NOTIFICATION_EMAIL">,
  email?: string,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.NOTIFICATION_EMAIL) {
    console.warn(
      "RESEND_API_KEY or NOTIFICATION_EMAIL not configured, skipping email",
    );
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Hot Metal <subscriptions@mail.hotmetalapp.com>",
    to: env.NOTIFICATION_EMAIL,
    subject: `New waitlist signup${email ? `: ${email}` : ""}`,
    text: [
      "Someone just joined the Hot Metal waitlist!",
      "",
      email ? `Email: ${email}` : "Email not available in webhook payload.",
      "",
      `Time: ${new Date().toISOString()}`,
    ].join("\n"),
  });
}

export default webhooks;
