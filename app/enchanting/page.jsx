import AppShell from '../../components/app-shell';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Enchanting & Soul Gem Calculator',
  description: 'Calculate item enchantment points, cast-on-strike and constant effect costs, soul gem capacities, and formulaic enchant success rates for Morrowind.',
  alternates: { canonical: 'https://siltstrider.tools/enchanting' },
  openGraph: {
    title: 'Morrowind Enchanting & Soul Gem Calculator | Silt Strider',
    description: 'Calculate item enchantment points, cast-on-strike and constant effect costs, soul gem capacities, and formulaic enchant success rates for Morrowind.',
    url: 'https://siltstrider.tools/enchanting',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider — Morrowind Enchanting Calculator' }]
  }
};

export default function EnchantingPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <AppShell initialView="enchanting" />
  </>;
}
