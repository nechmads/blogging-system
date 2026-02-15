import { Link } from "react-router";
import { PublicNavbar } from "@/components/public/PublicNavbar";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <PublicNavbar />

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-10 md:pt-16">
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-8 md:p-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Last updated: February 15, 2026
          </p>

          <div className="prose prose-slate mt-8 max-w-none">
            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                1. Agreement to Terms
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Welcome to Hot Metal. These Terms of Service ("Terms") govern your access to and use of
                Hot Metal, including our website at{" "}
                <a
                  href="https://hotmetal.app"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  hotmetal.app
                </a>
                , applications, and related services (collectively, the "Service"), operated by Far Far
                Away Labs ("we," "us," or "our").
              </p>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                By accessing or using the Service, you agree to be bound by these Terms and our Privacy
                Policy. If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                We reserve the right to modify these Terms at any time. If we make material changes, we
                will notify you by email or through the Service. Your continued use of the Service after
                changes are posted constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                2. Eligibility
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You must be at least 13 years old to use the Service. If you are under 18, you represent
                that you have your parent or guardian's permission to use the Service. By agreeing to
                these Terms, you represent and warrant that:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>You are at least 13 years old</li>
                <li>You have the legal capacity to enter into these Terms</li>
                <li>You will comply with these Terms and all applicable laws</li>
                <li>
                  You have not been previously suspended or removed from the Service
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                3. Account Registration and Security
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                To use certain features of the Service, you must create an account. When you create an
                account, you agree to:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>
                  Accept responsibility for all activities that occur under your account
                </li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                You may not use another person's account without permission, create multiple accounts,
                or transfer your account to another person. We reserve the right to suspend or terminate
                accounts that violate these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                4. Third-Party Account Connections
              </h2>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                4.1 Connecting Accounts
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Hot Metal allows you to connect third-party accounts, including LinkedIn and X (formerly
                Twitter), to publish content. By connecting these accounts, you:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Authorize us to access and use your account as necessary to provide the Service</li>
                <li>
                  Grant us permission to post content on your behalf when you explicitly request it
                </li>
                <li>
                  Acknowledge that your use of these accounts is subject to their respective terms of
                  service
                </li>
                <li>Can revoke access at any time through your account settings</li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                4.2 Your Responsibility
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You are solely responsible for:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Content posted to your connected accounts through Hot Metal</li>
                <li>Compliance with third-party platform terms and policies</li>
                <li>Maintaining valid credentials and authorization for connected accounts</li>
                <li>
                  Any consequences resulting from content published through the Service
                </li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                4.3 Third-Party Platform Changes
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We are not responsible for changes to third-party platforms (such as LinkedIn or X) that
                may affect your use of the Service, including API limitations, policy changes, or service
                interruptions. We will make reasonable efforts to adapt to platform changes, but cannot
                guarantee uninterrupted access to third-party publishing features.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                5. Your Content
              </h2>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.1 Ownership
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You retain all rights to the content you create, upload, or publish through the Service
                ("Your Content"). You grant us a limited, worldwide, non-exclusive, royalty-free license
                to use, store, display, reproduce, and distribute Your Content solely for the purpose of
                operating and improving the Service.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.2 Responsibility for Your Content
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You are solely responsible for Your Content and the consequences of posting or publishing
                it. By submitting Your Content to the Service, you represent and warrant that:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>You own or have the necessary rights to Your Content</li>
                <li>Your Content does not violate any third-party rights</li>
                <li>Your Content complies with these Terms and applicable laws</li>
                <li>Your Content is accurate (to the best of your knowledge)</li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.3 Content Restrictions
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You agree not to post or publish content that:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Is illegal, harmful, threatening, abusive, or hateful</li>
                <li>Infringes on intellectual property or other rights</li>
                <li>Contains malware, viruses, or other harmful code</li>
                <li>
                  Impersonates any person or entity or misrepresents your affiliation
                </li>
                <li>Contains spam, advertising, or unsolicited promotional material</li>
                <li>Violates anyone's privacy or publicity rights</li>
                <li>Contains false, misleading, or defamatory information</li>
                <li>Is pornographic or sexually explicit</li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                5.4 Content Removal
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We reserve the right (but have no obligation) to review, monitor, or remove Your Content
                at our discretion, including content that violates these Terms or is otherwise
                objectionable. We may suspend or terminate your account if you repeatedly violate these
                Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                6. AI-Generated Content
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Hot Metal uses artificial intelligence to help you create content. You acknowledge and
                agree that:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>
                  AI-generated suggestions are provided "as is" and may contain errors or inaccuracies
                </li>
                <li>You are responsible for reviewing and editing all AI-generated content</li>
                <li>
                  You should verify facts, citations, and claims before publishing
                </li>
                <li>
                  We are not responsible for the accuracy or quality of AI-generated content
                </li>
                <li>
                  AI-generated content may occasionally reflect biases present in training data
                </li>
                <li>
                  You should ensure AI-generated content complies with applicable laws and platform
                  policies
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                7. Acceptable Use
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You agree to use the Service only for lawful purposes and in accordance with these Terms.
                You agree not to:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>
                  Use the Service in any way that violates applicable laws or regulations
                </li>
                <li>
                  Use the Service to harm, threaten, or harass any person or entity
                </li>
                <li>
                  Attempt to gain unauthorized access to the Service or related systems
                </li>
                <li>Interfere with or disrupt the Service or servers/networks</li>
                <li>
                  Use automated systems (bots, scrapers) without our written permission
                </li>
                <li>
                  Reverse engineer, decompile, or attempt to extract the source code of the Service
                </li>
                <li>Remove or alter any proprietary notices from the Service</li>
                <li>
                  Use the Service to transmit spam, chain letters, or other unsolicited communications
                </li>
                <li>Sell, rent, or lease access to the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                8. Intellectual Property
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                The Service and its original content (excluding Your Content), features, and
                functionality are owned by Far Far Away Labs and are protected by international
                copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                You may not copy, modify, distribute, sell, or lease any part of our Service without our
                express written permission. The "Hot Metal" name, logo, and all related trademarks are
                the property of Far Far Away Labs.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                9. Subscription and Payment
              </h2>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                9.1 Paid Services
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Some features of the Service may require a paid subscription. By purchasing a
                subscription, you agree to pay all fees associated with your selected plan.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                9.2 Billing
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Subscriptions are billed in advance on a recurring basis</li>
                <li>You authorize us to charge your payment method for the subscription fees</li>
                <li>Fees are non-refundable except as required by law</li>
                <li>
                  We reserve the right to change pricing with 30 days' notice
                </li>
                <li>You are responsible for all applicable taxes</li>
              </ul>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                9.3 Cancellation
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You may cancel your subscription at any time through your account settings. Cancellation
                takes effect at the end of your current billing period. You will continue to have access
                to paid features until the end of the period you've paid for.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                9.4 Free Trials
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We may offer free trials. If you don't cancel before the trial ends, you will be charged
                for the subscription. We reserve the right to determine free trial eligibility.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                10. Disclaimers
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
                INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>WARRANTIES REGARDING ACCURACY, RELIABILITY, OR AVAILABILITY</li>
                <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE</li>
                <li>
                  WARRANTIES REGARDING SECURITY OR THAT DEFECTS WILL BE CORRECTED
                </li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                We do not warrant that the Service will meet your requirements or that results obtained
                from using the Service will be accurate or reliable. Use of the Service is at your sole
                risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                11. Limitation of Liability
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                TO THE FULLEST EXTENT PERMITTED BY LAW, FAR FAR AWAY LABS AND ITS OFFICERS, DIRECTORS,
                EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>
                  ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES
                </li>
                <li>
                  LOSS OF PROFITS, REVENUE, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES
                </li>
                <li>
                  DAMAGES RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE
                  SERVICE
                </li>
                <li>
                  DAMAGES RESULTING FROM ANY CONDUCT OR CONTENT OF THIRD PARTIES OR OTHER USERS
                </li>
                <li>
                  DAMAGES RESULTING FROM UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT
                </li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                IN NO EVENT WILL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE AMOUNT YOU PAID
                US IN THE 12 MONTHS PRIOR TO THE CLAIM, OR $100, WHICHEVER IS GREATER.
              </p>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                Some jurisdictions do not allow the exclusion of certain warranties or limitation of
                liability, so these limitations may not apply to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                12. Indemnification
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You agree to indemnify, defend, and hold harmless Far Far Away Labs and its officers,
                directors, employees, and agents from and against any claims, liabilities, damages,
                losses, costs, or expenses (including reasonable attorneys' fees) arising out of or
                related to:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Your use of the Service</li>
                <li>Your Content</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                13. Termination
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We may suspend or terminate your account and access to the Service at any time, with or
                without cause, with or without notice. Reasons for termination may include:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[var(--color-text-muted)]">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>Our business decision to discontinue the Service</li>
              </ul>
              <p className="mt-3 leading-relaxed text-[var(--color-text-muted)]">
                Upon termination, your right to use the Service will immediately cease. We may delete
                your account and content, though we may retain certain information as required by law or
                for legitimate business purposes. Sections of these Terms that by their nature should
                survive termination will remain in effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                14. Dispute Resolution
              </h2>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                14.1 Governing Law
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                These Terms are governed by and construed in accordance with the laws of the State of
                California, United States, without regard to its conflict of law principles.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                14.2 Informal Resolution
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Before filing a claim, you agree to contact us at{" "}
                <a
                  href="mailto:legal@farfarawaylabs.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  legal@farfarawaylabs.com
                </a>{" "}
                and attempt to resolve the dispute informally. We will attempt to resolve disputes in
                good faith.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                14.3 Arbitration
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                If informal resolution fails, you agree that any dispute will be resolved through binding
                arbitration in accordance with the American Arbitration Association's rules, rather than
                in court. Arbitration will take place in San Francisco, California. You waive the right
                to participate in class actions or class arbitrations.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                14.4 Exceptions
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Either party may bring a claim in small claims court, or seek injunctive or other
                equitable relief in court to protect intellectual property rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                15. General Provisions
              </h2>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                15.1 Entire Agreement
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                These Terms, together with our Privacy Policy, constitute the entire agreement between
                you and Far Far Away Labs regarding the Service.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                15.2 Severability
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                If any provision of these Terms is found to be invalid or unenforceable, that provision
                will be limited or eliminated to the minimum extent necessary, and the remaining
                provisions will remain in full force and effect.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                15.3 Waiver
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                Our failure to enforce any right or provision of these Terms will not be considered a
                waiver of those rights.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                15.4 Assignment
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You may not assign or transfer these Terms or your account without our prior written
                consent. We may assign these Terms without restriction.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                15.5 Force Majeure
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                We will not be liable for any delay or failure to perform due to causes beyond our
                reasonable control, including natural disasters, war, terrorism, labor disputes, or
                internet/telecommunications failures.
              </p>

              <h3 className="mb-2 mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
                15.6 Export Controls
              </h3>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                You may not use or export the Service except as authorized by U.S. law and the laws of
                the jurisdiction in which you obtained access to the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                16. Contact Information
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                If you have questions or concerns about these Terms, please contact us:
              </p>
              <div className="mt-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-4">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  Far Far Away Labs
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Email:{" "}
                  <a
                    href="mailto:legal@farfarawaylabs.com"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    legal@farfarawaylabs.com
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

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
                17. Acknowledgment
              </h2>
              <p className="leading-relaxed text-[var(--color-text-muted)]">
                By using Hot Metal, you acknowledge that you have read, understood, and agree to be bound
                by these Terms of Service.
              </p>
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
