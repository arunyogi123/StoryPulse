import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://simplenews.local').replace(/\/$/, '');
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/?category=Science`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/?category=Tech`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/?category=Nature`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/?category=Life`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    
    {
      url: `${siteUrl}/?category=World`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    // Source of truth: only published articles from Django API
    const response = await fetch(`${apiBaseUrl}/api/news/?status=published`, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const articles = await response.json();
      if (Array.isArray(articles)) {
        for (const art of articles) {
          // Strictly verify publication flag
          if (art.is_published && art.slug) {
            entries.push({
              url: `${siteUrl}/?article=${encodeURIComponent(art.slug)}`,
              lastModified: art.updated_at ? new Date(art.updated_at) : new Date(),
              changeFrequency: 'weekly',
              priority: 0.8,
            });
          }
        }
      }
    }
  } catch {
    // If backend is not running during static build, base sitemap is exported without failure
  }

  return entries;
}
