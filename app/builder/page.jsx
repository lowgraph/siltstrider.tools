import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Character Builder & Build Optimizer',
  description: 'Interactive character builder and class creator for The Elder Scrolls III: Morrowind, Tamriel Rebuilt, and ARCE. Balance skills, attributes, and gear.',
  alternates: { canonical: 'https://siltstrider.tools/builder' },
  openGraph: {
    title: 'Morrowind Character Builder & Build Optimizer | Silt Strider Tools',
    description: 'Interactive character builder and class creator for The Elder Scrolls III: Morrowind, Tamriel Rebuilt, and ARCE. Balance skills, attributes, and gear.',
    url: 'https://siltstrider.tools/builder',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Character Builder' }]
  }
};

export default function BuilderPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('builder');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    <AppShell initialView="builder" />
  </>;
}

