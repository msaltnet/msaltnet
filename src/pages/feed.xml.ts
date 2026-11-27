import { getSiteContent } from '../lib/data';
import { atomFeed } from '../lib/discovery';
import { toFeedPost } from '../lib/feed-posts';
import { SITE } from '../lib/site';

export async function GET() {
  const { posts } = await getSiteContent();
  const body = atomFeed(posts.map(toFeedPost), {
    site: SITE.origin, title: SITE.title, subtitle: SITE.description, updated: new Date().toISOString(), limit: 50,
  });
  return new Response(body, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
}
