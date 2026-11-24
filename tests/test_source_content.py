from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
PROJECT_URLS = {
    "https://ax.msalt.net",
    "https://github.com/msaltnet/smtm",
    "https://smtm.msalt.net",
    "https://github.com/msaltnet/T.Viewer",
    "https://brunch.co.kr/@msaltnet",
    "https://blog.msalt.net/",
    "https://coding.msalt.net",
    "https://jinju.msalt.net",
}


class SourceContentTest(unittest.TestCase):
    def test_astro_configuration_uses_custom_domain_and_article_routes(self):
        config = (ROOT / "astro.config.mjs").read_text(encoding="utf-8")
        self.assertIn("site: 'https://msalt.net'", config)
        self.assertIn("trailingSlash: 'always'", config)
        self.assertIn("outDir: './_site'", config)
        self.assertTrue((ROOT / "src/pages/article/[slug].astro").is_file())
        self.assertFalse((ROOT / "_config.yml").exists())

    def test_pages_workflow_builds_with_node_and_runs_all_checks(self):
        workflow = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
        self.assertIn("node-version: '22'", workflow)
        self.assertIn("npm ci", workflow)
        self.assertIn("npm run verify", workflow)
        self.assertIn("path: _site", workflow)
        self.assertNotIn("jekyll", workflow.lower())

    def test_all_existing_project_urls_and_images_are_declared(self):
        projects = (ROOT / "_data/projects.yml").read_text(encoding="utf-8")
        for url in PROJECT_URLS:
            self.assertIn(url, projects)
        self.assertEqual(projects.count("- title:"), 8)
        self.assertEqual(projects.count("  image:"), 8)
        self.assertEqual(projects.count("  alt:"), 8)

    def test_first_article_is_the_sidebar_feature_and_contains_both_texts(self):
        post = (
            ROOT / "src/content/posts/advice-to-a-young-poet.md"
        ).read_text(encoding="utf-8")
        self.assertIn('title: "젊은 시인에게 주는 충고"', post)
        self.assertIn("sidebar_feature: true", post)
        self.assertIn("마음속의 풀리지 않는 모든 문제들에 대해", post)
        self.assertIn("라이너 마리아 릴케", post)
        self.assertIn("때때로 검색과 댓글의 성급한 해답 말고", post)
        self.assertIn("온전히 내 자신의 해답이 필요하다.", post)

    def test_development_guide_documents_the_article_workflow(self):
        guide = (ROOT / "Development.md").read_text(encoding="utf-8")
        self.assertIn("src/content/posts/<slug>.md", guide)
        self.assertIn("category: reviews", guide)
        self.assertIn("sidebar_feature: true", guide)
        self.assertIn("npm run dev", guide)
        self.assertIn("npm run verify", guide)
        self.assertIn("selectAppFeedPosts", guide)
        self.assertNotIn("bundle exec jekyll", guide)

    def test_robots_points_to_the_generated_sitemap(self):
        robots = (ROOT / "public/robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: https://msalt.net/sitemap.xml", robots)
        self.assertFalse((ROOT / "sitemap.xml").exists())

    def test_root_ads_txt_authorizes_the_blog_publisher(self):
        path = ROOT / "public/ads.txt"
        self.assertTrue(path.is_file(), "msalt.net/ads.txt is missing")
        ads_txt = path.read_text(encoding="utf-8")
        self.assertEqual(
            ads_txt.strip(),
            "google.com, pub-7998090459933600, DIRECT, f08c47fec0942fa0",
        )


if __name__ == "__main__":
    unittest.main()
