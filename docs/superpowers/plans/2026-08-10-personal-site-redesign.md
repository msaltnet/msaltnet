# Personal Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current BootstrapMade landing page with a custom Jekyll personal site that publishes Markdown articles, preserves the existing project links, and uses the first poem article as both content and the home sidebar introduction.

**Architecture:** GitHub Pages runs Jekyll over `_posts`, layouts, includes, and project data. The home page uses semantic HTML with a two-column desktop composition and a single-column mobile flow; the post layout uses a focused reading column. Custom CSS and a small progressive-enhancement script replace all existing vendor UI dependencies.

**Tech Stack:** Jekyll/GitHub Pages, Liquid, Kramdown Markdown, custom HTML/CSS/JavaScript, Python `unittest`, Playwright

---

## File Map

- Create `_config.yml`: GitHub Pages/Jekyll configuration, metadata, permalink, and supported plugins.
- Create `Gemfile`: local dependency parity with GitHub Pages.
- Create `_data/projects.yml`: the six preserved project and writing links with image metadata.
- Create `_posts/2026-08-10-advice-to-a-young-poet.md`: first Article and sidebar source content.
- Create `_includes/site-nav.html`: shared Project/Article navigation.
- Create `_includes/sidebar.html`: featured poem Article and project cards on the home page.
- Create `_includes/gtm-head.html`: existing Google Tag Manager head script.
- Create `_includes/gtm-body.html`: existing Google Tag Manager noscript fallback.
- Create `_layouts/default.html`: common document shell, metadata, fonts, footer, and assets.
- Create `_layouts/post.html`: focused Article page.
- Replace `index.html`: Jekyll home composition and Article listing.
- Replace `assets/css/style.css`: complete custom responsive visual system.
- Replace `assets/js/main.js`: progressive reveal behavior only.
- Create `tests/test_source_content.py`: source content and preservation contracts.
- Create `tests/test_built_site.py`: generated HTML structure, links, and metadata contracts.
- Create `package.json`: Playwright test scripts and dependency.
- Create `playwright.config.mjs`: static `_site` browser test server.
- Create `tests/site.spec.mjs`: desktop, mobile, Article, motion, and overflow checks.
- Replace `README.md`: Jekyll writing and local build guide.
- Modify `robots.txt`: advertise the generated sitemap.
- Delete `sitemap.xml`: allow `jekyll-sitemap` to generate the current sitemap.
- Modify `.gitignore`: ignore Jekyll and browser test output.

### Task 1: Lock the Jekyll Content Model

**Files:**
- Create: `tests/test_source_content.py`
- Create: `_config.yml`
- Create: `Gemfile`
- Create: `_data/projects.yml`
- Create: `_posts/2026-08-10-advice-to-a-young-poet.md`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing source contract test**

```python
# tests/test_source_content.py
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
        self.assertIn('permalink: /article/:slug/', config)
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `python3 -m unittest tests/test_source_content.py -v`

Expected: `ERROR` because `_config.yml`, `_data/projects.yml`, and the first post do not exist.

- [ ] **Step 3: Add Jekyll configuration and dependency files**

```yaml
# _config.yml
title: "맛소금"
tagline: "지구별에서 소프트웨어를 만들고, 때때로 생각을 적습니다."
description: "소프트웨어를 만들고 가끔 생각을 기록하는 맛소금의 개인 웹 페이지"
url: "https://msalt.net"
baseurl: ""
lang: "ko-KR"
timezone: "Asia/Seoul"
permalink: /article/:slug/
markdown: kramdown
kramdown:
  input: GFM
plugins:
  - jekyll-seo-tag
  - jekyll-sitemap
defaults:
  - scope:
      path: ""
      type: posts
    values:
      layout: post
      image: /assets/img/hero-bg.jpg
exclude:
  - docs
  - node_modules
  - package.json
  - package-lock.json
  - playwright.config.mjs
  - tests
  - vendor
```

```ruby
# Gemfile
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
```

- [ ] **Step 4: Add the six project records**

```yaml
# _data/projects.yml
- title: "smtm"
  label: "Open Source"
  description: "Python Crypto Trading System"
  url: "https://github.com/msaltnet/smtm"
  image: "/assets/img/smtm.webp"
  alt: "smtm 암호화폐 자동매매 프로젝트 화면"
