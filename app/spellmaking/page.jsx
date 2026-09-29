import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd, getToolJsonLd, getToolFaqJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Spellmaking & Casting Chance Calculator',
  description: 'Calculate custom spell Magicka costs, casting success chance percentages, and spellmaker gold costs across all six schools of magic in Morrowind.',
  alternates: { canonical: 'https://siltstrider.tools/spellmaking' },
  openGraph: {
    title: 'Morrowind Spellmaking & Casting Chance Calculator | Silt Strider Tools',
    description: 'Calculate custom spell Magicka costs, casting success chance percentages, and spellmaker gold costs across all six schools of magic in Morrowind.',
    url: 'https://siltstrider.tools/spellmaking',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Spellmaking Calculator' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morrowind Spellmaking & Casting Chance Calculator | Silt Strider Tools',
    description: 'Calculate custom spell Magicka costs, casting success chance percentages, and spellmaker gold costs across all six schools of magic in Morrowind.',
    images: ['/og-image.png']
  }
};

export default function SpellmakingPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('spellmaking');
  const toolJsonLd = getToolJsonLd('spellmaking');
  const toolFaqJsonLd = getToolFaqJsonLd('spellmaking');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    {toolJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />}
    {toolFaqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolFaqJsonLd) }} />}
    <AppShell initialView="spellmaking" />
  </>;
}
