import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd, getToolJsonLd, getToolFaqJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Enchanting & Soul Gem Calculator',
  description: 'Calculate item enchantment points, cast-on-strike and constant effect costs, soul gem capacities, and formulaic enchant success rates for Morrowind.',
  alternates: { canonical: 'https://siltstrider.tools/enchanting' },
  openGraph: {
    title: 'Morrowind Enchanting & Soul Gem Calculator | Silt Strider Tools',
    description: 'Calculate item enchantment points, cast-on-strike and constant effect costs, soul gem capacities, and formulaic enchant success rates for Morrowind.',
    url: 'https://siltstrider.tools/enchanting',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Enchanting Calculator' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morrowind Enchanting & Soul Gem Calculator | Silt Strider Tools',
    description: 'Calculate item enchantment points, cast-on-strike and constant effect costs, soul gem capacities, and formulaic enchant success rates for Morrowind.',
    images: ['/og-image.png']
  }
};

export default function EnchantingPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('enchanting');
  const toolJsonLd = getToolJsonLd('enchanting');
  const toolFaqJsonLd = getToolFaqJsonLd('enchanting');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    {toolJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />}
    {toolFaqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolFaqJsonLd) }} />}
    <h1 className="sr-only">Morrowind Enchanting &amp; Soul Gem Calculator</h1>
    <AppShell initialView="enchanting" />
  </>;
}
