from html.parser import HTMLParser
from pathlib import Path
import json
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'


class Images(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.images = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.images.append(dict(attrs))


class AssetPerformanceTest(unittest.TestCase):
    def test_article_images_are_sized_responsive_and_under_budget(self):
        for path in (SITE / 'article').glob('*/index.html'):
            images = Images(path.read_text(encoding='utf-8')).images
            for index, image in enumerate(images):
                with self.subTest(article=path.parent.name, image=image['src']):
                    asset = SITE / image['src'].lstrip('/')
                    self.assertLessEqual(asset.stat().st_size, 350_000)
                    self.assertGreater(int(image.get('width', 0)), 0)
                    self.assertGreater(int(image.get('height', 0)), 0)
                    self.assertIn('srcset', image)
                    for candidate in image['srcset'].split(','):
                        url, width = candidate.strip().split()
                        self.assertTrue((SITE / url.lstrip('/')).is_file())
                        self.assertRegex(width, r'^\d+w$')
                    self.assertEqual(image['loading'], 'eager' if index == 0 else 'lazy')

    def test_social_cover_images_stay_compatible_and_small(self):
        for path in [SITE / 'index.html', *(SITE / 'article').glob('*/index.html')]:
            text = path.read_text(encoding='utf-8')
            image = re.search(r'property="og:image" content="https://msalt.net([^"]+)"', text).group(1)
            self.assertLessEqual((SITE / image.lstrip('/')).stat().st_size, 350_000, image)

    def test_current_korean_text_uses_small_local_font_subsets(self):
        css = (SITE / 'assets/css/fonts.css').read_text(encoding='utf-8')
        manifest = json.loads((ROOT / '_data/font_subsets.json').read_text())
        for face in manifest.values():
            self.assertLessEqual(face['common_bytes'], 200_000)
            self.assertTrue(face['coverage_complete'])
            self.assertEqual(face['covered_codepoints'], face['original_codepoints'])
        for url in re.findall(r'url\("([^\"]+)"\)', css):
            self.assertTrue((SITE / 'assets/css' / url).resolve().is_file(), url)
        self.assertIn('font-display: swap', css)

    def test_substantive_revision_reaches_schema_sitemap_feed_and_llms(self):
        slug = 'abstraction'
        html = (SITE / f'article/{slug}/index.html').read_text(encoding='utf-8')
        schema = json.loads(re.search(r'<script type="application/ld\+json">\s*(.*?)</script>', html, re.S).group(1))
        self.assertEqual(schema['datePublished'][:10], '2026-08-16')
        self.assertEqual(schema['dateModified'][:10], '2026-08-17')
        self.assertIn('수정', html)
        self.assertIn('2026.08.17', html)
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'a': 'http://www.w3.org/2005/Atom'}
        sitemap = ET.fromstring((SITE / 'sitemap.xml').read_text(encoding='utf-8'))
        entry = next(e for e in sitemap.findall('s:url', ns) if e.find('s:loc', ns).text.endswith(f'/{slug}/'))
        self.assertEqual(entry.find('s:lastmod', ns).text[:10], '2026-08-17')
        feed = ET.fromstring((SITE / 'feed.xml').read_text(encoding='utf-8'))
        entry = next(e for e in feed.findall('a:entry', ns) if e.find('a:id', ns).text.endswith('/' + slug))
        self.assertEqual(entry.find('a:updated', ns).text[:10], '2026-08-17')
        llms = (SITE / 'llms.txt').read_text(encoding='utf-8')
        line = next(line for line in llms.splitlines() if f'/{slug}/' in line)
        self.assertIn('수정 2026-08-17', line)


if __name__ == '__main__':
    unittest.main()
