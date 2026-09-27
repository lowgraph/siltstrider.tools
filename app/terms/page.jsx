import LegalPage from '../../components/legal-page';
import { getBreadcrumbJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms for using Silt Strider planning tools, Cloud Vault, and optional supporter benefits.',
  alternates: { canonical: 'https://siltstrider.tools/terms' },
  openGraph: {
    title: 'Terms of Service | Silt Strider Tools',
    description: 'Terms for using Silt Strider planning tools, Cloud Vault, and optional supporter benefits.',
    url: 'https://siltstrider.tools/terms',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Terms of Service' }]
  }
};

export default function TermsPage() {
  const breadcrumb = getBreadcrumbJsonLd('terms');
  return <>
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    <LegalPage title="Terms of Service">
    <p>These terms apply to your use of Silt Strider at siltstrider.tools. By using the service, you agree to these terms. If you do not agree, do not use the service. Questions can be sent to <a href="mailto:tmarcalferreira@gmail.com">tmarcalferreira@gmail.com</a>.</p>

    <section><h2>The service</h2>
      <p>Silt Strider is an independent fan project offering character planning, calculators, challenge generation, save-file reading, and optional cloud storage for Morrowind and supported mods. It is not affiliated with or endorsed by Bethesda or the mod teams. Game names, trademarks, and third-party content belong to their respective owners.</p>
      <p>Results are planning aids. Game versions, mods, and in-game conditions may produce different results. Keep independent backups of your game saves and exported characters; the Cloud Vault is not a guaranteed backup service.</p>
    </section>

    <section><h2>Accounts and acceptable use</h2>
      <p>You are responsible for your account activity and the information you choose to store or share. Use an account you control and comply with the eligibility requirements of the sign-in and payment providers you use.</p>
      <p>Do not access other users’ records without permission, bypass storage limits or authentication, submit malicious content, impersonate others, infringe others’ rights, or disrupt the service. We may restrict access where reasonably necessary to address abuse, security risks, or legal requirements.</p>
    </section>

    <section><h2>Your content and privacy</h2>
      <p>You retain any rights you hold in your submitted content. You permit us and our service providers to process, store, and transmit it as needed to provide the features you use. You are responsible for having permission to submit or share that content. Our <a href="/privacy">Privacy Policy</a> explains how personal information is handled.</p>
      <p>Anyone you give an exported file or a character share link may retain or redistribute its contents. Deleting your own copy does not remove copies held by others.</p>
    </section>

    <section><h2>Optional support and premium benefits</h2>
      <p>Optional support is handled through Ko-fi. The suggested amount is US$3; Ko-fi displays the available amount choices, currency, and final payment details. Eligible positive one-time support in any currency linked to your account provides 25 shared cloud-save slots and a special profile-icon border. Use the account support code as instructed so the payment can be matched.</p>
      <p>This is a one-time payment, not a subscription or automatic renewal. Premium has no scheduled expiry while the service and these benefits remain available; it is not a promise that the service will operate forever. Unmatched payments may need manual review.</p>
      <p>For missing benefits, mistaken payments, or refund requests, contact <a href="mailto:tmarcalferreira@gmail.com">tmarcalferreira@gmail.com</a> with your transaction reference, not card details. Refunds and disputes are reviewed manually through the payment provider. Any mandatory consumer rights remain unaffected.</p>
    </section>

    <section><h2>Availability and responsibility</h2>
      <p>The service is provided on an “as available” basis. We do not guarantee uninterrupted access, error-free calculations, or prevention of data loss. To the extent allowed by applicable law, we exclude implied warranties and liability for indirect or consequential losses arising from use of the service. Nothing in these terms excludes responsibility or rights that cannot lawfully be excluded.</p>
      <p>Features and availability may change. If paid benefits are materially reduced or the service is discontinued, we will aim to provide advance notice and an opportunity to export stored data, except where urgent security or legal circumstances prevent it. Applicable consumer remedies remain available.</p>
    </section>

    <section><h2>Ending use and updates</h2>
      <p>You can stop using the service at any time, delete individual cloud saves, and request account and associated data deletion by email. Information that must be retained is described in the Privacy Policy.</p>
      <p>We may revise these terms and will update the date above. Material changes will be described on the site. These terms do not replace the separate terms of Clerk, Google, Discord, Ko-fi, or other services you choose to use.</p>
    </section>
  </LegalPage>
  </>;
}