- title: "암호화폐 자동매매 시스템 만들기 with 파이썬"
  label: "Book"
  description: "지은이 정성문"
  url: "https://smtm.msalt.net"
  image: "/assets/img/smtm-book.webp"
  alt: "암호화폐 자동매매 시스템 만들기 with 파이썬 책 표지"
- title: "nanobot on rpi"
  label: "Project"
  description: "nanobot과 라즈베리파이로 나만의 비서 만들기"
  url: "https://nanobot.msalt.net"
  image: "/assets/img/nanobot.webp"
  alt: "라즈베리파이에서 실행되는 nanobot 프로젝트"
- title: "T.Viewer"
  label: "Open Source"
  description: "Cross Platform Tizen Log Viewer"
  url: "https://github.com/msaltnet/T.Viewer"
  image: "/assets/img/tviewer.webp"
  alt: "T.Viewer 타이젠 로그 뷰어 화면"
- title: "맛소금 브런치 스토리"
  label: "Writing"
  description: "글로 옮겨진 작가의 생각 모음"
  url: "https://brunch.co.kr/@msaltnet"
  image: "/assets/img/climatebook.webp"
  alt: "맛소금 브런치 스토리 대표 이미지"
- title: "고마워서 만든 블로그"
  label: "Blog"
  description: "나누면 좋을 것 같은 생각과 정보"
  url: "https://blog.msalt.net/"
  image: "/assets/img/judgement.webp"
  alt: "고마워서 만든 블로그 대표 이미지"
```

- [ ] **Step 5: Add the first Markdown Article**

```markdown
---
title: "젊은 시인에게 주는 충고"
date: 2026-08-10
description: "때때로 검색과 댓글의 성급한 해답 말고, 온전히 내 자신의 해답이 필요하다."
sidebar_feature: true
---

> 마음속의 풀리지 않는 모든 문제들에 대해  
> 인내를 가지라.  
> 문제 그 자체를 사랑하라.  
> 지금 당장 해답을 얻으려 하지 말라.  
> 그건 지금 당장 주어질 순 없으니까.  
> 중요한 건  
> 모든 것을 살아보는 일이다.  
> 지금 그 문제들을 살라.  
> 그러면 언젠가 먼 미래에  
> 자신도 알지 못하는 사이에  
> 삶이 너에게 해답을 가져다줄 테니까.
{: .poem-quote }

<p class="poem-author">- 라이너 마리아 릴케</p>

때때로 검색과 댓글의 성급한 해답 말고  
온전히 내 자신의 해답이 필요하다.
{: .personal-note }
```

- [ ] **Step 6: Ignore generated local artifacts**

Append these entries to `.gitignore`:

```gitignore
_site/
.jekyll-cache/
.jekyll-metadata
vendor/bundle/
test-results/
playwright-report/
```

- [ ] **Step 7: Run the source contract test**

Run: `python3 -m unittest tests/test_source_content.py -v`

Expected: `Ran 3 tests ... OK`.

- [ ] **Step 8: Commit the content model**

```bash
git add .gitignore Gemfile _config.yml _data/projects.yml _posts/2026-08-10-advice-to-a-young-poet.md tests/test_source_content.py
git commit -m "feat: add Jekyll content model"
```

### Task 2: Build the Semantic Site Shell

**Files:**
- Create: `tests/test_built_site.py`
- Create: `_includes/site-nav.html`
- Create: `_includes/sidebar.html`
- Create: `_includes/gtm-head.html`
- Create: `_includes/gtm-body.html`
- Create: `_layouts/default.html`
- Create: `_layouts/post.html`
- Replace: `index.html`

- [ ] **Step 1: Write the failing generated-site contract**

```python
# tests/test_built_site.py
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
        project_images = [image for image in self.home.images if "project-card" in image.get("class", "")]
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
```

- [ ] **Step 2: Run the generated-site contract and verify it fails**

Run: `python3 -m unittest tests/test_built_site.py -v`

Expected: `ERROR` because `_site/index.html` has not been generated.

- [ ] **Step 3: Add the shared navigation and sidebar includes**

```liquid
<!-- _includes/site-nav.html -->
<header class="site-header{% if include.home %} site-header--home{% endif %}">
  <a class="wordmark{% if include.home %} wordmark--mobile{% endif %}" href="{{ '/' | relative_url }}">맛소금</a>
  <nav aria-label="주요 메뉴">
    <a href="{{ '/' | relative_url }}#project">Project</a>
    <a href="{{ '/' | relative_url }}#article">Article</a>
  </nav>
