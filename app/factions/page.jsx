import AppShell from '../../components/app-shell';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Faction Journal & Guild Rank Tracker',
  description: 'Morrowind guild and Great House progression planner. Track favored skills, attribute rank thresholds, faction reputation, and inter-faction conflicts.',
  alternates: { canonical: 'https://siltstrider.tools/factions' },
  openGraph: {
    title: 'Morrowind Faction Journal & Guild Rank Tracker | Silt Strider',
    description: 'Morrowind guild and Great House progression planner. Track favored skills, attribute rank thresholds, faction reputation, and inter-faction conflicts.',
    url: 'https://siltstrider.tools/factions',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider — Morrowind Faction Journal' }]
  }
};

export default function FactionsPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <AppShell initialView="factions" />
  </>;
}
