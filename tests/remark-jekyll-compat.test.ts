import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { remarkKramdownClasses, remarkResponsiveImageInclude } from '../src/lib/remark-jekyll-compat.mjs';

const images = {
  '/assets/img/a.jpg': { src: '/o/a-1600.webp', mobile: '/o/a-800.webp', social: '', width: 1280, height: 960, mobile_width: 800 },
};
const run = async (md: string) => String(await unified().use(remarkParse)
  .use(remarkKramdownClasses).use(remarkResponsiveImageInclude, { images })
  .use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeStringify).process(md));

describe('remarkKramdownClasses', () => {
  it('applies a trailing block class to the enclosing blockquote', async () => {
    const out = await run('> line one  \n> line two\n{: .poem-quote }\n');
    expect(out).toMatch(/^<blockquote class="poem-quote">/);
    expect(out).not.toContain('{:');
  });
  it('applies a trailing block class to a paragraph', async () => {
    expect(await run('first  \nsecond\n{: .personal-note }\n')).toBe('<p class="personal-note">first<br>\nsecond</p>');
  });
  it('leaves ordinary braces alone', async () => {
    expect(await run('code {: not-a-class }\n')).toContain('{: not-a-class }');
  });
});

describe('remarkResponsiveImageInclude', () => {
  it('replaces the include with an unwrapped responsive img', async () => {
    const out = await run('{% include responsive-image.html src="/assets/img/a.jpg" alt="사진 2" %}\n');
    expect(out).toBe('<img src="/o/a-1600.webp" srcset="/o/a-800.webp 800w, /o/a-1600.webp 1280w" sizes="(max-width: 608px) calc(100vw - 48px), 560px" width="1280" height="960" alt="사진 2" loading="lazy" decoding="async">');
  });
  it('honors priority=true', async () => {
    const out = await run('{% include responsive-image.html src="/assets/img/a.jpg" alt="a" priority=true %}\n');
    expect(out).toContain('loading="eager" fetchpriority="high" decoding="async"');
  });
  it('fails the build for an image without metadata', async () => {
    await expect(run('{% include responsive-image.html src="/assets/img/none.jpg" alt="a" %}\n')).rejects.toThrow(/none\.jpg/);
  });
});
