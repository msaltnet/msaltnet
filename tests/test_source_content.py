from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
PROJECT_URLS = {
    "https://github.com/msaltnet/smtm",
    "https://smtm.msalt.net",
    "https://nanobot.msalt.net",
    "https://github.com/msaltnet/T.Viewer",
    "https://brunch.co.kr/@msaltnet",
    "https://blog.msalt.net/",
}


class SourceContentTest(unittest.TestCase):
    def test_jekyll_configuration_uses_custom_domain_and_article_permalink(self):
        config = (ROOT / "_config.yml").read_text(encoding="utf-8")
        self.assertIn('url: "https://msalt.net"', config)
        self.assertIn("permalink: /article/:slug/", config)
        self.assertIn("jekyll-seo-tag", config)
        self.assertIn("jekyll-sitemap", config)

    def test_all_existing_project_urls_and_images_are_declared(self):
        projects = (ROOT / "_data/projects.yml").read_text(encoding="utf-8")
        for url in PROJECT_URLS:
            self.assertIn(url, projects)
        self.assertEqual(projects.count("- title:"), 6)
        self.assertEqual(projects.count("  image:"), 6)
        self.assertEqual(projects.count("  alt:"), 6)

    def test_first_article_is_the_sidebar_feature_and_contains_both_texts(self):
        post = (
            ROOT / "_posts/2026-08-10-advice-to-a-young-poet.md"
        ).read_text(encoding="utf-8")
        self.assertIn('title: "젊은 시인에게 주는 충고"', post)
        self.assertIn("sidebar_feature: true", post)
        self.assertIn("마음속의 풀리지 않는 모든 문제들에 대해", post)
        self.assertIn("라이너 마리아 릴케", post)
        self.assertIn("때때로 검색과 댓글의 성급한 해답 말고", post)
        self.assertIn("온전히 내 자신의 해답이 필요하다.", post)


if __name__ == "__main__":
    unittest.main()
