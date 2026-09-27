import AppShell from '../../components/app-shell';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool',
  description: 'Calculate exact Morrowind potion effects and brew success chances using OpenMW 0.51 engine formulas. Accounts for mortar, alembic, calcinator, and retort.',
  alternates: { canonical: 'https://siltstrider.tools/alchemy' },
  openGraph: {
    title: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool | Silt Strider',
    description: 'Calculate exact Morrowind potion effects and brew success chances using OpenMW 0.51 engine formulas. Accounts for mortar, alembic, calcinator, and retort.',
    url: 'https://siltstrider.tools/alchemy',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider — Morrowind Alchemy Calculator' }]
  }
};

export default function AlchemyPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <AppShell initialView="alchemy" />
  </>;
}
