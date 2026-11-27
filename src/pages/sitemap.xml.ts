import { getSiteContent, isoDate } from '../lib/data';
import { sitemapXml } from '../lib/discovery';
import { navigation } from '../lib/site-data';
import { SITE, absolute } from '../lib/site';

// Same page set as the former jekyll-sitemap output; search and app pages stay out.
const SITEMAP_KEYS = new Set(['reviews', 'thoughts', 'ax', 'projects', 'about']);

export async function GET() {
  const { posts } = await getSiteContent();
  const entries = [
    ...posts.map((post) => ({ loc: absolute(`/article/${post.id}/`), lastmod: isoDate(post.data.last_modified_at ?? post.data.date) })),
    { loc: `${SITE.origin}/` },
    ...navigation().filter((item) => SITEMAP_KEYS.has(item.key)).map((item) => ({ loc: absolute(item.url) })),
  ];
  return new Response(sitemapXml(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
