import AppShell from '../../components/app-shell';
import { getBreadcrumbJsonLd } from '../../lib/seo-breadcrumbs.mjs';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool',
  description: 'Calculate exact Morrowind potion effects and brew success chances using OpenMW 0.51 engine formulas. Accounts for mortar, alembic, calcinator, and retort.',
  alternates: { canonical: 'https://siltstrider.tools/alchemy' },
  openGraph: {
    title: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool | Silt Strider Tools',
    description: 'Calculate exact Morrowind potion effects and brew success chances using OpenMW 0.51 engine formulas. Accounts for mortar, alembic, calcinator, and retort.',
    url: 'https://siltstrider.tools/alchemy',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider Tools — Morrowind Alchemy Calculator' }]
  }
};

export default function AlchemyPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  const breadcrumb = getBreadcrumbJsonLd('alchemy');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    {breadcrumb && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />}
    <AppShell initialView="alchemy" />
  </>;
}

