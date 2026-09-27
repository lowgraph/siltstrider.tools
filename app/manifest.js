export const dynamic = 'force-static';

export default function manifest() {
  return {
    name: 'Silt Strider Tools — Morrowind Build Planner & Progression Toolbox',
    short_name: 'Silt Strider Tools',
    description: 'The definitive data-driven character builder, 5x multiplier level simulator, alchemy calculator, and travel planner for Morrowind, Tamriel Rebuilt, and ARCE.',
    start_url: '/',
    display: 'standalone',
    background_color: '#14100a',
    theme_color: '#14100a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
