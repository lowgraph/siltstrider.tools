import AppShell from '../../components/app-shell';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Level Simulator & 5x Multiplier Progression Planner',
  description: 'Calculate optimal miscellaneous skill training for guaranteed 5x attribute multipliers, non-retroactive Health growth, and efficient leveling in Morrowind.',
  alternates: { canonical: 'https://siltstrider.tools/leveler' },
  openGraph: {
    title: 'Morrowind Level Simulator & 5x Multiplier Progression Planner | Silt Strider',
    description: 'Calculate optimal miscellaneous skill training for guaranteed 5x attribute multipliers, non-retroactive Health growth, and efficient leveling in Morrowind.',
    url: 'https://siltstrider.tools/leveler',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider — Morrowind Level Simulator' }]
  }
};

export default function LevelerPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <AppShell initialView="leveler" />
  </>;
}
