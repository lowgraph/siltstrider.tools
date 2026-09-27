import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd, getToolJsonLd, getToolFaqJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Level Simulator & 5x Multiplier Progression Planner',
  description: 'Calculate optimal miscellaneous skill training for guaranteed 5x attribute multipliers, non-retroactive Health growth, and efficient leveling in Morrowind.',
  alternates: { canonical: 'https://siltstrider.tools/leveler' },
  openGraph: {
    title: 'Morrowind Level Simulator & 5x Multiplier Progression Planner | Silt Strider Tools',
    description: 'Calculate optimal miscellaneous skill training for guaranteed 5x attribute multipliers, non-retroactive Health growth, and efficient leveling in Morrowind.',
    url: 'https://siltstrider.tools/leveler',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Level Simulator' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morrowind Level Simulator & 5x Multiplier Progression Planner | Silt Strider Tools',
    description: 'Calculate optimal miscellaneous skill training for guaranteed 5x attribute multipliers, non-retroactive Health growth, and efficient leveling in Morrowind.',
    images: ['/og-image.png']
  }
};

export default function LevelerPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('leveler');
  const toolJsonLd = getToolJsonLd('leveler');
  const toolFaqJsonLd = getToolFaqJsonLd('leveler');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    {toolJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />}
    {toolFaqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolFaqJsonLd) }} />}
    <h1 className="sr-only">Morrowind Level Simulator &amp; 5x Multiplier Progression Planner</h1>
    <AppShell initialView="leveler" />
  </>;
}
