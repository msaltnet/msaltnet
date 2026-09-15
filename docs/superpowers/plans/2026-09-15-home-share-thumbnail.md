# Home Share Thumbnail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the large `hero-bg.jpg` preview when the home page URL is shared.

**Architecture:** Declare the existing hero image in the home page front matter and continue using `jekyll-seo-tag` as the single metadata generator. Cover the generated HTML with a regression test that asserts the Open Graph image, Twitter image, and large-card type.

**Tech Stack:** Jekyll, Liquid front matter, `jekyll-seo-tag`, Python `unittest`

---

## File Structure

- Modify `tests/test_built_site.py`: verify social preview metadata in generated home HTML.
- Modify `index.html`: provide the home page image to `jekyll-seo-tag` through front matter.

### Task 1: Add the Home Social Metadata Regression Test

**Files:**
- Modify: `tests/test_built_site.py`

- [ ] **Step 1: Write the failing test**

Add this method to `BuiltSiteTest`:

```python
def test_home_uses_hero_image_for_large_social_preview(self):
    meta_by_property = {
        item["property"]: item.get("content")
        for item in self.home.meta
        if "property" in item
    }
    meta_by_name = {
        item["name"]: item.get("content")
        for item in self.home.meta
        if "name" in item
    }

    expected_image = "https://msalt.net/assets/img/hero-bg.jpg"
    self.assertEqual(meta_by_property.get("og:image"), expected_image)
    self.assertEqual(meta_by_property.get("twitter:image"), expected_image)
    self.assertEqual(meta_by_name.get("twitter:card"), "summary_large_image")
```

- [ ] **Step 2: Build and run the focused test to verify it fails**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests.test_built_site.BuiltSiteTest.test_home_uses_hero_image_for_large_social_preview -v
```

Expected: the Jekyll build succeeds, then the test fails because `og:image` is `None` instead of `https://msalt.net/assets/img/hero-bg.jpg`.

- [ ] **Step 3: Commit the failing regression test**

```bash
git add tests/test_built_site.py
git commit -m "test: cover home share thumbnail metadata"
```

### Task 2: Provide the Home Page Image to the SEO Tag

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add the minimal front-matter setting**

Change the front matter to:

```yaml
---
layout: default
body_class: home-page
image: /assets/img/hero-bg.jpg
---
```

- [ ] **Step 2: Rebuild and verify the focused test passes**

Run:

```bash
bundle exec jekyll build
python3 -m unittest tests.test_built_site.BuiltSiteTest.test_home_uses_hero_image_for_large_social_preview -v
```

Expected: `OK` with one passing test.

- [ ] **Step 3: Run the full test suite**

Run:

```bash
npm test
npm run test:e2e
```

Expected: all Python and Playwright tests pass with no failures.

- [ ] **Step 4: Inspect the generated metadata**

Run:

```bash
rg -n 'og:image|twitter:image|twitter:card' _site/index.html
```

Expected output contains absolute image URLs ending in `/assets/img/hero-bg.jpg` and `twitter:card` content `summary_large_image`.

- [ ] **Step 5: Commit the implementation**

```bash
git add index.html
git commit -m "fix: restore home share thumbnail"
```
