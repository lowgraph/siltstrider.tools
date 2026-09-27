import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd, getToolJsonLd, getToolFaqJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Travel Map & Transport Route Planner',
  description: 'Interactive travel route planner for Morrowind and Tamriel Rebuilt. Find the fewest legs, the cheapest fare or the fastest trip between settlements via silt strider, boat, and Guild Guides.',
  alternates: { canonical: 'https://siltstrider.tools/travel' },
  openGraph: {
    title: 'Morrowind Travel Map & Transport Route Planner | Silt Strider Tools',
    description: 'Interactive travel route planner for Morrowind and Tamriel Rebuilt. Find the fewest legs, the cheapest fare or the fastest trip between settlements via silt strider, boat, and Guild Guides.',
    url: 'https://siltstrider.tools/travel',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Travel Map' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morrowind Travel Map & Transport Route Planner | Silt Strider Tools',
    description: 'Interactive travel route planner for Morrowind and Tamriel Rebuilt. Find the fewest legs, the cheapest fare or the fastest trip between settlements via silt strider, boat, and Guild Guides.',
    images: ['/og-image.png']
  }
};

export default function TravelPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('travel');
  const toolJsonLd = getToolJsonLd('travel');
  const toolFaqJsonLd = getToolFaqJsonLd('travel');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    {toolJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />}
    {toolFaqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolFaqJsonLd) }} />}
    <h1 className="sr-only">Morrowind Travel Map &amp; Transport Route Planner</h1>
    <AppShell initialView="travel" />
  </>;
}
