from html.parser import HTMLParser
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
MENU = [('감상문', '/reviews/'), ('생각', '/thoughts/'),
        ('AI와 개발', '/ai-development/'), ('프로젝트', '/projects/'), ('소개', '/about/')]


class Navigation(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.in_menu = False
        self.menu = []
        self.links = []
        self.current = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'nav' and attrs.get('aria-label') == '주요 메뉴':
            self.in_menu = True
        if tag == 'a':
            self.links.append(attrs)
            if self.in_menu:
                self.current = {**attrs, 'text': ''}
                self.menu.append(self.current)

    def handle_data(self, text):
        if self.current is not None:
            self.current['text'] += text.strip()

    def handle_endtag(self, tag):
        if tag == 'a':
            self.current = None
        if tag == 'nav':
            self.in_menu = False


class ContentNavigationTest(unittest.TestCase):
    def page(self, url):
        path = SITE / url.lstrip('/') / 'index.html'
        self.assertTrue(path.is_file(), f'Missing content page: {url}')
        return Navigation(path.read_text(encoding='utf-8'))

    def test_all_pages_offer_five_independent_menu_destinations(self):
        for url in ['/', *(url for _, url in MENU), '/article/abstraction/']:
            with self.subTest(url=url):
                page = self.page(url)
                self.assertEqual([(a['text'], a['href']) for a in page.menu], MENU)

    def test_every_article_is_discoverable_in_exactly_one_topic(self):
        discovered = []
        for _, url in MENU[:3]:
            page = self.page(url)
            articles = [a['href'] for a in page.links if a.get('href', '').startswith('/article/')]
            self.assertTrue(articles, f'Empty topic: {url}')
            self.assertEqual(len(articles), len(set(articles)))
            discovered.extend(articles)
        expected = [f'/article/{p.stem[11:]}/' for p in (ROOT / '_posts').glob('*.md')]
        self.assertCountEqual(discovered, expected)

    def test_selected_topic_remains_active_when_reading_a_post(self):
        page = self.page('/article/abstraction/')
        active = [a for a in page.menu if a.get('aria-current') == 'page']
        self.assertEqual([a['href'] for a in active], ['/ai-development/'])
        self.assertTrue(any(a.get('href') == '/ai-development/' and a not in page.menu
                            for a in page.links))


if __name__ == '__main__':
    unittest.main()
