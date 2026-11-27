import { getSiteContent } from '../lib/data';
import { buildFeedSource } from '../lib/app-feed-source';

// Build-time handoff to the app-feed integration. Deleted before output is published.
export async function GET(context: { site: URL | undefined }) {
  if (!context.site) throw new Error('App feed requires Astro site configuration');
  const { posts, series } = await getSiteContent();
  return new Response(JSON.stringify(buildFeedSource(posts, series, context.site, import.meta.env.BASE_URL)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
