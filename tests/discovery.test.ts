import { describe, expect, it } from 'vitest';
import { atomFeed, llmsTxt, sitemapXml, type FeedPost } from '../src/lib/discovery';

const SITE = 'https://msalt.net';
const post = (id: string, date: string, extra: Partial<FeedPost> = {}): FeedPost => ({
  id, title: `T ${id}`, description: `D ${id}`, date, html: `<p>${id}</p>`, ...extra,
});
const posts = [post('new', '2026-03-01', { last_modified_at: '2026-03-05T10:00:00+09:00', image: '/assets/img/a.png' }), post('old', '2026-01-01')];

describe('sitemapXml', () => {
  it('lists every entry with optional lastmod', () => {
    const xml = sitemapXml([{ loc: `${SITE}/article/new/`, lastmod: '2026-03-05T10:00:00+09:00' }, { loc: `${SITE}/about/` }]);
    expect(xml).toContain('<url><loc>https://msalt.net/article/new/</loc><lastmod>2026-03-05T10:00:00+09:00</lastmod></url>');
    expect(xml).toContain('<url><loc>https://msalt.net/about/</loc></url>');
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  });
});

describe('atomFeed', () => {
  const xml = atomFeed(posts, { site: SITE, title: '맛소금', subtitle: 'sub', updated: '2026-03-06T00:00:00+09:00', limit: 50 });
  it('emits entries newest first with jekyll-feed ids and dates', () => {
    expect(xml.indexOf('T new')).toBeLessThan(xml.indexOf('T old'));
    expect(xml).toContain('<id>https://msalt.net/article/new</id>');
    expect(xml).toContain('<link href="https://msalt.net/article/new/" rel="alternate" type="text/html" title="T new" />');
    expect(xml).toContain('<published>2026-03-01T00:00:00+09:00</published>');
    expect(xml).toContain('<updated>2026-03-05T10:00:00+09:00</updated>');
    expect(xml).toContain('<content type="html" xml:base="https://msalt.net/article/new/"><![CDATA[<p>new</p>]]></content>');
    expect(xml).toContain('<summary type="html"><![CDATA[D new]]></summary>');
    expect(xml).toContain('url="https://msalt.net/assets/img/a.png"');
  });
  it('limits the number of entries', () => {
    const many = Array.from({ length: 60 }, (_, i) => post(`p${i}`, `2026-01-${String((i % 28) + 1).padStart(2, '0')}`));
    expect(atomFeed(many, { site: SITE, title: 't', subtitle: 's', updated: '2026-01-01T00:00:00+09:00', limit: 50 }).match(/<entry>/g)).toHaveLength(50);
  });
  it('keeps "]]>" inside content from breaking CDATA', () => {
    expect(atomFeed([post('x', '2026-01-01', { html: 'a]]>b' })], { site: SITE, title: 't', subtitle: 's', updated: 'u', limit: 50 }))
      .toContain('<![CDATA[a]]]]><![CDATA[>b]]>');
  });
});

describe('llmsTxt', () => {
  const text = llmsTxt({
    site: SITE, description: '설명', posts,
    navigation: [{ key: 'reviews', title: '감상문', url: '/reviews/', description: '책' }, { key: 'about', title: '소개', url: '/about/' }],
    projects: [{ title: 'smtm [book]', label: '', description: 'Trading', url: 'https://github.com/msaltnet/smtm', image: '', alt: '' }],
  });
  it('starts with the site heading and covers posts, menus and projects', () => {
    expect(text.startsWith('# 맛소금 — msalt.net\n\n> 설명\n')).toBe(true);
    expect(text).toContain('- [감상문](https://msalt.net/reviews/): 책\n');
    expect(text).toContain('- [소개](https://msalt.net/about/)\n');
    expect(text).toContain('- [T new](https://msalt.net/article/new/): 2026-03-01, 수정 2026-03-05 — D new\n');
    expect(text).toContain('- [T old](https://msalt.net/article/old/): 2026-01-01 — D old\n');
    expect(text).toContain('- [smtm (book)](https://github.com/msaltnet/smtm): Trading\n');
  });
});
