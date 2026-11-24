import { getSiteContent } from '../lib/data';
import { llmsTxt } from '../lib/discovery';
import { toFeedPost } from '../lib/feed-posts';
import { navigation, projects } from '../lib/site-data';
import { SITE } from '../lib/site';

export async function GET() {
  const { posts } = await getSiteContent();
  const text = llmsTxt({ site: SITE.origin, description: SITE.description, posts: posts.map(toFeedPost), navigation: navigation(), projects: projects() });
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
