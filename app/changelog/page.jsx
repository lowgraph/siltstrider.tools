import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Changelog & Version History',
  description: 'Version history, new features, balance adjustments, and updates to the Silt Strider Morrowind toolset.',
  alternates: { canonical: 'https://siltstrider.tools/changelog' },
  openGraph: {
    title: 'Changelog & Version History | Silt Strider Tools',
    description: 'Version history, new features, balance adjustments, and updates to the Silt Strider Morrowind toolset.',
    url: 'https://siltstrider.tools/changelog',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Changelog' }]
  }
};

export default function ChangelogPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('changelog');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    <AppShell initialView="changelog" />
  </>;
}
