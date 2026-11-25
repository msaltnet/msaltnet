import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import { buildFeedSource, selectAppFeedPosts } from '../src/lib/app-feed-source';
import { absoluteArticleUrl, canonicalJson, noteRevision, sanitizeArticle, safeArticleSchema } from '../src/lib/app-feed.mjs';
import { exportAppFeed } from '../src/integrations/app-feed.mjs';
import fixture from './fixtures/app-feed-notes.json';

const everyPost = <T>(posts: T[]) => posts;
const source = (site = 'https://msalt.net', base = '/') => buildFeedSource(
  fixture, [{ id: 'demo-series', data: { title: 'Demo series' } }], new URL(site), base, everyPost,
);
const article = '<nav>Not article navigation</nav><article class="post"><h1>Not body title</h1><div class="post-content"><h2 id="heading">제목</h2><p>본문 &amp; text</p><img src="/assets/img/optimized/photo.webp" alt="사진"><aside><p>Aftertaste sentence</p></aside></div></article><footer>Not article footer</footer>';

describe('app feed source and addressing', () => {
  it('uses the published note policy, with a synthetic future-dated draft fixture', () => {
    const feed = source();
    expect(feed.notes.map((note) => note.id)).toEqual(['published-new', 'published-old']);
    expect(JSON.stringify(feed)).not.toContain('PRIVATE DRAFT SENTINEL');
    expect(feed.author).toEqual({ name: 'AX Notes', aboutUrl: 'https://msalt.net/about/', channels: [] });
    expect(feed.notes[0].canonicalUrl).toBe('https://msalt.net/article/published-new/');
    expect(feed.notes[0]).toMatchObject({ collectionId: 'demo-series', seriesId: 'demo-series', seriesTitle: 'Demo series', seriesOrder: 1 });
    expect(feed.notes[0]).toMatchObject({ projectUrl: null, projectId: null, projectTitle: null, projectOrder: null });
    expect(feed.notes[1].collectionId).toBeNull();
    expect(feed.notes[1].seriesId).toBeNull();
    expect(feed.notes[0].updatedAt).toBeNull();
  });

  it('selects only AX Notes posts by default', () => {
    expect(selectAppFeedPosts(fixture).map((post) => post.id)).toEqual(['published-new']);
    expect(buildFeedSource(fixture, [], new URL('https://msalt.net'), '/').notes.map((note) => note.id)).toEqual(['published-new']);
  });

  it('honors a GitHub subpath without duplicating it', () => {
    const feed = source('https://msaltnet.github.io', '/ax-notes-public/');
    expect(feed.siteRoot).toBe('https://msaltnet.github.io/ax-notes-public/');
    expect(feed.notes[0].canonicalUrl).toBe(`${feed.siteRoot}article/published-new/`);
    expect(() => source('http://example.org')).toThrow(/HTTPS/);
  });

  it.each([
    ['/notes/other/', 'https://host.test/base/notes/other/'],
    ['/base/_astro/photo.webp', 'https://host.test/base/_astro/photo.webp'],
    ['../../_astro/photo.webp', 'https://host.test/base/_astro/photo.webp'],
    ['#section', 'https://host.test/base/notes/example/#section'],
    ['//external.test/path', 'https://external.test/path'],
    ['http://external.test/path', 'https://external.test/path'],
    ['javascript:alert(1)', undefined],
    ['data:image/svg+xml,test', undefined],
    ['mailto:test@example.org', undefined],
    ['https://user:password@example.org', undefined],
    ['java\nscript:alert(1)', undefined],
    ['\\evil.test', undefined],
  ])('normalizes or removes article URL %s', (input, expected) => {
    expect(absoluteArticleUrl(input, 'https://host.test/base/notes/example/', 'https://host.test/base/')).toBe(expected);
  });
});

