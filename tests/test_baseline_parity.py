"""The built site must keep every page, address and metadata of the Jekyll baseline."""
from pathlib import Path
import importlib.util
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
BASELINE = json.loads((ROOT / "tests/fixtures/jekyll-baseline.json").read_text(encoding="utf-8"))

_spec = importlib.util.spec_from_file_location("snapshot_site", ROOT / "scripts/snapshot_site.py")
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
snapshot = _module.snapshot

# The only intended differences from the Jekyll output.
ADDED_PAGES = {"search/index.html", "app-privacy/index.html"}
ADDED_FILE_PREFIXES = ("app/v1/", "pagefind/")
ADDED_NAV = [["검색", "/search/"]]  # Menu items appended after the baseline navigation.
# Jekyll emitted the raw invalid tag "<연금술사>", which browsers show as text; Astro escapes it (same visible text).
# kramdown and Astro's smartypants disagree on the direction of one apostrophe after an ellipsis.
KNOWN_TEXT_FIXES = {
    "article/give-and-take/index.html": [("< 연금술사>", "<연금술사>")],
    "article/stolen-focus/index.html": [("저거…‘라는", "저거…’라는")],
    # The home menu sits inside <main>, so the added search item also appears in its text.
    "index.html": [("프로젝트 소개 맛소금", "프로젝트 소개 검색 맛소금")],
}


def expected_page(path, baseline_page):
    page = json.loads(json.dumps(baseline_page))
    for old, new in KNOWN_TEXT_FIXES.get(path, []):
        page["main_text"] = page["main_text"].replace(old, new)
    if page["nav"]:
        page["nav"] = page["nav"] + ADDED_NAV
    return page


class BaselineParityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.current = snapshot(SITE)

    def test_every_baseline_page_exists_with_identical_snapshot(self):
        for path, baseline_page in BASELINE["pages"].items():
            with self.subTest(page=path):
                self.assertIn(path, self.current["pages"])
                self.assertEqual(self.current["pages"][path], expected_page(path, baseline_page))

    def test_no_unexpected_new_pages_or_files(self):
        new_pages = set(self.current["pages"]) - set(BASELINE["pages"])
        self.assertLessEqual(new_pages, ADDED_PAGES)
        new_files = {
            path for path in set(self.current["files"]) - set(BASELINE["files"])
            if not path.startswith(ADDED_FILE_PREFIXES)
        }
        self.assertEqual(new_files, set())
        self.assertEqual(set(BASELINE["files"]) - set(self.current["files"]), set())

    def test_sitemap_and_feed_entries_match(self):
        self.assertEqual(self.current["sitemap"], BASELINE["sitemap"])
        self.assertEqual(self.current["feed"], BASELINE["feed"])


if __name__ == "__main__":
    unittest.main()
