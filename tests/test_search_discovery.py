from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
import json
import os
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = Path(os.environ.get("SEO_SITE_DIR", ROOT / "_site"))
ORIGIN = "https://msalt.net"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9",
      "a": "http://www.w3.org/2005/Atom"}


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.meta = {}
        self.links = []
        self.structured = []
        self.script = None
        self.images = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            self.meta[attrs.get("name", attrs.get("property"))] = attrs.get("content")
        if tag == "link":
            self.links.append(attrs)
        if tag == "img":
            self.images.append(attrs)
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.script = ""

    def handle_data(self, text):
        if self.script is not None:
            self.script += text

    def handle_endtag(self, tag):
        if tag == "script" and self.script is not None:
            self.structured.append(json.loads(self.script))
            self.script = None


class SearchDiscoveryTest(unittest.TestCase):
    def read(self, relative):
        path = SITE / relative
        self.assertTrue(path.is_file(), f"Missing built endpoint: {relative}")
        return path.read_text(encoding="utf-8")

    def test_sitemap_contains_only_canonical_public_pages(self):
        tree = ET.fromstring(self.read("sitemap.xml"))
        urls = [node.text for node in tree.findall("s:url/s:loc", NS)]
        expected = {ORIGIN + "/"}
        expected.update(ORIGIN + "/article/" + path.stem[11:] + "/"
                        for path in (ROOT / "_posts").glob("*.md"))
        self.assertEqual(set(urls), expected)
        self.assertEqual(len(urls), len(set(urls)))
        for url in urls:
            path = urlparse(url).path.lstrip("/")
            self.assertTrue((SITE / path / "index.html").is_file(), url)

    def test_every_article_has_author_canonical_and_original_date(self):
        for source in (ROOT / "_posts").glob("*.md"):
            slug = source.stem[11:]
            with self.subTest(article=slug):
                page = Page(self.read(f"article/{slug}/index.html"))
                canonical = [link["href"] for link in page.links
                             if link.get("rel") == "canonical"]
                self.assertEqual(canonical, [f"{ORIGIN}/article/{slug}/"])
                self.assertEqual(page.meta.get("author"), "맛소금")
                self.assertTrue(page.meta.get("description"))
                self.assertIn("max-image-preview:large", page.meta.get("robots", ""))
                self.assertEqual(page.meta.get("og:type"), "article")
                self.assertTrue(page.meta.get("og:image", "").startswith(ORIGIN + "/"))
                articles = [item for item in page.structured if item.get("@type") == "BlogPosting"]
                self.assertEqual(len(articles), 1)
                article = articles[0]
                self.assertEqual(article["author"]["name"], "맛소금")
                self.assertEqual(article["author"]["url"], ORIGIN + "/")
                self.assertEqual(article["datePublished"][:10], source.name[:10])
                for image in page.images:
                    self.assertTrue(image.get("alt"))
                    self.assertEqual(image.get("loading"), "lazy")
                    self.assertEqual(image.get("decoding"), "async")

    def test_search_and_ai_bots_can_fetch_public_resources(self):
        text = self.read("robots.txt")
        robots = RobotFileParser()
        robots.parse(text.splitlines())
        self.assertEqual(robots.site_maps(), [ORIGIN + "/sitemap.xml"])
        for bot in ["Googlebot", "bingbot", "Yeti", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "PerplexityBot"]:
            for path in ["/", "/article/cooking-book-review/", "/llms.txt", "/feed.xml", "/assets/img/hero-bg.jpg", "/ads.txt"]:
                self.assertTrue(robots.can_fetch(bot, ORIGIN + path), (bot, path))

    def test_ads_and_ownership_files_remain_public(self):
        self.assertEqual(self.read("ads.txt").strip(),
                         "google.com, pub-7998090459933600, DIRECT, f08c47fec0942fa0")
        for source in ["google21e62a1687cb22d6.html", "naver4c0b9729a529a2a06abf1e75a84b7868.html", "naver522b25ba6931e5488d5560ea704caaa3.html"]:
            self.assertEqual(self.read(source), (ROOT / source).read_text(encoding="utf-8"))
        self.assertFalse((SITE / "Development/index.html").exists())
        self.assertFalse((SITE / "Development.md").exists())

    def test_llms_index_covers_every_article_and_project(self):
        text = self.read("llms.txt")
        self.assertTrue(text.startswith("# 맛소금"))
        self.assertNotIn("{{", text)
        self.assertNotIn("{%", text)
        for source in (ROOT / "_posts").glob("*.md"):
            url = f"{ORIGIN}/article/{source.stem[11:]}/"
            self.assertIn(f"]({url})", text)
            self.assertIn(source.name[:10], text)
        projects = (ROOT / "_data/projects.yml").read_text(encoding="utf-8")
        for url in re.findall(r'  url: "([^"]+)"', projects):
            self.assertIn(f"]({url})", text)

    def test_atom_feed_is_advertised_and_contains_current_articles(self):
        for path in ["index.html", "article/cooking-book-review/index.html"]:
            page = Page(self.read(path))
            self.assertTrue(any(link.get("rel") == "alternate"
                                and link.get("type") == "application/atom+xml"
                                and link.get("href") == ORIGIN + "/feed.xml"
                                for link in page.links))
        feed = ET.fromstring(self.read("feed.xml"))
        self.assertEqual(feed.tag, "{" + NS["a"] + "}feed")
        entries = feed.findall("a:entry", NS)
        self.assertEqual(len(entries), len(list((ROOT / "_posts").glob("*.md"))))
        for entry in entries:
            self.assertTrue(entry.find("a:content", NS).text.strip())


if __name__ == "__main__":
    unittest.main()