</header>
```

```liquid
<!-- _includes/sidebar.html -->
{% assign sidebar_post = site.posts | where: "sidebar_feature", true | first %}
<aside class="home-sidebar" id="project" aria-label="소개와 프로젝트">
  <a class="sidebar-wordmark" href="{{ '/' | relative_url }}">맛소금</a>

  {% if sidebar_post %}
    <section class="sidebar-poem" aria-labelledby="sidebar-poem-title">
      <h2 id="sidebar-poem-title">{{ sidebar_post.title }}</h2>
      <div class="sidebar-poem-content">{{ sidebar_post.content }}</div>
    </section>
  {% endif %}

  <section class="projects" aria-labelledby="project-title">
    <p class="section-kicker" id="project-title">Project</p>
    <div class="project-list">
      {% for project in site.data.projects %}
        <a class="project-card" href="{{ project.url }}" target="_blank" rel="noopener noreferrer">
          <img class="project-card-image" src="{{ project.image | relative_url }}" alt="{{ project.alt }}" loading="lazy" width="160" height="112">
          <span class="project-card-copy">
            <span class="project-label">{{ project.label }}</span>
            <strong>{{ project.title }}</strong>
            <span>{{ project.description }}</span>
          </span>
        </a>
      {% endfor %}
    </div>
  </section>
</aside>
```

- [ ] **Step 4: Preserve the existing Google Tag Manager integration**

```html
<!-- _includes/gtm-head.html -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-N3Z7SSC');
</script>
```

```html
<!-- _includes/gtm-body.html -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N3Z7SSC"
  height="0" width="0" class="gtm-frame" title="Google Tag Manager"></iframe></noscript>
```

- [ ] **Step 5: Add the default and Article layouts**

```liquid
<!-- _layouts/default.html -->
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  {% include gtm-head.html %}
  {% seo %}
  <link rel="icon" href="{{ '/assets/img/msaltnet.ico' | relative_url }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&family=Noto+Serif+KR:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
  <script src="{{ '/assets/js/main.js' | relative_url }}" defer></script>
</head>
<body class="{{ page.body_class }}">
  {% include gtm-body.html %}
  <a class="skip-link" href="#main-content">본문으로 건너뛰기</a>
  {{ content }}
  <footer class="site-footer"><p>&copy; 2026 맛소금</p></footer>
</body>
</html>
```

```liquid
<!-- _layouts/post.html -->
---
layout: default
body_class: article-page
---
{% include site-nav.html %}
<main class="post-shell" id="main-content">
  <article class="post">
    <a class="back-link" href="{{ '/' | relative_url }}#article">Article 목록</a>
    <p class="post-date"><time datetime="{{ page.date | date_to_xmlschema }}">{{ page.date | date: "%Y.%m.%d" }}</time></p>
    <h1>{{ page.title }}</h1>
    <div class="post-content">{{ content }}</div>
  </article>
</main>
```

- [ ] **Step 6: Replace the home page with the new Liquid composition**

```liquid
---
layout: default
body_class: home-page
---
<div class="home-shell">
  <main class="home-main" id="main-content">
    {% include site-nav.html home=true %}

    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy" data-reveal>
        <h1 id="hero-title">맛소금</h1>
        <p>지구별에서 소프트웨어를 만들고,<br>때때로 생각을 적습니다.</p>
      </div>
    </section>

    <section class="article-index" id="article" aria-labelledby="article-title" data-reveal>
      <p class="section-kicker">Article</p>
      <h2 id="article-title">가끔 적는 생각</h2>
      {% assign latest = site.posts | first %}
      {% if latest %}
        <a class="latest-article" href="{{ latest.url | relative_url }}">
          <time datetime="{{ latest.date | date_to_xmlschema }}">{{ latest.date | date: "%Y.%m.%d" }}</time>
          <h3>{{ latest.title }}</h3>
          <p>{{ latest.description }}</p>
          <span aria-hidden="true">읽기 →</span>
        </a>
      {% endif %}

      {% if site.posts.size > 1 %}
        <div class="article-list">
          {% for post in site.posts offset:1 %}
            <a href="{{ post.url | relative_url }}">
              <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y.%m.%d" }}</time>
              <strong>{{ post.title }}</strong>
              <span>{{ post.description }}</span>
            </a>
          {% endfor %}
        </div>
      {% endif %}
    </section>
  </main>

  {% include sidebar.html %}
