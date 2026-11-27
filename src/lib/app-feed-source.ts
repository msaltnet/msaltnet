import { publishedPosts, type PostRecord } from './content';

type FeedPost = PostRecord & { data: PostRecord['data'] & { description: string } };
type FeedSeries = { id: string; data: { title: string } };

const withBase = (base: string, path: string) => `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

/** The AX Notes app receives every published AX Notes post. */
export function selectAppFeedPosts<T extends PostRecord>(posts: T[]): T[] {
  return posts.filter((post) => post.data.category === 'ax');
}

/** App feed metadata. The website's publication policy (drafts excluded) is always applied first. */
export function buildFeedSource<T extends FeedPost>(
  posts: T[], series: FeedSeries[], site: URL, base: string, select: (posts: T[]) => T[] = selectAppFeedPosts,
) {
  if (site.protocol !== 'https:') throw new Error('App feed SITE_URL must use HTTPS');
  const url = (path: string) => new URL(withBase(base, path), site).href;
  const byId = new Map(series.map((item) => [item.id, item]));
  return {
    schemaVersion: 1,
    siteRoot: url('/'),
    author: { name: 'AX Notes', aboutUrl: url('/about/'), channels: [] },
    notes: select(publishedPosts(posts)).map((post) => {
      const group = post.data.series ? byId.get(post.data.series) : undefined;
      return {
        id: post.id,
        title: post.data.title,
        description: post.data.description,
        publishedAt: post.data.date,
        updatedAt: null,
        canonicalUrl: url(`/article/${post.id}/`),
        collectionId: post.data.series ?? null,
        // Projects no longer exist on msalt.net; the fields stay for schema v1 compatibility.
        projectUrl: null,
        projectId: null,
        projectTitle: null,
        projectOrder: null,
        seriesId: group?.id ?? null,
        seriesTitle: group?.data.title ?? null,
        seriesOrder: group ? post.data.series_order ?? null : null,
      };
    }),
  };
}
