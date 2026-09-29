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
        text: 'Yes. Opening an OpenMW save parses it in your browser with local JavaScript; the file is not uploaded. Saving a character to Cloud Vault is optional and needs an account: it sends the parsed character data to our service. The Privacy Policy explains what is stored.',
      },
    },
  ],
});

export const TOOL_SCHEMAS = Object.freeze({
  builder: {
    name: 'Morrowind Character Builder & Build Optimizer',
    description: 'Interactive character builder and class creator for The Elder Scrolls III: Morrowind, Tamriel Rebuilt, and ARCE. Balance skills, attributes, and gear.',
    path: '/builder',
    featureList: [
      'Custom class creator and 21 premade class archetypes',
      'Starting attributes and health calculation based on race, gender, and birthsign',
      'Major and Minor skill progression balancing',
      'Early-game gear advice and late-game equipment optimizer',
      'Full support for Vanilla, Tamriel Rebuilt, and ARCE subtypes',
    ],
  },
  leveler: {
    name: 'Morrowind Level Simulator & 5x Multiplier Progression Planner',
    description: 'Calculate optimal miscellaneous skill training for guaranteed 5x attribute multipliers, non-retroactive Health growth, and efficient leveling in Morrowind.',
    path: '/leveler',
    featureList: [
      'Automatic 5x attribute multiplier solver',
      'Cheapest miscellaneous skill training level-by-level recommendations',
      'Non-retroactive Health projection and Endurance rushing optimizer',
      'Build archetype detection (Melee Tank, Stealth Assassin, Pure Mage, Battlemage)',
      'Direct synchronization with active character builder sheets',
    ],
  },
  alchemy: {
    name: 'Morrowind Alchemy Calculator & Potion Brewing Recipe Tool',
    description: 'Interactive potion brewing calculator with verified OpenMW engine mechanics. Four-ingredient combinations, apparatus quality scaling, and exact brew formulas.',
    path: '/alchemy',
    featureList: [
      'Four-ingredient combination search with effect filtering',
      'Apparatus quality modifiers (Mortar and Pestle, Alembic, Calcinator, Retort)',
      'Verified OpenMW 0.51.0 mwmechanics brewing probability formula',
      'Positive and negative effect magnitude and duration calculation',
      'Full ingredients support for Vanilla, Tamriel Rebuilt 26.08, and ARCE',
    ],
  },
  travel: {
    name: 'Morrowind Travel Map & Transport Route Planner',
    description: 'Fewest legs, cheapest fare or fastest trip: a transport route planner and interactive transit map for Silt Striders, boats, river striders, and Mage Guild Guides in Morrowind and Tamriel Rebuilt.',
    path: '/travel',
    featureList: [
      'Dijkstra shortest-path routing between any two settlements',
      'Silt Strider, boat, river strider, and Guild Guide transit network graph',
      'Propylon Index ancient Dunmer stronghold fast travel routes',
      'Interactive vector map of Vvardenfell and mainland Tamriel',
      'Guild of Mages discount and membership filtering',
    ],
  },
  spellmaking: {
    name: 'Morrowind Spellmaking & Casting Chance Calculator',
    description: 'Custom spellmaking calculator computing Magicka costs, casting success chance percentages, and spellmaker gold barter prices across all six magic schools.',
    path: '/spellmaking',
    featureList: [
      'Formulaic Magicka cost calculation based on spell effects, magnitude, duration, and area',
      'Casting success probability formula factoring Skill, Willpower, Luck, and Fatigue',
      'Spellmaker NPC barter price calculator with Mercantile and Personality scaling',
      'All 6 schools of magic (Destruction, Restoration, Alteration, Illusion, Conjuration, Mysticism)',
    ],
  },
  enchanting: {
    name: 'Morrowind Enchanting & Soul Gem Calculator',
    description: 'Soul gem capacity, item enchant points, cast-on-strike/use and constant effect costs, and formulaic success probability calculator.',
    path: '/enchanting',
    featureList: [
      'Soul gem capacity reference (Petty to Grand, Azura\'s Star)',
      'Item enchantment point capacity catalogue',
      'Constant effect enchantment requirements (400+ soul: Golden Saint, Ascended Sleeper)',
      'Self-enchanting success chance percentage formula',
      'Enchanter service NPC gold barter cost calculation',
    ],
  },
  factions: {
    name: 'Morrowind Faction Journal & Guild Rank Tracker',
    description: 'Guild and Great House progression planner. Track favored skills, attribute rank thresholds, faction reputation, and guild conflict standings.',
    path: '/factions',
    featureList: [
      'Great Houses (Hlaalu, Redoran, Telvanni) exclusivity and advancement',
      'Imperial Guilds, Temple, Imperial Cult, Morag Tong, and Thieves Guild',
      'Favored attribute and skill requirements per rank',
      'Inter-faction reputation and disposition modifiers',
      'Tamriel Rebuilt mainland faction support',
    ],
  },
  challenge: {
    name: 'Morrowind Challenge Run Generator & Permalinks',
    description: 'Deterministic challenge run generator for Morrowind with customizable restrictions, goals, and shareable permalink seeds.',
    path: '/challenge',
    featureList: [
      'Deterministic 32-bit pseudorandom seed engine',
      'Customizable restrictions, major goals, and thematic playthroughs',
      'Card locking and selective rerolling',
      'Compact shareable URL permalinks',
    ],
  },
  vault: {
    name: 'Cloud Character Vault & OpenMW Save Ingestion',
    description: 'Inspect OpenMW .omwsave files in your browser without uploading them. Optional cloud character vault and cross-device build sync for signed-in users.',
    path: '/vault',
    featureList: [
      'Browser-based client-side OpenMW .omwsave binary parser',
      'Local save inspection: files are read in your browser, not uploaded',
      'Cloud storage and cross-device character build sync via Clerk',
      'Export character sheets and build progress directly to workstations',
    ],
  },
  about: {
    name: 'About Silt Strider & Game Engine Mechanics',
    description: 'Formula derivation, OpenMW 0.51.0 engine accuracy, data provenance, and privacy details for Silt Strider.',
    path: '/about',
    featureList: [
      'Engine mechanics verified against OpenMW mwmechanics C++ source',
      'Multi-world dataset provenance (Vanilla, Tamriel Rebuilt 26.08, ARCE)',
      'Public source code and plain-language privacy details',
    ],
  },
  changelog: {
    name: 'Silt Strider Tools Changelog & Version History',
    description: 'Detailed release notes, engine formulas, and feature updates across Silt Strider versions.',
    path: '/changelog',
    featureList: [
      'Chronological version history and milestone releases',
      'Game formula updates and database schema sync',
      'Responsive design and accessibility improvements',
    ],
  },
});

