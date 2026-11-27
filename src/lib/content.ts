export type PostRecord = {
  id: string;
  data: {
    title: string;
    date: string;
    category: string;
    series?: string;
    series_order?: number;
    sidebar_feature: boolean;
    draft: boolean;
  };
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Build-time content rules. Any violation fails the build. */
export function assertContentIntegrity(posts: PostRecord[], categories: string[], seriesIds: string[]): void {
  const knownCategories = new Set(categories);
  const knownSeries = new Set(seriesIds);
  const seenPositions = new Set<string>();
  let featured = 0;

  for (const { id, data } of posts) {
    if (!SLUG.test(id)) throw new Error(`Invalid slug "${id}": use lowercase ASCII words joined by hyphens`);
    if (!knownCategories.has(data.category)) throw new Error(`Unknown category "${data.category}" in ${id}`);
    if (data.series && !knownSeries.has(data.series)) throw new Error(`Unknown series "${data.series}" in ${id}`);
    if (data.series && (!Number.isInteger(data.series_order) || (data.series_order ?? 0) < 1)) {
      throw new Error(`series_order must be a positive integer for ${id}`);
    }
    if (!data.series && data.series_order !== undefined) throw new Error(`series_order requires series for ${id}`);
    if (data.series) {
      const key = `${data.series}:${data.series_order}`;
      if (seenPositions.has(key)) throw new Error(`Duplicate series order ${key}`);
      seenPositions.add(key);
    }
    if (data.sidebar_feature) featured += 1;
  }
  if (featured > 1) throw new Error(`Only one post may set sidebar_feature: true (found ${featured})`);
}

/** Public posts, newest first; same-date posts are ordered by slug. */
export function publishedPosts<T extends PostRecord>(posts: T[]): T[] {
  return posts
    .filter(({ data }) => !data.draft)
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

const MARKDOWN_IMAGE = /!\[[^\]]*\]\((\/assets\/[^)\s]+)/g;

/**
 * Thumbnail for a home card: the front matter `image`, otherwise the first body
 * image that has responsive-image metadata. Undefined means a text-only card.
 */
export function cardImage(post: { data: { image?: string }; body?: string }, known: ReadonlySet<string>): string | undefined {
  if (post.data.image && known.has(post.data.image)) return post.data.image;
  for (const match of post.body?.matchAll(MARKDOWN_IMAGE) ?? []) {
    if (known.has(match[1])) return match[1];
  }
  return undefined;
}