describe('safe article body and revisions', () => {
  it('exports article-only text/HTML with absolute optimized images', async () => {
    const body = await sanitizeArticle(article, source().notes[0].canonicalUrl, source().siteRoot);
    expect(body.bodyHtml).toContain('src="https://msalt.net/assets/img/optimized/photo.webp"');
    expect(body.bodyHtml).toContain('<h2 id="heading">제목</h2>');
    expect(body.bodyText).toContain('본문 & text');
    expect(body.bodyText).toContain('Aftertaste sentence');
    expect(body.bodyHtml).not.toContain('Not article');
    expect(body.bodyHtml).not.toContain('<article');
    expect(body.bodyHtml).not.toContain('post-content');
    expect(body.bodyText).not.toContain('Not body title');
  });

  it('removes active tags, hidden script/style content, unsafe schemes, styles and event attributes', async () => {
    const malicious = `<div class="post-content"><script>alert('secret-script')</script><style>secret-style</style>
      <iframe src="https://evil.test">secret-frame</iframe><form><p>secret-form</p></form>
      <svg><script>secret-svg</script></svg><p onclick="run()" style="display:none">Visible</p>
      <a href="jav&#x61;script:run()" target="_blank" ping="https://evil.test">Bad</a>
      <a href="/article/good/" onclick="run()">Good</a><img src="data:text/html,bad" onerror="run()" srcset="/bad.png 2x">
      <table><thead><tr><th scope="col">Header</th></tr></thead><tbody><tr><td colspan="2">Cell</td></tr></tbody></table></div>`;
    const body = await sanitizeArticle(malicious, 'https://msalt.net/article/example/', 'https://msalt.net/');
    expect(body.bodyHtml).not.toMatch(/<(script|style|iframe|form|svg)\b|\bon\w+=|\bstyle=|\bsrcset=|\bping=|javascript:|data:text/);
    expect(body.bodyText).not.toContain('secret-');
    expect(body.bodyHtml).toContain('href="https://msalt.net/article/good/"');
    expect(body.bodyHtml).toContain('<th scope="col">Header</th>');
    expect(body.bodyHtml).toContain('<td colspan="2">Cell</td>');
  });

  it('fails closed when the expected article wrapper is missing or duplicated', async () => {
    await expect(sanitizeArticle('<main>Wrong layout</main>', 'https://a.test/', 'https://a.test/')).rejects.toThrow(/Expected one/);
    await expect(sanitizeArticle(`${article}${article}`, 'https://a.test/', 'https://a.test/')).rejects.toThrow(/found 2/);
  });

  it('hashes stable canonical body plus metadata, including metadata-only corrections', async () => {
    const metadata = source().notes[0];
    const body = await sanitizeArticle(article, metadata.canonicalUrl, source().siteRoot);
    const revision = noteRevision(metadata, body);
    expect(revision).toMatch(/^[a-f0-9]{64}$/);
    expect(noteRevision({ ...metadata }, { bodyText: body.bodyText, bodyHtml: body.bodyHtml })).toBe(revision);
    expect(noteRevision({ ...metadata, title: 'Corrected title' }, body)).not.toBe(revision);
    expect(noteRevision(metadata, { ...body, bodyText: `${body.bodyText} new` })).not.toBe(revision);
    expect(canonicalJson({ z: 1, a: { z: 2, b: '한글' } })).toBe('{"a":{"b":"한글","z":2},"z":1}');
  });
});

