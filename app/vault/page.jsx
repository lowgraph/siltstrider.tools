import AppShell from '../../components/app-shell';

export const dynamic = 'force-static';

export const metadata = {
  title: 'OpenMW Save File Inspector & Cloud Character Vault',
  description: 'Inspect and import OpenMW .omwsave files directly in your browser. Seamlessly manage character builds, equipment loadouts, and journal quests in the cloud.',
  alternates: { canonical: 'https://siltstrider.tools/vault' },
  openGraph: {
    title: 'OpenMW Save File Inspector & Cloud Character Vault | Silt Strider',
    description: 'Inspect and import OpenMW .omwsave files directly in your browser. Seamlessly manage character builds, equipment loadouts, and journal quests in the cloud.',
    url: 'https://siltstrider.tools/vault',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider — OpenMW Save Inspector' }]
  }
};

export default function VaultPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <AppShell initialView="vault" />
  </>;
}
