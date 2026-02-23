import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import { PublicNavbar } from "@/components/public/PublicNavbar";

const RSS_URL = "https://hot-metal-story.hotmetalapp.com/rss";

type BlogPost = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

function parseRssFeed(xml: string): BlogPost[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.warn("RSS parse error:", parseError.textContent);
    return [];
  }

  const items = doc.querySelectorAll("item");

  return Array.from(items).map((item) => ({
    title: item.querySelector("title")?.textContent ?? "",
    link: item.querySelector("link")?.textContent ?? "",
    description: stripHtml(
      item.querySelector("description")?.textContent ?? ""
    ),
    pubDate: item.querySelector("pubDate")?.textContent ?? "",
  }));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogPage() {
  return <BlogContent />;
}

export function BlogContent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(RSS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch RSS feed`);
        return res.text();
      })
      .then((xml) => {
        setPosts(parseRssFeed(xml));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <PublicNavbar />

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-10 md:pt-16">
        {/* Hero */}
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-4xl">
            Blog
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Behind the scenes of building Hot Metal — product updates, writing
            experiments, and lessons learned shipping an AI content engine.
          </p>
        </div>

        {/* Posts */}
        <div className="mt-10">
          {loading ? (
            <div className="py-12 text-center text-[var(--color-text-muted)]">
              Loading posts...
            </div>
          ) : error ? (
            <div className="py-12 text-center text-[var(--color-text-muted)]">
              Couldn't load posts right now. Check back soon.
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-[var(--color-text-muted)]">
              No posts yet — stay tuned.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <BlogPostCard key={post.link} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8 text-center">
          <h3 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl">
            Want early access?
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Join the waitlist and we'll onboard you in small batches.
            Consistency loves company.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/waitlist"
              className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Join the waitlist
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-[var(--color-border-default)] px-6 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-card)]"
            >
              Back to landing
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--color-border-default)] px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
        <span className="font-medium text-[var(--color-text-primary)]">
          Hot Metal
        </span>
        <span className="mx-2">·</span>
        <Link to="/about" className="hover:underline">
          About
        </Link>
        <span className="mx-2">·</span>
        <Link to="/faq" className="hover:underline">
          FAQ
        </Link>
        <span className="mx-2">·</span>
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:underline">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link to="/terms" className="hover:underline">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link to="/waitlist" className="hover:underline">
          Waitlist
        </Link>
      </footer>
    </div>
  );
}

function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6 transition-colors hover:border-[var(--color-accent)]"
    >
      {post.pubDate ? (
        <time className="text-sm text-[var(--color-text-muted)]">
          {formatDate(post.pubDate)}
        </time>
      ) : null}
      <h2 className="mt-2 text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
        {post.title}
      </h2>
      {post.description ? (
        <p className="mt-2 text-base leading-relaxed text-[var(--color-text-muted)]">
          {post.description}
        </p>
      ) : null}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] group-hover:underline">
        Read more
        <ArrowSquareOutIcon size={16} />
      </span>
    </a>
  );
}
