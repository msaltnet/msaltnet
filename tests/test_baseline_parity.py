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
ADDED_NAV = []  # Menu items appended after the baseline navigation.


def expected_page(baseline_page):
    page = json.loads(json.dumps(baseline_page))
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
                self.assertEqual(self.current["pages"][path], expected_page(baseline_page))

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