export function getToolJsonLd(view) {
  const tool = TOOL_SCHEMAS[view];
  if (!tool) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: `https://siltstrider.tools${tool.path}`,
    description: tool.description,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    featureList: tool.featureList,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    image: 'https://siltstrider.tools/og-image.png',
  };
}

export const TOOL_FAQS = Object.freeze({
  leveler: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do 5x attribute multipliers work in Morrowind?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Each level-up in Morrowind requires 10 skill increases in Major or Minor skills. To get a 5x multiplier in a governing attribute on level up, you need a combined 10 skill increases across skills governed by that attribute (including Major, Minor, and Miscellaneous skills) before sleeping. Miscellaneous skills do not advance character level, making them ideal for securing 5x multipliers without wasting character levels.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Health retroactive on level up in Morrowind?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Health gain on level up is strictly non-retroactive in vanilla Morrowind and OpenMW. It is calculated as floor(Endurance / 10) using your new Endurance attribute after the level-up is applied. Reaching 100 Endurance early yields significantly more total Health over the course of a playthrough.',
        },
      },
    ],
  },
  alchemy: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do alchemy apparatus affect potion brewing in Morrowind?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In Morrowind (and verified in OpenMW 0.51.0 mwmechanics), the Mortar and Pestle determines base potion strength and duration; the Retort amplifies positive effect magnitude; the Alembic weakens negative side-effects; and the Calcinator magnifies both positive and negative magnitudes.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the potion brewing success chance formula in OpenMW?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The brewing success probability is floor(Alchemy + 0.1 * Intelligence + 0.1 * Luck)%. In OpenMW engine mechanics, fatigue does not alter the alchemy success check, only current attribute and skill levels.',
        },
      },
    ],
  },
  enchanting: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What souls can be used for constant effect enchantments in Morrowind?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Constant effect enchantments require a soul size of 400 or greater trapped in a Grand Soul Gem or Azura\'s Star. The only creatures in the base game that provide 400 soul are Golden Saints and Ascended Sleepers (Tribunal and Bloodmoon add certain unique bosses like Almalexia, Vivec, and Karstaag).',
        },
      },
    ],
  },
  travel: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How can I fast travel between Vvardenfell and mainland Tamriel Rebuilt?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mainland travel links include sea connections (boats from Ebonheart, Tel Branora, and Khuul to mainland ports like Firewatch and Old Ebonheart), River Striders in mainland waterways, and the Mage Guild Guide teleportation network linking major Vvardenfell chapterhouses to mainland Mages Guild halls.',
        },
      },
    ],
  },
});

export function getToolFaqJsonLd(view) {
  return TOOL_FAQS[view] || null;
}
