import AppShell from '../../components/app-shell';

export const dynamic = 'force-static';

export const metadata = {
  title: 'About Silt Strider & Game Engine Mechanics',
  description: 'About Silt Strider, an open-source data-driven toolbox for The Elder Scrolls III: Morrowind. Formula derivation, engine accuracy, and privacy details.',
  alternates: { canonical: 'https://siltstrider.tools/about' },
  openGraph: {
    title: 'About Silt Strider & Game Engine Mechanics | Silt Strider',
    description: 'About Silt Strider, an open-source data-driven toolbox for The Elder Scrolls III: Morrowind. Formula derivation, engine accuracy, and privacy details.',
    url: 'https://siltstrider.tools/about',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Silt Strider — About' }]
  }
};

export default function AboutPage() {
  const key = process.env.CLERK_PUBLISHABLE_KEY || '';
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return <>
    <meta name="clerk-publishable-key" content={key} />
    <AppShell initialView="about" />
  </>;
}
