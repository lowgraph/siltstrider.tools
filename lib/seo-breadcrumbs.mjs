/**
 * SEO Structured Data: Breadcrumbs and Rich Snippet schemas.
 * Adheres strictly to Schema.org standards and Google Search Central requirements
 * for BreadcrumbList and FAQPage rich results.
 */

export const BREADCRUMB_MAP = Object.freeze({
  builder: { group: 'Planners', name: 'Build Optimizer', path: '/builder' },
  leveler: { group: 'Planners', name: 'Level Simulator', path: '/leveler' },
  factions: { group: 'Planners', name: 'Faction Journal', path: '/factions' },
  challenge: { group: 'Planners', name: 'Challenge Runs', path: '/challenge' },
  vault: { group: 'Planners', name: 'Cloud Vault', path: '/vault' },
  alchemy: { group: 'Calculators', name: 'Alchemy Calculator', path: '/alchemy' },
  travel: { group: 'Calculators', name: 'Travel Optimizer', path: '/travel' },
  enchanting: { group: 'Calculators', name: 'Enchanting Calculator', path: '/enchanting' },
  spellmaking: { group: 'Calculators', name: 'Spellmaking Calculator', path: '/spellmaking' },
  about: { group: 'Site', name: 'About & Mechanics', path: '/about' },
  changelog: { group: 'Site', name: 'Changelog', path: '/changelog' },
  privacy: { group: 'Legal', name: 'Privacy Policy', path: '/privacy' },
  terms: { group: 'Legal', name: 'Terms of Service', path: '/terms' },
});

export function getBreadcrumbJsonLd(view) {
  const item = BREADCRUMB_MAP[view];
  if (!item) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://siltstrider.tools',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: item.group,
        item: 'https://siltstrider.tools',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: item.name,
        item: `https://siltstrider.tools${item.path}`,
      },
    ],
  };
}

export const ABOUT_FAQ_JSON_LD = Object.freeze({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Health growth work on level-up in Morrowind and OpenMW?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Health gains on level-up in Morrowind are strictly non-retroactive and calculated as floor(Endurance / 10) using your new Endurance attribute after the level-up is applied. Raising Endurance early maximizes total Health over a playthrough.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do you earn ×5 attribute multipliers on level-up in Morrowind?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To earn a ×5 multiplier for a governing attribute on level-up, you must gain a combined total of 10 skill increases in skills governed by that attribute (from Major, Minor, or Miscellaneous skills) before sleeping to trigger the level-up. Luck has no governing skills and is fixed at +1.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do alchemy apparatus quality modifiers work in Morrowind?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In Morrowind alchemy (verified against OpenMW 0.51.0 mwmechanics), Mortar and Pestle quality dictates base potion magnitude and duration; Retort amplifies positive effect magnitude; Alembic reduces negative side-effect magnitude and duration; and Calcinator magnifies all effect magnitudes.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is required to create constant effect enchantments in Morrowind?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Constant effect enchantments strictly require a soul gem holding a soul capacity of 400 or greater, such as a Grand Soul Gem or Azura\'s Star trapped with a Golden Saint (400) or Ascended Sleeper (400). Items must also possess sufficient enchantment capacity.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it safe to inspect OpenMW save files (.omwsave) in Silt Strider?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. OpenMW save parsing in Silt Strider is strictly client-side and zero-tracking. Files are decoded entirely in your browser using local JavaScript, and no save data or personal information is ever transmitted to an external server.',
      },
    },
  ],
});