</div>
```

- [ ] **Step 7: Build through a Ruby container**

The host has no Ruby/Jekyll installation. Run Jekyll in a disposable Ruby container while keeping Bundler output inside the ignored `vendor/bundle` directory:

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
  -v "$PWD:/srv/jekyll" -w /srv/jekyll ruby:3.2 \
  bash -lc "bundle install && bundle exec jekyll build"
```

Expected: `done in ... seconds.` and `_site/index.html` exists.

- [ ] **Step 8: Run the generated-site contract**

Run: `python3 -m unittest tests/test_built_site.py -v`

Expected: `Ran 5 tests ... OK`.

- [ ] **Step 9: Commit the semantic shell**

```bash
git add Gemfile.lock _includes _layouts index.html tests/test_built_site.py
git commit -m "feat: build Jekyll site shell"
```

### Task 3: Implement the Custom Visual System

**Files:**
- Create: `package.json`
- Create: `playwright.config.mjs`
- Create: `tests/site.spec.mjs`
- Replace: `assets/css/style.css`
- Replace: `assets/js/main.js`

- [ ] **Step 1: Add browser tests that fail against the unstyled shell**

```json
{
  "name": "msaltnet-site",
  "private": true,
  "scripts": {
    "test": "python3 -m unittest discover -s tests -p 'test_*.py' -v",
    "test:e2e": "playwright test",
    "test:all": "npm test && npm run test:e2e"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  }
}
```

```javascript
// playwright.config.mjs
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'site.spec.mjs',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory _site',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
```

```javascript
// tests/site.spec.mjs
import { test, expect } from '@playwright/test';

test('desktop home uses an editorial sidebar and exposes the next section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '맛소금' })).toBeVisible();
  await expect(page.locator('.project-card')).toHaveCount(6);

  const sidebar = await page.locator('.home-sidebar').boundingBox();
  const main = await page.locator('.home-main').boundingBox();
  const articles = await page.locator('#article').boundingBox();
  expect(sidebar.x).toBeLessThan(main.x);
  expect(sidebar.width).toBeLessThan(main.width);
  expect(articles.y).toBeLessThan(900);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
});

test('mobile keeps hero copy and places sidebar content after articles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('지구별에서 소프트웨어를 만들고,')).toBeVisible();
  await expect(page.getByText('때때로 생각을 적습니다.')).toBeVisible();

  const main = await page.locator('.home-main').boundingBox();
  const sidebar = await page.locator('.home-sidebar').boundingBox();
  expect(main.y).toBeLessThan(sidebar.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
});

test('article page presents the poem and personal note in a reading column', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/article/advice-to-a-young-poet/');
  await expect(page.getByRole('heading', { level: 1, name: '젊은 시인에게 주는 충고' })).toBeVisible();
  await expect(page.getByText('마음속의 풀리지 않는 모든 문제들에 대해')).toBeVisible();
  await expect(page.getByText('온전히 내 자신의 해답이 필요하다.')).toBeVisible();
  const article = await page.locator('.post').boundingBox();
  expect(article.width).toBeLessThanOrEqual(760);
  await page.screenshot({ path: 'test-results/article-desktop.png', fullPage: true });
});

test('reduced motion disables transitions and content remains visible', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('[data-reveal]').first()).toBeVisible();
  const duration = await page.locator('[data-reveal]').first().evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(duration).toBe('0s');
  await context.close();
});
```

- [ ] **Step 2: Install Playwright and verify the layout test fails**

Run:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

Expected: FAIL because the current template CSS does not create the new sidebar grid or responsive order.

- [ ] **Step 3: Replace the stylesheet with the complete custom design**

Replace `assets/css/style.css` with:

