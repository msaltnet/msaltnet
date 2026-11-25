import { readdirSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import { assertContentIntegrity, publishedPosts } from './content';
import { CATEGORY_KEYS } from './site-data';

export type Post = CollectionEntry<'posts'>;
export type Series = CollectionEntry<'series'>;

export async function getSiteContent() {
  // Skip the empty series collection to avoid a warning on every page.
  const hasSeries = readdirSync('src/content/series').some((file) => file.endsWith('.md'));
  const [rawPosts, series] = await Promise.all([getCollection('posts'), hasSeries ? getCollection('series') : []]);
  assertContentIntegrity(rawPosts, [...CATEGORY_KEYS], series.map(({ id }) => id));
  return { posts: publishedPosts(rawPosts), series };
}

/** Posts of one series in authored order. */
export const seriesEntries = (posts: Post[], seriesId: string) =>
  posts.filter((post) => post.data.series === seriesId).sort((a, b) => (a.data.series_order ?? 0) - (b.data.series_order ?? 0));

/** Front matter dates are Asia/Seoul calendar dates. */
export const isoDate = (date: string) => (date.includes('T') ? date : `${date}T00:00:00+09:00`);
export const displayDate = (date: string) => date.slice(0, 10).replaceAll('-', '.');
