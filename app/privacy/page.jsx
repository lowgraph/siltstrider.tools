import LegalPage from '../../components/legal-page';
import { getBreadcrumbJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Silt Strider handles account information, game saves, and supporter payments.',
  alternates: { canonical: 'https://siltstrider.tools/privacy' },
  openGraph: {
    title: 'Privacy Policy | Silt Strider Tools',
    description: 'How Silt Strider handles account information, game saves, and supporter payments.',
    url: 'https://siltstrider.tools/privacy',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Privacy Policy' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Silt Strider Tools',
    description: 'How Silt Strider handles account information, game saves, and supporter payments.',
    images: ['/og-image.png']
  }
};

export default function PrivacyPage() {
  const breadcrumb = getBreadcrumbJsonLd('privacy');
  return <>
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    <LegalPage title="Privacy Policy">
    <p>This policy explains how Silt Strider at siltstrider.tools handles information when you use its Morrowind planning tools, accounts, and Cloud Vault. For privacy questions or requests, contact the site operator at <a href="mailto:tmarcalferreira@gmail.com">tmarcalferreira@gmail.com</a>.</p>

    <section><h2>Information we process</h2>
      <ul>
        <li><strong>Sign-in information.</strong> Clerk manages authentication. When you use Google or Discord, Clerk processes the account identifier, email address, and basic profile information the provider supplies, such as a name or avatar. Silt Strider uses your Clerk account identifier to associate your saved data and supporter status with you. Site profile icons are selected from our built-in icons.</li>
        <li><strong>Profile information.</strong> We store your chosen username and icon identifier.</li>
        <li><strong>Saved characters.</strong> Cloud saves can contain builds, challenges, equipment, and imported game information such as character names, levels, inventory, locations, quests, and factions, along with save titles, revisions, and timestamps.</li>
        <li><strong>Supporter information.</strong> To match a Ko-fi payment to your account, we store an account support code and payment transaction identifier, amount, account identifier, and receipt timestamp. Our payment record does not retain donor emails or card details. Ko-fi and its payment processors handle payment information separately.</li>
        <li><strong>Technical and contact information.</strong> Hosting and authentication providers process information such as IP addresses, browser details, requests, and security logs. If you contact us, we receive the information in your message.</li>
      </ul>
    </section>

    <section><h2>Local files and browser storage</h2>
      <p>Opening a game save parses it in your browser. Opening it alone does not upload it to Cloud Vault. Choosing to save or upload it to the cloud sends its parsed character data to our service. You can use the planning tools without a cloud account.</p>
      <p>Browser storage keeps local saves and preferences, including your selected theme. Clerk uses cookies and related browser storage to support sign-in and sessions. Clearing site data removes locally stored information and may sign you out; it does not delete cloud records.</p>
    </section>

    <section><h2>How we use information</h2>
      <p>We use information to authenticate you, store and retrieve your characters, display your chosen profile, apply supporter benefits, respond to requests, and protect and maintain the service. Google access is used for sign-in and basic identity information; we do not request access to your Gmail, Drive files, or contacts. We do not sell your personal information or use Google account data for advertising.</p>
    </section>

    <section><h2>Service providers and sharing</h2>
      <p>Clerk provides authentication, Cloudflare hosts the site and cloud database, and Ko-fi handles optional support payments. Information needed for those functions is processed by those providers under their own terms and privacy policies. Their infrastructure may process information outside your country.</p>
      <p>We may disclose information when required by law or when necessary to address fraud, abuse, or security incidents. If you send someone an exported save or a share link containing character information, that recipient can access the information you share. Treat those links and files accordingly.</p>
    </section>

    <section><h2>Retention, deletion, and your choices</h2>
      <p>Cloud records are kept until you delete them or request their removal, subject to information needed for payment records, security, disputes, or legal obligations. Provider backups and logs can remain subject to the provider’s retention practices. Local copies remain in your browser until removed.</p>
      <p>You can export and delete saves through the vault and change your site profile through the account page. For account deletion, deletion of associated site records, or requests to access or correct your personal information, email <a href="mailto:tmarcalferreira@gmail.com">tmarcalferreira@gmail.com</a>. We may need to verify ownership before acting. Disconnecting Google or Discord alone does not delete previously stored site data.</p>
      <p>Depending on where you live, applicable law may give you additional rights, including objection, restriction, portability, or the right to complain to a data protection authority. Contact us to exercise those rights.</p>
    </section>

    <section><h2>Security and changes</h2>
      <p>We use authenticated access to protect cloud records, but no online service can guarantee complete security. Keep your own backups and avoid putting sensitive personal information into character names or save titles.</p>
      <p>We may update this policy as the service changes. The date above identifies the latest revision. Material changes will be described on the site.</p>
    </section>
  </LegalPage>
  </>;
}