```css
:root {
  --paper: #f3f5f2;
  --surface: #fbfcfa;
  --rail: #e2e9e3;
  --ink: #1d241f;
  --muted: #667068;
  --line: #c6d0c8;
  --accent: #ad4e37;
  --focus: #176d8b;
  --serif: "Noto Serif KR", Georgia, serif;
  --sans: "IBM Plex Sans KR", sans-serif;
}

* { box-sizing: border-box; }

html {
  color-scheme: light;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  overflow-x: hidden;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--sans);
  line-height: 1.7;
  word-break: keep-all;
}

a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }

a:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 4px;
}

.skip-link {
  position: fixed;
  left: 16px;
  top: -80px;
  z-index: 100;
  padding: 10px 14px;
  background: var(--ink);
  color: #fff;
  transition: top 160ms ease;
}

.skip-link:focus { top: 16px; }
.gtm-frame { display: none; visibility: hidden; }

.home-shell {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  grid-template-areas: "sidebar main";
  max-width: 1440px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--surface);
}

.home-main { grid-area: main; min-width: 0; }

.home-sidebar {
  grid-area: sidebar;
  padding: 38px clamp(22px, 3vw, 42px) 64px;
  border-right: 1px solid var(--line);
  background: var(--rail);
}

.sidebar-wordmark,
.wordmark {
  display: inline-block;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 700;
}

.sidebar-wordmark { margin-bottom: 54px; }

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 66px;
  padding: 0 clamp(20px, 4vw, 64px);
  border-bottom: 1px solid var(--line);
  background: rgba(251, 252, 250, 0.94);
}

.site-header--home { justify-content: flex-end; }
.wordmark--mobile { display: none; }

.site-header nav { display: flex; gap: clamp(18px, 3vw, 36px); }

.site-header nav a {
  position: relative;
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: uppercase;
}

.site-header nav a::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -7px;
  width: 100%;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
}

.site-header nav a:hover::after,
.site-header nav a:focus-visible::after { transform: scaleX(1); }

.hero {
  display: flex;
  align-items: flex-end;
  min-height: clamp(360px, 52svh, 620px);
  padding: clamp(30px, 6vw, 84px);
  background-image: linear-gradient(rgba(15, 22, 18, 0.08), rgba(15, 22, 18, 0.56)), url("../img/hero-bg.webp");
  background-position: 68% 50%;
  background-size: cover;
  color: #fff;
}

.hero h1 {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(2.6rem, 6vw, 5.5rem);
  line-height: 1.05;
}

.hero p {
  margin: 16px 0 0;
  font-size: clamp(0.95rem, 1.4vw, 1.15rem);
  line-height: 1.75;
}

.section-kicker {
  margin: 0 0 12px;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
}

.sidebar-poem { margin-bottom: 52px; }

.sidebar-poem h2 {
  margin: 0 0 24px;
  font-family: var(--serif);
  font-size: 1.02rem;
  line-height: 1.5;
}

.poem-quote {
  margin: 0;
  padding: 0;
  border: 0;
  color: #3f4941;
  font-family: var(--serif);
  font-size: 0.82rem;
  line-height: 2;
}

.poem-author {
  margin: 18px 0 0;
  color: var(--muted);
  font-family: var(--serif);
  font-size: 0.76rem;
}

.personal-note {
  margin: 32px 0 0;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.88rem;
  line-height: 1.9;
}

.project-list { display: grid; gap: 12px; }

.project-card {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  min-height: 78px;
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--surface);
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.project-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(29, 36, 31, 0.1);
}

.project-card img { width: 86px; height: 100%; object-fit: cover; }

.project-card-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 10px 12px;
}

.project-label {
  color: var(--accent);
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
}

.project-card strong {
  overflow: hidden;
  margin: 2px 0;
  font-family: var(--serif);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-card-copy > span:last-child {
  overflow: hidden;
  color: var(--muted);
  font-size: 0.66rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-index {
  max-width: 780px;
  padding: clamp(68px, 10vw, 130px) clamp(24px, 7vw, 92px);
}

.article-index > h2 {
  margin: 0 0 44px;
  font-family: var(--serif);
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1.25;
}

.latest-article { display: block; padding: 32px 0; border-block: 1px solid var(--line); }
.latest-article time,
.article-list time,
.post-date { color: var(--muted); font-size: 0.75rem; }

.latest-article h3 {
  margin: 14px 0;
  font-family: var(--serif);
  font-size: clamp(1.45rem, 3vw, 2.2rem);
}

.latest-article p { margin: 0 0 24px; color: var(--muted); }
.latest-article > span { color: var(--accent); font-size: 0.78rem; font-weight: 600; }

.article-list a {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 4px 20px;
  padding: 24px 0;
  border-bottom: 1px solid var(--line);
}

.article-list strong { font-family: var(--serif); }
.article-list span { grid-column: 2; color: var(--muted); font-size: 0.85rem; }

.post-shell { max-width: 760px; min-height: 75vh; margin: 0 auto; padding: 80px 24px 120px; }
.back-link { color: var(--accent); font-size: 0.78rem; font-weight: 600; }
.post-date { margin: 56px 0 8px; }

.post h1 {
  margin: 0 0 56px;
  font-family: var(--serif);
  font-size: clamp(2.2rem, 5vw, 4.2rem);
  line-height: 1.25;
}

.post-content { font-family: var(--serif); font-size: 1.02rem; line-height: 2; }
.post-content .poem-quote { font-size: 1.04rem; }
.post-content .personal-note { margin-top: 52px; font-size: 1.05rem; }

.site-footer {
  padding: 34px 24px;
  border-top: 1px solid var(--line);
  background: var(--ink);
  color: #dfe5df;
  text-align: center;
  font-size: 0.7rem;
}

.site-footer p { margin: 0; }

.js [data-reveal] { opacity: 0; transform: translateY(18px); transition: opacity 500ms ease, transform 500ms ease; }
.js [data-reveal].is-visible { opacity: 1; transform: none; }

@media (max-width: 860px) {
  .home-shell {
    grid-template-columns: 1fr;
    grid-template-areas: "main" "sidebar";
  }

  .home-sidebar { padding: 56px 22px 72px; border-top: 1px solid var(--line); border-right: 0; }
  .sidebar-wordmark { display: none; }
  .site-header--home { justify-content: space-between; }
  .wordmark--mobile { display: inline-block; }
  .hero { min-height: clamp(340px, 48svh, 520px); padding: 28px 22px; }
  .hero p { display: block; }
  .article-index { padding: 72px 22px 88px; }
  .sidebar-poem,
  .projects { max-width: 620px; margin-inline: auto; }
  .sidebar-poem { margin-bottom: 56px; }
  .project-card { grid-template-columns: 104px minmax(0, 1fr); min-height: 88px; }
  .project-card img { width: 104px; }
}

@media (max-width: 480px) {
  .site-header { padding-inline: 16px; }
  .site-header nav { gap: 16px; }
  .site-header nav a { font-size: 0.68rem; }
  .article-list a { grid-template-columns: 1fr; }
  .article-list span { grid-column: 1; }
  .post-shell { padding-top: 56px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0s !important; animation-duration: 0s !important; }
  .js [data-reveal] { opacity: 1; transform: none; }
}
```