describe('feed exporter', () => {
  it('writes content-addressed JSON and removes its temporary source; never exports draft content', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ax-app-feed-'));
    try {
      const feed = source();
      await writeFile(join(directory, 'app-feed-build-source.json'), JSON.stringify(feed));
      for (const note of feed.notes) {
        await mkdir(join(directory, 'article', note.id), { recursive: true });
        await writeFile(join(directory, 'article', note.id, 'index.html'), article);
      }
      const manifest = await exportAppFeed(directory);
      expect(manifest.notes.map((note: { id: string }) => note.id)).toEqual(['published-new', 'published-old']);
      expect(existsSync(join(directory, 'app-feed-build-source.json'))).toBe(false);
      expect(readdirSync(join(directory, 'app/v1/notes'))).not.toContain('synthetic-draft');
      expect(manifest.schemaVersion).toBe(1);
      expect(Number.isNaN(Date.parse(manifest.generatedAt))).toBe(false);
      for (const summary of manifest.notes) {
        expect(summary.detailUrl).toBe(`https://msalt.net/app/v1/notes/${summary.id}/${summary.revision}.json`);
        const detail = JSON.parse(await readFile(join(directory, new URL(summary.detailUrl).pathname), 'utf8'));
        expect(detail.id).toBe(summary.id);
        expect(detail.revision).toBe(noteRevision(summary, detail));
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('built app/v1 contract', () => {
  const root = new URL('https://msalt.net/');
  const outputFile = (url: string) => {
    const parsed = new URL(url);
    expect(parsed.origin).toBe(root.origin);
    expect(parsed.pathname.startsWith(root.pathname)).toBe(true);
    return join(process.cwd(), '_site', decodeURIComponent(parsed.pathname.slice(root.pathname.length)));
  };

  it('serves every summary and revision-matching detail with valid dates, absolute URLs and no draft endpoints', async () => {
    const manifest = JSON.parse(await readFile(join(process.cwd(), '_site/app/v1/manifest.json'), 'utf8'));
    expect(Object.keys(manifest).sort()).toEqual(['author', 'generatedAt', 'notes', 'schemaVersion']);
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Number.isNaN(Date.parse(manifest.generatedAt))).toBe(false);
    expect(manifest.author.channels).toEqual([]);
    expect(manifest.author.aboutUrl).toBe(new URL('about/', root).href);
    expect(manifest.author.name).toBe('AX Notes');
    // The app receives every published AX Notes post.
    const axPosts = readdirSync(join(process.cwd(), 'src/content/posts'))
      .filter((file) => {
        const text = readFileSync(join(process.cwd(), 'src/content/posts', file), 'utf8');
        return /\ncategory: ax\n/.test(text) && !/\ndraft: true\n/.test(text);
      })
      .map((file) => file.replace(/\.md$/, ''));
    expect(axPosts.length).toBe(15);
    expect(manifest.notes.map((note: { id: string }) => note.id).sort()).toEqual(axPosts.sort());
    expect(manifest.notes.some((note: { seriesId: string | null }) => note.seriesId === 'nanobot')).toBe(true);
    expect(new Set(manifest.notes.map((note: { id: string }) => note.id)).size).toBe(manifest.notes.length);
    const dates: string[] = [];
    for (const summary of manifest.notes) {
      expect(Object.keys(summary).sort()).toEqual(['canonicalUrl', 'collectionId', 'description', 'detailUrl', 'id', 'projectId', 'projectOrder', 'projectTitle', 'projectUrl', 'publishedAt', 'revision', 'seriesId', 'seriesOrder', 'seriesTitle', 'title', 'updatedAt']);
      expect(summary.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(summary.title.length).toBeGreaterThan(0);
      expect(summary.description.length).toBeGreaterThan(0);
      expect(summary.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(summary.updatedAt).toBeNull();
      expect(summary.revision).toMatch(/^[a-f0-9]{64}$/);
      expect(summary.canonicalUrl).toBe(new URL(`article/${summary.id}/`, root).href);
      expect(summary.detailUrl).toBe(new URL(`app/v1/notes/${summary.id}/${summary.revision}.json`, root).href);
      expect(existsSync(join(outputFile(summary.canonicalUrl), 'index.html'))).toBe(true);
      const detail = JSON.parse(await readFile(outputFile(summary.detailUrl), 'utf8'));
      expect(Object.keys(detail).sort()).toEqual(['bodyHtml', 'bodyText', 'id', 'revision', 'schemaVersion']);
      expect(detail.schemaVersion).toBe(1);
      expect(detail.id).toBe(summary.id);
      expect(detail.revision).toBe(summary.revision);
      expect(detail.revision).toBe(noteRevision(summary, detail));
      expect(detail.bodyText.length).toBeGreaterThan(0);
      const tree = unified().use(rehypeParse, { fragment: true }).parse(detail.bodyHtml);
      const checkNode = (node: any) => {
        if (node.type === 'element') {
          expect(safeArticleSchema.tagNames).toContain(node.tagName);
          for (const attribute of Object.keys(node.properties)) {
            const permitted = [...safeArticleSchema.attributes['*'], ...(safeArticleSchema.attributes[node.tagName as keyof typeof safeArticleSchema.attributes] ?? [])];
            expect(permitted).toContain(attribute);
          }
          for (const property of ['href', 'src']) {
            const link = node.properties[property];
            if (!link) continue;
            expect(new URL(link).protocol).toBe('https:');
            if (new URL(link).origin === root.origin) {
              const path = outputFile(link);
              expect(existsSync(path) || existsSync(join(path, 'index.html')), `${summary.id}: ${link}`).toBe(true);
            }
          }
        }
        for (const child of node.children ?? []) checkNode(child);
      };
      checkNode(tree);
      dates.push(summary.publishedAt);
    }
    expect(dates).toEqual([...dates].sort().reverse());
    expect(existsSync(join(process.cwd(), '_site/app-feed-build-source.json'))).toBe(false);
  });
});
