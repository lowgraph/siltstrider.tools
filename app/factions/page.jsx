import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd, getToolJsonLd, getToolFaqJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Faction Journal & Guild Rank Tracker',
  description: 'Morrowind guild and Great House progression planner. Track favored skills, attribute rank thresholds, faction reputation, and how each faction regards the others.',
  alternates: { canonical: 'https://siltstrider.tools/factions' },
  openGraph: {
    title: 'Morrowind Faction Journal & Guild Rank Tracker | Silt Strider Tools',
    description: 'Morrowind guild and Great House progression planner. Track favored skills, attribute rank thresholds, faction reputation, and how each faction regards the others.',
    url: 'https://siltstrider.tools/factions',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Faction Journal' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morrowind Faction Journal & Guild Rank Tracker | Silt Strider Tools',
    description: 'Morrowind guild and Great House progression planner. Track favored skills, attribute rank thresholds, faction reputation, and how each faction regards the others.',
    images: ['/og-image.png']
  }
};

export default function FactionsPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('factions');
  const toolJsonLd = getToolJsonLd('factions');
  const toolFaqJsonLd = getToolFaqJsonLd('factions');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    {toolJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />}
    {toolFaqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolFaqJsonLd) }} />}
    <AppShell initialView="factions" />
  </>;
}
