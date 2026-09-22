import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from '../lib/theme.mjs';
import './legacy-compat.css';
import './globals.css';
import './theme-ashfall.css';

// Ashfall's type. The classic theme keeps Pelagiad (see globals.css).
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });

export const metadata = { title: 'Silt Strider', description: 'Morrowind Build Planner & Challenge Run Generator' };

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
      </head>
      <body>{children}</body>
    </html>
  );
}