- [ ] **Step 4: Replace the legacy JavaScript with progressive reveal behavior**

```javascript
// assets/js/main.js
document.documentElement.classList.add('js');

const revealTargets = document.querySelectorAll('[data-reveal]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((target) => target.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach((target) => observer.observe(target));
}
```

- [ ] **Step 5: Rebuild and run browser tests**

Run the Docker Jekyll build command from Task 2, then run `npm run test:e2e`.

Expected: `4 passed`; screenshots are written to `test-results/`.

- [ ] **Step 6: Inspect screenshots**

Open and inspect:

- `test-results/home-desktop.png`
- `test-results/home-mobile.png`
- `test-results/article-desktop.png`

Verify that hero text is readable, the mobile hero description is present, the sidebar poem has no `Article 01` label, all card text fits, and no elements overlap.

- [ ] **Step 7: Commit the custom visual system**

```bash
git add package.json package-lock.json playwright.config.mjs tests/site.spec.mjs assets/css/style.css assets/js/main.js
git commit -m "feat: add custom editorial site design"
```

### Task 4: Document Publishing and Finish SEO Files

**Files:**
- Modify: `tests/test_source_content.py`
- Replace: `README.md`
- Modify: `robots.txt`
- Delete: `sitemap.xml`

- [ ] **Step 1: Extend the source test for publishing documentation and generated sitemap ownership**

