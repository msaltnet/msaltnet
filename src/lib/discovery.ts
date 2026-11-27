import type { NavItem, Project } from './site-data';

export type FeedPost = {
  id: string; title: string; description: string; date: string; html: string;
  last_modified_at?: string; image?: string;
};

const isoDate = (date: string) => (date.includes('T') ? date : `${date}T00:00:00+09:00`);
const xml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cdata = (value: string) => `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
const mdLabel = (value: string) => value.replaceAll('[', '(').replaceAll(']', ')');

export function sitemapXml(entries: { loc: string; lastmod?: string }[]): string {
  const urls = entries.map(({ loc, lastmod }) => `<url><loc>${xml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

/** Atom feed in the shape jekyll-feed produced (entry ids without trailing slash). */
export function atomFeed(posts: FeedPost[], opts: { site: string; title: string; subtitle: string; updated: string; limit: number }): string {
  const { site, title, subtitle, updated, limit } = opts;
  const entries = [...posts].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).slice(0, limit).map((post) => {
    const url = `${site}/article/${post.id}/`;
    const image = post.image ? new URL(post.image, site).href : undefined;
    return [
      '<entry>',
      `<title type="html">${xml(post.title)}</title>`,
      `<link href="${url}" rel="alternate" type="text/html" title="${xml(post.title)}" />`,
      `<published>${isoDate(post.date)}</published>`,
      `<updated>${isoDate(post.last_modified_at ?? post.date)}</updated>`,
      `<id>${site}/article/${post.id}</id>`,
      `<content type="html" xml:base="${url}">${cdata(post.html)}</content>`,
      `<author><name>${xml(title)}</name></author>`,
      `<summary type="html">${cdata(post.description)}</summary>`,
      ...(image ? [
        `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${xml(image)}" />`,
        `<media:content medium="image" url="${xml(image)}" xmlns:media="http://search.yahoo.com/mrss/" />`,
      ] : []),
      '</entry>',
    ].join('');
  });
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ko-KR">',
    `<link href="${site}/feed.xml" rel="self" type="application/atom+xml" />`,
    `<link href="${site}/" rel="alternate" type="text/html" hreflang="ko-KR" />`,
    `<updated>${updated}</updated>`,
    `<id>${site}/feed.xml</id>`,
    `<title type="html">${xml(title)}</title>`,
    `<subtitle>${xml(subtitle)}</subtitle>`,
    `<author><name>${xml(title)}</name></author>`,
    ...entries,
    '</feed>',
    '',
  ].join('\n');
}

export function llmsTxt(input: { site: string; description: string; posts: FeedPost[]; navigation: NavItem[]; projects: Project[] }): string {
  const { site, description, posts, navigation, projects } = input;
  const abs = (path: string) => new URL(path, site).href;
  const lines = [
    '# 맛소금 — msalt.net', '', `> ${description}`, '',
    '이 사이트의 글은 소프트웨어 개발자 맛소금이 직접 작성한 에세이, 독후감, 개발 경험입니다. 프로그래밍, AI 활용과 일상의 생각을 다룹니다. 글의 날짜는 최초 작성일이며, 글마다 제공하는 HTML 페이지가 정식 원문입니다.',
    '', '## 사이트', '',
    `- [홈과 글 목록](${abs('/')}): 맛소금 소개와 전체 글 목록`,
    ...navigation.map((item) => `- [${item.title}](${abs(item.url)})${item.description ? `: ${item.description}` : ''}`),
    `- [사이트맵](${abs('/sitemap.xml')}): 공개 페이지의 정식 URL`,
    `- [Atom 피드](${abs('/feed.xml')}): 최근 글과 본문`,
    '', '## 글', '',
    ...posts.map((post) => `- [${mdLabel(post.title)}](${abs(`/article/${post.id}/`)}): ${post.date}${post.last_modified_at ? `, 수정 ${post.last_modified_at.slice(0, 10)}` : ''} — ${post.description.replace(/<[^>]*>/g, '').replace(/\n/g, '')}`),
    '', '## 프로젝트', '',
    ...projects.map((project) => `- [${mdLabel(project.title)}](${project.url}): ${project.description}`),
    '',
  ];
  return lines.join('\n');
}
