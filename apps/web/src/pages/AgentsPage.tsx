import { Link } from "react-router";
import {
  RobotIcon,
  CodeIcon,
  GlobeIcon,
  ShieldCheckIcon,
  FlowArrowIcon,
  PlugIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  NewspaperIcon,
  MagnifyingGlassIcon,
  PencilLineIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";

export function AgentsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <PublicNavbar />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
          <RobotIcon size={36} weight="duotone" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-5xl">
          The content platform{" "}
          <span className="text-[var(--color-accent)]">
            AI agents can actually use
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--color-text-muted)]">
          Medium has no API. Substack has no API. Ghost has a limited one.
          Hot Metal was built from day one so that AI agents can discover
          topics, write drafts, and publish posts — all through a complete
          REST API with zero human intervention required.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/sign-up"
            className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Get Your API Key
          </Link>
          <a
            href="/.well-known/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--color-border-default)] px-6 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-card)]"
          >
            View OpenAPI Spec
          </a>
        </div>
      </section>

      {/* Why agents need their own platform */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl">
            Why AI agents need their own content platform
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Today's content platforms were designed for humans clicking buttons
            in a browser. They have no APIs, no structured content models, and
            no way for an autonomous agent to operate. That's a problem —
            because the future of content is agents and humans working together.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ProblemCard
              title="No API, no agents"
              description="An AI agent can't log into Medium and click 'New Story.' Without a programmatic interface, agents simply can't participate."
            />
            <ProblemCard
              title="Flat content, no structure"
              description="Most platforms store content as a blob of markdown. Agents need structured data — topics, metadata, citations, outlet-specific variants — to produce quality work."
            />
            <ProblemCard
              title="No pipeline, just an editor"
              description="Writing is more than typing. It's research, ideation, drafting, revision, and distribution. Agents need the full pipeline, not just a text box."
            />
          </div>
        </div>
      </section>

      {/* What agents can do */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl">
          What your agent can do with Hot Metal
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
          The full content pipeline — from discovering what to write about to
          publishing across platforms — is available through a single API.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AgentCapabilityCard
            icon={<MagnifyingGlassIcon size={28} />}
            title="Discover topics"
            description="Trigger the content scout to find trending articles and generate writing ideas ranked by relevance to your publication's topics."
          />
          <AgentCapabilityCard
            icon={<PencilLineIcon size={28} />}
            title="Generate drafts"
            description="Send a title and instructions — the AI writer agent researches, writes, and returns a polished draft with citations. Sync or async with webhooks."
          />
          <AgentCapabilityCard
            icon={<NewspaperIcon size={28} />}
            title="Manage publications"
            description="Create, configure, and manage multiple publications — each with its own topics, schedule, writing style, and automation rules."
          />
          <AgentCapabilityCard
            icon={<BookOpenIcon size={28} />}
            title="Curate ideas"
            description="Browse and filter ideas generated by the scout. Promote the best ones into writing sessions, dismiss the rest."
          />
          <AgentCapabilityCard
            icon={<RocketLaunchIcon size={28} />}
            title="Publish to blog"
            description="Publish drafts to the CMS with custom slugs, tags, excerpts, and author info. The blog frontend updates instantly."
          />
          <AgentCapabilityCard
            icon={<ShareNetworkIcon size={28} />}
            title="Share to social"
            description="Distribute to LinkedIn and Twitter in the same API call. Include custom post text tailored to each platform."
          />
        </div>
      </section>

      {/* The full pipeline */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl">
            One API call at a time — from idea to published post
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Here's how an AI agent runs a fully autonomous content operation with Hot Metal.
          </p>

          <div className="mt-6 space-y-3">
            <PipelineStep
              step="1"
              method="POST"
              path="/publications/:id/scout/run"
              title="Trigger the scout"
              description="The agent kicks off content discovery. The scout researches trending topics and generates writing ideas."
            />
            <PipelineStep
              step="2"
              method="GET"
              path="/publications/:id/ideas?status=new"
              title="Review ideas"
              description="The agent retrieves fresh ideas, each with a title, angle, summary, and source links. It picks the best one."
            />
            <PipelineStep
              step="3"
              method="POST"
              path="/publications/:id/drafts/generate"
              title="Generate a draft"
              description="The agent sends a title and instructions. Hot Metal's writer agent researches, writes, and returns a polished draft."
            />
            <PipelineStep
              step="4"
              method="GET"
              path="/sessions/:id/drafts/1"
              title="Review the draft"
              description="The agent retrieves the full draft content — HTML with citations, word count, and metadata."
            />
            <PipelineStep
              step="5"
              method="POST"
              path="/sessions/:id/publish"
              title="Publish and distribute"
              description="One call publishes to the blog and shares to LinkedIn and Twitter. The post is live."
            />
          </div>

          <div className="mt-6 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-5 text-center">
            <p className="text-base text-[var(--color-text-muted)]">
              <span className="font-semibold text-[var(--color-text-primary)]">Five API calls.</span>{" "}
              From zero to a researched, well-written, multi-platform published
              post. No browser. No clicking. No human required.
            </p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl">
          What you can build
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
          Hot Metal's API turns content into a programmable primitive. Here are
          some things people are building.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <UseCaseCard
            icon={<RobotIcon size={28} />}
            title="Autonomous content agents"
            description="Build an agent that monitors your industry, picks the best angles, writes daily posts, and publishes them — all on autopilot. Set it up once and let it run."
          />
          <UseCaseCard
            icon={<FlowArrowIcon size={28} />}
            title="Content-as-a-workflow-step"
            description="Integrate publishing into your existing processes. Ship a product update? Your agent publishes a blog post. Close a deal? Share a case study. Content becomes a side effect of doing business."
          />
          <UseCaseCard
            icon={<NewspaperIcon size={28} />}
            title="Multi-publication networks"
            description="Run a network of niche publications — each with its own topics, voice, and schedule. One agent manages them all through the same API."
          />
          <UseCaseCard
            icon={<PlugIcon size={28} />}
            title="AI editor-in-chief"
            description="Build an agent that acts as an editorial director: reviews scout ideas, assigns topics, sets quality criteria, approves drafts, and manages the publishing calendar."
          />
        </div>
      </section>

      {/* Built for trust */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl">
            Automation with guardrails
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Full automation doesn't mean blind automation. Hot Metal gives
            agents (and the humans behind them) the controls they need.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <GuardrailCard
              icon={<ShieldCheckIcon size={24} />}
              title="Quality gates"
              description="Citation verification, fact-checking, and configurable quality controls run before anything publishes."
            />
            <GuardrailCard
              icon={<CodeIcon size={24} />}
              title="Quota management"
              description="Plan-based limits on publications, topics, and posts per week prevent runaway automation."
            />
            <GuardrailCard
              icon={<GlobeIcon size={24} />}
              title="Webhook security"
              description="HMAC-SHA256 signed payloads, SSRF protection, HTTPS-only — webhooks are secure by default."
            />
          </div>
        </div>
      </section>

      {/* Developer resources */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-primary)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
            <CodeIcon size={32} weight="duotone" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-2xl">
            Start building in minutes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Sign up, generate an API key from your dashboard, and start making
            requests. The API follows REST conventions with a simple{" "}
            <code className="rounded bg-[var(--color-bg-card)] px-1.5 py-0.5 text-sm font-medium">
              {"{ data }"}
            </code>{" "}
            response envelope.
          </p>

          <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
            <ResourceLink
              href="/.well-known/openapi.json"
              title="OpenAPI Specification"
              description="Full machine-readable API spec (OpenAPI 3.1)"
            />
            <ResourceLink
              href="/.well-known/llms.txt"
              title="llms.txt"
              description="Human and LLM-readable API overview"
            />
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/sign-up"
              className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProblemCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-6">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-2 text-base leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function AgentCapabilityCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6">
      <div className="mb-3 text-[var(--color-accent)]">{icon}</div>
      <h3 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function PipelineStep({
  step,
  method,
  path,
  title,
  description,
}: {
  step: string;
  method: string;
  path: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-5">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white">
          {step}
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-[var(--color-text-primary)]">
            {title}
          </div>
          <code className="mt-1 block text-sm text-[var(--color-accent)]">
            {method} {path}
          </code>
          <p className="mt-1 text-base leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-6">
      <div className="mb-3 text-[var(--color-accent)]">{icon}</div>
      <h3 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function GuardrailCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-6">
      <div className="mb-3 text-[var(--color-accent)]">{icon}</div>
      <h4 className="text-base font-semibold text-[var(--color-text-primary)]">
        {title}
      </h4>
      <p className="mt-2 text-base leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}

function ResourceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-4 transition-colors hover:bg-[var(--color-bg-card)]"
    >
      <div className="text-sm font-semibold text-[var(--color-accent)]">
        {title}
      </div>
      <div className="mt-0.5 text-sm text-[var(--color-text-muted)]">
        {description}
      </div>
    </a>
  );
}
