import { Link } from "react-router";
import { PublicNavbar } from "@/components/public/PublicNavbar";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <PublicNavbar />

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-10 md:pt-16">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8 md:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Last updated: February 15, 2026
          </p>

          <div className="prose prose-slate mt-8 max-w-none">
            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                1. Introduction
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Welcome to Hot Metal, operated by Far Far Away Labs ("we," "us," or "our"). We are
                committed to protecting your privacy and ensuring you understand how we collect, use,
                and safeguard your information. This Privacy Policy applies to{" "}
                <a
                  href="https://hotmetal.app"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  hotmetal.app
                </a>{" "}
                and all related services.
              </p>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                By using Hot Metal, you agree to the collection and use of information in accordance
                with this policy. If you do not agree with any part of this policy, please do not use
                our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                2. Information We Collect
              </h2>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                2.1 Information You Provide
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                When you create an account or use Hot Metal, you may provide us with:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Account information (name, email address, password)</li>
                <li>Profile information and preferences</li>
                <li>Content you create, draft, or publish through our platform</li>
                <li>Communications with us (support requests, feedback)</li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                2.2 Connected Account Information
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                When you connect third-party accounts to Hot Metal, we collect:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>
                  <strong>LinkedIn:</strong> Profile information, connection data, and permissions to
                  post content on your behalf when you authorize publishing
                </li>
                <li>
                  <strong>X (formerly Twitter):</strong> Profile information, account handle, and
                  permissions to post content on your behalf when you authorize publishing
                </li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                We only access the minimum information necessary to provide our services. You can
                disconnect these accounts at any time through your account settings.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                2.3 Automatically Collected Information
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We automatically collect certain information when you use our service:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Usage data (features used, pages viewed, time spent)</li>
                <li>Device information (browser type, operating system, IP address)</li>
                <li>Log data (access times, error logs, referral URLs)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                3. How We Use Your Information
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We use the information we collect to:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Provide, maintain, and improve our services</li>
                <li>
                  Process and publish content to your connected platforms (LinkedIn, X) when you
                  authorize it
                </li>
                <li>Generate AI-assisted content drafts and suggestions</li>
                <li>Communicate with you about your account and service updates</li>
                <li>Respond to your support requests and feedback</li>
                <li>Monitor and analyze usage patterns to improve user experience</li>
                <li>Detect, prevent, and address technical issues or fraudulent activity</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                4. AI and Content Processing
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Hot Metal uses artificial intelligence to help you create content. Here's how we handle
                your data:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>
                  Your content (ideas, drafts, published posts) is processed by AI models to generate
                  suggestions and variations
                </li>
                <li>
                  We may use third-party AI providers (such as OpenAI, Anthropic, or others) to process
                  your content
                </li>
                <li>
                  We do not use your content to train third-party AI models unless you explicitly opt
                  in
                </li>
                <li>You retain all rights to content you create on Hot Metal</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                5. Information Sharing and Disclosure
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We do not sell your personal information. We may share your information in the
                following circumstances:
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.1 Third-Party Platforms
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                When you authorize us to publish content to LinkedIn, X, or other platforms, we share
                only the content and metadata necessary to complete the publishing action.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.2 Service Providers
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We work with trusted third-party service providers who help us operate our platform:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Cloud infrastructure providers (Cloudflare)</li>
                <li>Authentication services (Clerk)</li>
                <li>Payment processors</li>
                <li>AI and natural language processing services</li>
                <li>Analytics and monitoring services</li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                These providers are contractually obligated to protect your information and use it only
                for the services they provide to us.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.3 Legal Requirements
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We may disclose your information if required by law, legal process, or government
                request, or to protect the rights, property, or safety of Hot Metal, our users, or
                others.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.4 Business Transfers
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                If Far Far Away Labs is involved in a merger, acquisition, or sale of assets, your
                information may be transferred as part of that transaction. We will notify you of any
                such change and any choices you may have.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                6. Data Security
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Data encryption in transit (TLS/SSL)</li>
                <li>Data encryption at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication</li>
                <li>Secure infrastructure hosted on Cloudflare</li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                However, no method of transmission over the Internet or electronic storage is 100%
                secure. While we strive to protect your information, we cannot guarantee absolute
                security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                7. Data Retention
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We retain your information for as long as your account is active or as needed to provide
                services. You can request deletion of your account and associated data at any time. We
                may retain certain information for legitimate business purposes or as required by law,
                such as:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Backup copies (deleted within 90 days)</li>
                <li>Transaction records for accounting purposes</li>
                <li>Logs for security and fraud prevention</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                8. Your Privacy Rights
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You have the following rights regarding your personal information:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>
                  <strong>Access:</strong> Request a copy of your personal information
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account and data
                </li>
                <li>
                  <strong>Portability:</strong> Export your content in a standard format
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from marketing communications
                </li>
                <li>
                  <strong>Restriction:</strong> Limit how we process your information
                </li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@farfarawaylabs.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  privacy@farfarawaylabs.com
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                9. International Data Transfers
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Hot Metal is operated from the United States. If you are accessing our service from
                outside the United States, your information may be transferred to, stored, and processed
                in the United States or other countries. By using our service, you consent to this
                transfer. We ensure appropriate safeguards are in place to protect your information in
                accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                10. Children's Privacy
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Hot Metal is not intended for children under 13 years of age. We do not knowingly
                collect personal information from children under 13. If you believe we have collected
                information from a child under 13, please contact us immediately, and we will take steps
                to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                11. Cookies and Tracking Technologies
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We use cookies and similar technologies to improve your experience:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>
                  <strong>Essential cookies:</strong> Required for authentication and core functionality
                </li>
                <li>
                  <strong>Analytics cookies:</strong> Help us understand how users interact with our
                  service
                </li>
                <li>
                  <strong>Preference cookies:</strong> Remember your settings and preferences
                </li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                You can control cookies through your browser settings. Note that disabling certain
                cookies may limit functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                12. California Privacy Rights (CCPA)
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                If you are a California resident, you have additional rights under the California
                Consumer Privacy Act (CCPA):
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Right to know what personal information we collect and how we use it</li>
                <li>Right to request deletion of your personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                <li>Right to non-discrimination for exercising your privacy rights</li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@farfarawaylabs.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  privacy@farfarawaylabs.com
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                13. European Privacy Rights (GDPR)
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                If you are in the European Economic Area (EEA), you have rights under the General Data
                Protection Regulation (GDPR), including the rights listed in Section 8 above. Our lawful
                bases for processing your information include:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Contract performance (providing our services)</li>
                <li>Consent (when you connect third-party accounts)</li>
                <li>Legitimate interests (improving our service, security)</li>
                <li>Legal obligations (compliance with applicable laws)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                14. Changes to This Privacy Policy
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We may update this Privacy Policy from time to time. We will notify you of any material
                changes by:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending you an email notification (for significant changes)</li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                We encourage you to review this Privacy Policy periodically. Your continued use of Hot
                Metal after changes are posted constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                15. Contact Us
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data
                practices, please contact us:
              </p>
              <div className="mt-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-4">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  Far Far Away Labs
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Email:{" "}
                  <a
                    href="mailto:privacy@farfarawaylabs.com"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    privacy@farfarawaylabs.com
                  </a>
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Website:{" "}
                  <a
                    href="https://farfarawaylabs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    farfarawaylabs.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--color-border-default)] px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
        <span className="font-medium text-[var(--color-text-primary)]">Hot Metal</span>
        <span className="mx-2">·</span>
        <Link to="/about" className="hover:underline">
          About
        </Link>
        <span className="mx-2">·</span>
        <Link to="/faq" className="hover:underline">
          FAQ
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
