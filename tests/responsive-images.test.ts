import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeResponsiveImages from '../src/lib/rehype-responsive-images.mjs';

const images = {
  '/assets/img/book.png': { src: '/assets/img/book-1600.webp', mobile: '/assets/img/book-800.webp', social: '', width: 1200, height: 1600, mobile_width: 600 },
  '/assets/img/small.png': { src: '/assets/img/small-1600.webp', mobile: '/assets/img/small-800.webp', social: '', width: 600, height: 400, mobile_width: 600 },
};
const run = async (html: string) => String(await unified()
  .use(rehypeParse, { fragment: true }).use(rehypeResponsiveImages, { images }).use(rehypeStringify).process(html));

describe('rehypeResponsiveImages', () => {
  it('swaps known images to variants with srcset, sizes and dimensions', async () => {
    const out = await run('<p><img src="/assets/img/book.png" alt="Book &#x26; page"></p>');
    expect(out).toContain('src="/assets/img/book-1600.webp"');
    expect(out).toContain('srcset="/assets/img/book-800.webp 600w, /assets/img/book-1600.webp 1200w"');
    expect(out).toContain('sizes="(max-width: 800px) calc(100vw - 48px), 760px"');
    expect(out).toContain('width="1200" height="1600"');
    expect(out).toContain('alt="Book &#x26; page"');
  });
  it('omits the desktop candidate when the image is no wider than the mobile variant', async () => {
    expect(await run('<img src="/assets/img/small.png" alt="s">')).toContain('srcset="/assets/img/small-800.webp 600w"');
  });
  it('keeps unknown images and only adds loading and decoding', async () => {
    const out = await run('<img src="/assets/img/book.png" alt="a"><img src="/assets/img/new.png" alt="New">');
    expect(out).toContain('<img src="/assets/img/new.png" alt="New" loading="lazy" decoding="async">');
  });
  it('makes only the first image eager with high fetch priority', async () => {
    const out = await run('<img src="/x.png" alt="1"><img src="/y.png" alt="2">');
    expect(out).toContain('<img src="/x.png" alt="1" loading="eager" fetchpriority="high" decoding="async">');
    expect(out).toContain('<img src="/y.png" alt="2" loading="lazy" decoding="async">');
  });
  it('leaves images that already have srcset untouched but still counts them', async () => {
    const out = await run('<img src="/a.png" srcset="/a.png 1w" alt="a"><img src="/b.png" alt="b">');
    expect(out).toContain('<img src="/a.png" srcset="/a.png 1w" alt="a">');
    expect(out).toContain('<img src="/b.png" alt="b" loading="lazy" decoding="async">');
  });
});
