import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('optimize_html_images', ROOT / 'scripts/optimize_html_images.py')

class MarkdownImageTest(unittest.TestCase):
    def test_markdown_images_use_variants_and_missing_metadata_falls_back(self):
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        html = '<div class="post-content"><p><img src="/assets/img/book.png" alt="Book &amp; page" /></p><p><img src="/assets/img/new.png" alt="New" /></p></div>'
        metadata = {'/assets/img/book.png': {'src': '/assets/img/book-1600.webp', 'mobile': '/assets/img/book-800.webp', 'width': 1200, 'height': 1600, 'mobile_width': 600}}
        result = module.optimize_html(html, metadata)
        self.assertIn('src="/assets/img/book-1600.webp"', result)
        self.assertIn('srcset="/assets/img/book-800.webp 600w, /assets/img/book-1600.webp 1200w"', result)
        self.assertIn('width="1200" height="1600"', result)
        self.assertIn('alt="Book &amp; page"', result)
        self.assertIn('loading="eager"', result)
        self.assertIn('src="/assets/img/new.png" alt="New" loading="lazy"', result)
