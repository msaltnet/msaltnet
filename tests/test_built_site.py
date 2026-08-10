from html.parser import HTMLParser
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
PROJECT_URLS = {
    "https://github.com/msaltnet/smtm",
    "https://smtm.msalt.net",
    "https://nanobot.msalt.net",
    "https://github.com/msaltnet/T.Viewer",
    "https://brunch.co.kr/@msaltnet",
    "https://blog.msalt.net/",
}


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = []
        self.images = []
        self.ids = set()
        self.text = []
        self.meta = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a":
            self.links.append(attrs)
        elif tag == "img":
            self.images.append(attrs)
        elif tag == "meta":
            self.meta.append(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])

    def handle_data(self, data):
        value = " ".join(data.split())
        if value:
            self.text.append(value)


class BuiltSiteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.home = Document((SITE / "index.html").read_text(encoding="utf-8"))
        cls.post = Document(
            (SITE / "article/advice-to-a-young-poet/index.html").read_text(
                encoding="utf-8"
            )
        )

    def test_home_contains_required_sections_and_copy(self):
        text = " ".join(self.home.text)
        self.assertIn("article", self.home.ids)
        self.assertIn("project", self.home.ids)
        self.assertIn("지구별에서 소프트웨어를 만들고", text)
        self.assertIn("젊은 시인에게 주는 충고", text)
        self.assertIn("때때로 검색과 댓글의 성급한 해답 말고", text)

    def test_project_links_are_preserved_and_safe(self):
        external = {link.get("href"): link for link in self.home.links}
        self.assertTrue(PROJECT_URLS.issubset(external))
        for url in PROJECT_URLS:
            self.assertEqual(external[url].get("target"), "_blank")
            self.assertEqual(
                set(external[url].get("rel", "").split()),
                {"noopener", "noreferrer"},
            )

    def test_images_have_alternative_text(self):
        project_images = [
            image
            for image in self.home.images
            if "project-card-image" in image.get("class", "")
        ]
        self.assertEqual(len(project_images), 6)
        self.assertTrue(all(image.get("alt", "").strip() for image in project_images))

    def test_first_article_contains_poem_and_personal_note(self):
        text = " ".join(self.post.text)
        self.assertIn("마음속의 풀리지 않는 모든 문제들에 대해", text)
        self.assertIn("라이너 마리아 릴케", text)
        self.assertIn("온전히 내 자신의 해답이 필요하다.", text)

    def test_new_site_has_no_template_dependencies_or_credit(self):
        html = (SITE / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("BootstrapMade", html)
        self.assertNotIn("assets/vendor/", html)
        self.assertNotIn("bootstrap", html.lower())


if __name__ == "__main__":
    unittest.main()
