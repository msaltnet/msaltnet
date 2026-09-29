# Search and AI discovery implementation plan

**Goal:** Improve discovery of msalt.net articles without changing their URLs or original publication dates.

**Architecture:** Keep the GitHub Pages supported Jekyll plugins as the source of canonical metadata, structured data, sitemap and Atom feed. Generate the AI content index from the same posts and project data at build time.

**Tech stack:** Jekyll, Liquid, jekyll-seo-tag, jekyll-sitemap, jekyll-feed, Python unittest.

## Requirements and findings

- Live robots.txt, sitemap.xml and ads.txt return HTTP 200.
- Sitemap currently includes Development and three ownership verification files.
- Article metadata has canonical URLs and descriptions but no author.
- Preserve verification endpoints and the existing ads.txt publisher ID.
- Allow public search and AI crawling under the existing wildcard policy.
- llms.txt is a supplementary proposal, not a guarantee of ranking or AI citations.
- Preserve unrelated pending project-card changes.

## Tasks

- [x] Add built-output regression tests for sitemap content, author/schema/canonical metadata, crawl policy, ads.txt, feed and llms.txt.
- [x] Add author metadata and jekyll-feed configuration; exclude Development from deployment and verification files from sitemap.
- [x] Add discoverable Atom feed metadata, article byline and large-image preview permission.
- [x] Generate llms.txt from posts and projects; simplify robots.txt to the public crawl policy.
- [x] Document SEO maintenance, actual modification dates, verification and post-deployment submissions.
- [x] Build with the real Jekyll dependencies and run source, built-output and browser checks.

## Verification

- Existing live sitemap and missing llms.txt reproduced the two baseline failures.
- Production build passed with Jekyll 3.10.0, jekyll-seo-tag 2.8.0, jekyll-sitemap 1.4.0 and jekyll-feed 0.17.0.
- 20 source and generated-output tests passed; 6 browser tests passed, including JavaScript-disabled discovery.
- Sitemap contains 18 URLs: home and 17 articles. Verification files and ads.txt remain available.
- All article publication dates and canonical URLs are preserved. Article images load lazily with asynchronous decoding.
- Existing mobile image test now scrolls lazy images into view before decoding instead of waiting indefinitely.
- No deployment or search-console submission was performed.
