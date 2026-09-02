// src/components/legalDocs.jsx
// The full WTS CompoundIQ legal set -- Terms & Conditions, Privacy Policy, and Refund &
// Cancellation Policy -- rendered in-app by LegalModal.jsx. This is the same content as
// the standalone "CompoundIQ Legal Center" review artifact, ported into the product so
// the footer's "Privacy & Terms" link opens the real documents rather than a stub.
//
// Each document is an ordered list of sections; LegalModal numbers them from their array
// position (1..N), so reordering or inserting a section renumbers everything automatically
// and the "Section N" cross-references in the prose stay the single thing to keep in sync.
//
// <Fill> marks a detail the business owner must still supply (company name, registration
// number, addresses, support emails, effective dates, and the few numbers left as a
// business call). It renders as a visibly distinct token, not plain text, so nothing
// here reads as finished when it isn't. This content is a substantive review against
// POPIA / the CPA / ECTA / GDPR / PAIA -- not a formal legal opinion; the inline
// "[Flag for counsel: ...]" notes are genuine judgement calls for an admitted attorney.

import React from 'react';

// A still-to-be-filled company detail. Kept as a component (not a bare string) so every
// placeholder gets the same treatment and they're trivial to grep for before go-live.
export const Fill = ({ children }) => <span className="legal-fill">{children}</span>;