Add to `SourceContentTest`:

```python
    def test_readme_documents_the_article_workflow(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("_posts/YYYY-MM-DD-title.md", readme)
        self.assertIn("sidebar_feature: true", readme)
        self.assertIn("bundle exec jekyll serve", readme)

    def test_robots_points_to_the_generated_sitemap(self):
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: https://msalt.net/sitemap.xml", robots)
        self.assertFalse((ROOT / "sitemap.xml").exists())
```

- [ ] **Step 2: Run the source test and verify the new assertions fail**

Run: `python3 -m unittest tests/test_source_content.py -v`

Expected: FAIL because README still contains only the poem, robots has no Sitemap line, and the manual sitemap exists.

- [ ] **Step 3: Replace README with the writing workflow**

````markdown
# msalt.net

Jekyll로 생성되는 맛소금의 개인 웹 페이지입니다.

## 글 쓰기

`_posts/YYYY-MM-DD-title.md` 형식으로 파일을 만들고 다음 front matter 뒤에 Markdown 본문을 작성합니다.

```yaml
---
title: "글 제목"
date: 2026-08-10
description: "홈과 공유 메타데이터에 표시할 한두 문장"
---
```

홈 왼쪽 사이드바에 글 전문을 함께 표시하려면 front matter에 `sidebar_feature: true`를 추가합니다. 한 편만 지정합니다.

## 로컬 실행

Ruby와 Bundler가 있는 환경에서는 다음 명령을 사용합니다.

```bash
bundle install
bundle exec jekyll serve
```

이 저장소의 개발 환경처럼 Ruby가 없다면 구현 계획에 기록된 Docker 명령으로 빌드할 수 있습니다.
````

- [ ] **Step 4: Let Jekyll own the sitemap**

Replace `robots.txt` with:

```text
User-agent: *
Disallow: /api
Disallow: /error
Allow: /

Sitemap: https://msalt.net/sitemap.xml
```

Delete the checked-in `sitemap.xml`; the supported `jekyll-sitemap` plugin generates it from current posts and pages.

- [ ] **Step 5: Run tests and rebuild**

Run:

```bash
python3 -m unittest tests/test_source_content.py -v
```

Then run the Docker Jekyll build command from Task 2 followed by:

```bash
python3 -m unittest tests/test_built_site.py -v
test -f _site/sitemap.xml
```

Expected: all Python tests pass and `_site/sitemap.xml` exists.

- [ ] **Step 6: Commit documentation and SEO cleanup**

```bash
git add README.md robots.txt sitemap.xml tests/test_source_content.py
git commit -m "docs: add Article publishing workflow"
```

### Task 5: Final Verification

**Files:**
- Verify only; modify files only if a failing check identifies a defect.

- [ ] **Step 1: Run whitespace and repository checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no unexpected untracked files.

- [ ] **Step 2: Run the complete automated suite**

Run the Docker Jekyll build command from Task 2, then:

```bash
npm run test:all
```

Expected: all Python contract tests and all four Playwright tests pass.

- [ ] **Step 3: Verify preserved links and removed template references**

Run:

```bash
rg -n "github.com/msaltnet/smtm|smtm.msalt.net|nanobot.msalt.net|github.com/msaltnet/T.Viewer|brunch.co.kr/@msaltnet|blog.msalt.net" _site/index.html
rg -n "BootstrapMade|assets/vendor/|bootstrap" _site/index.html && exit 1 || true
```

Expected: the first command finds all six URLs; the second finds nothing.

- [ ] **Step 4: Perform final responsive screenshot review**

Use the Playwright screenshots at desktop `1440x900` and mobile `390x844`. Confirm:

- the mobile hero includes both description lines;
- the poem and “때때로…” text appear in both the sidebar and first Article;
- the sidebar has no numbering or Article label above the poem;
- six project cards show images and readable labels;
- the next Article section is visible below the desktop hero;
- no text overlaps, clips, or causes horizontal scrolling.

- [ ] **Step 5: Commit any verification-only corrections**

If verification required corrections, stage only those files and run:

```bash
git commit -m "fix: polish responsive personal site layout"
```

If no corrections were required, do not create an empty commit.
