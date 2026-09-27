import AppShell from '../../components/app-shell';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Spellmaking & Casting Chance Calculator',
  description: 'Calculate custom spell Magicka costs, casting success chance percentages, and spellmaker gold costs across all six schools of magic in Morrowind.',
  alternates: { canonical: 'https://siltstrider.tools/spellmaking' },
  openGraph: {
    title: 'Morrowind Spellmaking & Casting Chance Calculator | Silt Strider',
    description: 'Calculate custom spell Magicka costs, casting success chance percentages, and spellmaker gold costs across all six schools of magic in Morrowind.',
    url: 'https://siltstrider.tools/spellmaking',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider — Morrowind Spellmaking Calculator' }]
  }
};

export default function SpellmakingPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <AppShell initialView="spellmaking" />
  </>;
}