export const LEGAL_DOCS = [
  {
    id: 'terms',
    tab: 'Terms & Conditions',
    title: 'Terms & Conditions',
    docLabel: 'Document 1 of 3',
    effective: <Fill>[Effective Date]</Fill>,
    updated: <Fill>[Last Updated Date]</Fill>,
    callout: {
      tag: 'Reviewed against SA law — read this first',
      body: (
        <p>
          Checked against POPIA, the Consumer Protection Act (CPA), and the Electronic
          Communications and Transactions Act (ECTA) — see Sections 8–10 and 20, added
          specifically for that. Section 21 (General Provisions) and Sections 16/18/22 add
          the boilerplate that protects <em>you</em> as the operator — severability, entire
          agreement, no waiver, force majeure, assignment, a class-action waiver, a feedback
          license, sanctions compliance, fraud/abuse termination grounds, and Enterprise
          white-label indemnification — the kind of clauses a first draft usually leaves out
          and a counterparty's lawyer usually notices. This is a substantive review based on
          knowledge of these frameworks, not a formal legal opinion from a practicing
          attorney: a few calls below (flagged inline) are genuine judgment territory — most
          notably whether monthly plans count as a CPA §14 "fixed-term" agreement, the exact
          ECTA §44 cooling-off exemption boundary for a non-financial digital service, and
          whether the class-action waiver holds in every jurisdiction you reach. Have an
          admitted attorney confirm those before publishing. Fields shown as{' '}
          <Fill>[like this]</Fill> still need your real company details.
        </p>
      )
    },
    sections: [
      {
        heading: 'Agreement to These Terms',
        body: (
          <>
            <p>
              These Terms &amp; Conditions ("<strong>Terms</strong>") are a binding
              agreement between you ("<strong>you</strong>," "<strong>User</strong>") and{' '}
              <Fill>[Company Legal Name]</Fill> (Pty) Ltd, registration number{' '}
              <Fill>[Registration Number]</Fill>, of <Fill>[Registered Business Address]</Fill>{' '}
              ("<strong>we</strong>," "<strong>us</strong>," "<strong>the Company</strong>"),
              governing your access to and use of WTS CompoundIQ, including its website,
              calculators, and any related tools (together, the "<strong>Service</strong>").
            </p>
            <p>
              By creating a plan, upgrading to a paid tier, or otherwise using the Service,
              you accept these Terms in full. If you don't agree with them, don't use the
              Service. We may update these Terms from time to time under Section 19 —
              continued use after a change means you accept the revised Terms.
            </p>
          </>
        )
      },
      {
        heading: 'What the Service Is',
        body: (
          <>
            <p>
              WTS CompoundIQ is an educational financial-planning and compound-interest
              modeling tool covering 36 countries. Its Tools include a calculator, tax-free
              wrapper comparisons, a debt payoff planner, an emergency fund planner, a
              loan/bond calculator, a net worth tracker with an FX stress test for offshore
              holdings, a budget tracker, goal-based investing tools, a consolidated plan
              tracker, a tax optimizer, a dashboard with a financial health score and
              milestones, a suite of "Power Tools" (FIRE number, home affordability,
              education savings, insurance needs, debt-vs-invest and more), side-by-side
              country and plan comparison, Monte Carlo simulation, and the rule-based
              "AI Coach" and "AI Advisor" features described in Section 13 (collectively,
              the "<strong>Tools</strong>"), available across the free and paid subscription
              tiers described in Section 6.
            </p>
            <p>
              <strong>The Service does not hold or manage your money.</strong> It does not
              connect to your bank accounts, brokerage, or any financial institution. Every
              figure you see is a projection calculated from numbers you type in.
            </p>
          </>
        )
      },
      {
        heading: 'Not Financial, Tax, or Legal Advice',
        body: (
          <>
            <p>
              The Tools are illustrative and educational. Tax rates, contribution limits,
              exchange rates, and wrapper rules for each of the 36 supported countries are
              simplified, indicative, and shown with a "last verified" date — they drift out
              of date and are not a substitute for the current rules published by the
              relevant tax authority (e.g. SARS, IRS, HMRC).
            </p>
            <p>
              Nothing produced by the Service — including output from the AI Coach and AI
              Advisor features — is financial, investment, tax, or legal advice, and none of
              it constitutes a personalized recommendation. Projections assume constant rates
              and no volatility unless a tool explicitly models a range of outcomes (e.g. the
              Monte Carlo simulator). Before acting on anything the Service shows you, verify
              it with a licensed financial adviser, accountant, or the relevant tax authority.
            </p>
          </>
        )
      },
      {
        heading: 'Eligibility',
        body: (
          <p>
            You must be at least 18 years old, or the age of majority in your jurisdiction,
            and have the legal capacity to enter into a binding contract, to subscribe to a
            paid tier. The free tier may be used by anyone capable of using the Service
            responsibly, subject to applicable local law.
          </p>
        )
      },
      {
        heading: 'No Account, Local-First Data',
        body: (
          <>
            <p>
              The Service does not require you to register an account or provide a name,
              email, or password to use its free or paid Tools. Your plan inputs, saved
              snapshots, and selected tier are stored only in your own browser's local
              storage — never on our servers, because we don't operate one for this data.
              Clearing your browser's site data, switching browsers, or switching devices
              will lose this information unless you've exported a backup using the in-app
              Export/Import feature.
            </p>
            <p>
              Because there is no account, <strong>tier access after payment is tied to the
              browser/device you paid from</strong>, restored via the backup file you export,
              or reissued by us on request — using the contact details in Section 23 — if you
              can show proof of payment, such as Paystack's emailed receipt or transaction
              reference. See the Privacy Policy for exactly what limited data does pass
              through a third party when you subscribe.
            </p>
          </>
        )
      },
      {
        heading: 'Subscription Plans & Pricing',
        body: (
          <>
            <p>
              The Service is offered on the following tiers. Prices are quoted in South
              African Rand (ZAR) and may vary by promotion or region; the price shown to you
              at checkout governs.
            </p>
            <div className="legal-tbl-wrap">
              <table className="legal-rate">
                <thead>
                  <tr><th>Tier</th><th>Monthly</th><th>Annual</th><th>Scope</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic</td><td>Free</td><td>—</td>
                    <td>Calculator, all 36 countries, wrapper comparison</td>
                  </tr>
                  <tr>
                    <td>Pro</td><td>R199</td><td>R1,499</td>
                    <td>Full planning toolkit (Dashboard, Budget, Emergency Fund, Debt
                      Payoff, Loan &amp; Bond, My Plan, Net Worth, Snapshot export, Invest,
                      Tax Optimizer, Power Tools, Compare)</td>
                  </tr>
                  <tr>
                    <td>Ultra</td><td>R299</td><td>R2,499</td>
                    <td>Everything in Pro, plus Monte Carlo, FX Stress Test, AI Wealth Coach,
                      AI Investment Advisor</td>
                  </tr>
                  <tr>
                    <td>Enterprise</td><td colSpan="2">Custom, per seat/firm license</td>
                    <td>White-label branding, bulk user management, API access — governed by
                      a separate order form or master agreement</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              We may change tier pricing or feature composition prospectively. A price change
              never applies retroactively to a billing period you've already paid for; it
              takes effect at your next renewal, and we'll give you at least{' '}
              <Fill>[30]</Fill> days' notice in-app before it does.
            </p>
          </>
        )
      },
      {
        heading: 'Payment & Billing',
        body: (
          <>
            <p>
              <Fill>[Remove this paragraph once live billing is switched on.]</Fill>{' '}
              <strong>The in-app checkout is currently operating in demo mode — no card is
              charged and no payment is taken.</strong> Selecting a paid tier unlocks its
              features locally in your browser for evaluation only. The billing, renewal, and
              refund terms in this Section and the Refund &amp; Cancellation Policy describe
              how paid subscriptions work once live payment processing is enabled.
            </p>
            <p>
              Paid subscriptions are processed by Paystack, an independent third-party
              payment processor. We never receive or store your full card number, CVV, or
              banking credentials — see the Privacy Policy for what limited data is shared
              with the processor to complete your purchase.
            </p>
            <p>
              Monthly plans bill every 30 days from the date of purchase; annual plans bill
              every 12 months. Subscriptions <strong>renew automatically</strong> at the
              then-current price unless cancelled before the renewal date, per Section 9. A
              failed renewal payment may result in an automatic downgrade to the Basic tier
              after <Fill>[a grace period, e.g. 3 days]</Fill> of retry attempts.
            </p>
          </>
        )
      },
      {
        heading: 'Electronic Transaction Disclosures (ECTA)',
        body: (
          <>
            <p>
              The following is provided so this Section satisfies section 43 of the
              Electronic Communications and Transactions Act on its own, without a reader
              having to piece it together from the rest of the document:
            </p>
            <ul>
              <li><strong>Supplier:</strong> full legal name, status, registration number,
                and address are in Section 1.</li>
              <li><strong>Main characteristics of the Service:</strong> Section 2.</li>
              <li><strong>Full price</strong>, including VAT where applicable, and no
                undisclosed charges: Section 6. Prices shown at checkout are VAT-inclusive
                where VAT applies; <Fill>[confirm your VAT-registration status and adjust
                this line]</Fill>.</li>
              <li><strong>Manner of payment:</strong> Section 7.</li>
              <li><strong>Access/delivery:</strong> a paid tier's Tools unlock immediately on
                successful payment confirmation — there is no shipping or waiting period.</li>
              <li><strong>Return, exchange, and refund policy:</strong> Section 9, and in
                full in the separate Refund &amp; Cancellation Policy.</li>
              <li><strong>Payment security:</strong> card and bank details are entered
                directly into Paystack's own checkout, not ours, and handled under its
                PCI-DSS-compliant infrastructure — we never see or store them.</li>
              <li><strong>Transaction record:</strong> Paystack emails you a receipt at the
                time of payment; contact us at{' '}
                <Fill>[support@wtscompoundiq.co.za]</Fill> for a copy of your transaction
                history with us at any time.</li>
              <li><strong>Right to review before confirming:</strong> the checkout flow shows
                the tier, price, and billing frequency before you submit payment, giving you
                the opportunity to review, correct, and confirm — or withdraw — before the
                transaction is finalized.</li>
              <li><strong>Codes of conduct / self-regulatory membership:</strong>{' '}
                <Fill>[none, or list any you belong to]</Fill>.</li>
            </ul>
          </>
        )
      },
      {
        heading: 'Cancellation, Cooling-Off & Refunds',
        body: (
          <>
            <p>
              If you're a natural person contracting electronically, section 44 of ECTA gives
              you a statutory right to cancel this transaction without reason or penalty
              within <strong>7 calendar days</strong> of the date you subscribed — unless
              you've expressly agreed the Service should start before that period ends and,
              in doing so, acknowledged that you'd lose the cooling-off right once it has.{' '}
              <Fill>[Flag for counsel: whether this Service falls under ECTA's "financial
              services" cooling-off exemption is a real judgment call — it models finances
              but doesn't itself hold, move, or manage money, so the better reading is that
              the exemption doesn't apply, but have this confirmed.]</Fill>
            </p>
            <p>
              Our own policy is more generous than that statutory floor in every case, so
              it's what actually governs in practice: cancellation, downgrades, and the full
              refund window, process, and exceptions are set out in the separate Refund &amp;
              Cancellation Policy, which forms part of these Terms.
            </p>
          </>
        )
      },
      {
        heading: 'Fixed-Term Plan Renewal Notice',
        body: (
          <>
            <p>
              An <strong>annual</strong> plan is a fixed-term agreement for the purposes of
              section 14 of the Consumer Protection Act. Before it renews, we'll notify you
              in-app and by email between 40 and 80 business days ahead of the renewal date,
              so you have a real opportunity to cancel before being charged again. You may
              cancel a fixed-term annual plan at any time on 20 business days' notice;
              because it's prepaid, cancellation takes effect at the end of the already-paid
              term rather than triggering an automatic partial refund, except where Section 9
              or the Refund Policy's money-back window applies.
            </p>
            <p>
              <Fill>[Flag for counsel: monthly plans are billed periodically without a fixed
              end date, so the better reading is that they fall outside CPA §14's
              "fixed-term" definition and this renewal-notice mechanic isn't a strict legal
              requirement for them — we still surface the upcoming charge in-app either way
              as a matter of practice, not obligation.]</Fill>
            </p>
          </>
        )
      },
      {
        heading: 'Acceptable Use',
        body: (
          <>
            <p>You agree not to:</p>
            <ul>
              <li>Attempt to reverse-engineer, scrape at scale, or circumvent the
                tier/paywall logic of the Service;</li>
              <li>Use the Service to build a competing product from its content, country tax
                data, or Tool logic;</li>
              <li>Misrepresent the Service's projections as verified financial advice to a
                third party (e.g. a client, if you're an Enterprise licensee) without the
                disclaimers in Section 3 intact;</li>
              <li>Interfere with the Service's operation, probe its infrastructure for
                vulnerabilities without authorization, or use it to transmit malware.</li>
            </ul>
          </>
        )
      },
      {
        heading: 'Intellectual Property',
        body: (
          <p>
            The Service, its design, calculators, country tax datasets, and underlying code
            are owned by <Fill>[Company Legal Name]</Fill> or its licensors and protected by
            copyright and other intellectual property laws. Your subscription grants you a
            personal, non-exclusive, non-transferable license to use the Service for your own
            financial planning — it does not transfer ownership of anything. Numbers and
            plans you enter remain yours.
          </p>
        )
      },
      {
        heading: '"AI" Coach & Advisor Features',
        body: (
          <p>
            <strong>The AI Coach and AI Investment Advisor Tools are rule-based, not powered
            by a third-party generative AI model.</strong> Your inputs run through fixed
            if/else decision logic built into the Service itself — the same calculator engine
            used elsewhere in the app, re-run with one input changed — not a call to an
            external AI provider. Both tools carry this same disclosure directly in-app.
            Output is therefore deterministic and reproducible for the same inputs, not
            generated text with the variability that implies; it can still be wrong,
            oversimplified, or based on incomplete context, for the same reasons any of the
            Service's other projections can be. Section 3's "not financial advice" disclaimer
            applies with full force to anything these features produce.{' '}
            <Fill>[If this Section is ever wired up to a real third-party AI/LLM provider,
            update this paragraph before that ships — it stops being accurate the moment a
            live model call is involved.]</Fill>
          </p>
        )
      },
      {
        heading: 'Disclaimers & Warranty',
        body: (
          <>
            <p>
              The Service is provided <strong>"as is" and "as available,"</strong> without
              warranty of any kind, express or implied, including fitness for a particular
              purpose, accuracy, or non-infringement. We don't guarantee the Service will be
              uninterrupted, error-free, or that any calculation will match your real-world
              outcome.
            </p>
            <p>
              <strong>Assumption of risk.</strong> Investment, debt, and financial markets
              carry inherent risk, and past or projected performance shown by the Service
              never guarantees a future result. By using the Service you acknowledge that any
              financial decision you make is yours alone, made at your own risk, and not made
              in reliance on the Service as a guarantee of any outcome.
            </p>
            <p>
              <strong>No liability for data loss.</strong> Because the Service stores your
              plan data only in your own browser's local storage and never on our servers
              (Section 5), we have no ability to back it up, recover it, or restore it, and
              accept no liability for its loss however caused — including you clearing your
              browser's site data, a browser or device failure, or an uninstalled or
              corrupted browser profile. Exporting a backup via the in-app Export/Import
              feature is solely your own responsibility.
            </p>
            <p>
              <strong>Third-party services.</strong> We're not liable for the acts, omissions,
              downtime, or errors of any third-party service the Service relies on or links
              to, including our payment processor (Paystack), your browser, your device, or
              your internet service provider — each is a separate party under its own terms,
              outside our control.
            </p>
            <p>
              <strong>Changes to and availability of the Service.</strong> We may add, change,
              suspend, or discontinue any part of the Service, or the whole of it, at any
              time. If we permanently discontinue a paid tier you are actively subscribed to,
              your sole remedy is a pro-rata refund of any prepaid, unused portion of that
              subscription — we have no further liability for the discontinuation.
            </p>
          </>
        )
      },
      {
        heading: 'Limitation of Liability',
        body: (
          <p>
            To the maximum extent permitted by law, and regardless of the legal theory
            asserted (contract, delict/tort, negligence, strict liability, or otherwise),{' '}
            <Fill>[Company Legal Name]</Fill> will not be liable for any indirect, incidental,
            special, punitive, or consequential loss — including lost profits, lost revenue,
            lost or corrupted data, loss of goodwill, or investment losses — arising from your
            use of, or reliance on, the Service, even if we've been advised of the
            possibility of such loss. Our total aggregate liability to you for any and all
            claims arising from or relating to these Terms or the Service is limited to, and
            is your <strong>sole and exclusive remedy</strong> for, the amount you paid us in
            the 12 months before the claim arose, or <Fill>[R500]</Fill>, whichever is
            greater. Multiple claims arising from the same event, or from a related series of
            events, count as a single claim for the purpose of this cap. Nothing in this
            section limits liability that cannot be limited under South African law,
            including for gross negligence, willful misconduct, fraud, or death or personal
            injury caused by our negligence.
          </p>
        )
      },
      {
        heading: 'Termination',
        body: (
          <p>
            You may stop using the Service at any time. We may suspend or terminate access,
            without notice where the circumstances justify it, for a User who materially
            breaches Section 11 (Acceptable Use), attempts payment fraud or chargeback abuse,
            or otherwise misuses the Service in a way that puts other Users or the Service
            itself at risk. Sections 3, 12, 14, 15, 18, and 21 survive termination.
          </p>
        )
      },
      {
        heading: 'Enterprise Licensing',
        body: (
          <p>
            Enterprise tier access — including white-label branding, bulk user management,
            and API access — is governed by these Terms plus a separate written order form or
            master license agreement between you and us. Where the two conflict on
            Enterprise-specific terms, the order form controls.
          </p>
        )
      },
      {
        heading: 'Indemnification',
        body: (
          <p>
            You agree to indemnify, defend, and hold us and our officers, directors, and
            employees harmless from any claim, loss, liability, or expense (including
            reasonable legal fees) arising from: your breach of these Terms; your misuse of
            the Service; your violation of any law or a third party's rights; content or data
            you input into the Service; or, if you're an Enterprise licensee, any
            representation your organization makes to your own end clients using the
            white-labeled Service — including a client's reliance on projections your
            organization presented as its own advice without carrying forward the disclaimers
            in Section 3. We're not a party to, and accept no liability for, your relationship
            with your own end clients.
          </p>
        )
      },
      {
        heading: 'Changes to These Terms',
        body: (
          <p>
            We may revise these Terms from time to time. Material changes will be flagged
            in-app with an updated "Last updated" date. Continuing to use the Service after a
            change takes effect means you accept the revised Terms; if you don't agree, your
            recourse is to stop using the Service and cancel any active subscription.
          </p>
        )
      },
      {
        heading: 'Consumer Status & CPA Applicability',
        body: (
          <p>
            Some protections referenced above (including Sections 9 and 10) come from the
            Consumer Protection Act, which applies only to "consumers" as the Act defines
            them — broadly, natural persons, and juristic persons below an asset/turnover
            threshold the Minister sets from time to time. If you're subscribing as, or on
            behalf of, a larger juristic person — the typical case for an Enterprise licensee
            — those specific CPA-sourced protections may not apply to you by law, and your
            Enterprise order form governs instead.
          </p>
        )
      },
      {
        heading: 'General Provisions',
        body: (
          <>
            <h4>Severability</h4>
            <p>
              If any provision of these Terms is found unenforceable or invalid by a court or
              regulator, that provision is limited or removed to the minimum extent
              necessary, and the rest of these Terms remains in full force.
            </p>
            <h4>Entire Agreement</h4>
            <p>
              These Terms (together with the Privacy Policy, the Refund &amp; Cancellation
              Policy, and — for Enterprise — the relevant order form) are the entire
              agreement between you and us regarding the Service, and supersede any prior
              discussion, marketing material, or informal representation, whether written or
              oral. You confirm you haven't relied on anything outside these documents in
              deciding to use or pay for the Service.
            </p>
            <h4>No Waiver</h4>
            <p>
              Our failure to enforce any provision of these Terms — including letting a
              breach go unaddressed once — is not a waiver of our right to enforce it later,
              and doesn't waive any other provision.
            </p>
            <h4>Force Majeure</h4>
            <p>
              We're not liable for any failure or delay in the Service caused by events
              beyond our reasonable control, including load-shedding or other power/utility
              outages, internet or telecommunications failures, our hosting or payment
              processor's downtime, natural disaster, war, or government action.
            </p>
            <h4>Assignment</h4>
            <p>
              You may not assign or transfer your rights under these Terms without our
              written consent. We may assign these Terms, in whole or part, in connection
              with a merger, acquisition, restructuring, or sale of assets, without needing
              your consent, provided the assignee agrees to honor the Terms then in effect
              for your current billing period.
            </p>
            <h4>No Class Actions</h4>
            <p>
              To the extent permitted by applicable law, any dispute must be brought in your
              individual capacity, not as a plaintiff or class member in any purported class,
              collective, or representative proceeding. <Fill>[Flag for counsel: class-action
              waivers are not uniformly enforceable across every jurisdiction this Service
              reaches — confirm this holds where you're most exposed.]</Fill>
            </p>
            <h4>Feedback</h4>
            <p>
              If you send us feedback, suggestions, or feature ideas, you grant us an
              unrestricted, royalty-free, perpetual right to use them for any purpose,
              without owing you compensation or attribution.
            </p>
            <h4>Sanctions &amp; Export Compliance</h4>
            <p>
              You represent that you're not located in, or a national of, a country or
              region subject to comprehensive South African, UN, EU, UK, or US trade
              sanctions, and that you're not on any restricted-party or denied-persons list
              maintained by those authorities. We may suspend or terminate access where
              required to comply with applicable sanctions law.
            </p>
            <h4>Reservation of Rights</h4>
            <p>
              We may refuse, suspend, or terminate access to the Service for any User, at our
              reasonable discretion, including where we suspect fraud, payment abuse,
              chargeback abuse, or a breach of Section 11 (Acceptable Use) — without it
              entitling that User to a refund beyond what Section 9 already provides.
            </p>

            <h4>No Third-Party Beneficiaries</h4>
            <p>
              These Terms are between you and us alone. No other person — including, where you
              are an Enterprise licensee, your own end clients — has any right to enforce any
              part of them.
            </p>

            <h4>No Partnership or Agency</h4>
            <p>
              Nothing in these Terms creates a partnership, joint venture, franchise,
              employment, or agency relationship between you and us. Neither party may bind or
              incur obligations on behalf of the other.
            </p>

            <h4>Time Limit on Claims</h4>
            <p>
              Any claim you bring arising out of or relating to these Terms or the Service
              must be commenced within <Fill>[one year]</Fill> of the date the cause of action
              arose, failing which it is permanently barred, except where a longer period
              cannot lawfully be shortened by agreement.{' '}
              <Fill>[Flag for counsel: a contractually shortened limitation period may not be
              enforceable against a natural-person consumer under the CPA / common law —
              confirm before relying on it.]</Fill>
            </p>

            <h4>Electronic Communications</h4>
            <p>
              The Service operates without an account, so we communicate with you
              electronically — through the app itself and, for anything tied to a purchase, by
              email to the address you entered at checkout. You consent to receive all
              notices, disclosures, and agreements from us in electronic form, and agree that
              this satisfies any legal requirement that such communications be in writing.
            </p>

            <h4>Notices</h4>
            <p>
              Notice to us must be sent to <Fill>[legal@wtscompoundiq.co.za]</Fill> and is
              treated as received on the next business day. Notice to you is treated as
              received when we post it in the app or send it to your checkout email address.
            </p>

            <h4>Headings</h4>
            <p>
              Section headings are for convenience only and do not affect how these Terms are
              interpreted.
            </p>
          </>
        )
      },
      {
        heading: 'Governing Law & Disputes',
        body: (
          <p>
            These Terms are governed by the laws of the Republic of South Africa, without
            regard to conflict-of-law principles. Subject to any non-waivable consumer
            protection you have where you live, disputes arising from these Terms will first
            be attempted to be resolved informally by contacting us at{' '}
            <Fill>[legal@wtscompoundiq.co.za]</Fill> and allowing <Fill>[30]</Fill> days to
            resolve it. Failing that, at our election, a dispute may instead be referred to
            arbitration under the rules of <Fill>[the Arbitration Foundation of Southern
            Africa (AFSA), or your preferred body]</Fill> rather than litigated in court, or
            is otherwise subject to the exclusive jurisdiction of the courts of{' '}
            <Fill>[South Africa — e.g. Western Cape Division, Cape Town]</Fill>.
          </p>
        )
      },
      {
        heading: 'Contact',
        body: (
          <p>
            Questions about these Terms: <Fill>[legal@wtscompoundiq.co.za]</Fill> ·{' '}
            <Fill>[Registered Business Address]</Fill>.
          </p>
        )
      }
    ]
  },

  {
    id: 'privacy',
    tab: 'Privacy Policy',
    title: 'Privacy Policy',
    docLabel: 'Document 2 of 3',
    effective: <Fill>[Effective Date]</Fill>,
    updated: <Fill>[Last Updated Date]</Fill>,
    callout: {
      tag: 'Reviewed against POPIA, GDPR & PAIA — read this first',
      body: (
        <p>
          Sections 6, 7, 10, and 11 were added specifically to satisfy POPIA's
          notification-at-collection and security-safeguard conditions, GDPR's rights list
          for EU/UK users, and PAIA's access-request obligation, respectively. This is a
          substantive review based on knowledge of these frameworks, not a formal legal
          opinion — have your Information Officer registration and this document confirmed by
          an admitted attorney before publishing.
        </p>
      )
    },
    sections: [
      {
        heading: 'Our Approach',
        body: (
          <>
            <p>
              WTS CompoundIQ was built local-first on purpose: your financial figures —
              income, debts, goals, net worth — are sensitive, and the least risky way to
              handle them is to never receive them. Everything you type into a calculator,
              tracker, or planner stays in your own browser's local storage. We cannot see
              it, and it is never transmitted to us or anyone else.
            </p>
            <p>
              This policy explains the one place that changes once billing is real: paying
              for a subscription necessarily shares a small amount of data with our payment
              processor.
            </p>
          </>
        )
      },
      {
        heading: 'Who We Are',
        body: (
          <p>
            <Fill>[Company Legal Name]</Fill> (Pty) Ltd, registration number{' '}
            <Fill>[Registration Number]</Fill>, of <Fill>[Registered Business Address]</Fill>,
            is the responsible party (POPIA) / data controller (GDPR) for the limited data
            described in this policy. Our Information Officer, registered with the Information
            Regulator as required by POPIA section 55, is named in Section 16.
          </p>
        )
      },
      {
        heading: 'Information We Do Not Collect',
        body: (
          <p>
            We do not collect, receive, or store: your name, financial figures, saved plans,
            debts, net worth, goals, calculator inputs, browsing behavior inside the app, IP
            address logs tied to your activity, or device fingerprints. There is no analytics
            script, tracking pixel, or third-party script running in the Service beyond
            what's listed in Section 5. This is a verifiable architectural claim, not
            boilerplate — the app's only outbound network calls are its own service worker
            caching its own files for offline use, and (only if you subscribe) the payment
            processor's own checkout.
          </p>
        )
      },
      {
        heading: 'Information We Do Collect — Paid Subscriptions Only',
        body: (
          <>
            <p>
              If you subscribe to Pro, Ultra, or Enterprise, you type your email address
              directly into our own checkout screen — it's the one piece of personal
              information our own code ever touches, and it exists only to pass straight
              through to our payment processor, Paystack, which needs it to process the
              transaction and email you a receipt. Everything else — card or bank details,
              billing address — goes directly into Paystack's own secure checkout fields,
              never through our code at all. Paystack processes what it collects as an
              independent controller under its own privacy policy — we receive back only:
            </p>
            <ul>
              <li>A confirmation that payment succeeded, and the tier/plan purchased;</li>
              <li>The email address you paid with, so we can find your transaction if you
                contact support or request a refund;</li>
              <li>A transaction reference and amount, for our own accounting and tax
                records.</li>
            </ul>
            <p>
              We do not receive or store your card number, CVV, or full billing address.
              Your email passes through our checkout screen in memory only — it isn't written
              to our own database (we don't have one) and isn't the same thing as the email
              address Paystack reports back to us in the confirmation above, though in
              practice they're usually the same address.
            </p>
          </>
        )
      },
      {
        heading: 'Cookies & Local Storage',
        body: (
          <p>
            The Service uses your browser's <strong>local storage</strong> (not cookies) to
            remember your plan, tier, and saved tools data on your own device — this never
            leaves your browser except when you explicitly use the in-app Export Backup
            feature, which saves a plain JSON file directly to your own filesystem. The
            Service's service worker caches static files for offline use; it does not track
            you. No advertising or analytics cookies are set.
          </p>
        )
      },
      {
        heading: 'Notice at the Point of Collection (POPIA §18)',
        body: (
          <p>
            The only point at which any personal information is collected — your email,
            directly by our own checkout screen, and the rest, directly by Paystack's own
            fields — is checkout. At that point: the purpose is solely to process your
            payment and activate your subscription; providing it is entirely{' '}
            <strong>voluntary</strong> in the sense that the free Basic tier requires none of
            it — it's only required if you choose to subscribe to a paid tier; the
            consequence of not providing it is simply that the paid tier isn't activated; and
            you have the right to access or object to this processing at any time (Section 9).
          </p>
        )
      },
      {
        heading: 'Security Safeguards',
        body: (
          <p>
            Card and bank details are entered directly into Paystack's own PCI-DSS-compliant
            checkout over an encrypted (TLS/HTTPS) connection — they never transit our own
            systems at all. Your email address briefly does, in your browser's own memory
            only, on its way from our checkout screen to Paystack over the same encrypted
            connection — it's never written to a database of ours (we don't have one) or
            logged anywhere on our side. The limited transaction metadata we do hold
            afterward (Section 4) is stored in <Fill>[describe where: e.g. your accounting
            software / a spreadsheet / a database, and who can access it]</Fill>, access to
            which is restricted to <Fill>[e.g. the founder / named staff]</Fill>. Because the
            Service itself has no backend, there is no central database of user planning data
            that could be breached — the largest practical privacy risk this architecture
            avoids entirely.
          </p>
        )
      },
      {
        heading: 'How We Use What We Receive',
        body: (
          <p>
            The limited transaction data in Section 4 is used only to: verify your
            subscription, process refunds and support requests, meet our own accounting/tax
            obligations, and detect fraud or chargebacks. We do not sell it, rent it, or use
            it for marketing without your separate opt-in consent.
          </p>
        )
      },
      {
        heading: 'Your Rights (POPIA)',
        body: (
          <>
            <p>
              You have the right to: be notified that your information is being processed;
              access the personal information we hold about you; request its correction or
              deletion; object to our processing of it; and lodge a complaint with the
              Information Regulator. Because we hold so little — essentially just a
              transaction record from Section 4 — most requests are quick to fulfil. Your
              planning data itself is already entirely in your control: delete it any time
              via your browser's site-data settings, or the in-app "Clear history" controls
              on each tool.
            </p>
            <p>
              To exercise a right, contact our Information Officer (Section 16). You may also
              lodge a complaint with the <strong>Information Regulator (South Africa)</strong>{' '}
              — <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>{' '}
              — or your own country's data protection authority.
            </p>
          </>
        )
      },
      {
        heading: 'Rights for EU/UK Users (GDPR)',
        body: (
          <p>
            If you're in the EU or UK, we process your payment data under Article 6(1)(b)
            GDPR — it's necessary to perform the subscription contract you asked us for. In
            addition to the POPIA rights above, you have the right to: data portability
            (receive your transaction data in a structured, machine-readable format);
            restrict processing; withdraw consent at any time where processing is
            consent-based; and lodge a complaint with your local supervisory authority (e.g.
            the ICO in the UK, or your national Data Protection Authority in the EU) as well
            as, or instead of, South Africa's Information Regulator. We don't process
            special-category data and haven't appointed an EU representative under Article 27{' '}
            <Fill>[confirm this is still accurate as your EU user base grows — Article 27 has
            its own size/scale thresholds]</Fill>.
          </p>
        )
      },
      {
        heading: 'Access Requests Under PAIA',
        body: (
          <p>
            The Promotion of Access to Information Act gives you the right to formally request
            access to records we hold about you, or about how we operate, subject to PAIA's
            own grounds for refusal. <Fill>[Many small private bodies are currently exempted
            from having to proactively publish a full PAIA manual under the Information
            Regulator's exemption notices — confirm this still applies to your business size
            before relying on it.]</Fill> Submit a PAIA request to the Information Officer in
            Section 16.
          </p>
        )
      },
      {
        heading: 'Data Retention',
        body: (
          <p>
            Transaction records (Section 4) are retained for <Fill>[5 years]</Fill> to meet
            South African tax and accounting record-keeping requirements, then deleted. Your
            local planning data is retained on your own device for as long as you keep it
            there — we have no ability to delete it remotely, because we never had it.
          </p>
        )
      },
      {
        heading: 'International Users & Cross-Border Transfers',
        body: (
          <p>
            The Service is used globally across the 36 countries it models. Payment data may
            be processed by Paystack in South Africa or another jurisdiction where it
            operates. Where that involves a cross-border transfer of your personal
            information, we rely on Paystack's own contractual safeguards and/or your consent
            (given by proceeding with payment) to meet POPIA section 72 and, for EU/UK users,
            GDPR Chapter V. Because your planning data never leaves your device, there is no
            cross-border transfer of it to worry about — this section is entirely about the
            narrow payment-transaction data in Section 4.
          </p>
        )
      },
      {
        heading: "Children's Privacy",
        body: (
          <p>
            The Service is not directed at children under 18, and paid subscriptions require
            the legal capacity described in the Terms' Section 4. We do not knowingly collect
            data from children.
          </p>
        )
      },
      {
        heading: 'Changes to This Policy',
        body: (
          <p>
            We'll update the "Last updated" date above and flag material changes in-app.
          </p>
        )
      },
      {
        heading: 'Contact / Information Officer',
        body: (
          <p>
            <Fill>[Information Officer Name]</Fill> ·{' '}
            <Fill>[privacy@wtscompoundiq.co.za]</Fill> ·{' '}
            <Fill>[Registered Business Address]</Fill> · registered with the Information
            Regulator under POPIA §55.
          </p>
        )
      }
    ]
  },

  {
    id: 'refunds',
    tab: 'Refund & Cancellation',
    title: 'Refund & Cancellation Policy',
    docLabel: 'Document 3 of 3',
    effective: <Fill>[Effective Date]</Fill>,
    updated: <Fill>[Last Updated Date]</Fill>,
    callout: {
      tag: 'Reviewed against ECTA & the CPA — read this first',
      body: (
        <p>
          Section 3 adds the statutory ECTA cooling-off right this policy sits on top of;
          Section 5 cross-references the Terms' CPA renewal-notice mechanic for annual plans.
          The exact numbers below (<Fill>[14 days]</Fill>, grace periods, etc.) are still
          your business call, not a legal minimum — this is a substantive review, not a
          formal legal opinion, and the flagged judgment calls are worth an attorney's
          confirmation before publishing.
        </p>
      )
    },
    sections: [
      {
        heading: 'Overview',
        body: (
          <>
            <p>
              <Fill>[Remove this paragraph once live billing is switched on.]</Fill>{' '}
              <strong>The in-app checkout is currently in demo mode and takes no payment</strong>,
              so there is nothing to refund today. This policy sets out how cancellations and
              refunds will work once live payment processing is enabled.
            </p>
            <p>
              This policy covers cancelling a subscription and requesting a refund for Pro,
              Ultra, and Enterprise tiers. The Basic tier is free and has nothing to cancel or
              refund.
            </p>
          </>
        )
      },
      {
        heading: 'Cancelling Anytime',
        body: (
          <p>
            You can cancel a Pro or Ultra subscription at any time via the in-app "Downgrade
            to Basic" control — it's instant, self-service, and needs no confirmation email
            or support ticket. <strong>Cancelling stops future renewal charges; it doesn't
            refund the period you're currently in.</strong> Your plan stays at its current
            tier until the end of that period, then drops to Basic. Your saved planning data
            isn't deleted by downgrading — it's simply local to your device either way, and
            picks back up in full if you resubscribe.
          </p>
        )
      },
      {
        heading: 'Statutory Cooling-Off Right',
        body: (
          <p>
            Separately from — and in addition to — the money-back window below, section 44 of
            ECTA gives a natural-person consumer who subscribes electronically the right to
            cancel that specific transaction, without reason or penalty, within{' '}
            <strong>7 calendar days</strong> of paying, unless you've expressly agreed the
            Service should start immediately and acknowledged you'd lose that right by doing
            so. <Fill>[Flag for counsel: the applicability of this right turns on whether the
            Service counts as a "financial service" for ECTA's exemption purposes — it models
            finances but doesn't hold or move money, so the better reading is that the
            exemption doesn't apply, but confirm before relying on it.]</Fill> In practice
            this rarely matters on its own, because Section 4's money-back window is longer
            and simpler to invoke.
          </p>
        )
      },
      {
        heading: 'Money-Back Window',
        body: (
          <>
            <p>
              If you're not happy with a paid tier, you can request a full refund within{' '}
              <Fill>[14]</Fill> calendar days of your <strong>first</strong> payment on that
              tier — no reason required. This applies once per person per tier; it isn't
              renewed by re-subscribing after a previous refund, and we may decline a request
              that we reasonably believe is being used to cycle free access — for example,
              repeated sign-up-refund-resubscribe patterns across different emails or payment
              methods traceable to the same person.
            </p>
            <p>
              After the <Fill>[14]</Fill>-day window, subscription payments are non-refundable
              for the remainder of that billing period — you keep access through the period
              you paid for, and cancellation under Section 2 prevents the next charge.
            </p>
          </>
        )
      },
      {
        heading: 'Annual Plans',
        body: (
          <p>
            The Section 4 money-back window also applies to annual plans, calculated from the
            date of purchase, not pro-rated for months used. Outside that window, an annual
            plan is non-refundable for the remaining months of its term; you may still cancel
            auto-renewal at any time so it doesn't renew for a second year. Annual plans also
            carry the pre-renewal notice described in the Terms &amp; Conditions' Fixed-Term
            Plan Renewal Notice section, giving you advance warning before the next charge
            either way.
          </p>
        )
      },
      {
        heading: 'Enterprise Plans',
        body: (
          <p>
            Enterprise/custom licensing is billed and refunded per the terms of its separate
            order form or master agreement, not this policy — check that document, or contact{' '}
            <Fill>[sales@wtscompoundiq.co.za]</Fill>.
          </p>
        )
      },
      {
        heading: 'Failed & Disputed Payments',
        body: (
          <p>
            If a renewal payment fails, we'll retry per our processor's standard schedule;
            your tier downgrades to Basic automatically if it's still unresolved after{' '}
            <Fill>[3 days]</Fill>. If you file a chargeback with your bank instead of
            contacting us first, we reserve the right to immediately suspend the associated
            access while it's investigated.
          </p>
        )
      },
      {
        heading: 'How to Request a Refund',
        body: (
          <p>
            Email <Fill>[support@wtscompoundiq.co.za]</Fill> with the email address you paid
            with and, if you have it, your transaction reference from Paystack's
            confirmation. We aim to respond within <Fill>[3]</Fill> business days and, once
            approved, refunds are returned to your original payment method within{' '}
            <Fill>[5–10]</Fill> business days, depending on your bank or card issuer.
          </p>
        )
      },
      {
        heading: 'Changes to This Policy',
        body: (
          <p>
            Refund terms in effect at the time of your purchase apply to that purchase; if we
            shorten or extend the money-back window, it applies to purchases made after the
            change, not retroactively.
          </p>
        )
      }
    ]
  }
];
