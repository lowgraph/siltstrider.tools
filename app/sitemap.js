export const dynamic = 'force-static';

export default function sitemap() {
  const lastMod = new Date('2026-09-27');
  return [
    {
      url: 'https://siltstrider.tools/',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://siltstrider.tools/builder',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://siltstrider.tools/leveler',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://siltstrider.tools/alchemy',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://siltstrider.tools/travel',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://siltstrider.tools/spellmaking',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://siltstrider.tools/enchanting',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://siltstrider.tools/factions',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://siltstrider.tools/challenge',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://siltstrider.tools/vault',
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://siltstrider.tools/about',
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://siltstrider.tools/changelog',
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://siltstrider.tools/privacy',
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://siltstrider.tools/terms',
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
