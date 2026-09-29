import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from '../lib/theme.mjs';
import './globals.css';
import './theme-ashfall.css';

// Ashfall's type. The classic theme keeps Pelagiad (see globals.css).
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });

export const metadata = {
  metadataBase: new URL('https://siltstrider.tools'),
  title: {
    default: 'Silt Strider Tools — Morrowind Build Planner & Progression Toolbox',
    template: '%s | Silt Strider Tools',
  },
  description:
    'The definitive data-driven character builder, 5x multiplier level simulator, alchemy calculator, and travel planner for The Elder Scrolls III: Morrowind, Tamriel Rebuilt, and ARCE.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  alternates: {
    canonical: 'https://siltstrider.tools',
  },
  canonical: 'https://siltstrider.tools',
  openGraph: {
    title: 'Silt Strider Tools — Morrowind Build Planner & Progression Toolbox',
    description:
      'The definitive data-driven character builder, 5x multiplier level simulator, alchemy calculator, and travel planner for The Elder Scrolls III: Morrowind, Tamriel Rebuilt, and ARCE.',
    url: 'https://siltstrider.tools',
    siteName: 'Silt Strider Tools',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Silt Strider Tools — Morrowind Build Planner & Progression Toolbox',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Silt Strider Tools — Morrowind Build Planner & Progression Toolbox',
    description:
      'The definitive data-driven character builder, 5x multiplier level simulator, alchemy calculator, and travel planner for The Elder Scrolls III: Morrowind, Tamriel Rebuilt, and ARCE.',
    images: ['/og-image.png'],
  },
  keywords: [
    'Morrowind',
    'OpenMW',
    'Tamriel Rebuilt',
    'character builder',
    'build planner',
    'level simulator',
    'efficient leveling',
    '5x multiplier',
    'alchemy calculator',
    'spellmaking calculator',
    'enchanting calculator',
    'travel map',
    'ARCE',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Silt Strider Tools',
  url: 'https://siltstrider.tools',
  description:
    'The definitive data-driven character builder, 5x multiplier level simulator, alchemy calculator, and travel planner for The Elder Scrolls III: Morrowind, Tamriel Rebuilt, and ARCE.',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  image: 'https://siltstrider.tools/og-image.png',
};

export default function RootLayout({ children }) {
  // The server renders the default theme; the inline script swaps in a stored
  // choice before the first paint, hence suppressHydrationWarning on <html>.
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
