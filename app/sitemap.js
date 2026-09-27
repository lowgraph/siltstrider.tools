export const dynamic = 'force-static';

export default function sitemap() {
  return [
    {
      url: 'https://siltstrider.tools/',
      lastModified: new Date('2026-09-27'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://siltstrider.tools/privacy',
      lastModified: new Date('2026-09-27'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://siltstrider.tools/terms',
      lastModified: new Date('2026-09-27'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
