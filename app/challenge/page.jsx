import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Challenge Run Generator & Permalinks',
  description: 'Generate Morrowind challenge runs with customizable difficulty, restrictions, win conditions, and seedable permalinks for Vvardenfell and Tamriel Rebuilt.',
  alternates: { canonical: 'https://siltstrider.tools/challenge' },
  openGraph: {
    title: 'Morrowind Challenge Run Generator & Permalinks | Silt Strider Tools',
    description: 'Generate Morrowind challenge runs with customizable difficulty, restrictions, win conditions, and seedable permalinks for Vvardenfell and Tamriel Rebuilt.',
    url: 'https://siltstrider.tools/challenge',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Challenge Generator' }]
  }
};

export default function ChallengePage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('challenge');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    <AppShell initialView="challenge" />
  </>;
}
