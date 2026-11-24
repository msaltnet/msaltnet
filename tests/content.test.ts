import { describe, expect, it } from 'vitest';
import { assertContentIntegrity, publishedPosts, type PostRecord } from '../src/lib/content';

const CATS = ['reviews', 'thoughts', 'ai-development'];
const post = (id: string, data: Partial<PostRecord['data']> = {}): PostRecord => ({
  id,
  data: { title: id, date: '2026-01-01', category: 'reviews', sidebar_feature: false, draft: false, ...data },
});

describe('assertContentIntegrity', () => {
  it('accepts valid posts', () => {
    expect(() => assertContentIntegrity([post('a'), post('b', { series: 's', series_order: 1 })], CATS, ['s'])).not.toThrow();
  });
  it('rejects unknown category', () => {
    expect(() => assertContentIntegrity([post('a', { category: 'tags' })], CATS, [])).toThrow(/category/);
  });
  it('rejects unknown series', () => {
    expect(() => assertContentIntegrity([post('a', { series: 'nope', series_order: 1 })], CATS, ['s'])).toThrow(/series/);
  });
  it('rejects series without order and order without series', () => {
    expect(() => assertContentIntegrity([post('a', { series: 's' })], CATS, ['s'])).toThrow(/series_order/);
    expect(() => assertContentIntegrity([post('a', { series_order: 1 })], CATS, ['s'])).toThrow(/series_order/);
  });
  it('rejects duplicate order inside one series', () => {
    expect(() => assertContentIntegrity(
      [post('a', { series: 's', series_order: 1 }), post('b', { series: 's', series_order: 1 })], CATS, ['s'],
    )).toThrow(/order/);
  });
  it('rejects two sidebar_feature posts', () => {
    expect(() => assertContentIntegrity(
      [post('a', { sidebar_feature: true }), post('b', { sidebar_feature: true })], CATS, [],
    )).toThrow(/sidebar_feature/);
  });
  it('rejects non-ascii or uppercase slugs', () => {
    expect(() => assertContentIntegrity([post('Give-and-take')], CATS, [])).toThrow(/slug/);
    expect(() => assertContentIntegrity([post('불변의-법칙')], CATS, [])).toThrow(/slug/);
  });
});

describe('publishedPosts', () => {
  it('drops drafts and sorts by date desc then id asc', () => {
    const posts = [
      post('b', { date: '2026-01-01' }), post('a', { date: '2026-01-01' }),
      post('c', { date: '2026-02-01' }), post('d', { date: '2026-03-01', draft: true }),
    ];
    expect(publishedPosts(posts).map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });
});
