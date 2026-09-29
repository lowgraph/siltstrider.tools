import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd, getToolJsonLd, ABOUT_FAQ_JSON_LD } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'About Silt Strider & Game Engine Mechanics',
  description: 'About Silt Strider, a free, data-driven toolbox for The Elder Scrolls III: Morrowind. Formula derivation, engine accuracy, and privacy details.',
  alternates: { canonical: 'https://siltstrider.tools/about' },
  openGraph: {
    title: 'About Silt Strider & Game Engine Mechanics | Silt Strider Tools',
    description: 'About Silt Strider, a free, data-driven toolbox for The Elder Scrolls III: Morrowind. Formula derivation, engine accuracy, and privacy details.',
    url: 'https://siltstrider.tools/about',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — About' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Silt Strider & Game Engine Mechanics | Silt Strider Tools',
    description: 'About Silt Strider, a free, data-driven toolbox for The Elder Scrolls III: Morrowind. Formula derivation, engine accuracy, and privacy details.',
    images: ['/og-image.png']
  }
};

export default function AboutPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('about');
  const toolJsonLd = getToolJsonLd('about');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    {toolJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_FAQ_JSON_LD) }} />
    <h1 className="sr-only">About Silt Strider &amp; Game Engine Mechanics</h1>
    <AppShell initialView="about" />
  </>;
}
