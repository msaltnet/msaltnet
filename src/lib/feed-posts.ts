import type { Post } from './data';
import type { FeedPost } from './discovery';
import { SITE } from './site';

export const toFeedPost = (post: Post): FeedPost => ({
  id: post.id,
  title: post.data.title,
  description: post.data.description,
  date: post.data.date,
  last_modified_at: post.data.last_modified_at,
  image: post.data.image ?? SITE.defaultImage,
  html: post.rendered?.html ?? '',
});
