# Search performance implementation plan

**Goal:** Improve the image and Korean font downloads identified in the live audit, and publish evidence-based article modification dates.

**Architecture:** Keep GitHub Pages compatible Jekyll templates and existing canonical URLs. Generate image derivatives and Unicode font subsets offline, commit their metadata and assets, and consume them from Liquid/CSS. Keep original assets available for existing links and future font characters.

**Scope:** The user authorized all three improvements from the audit. Preserve article prose, original publication dates, typography, search metadata, feed, sitemap and llms.txt.

## Tasks

- [ ] Verify the existing tests and build environment.
- [ ] Add failing output tests for image download budgets, dimensions/responsive variants, Unicode font coverage and modified-date propagation.
- [ ] Add a reproducible offline asset preparation script. Convert referenced images to WebP, cap desktop width at 1600px, and provide 800px variants. Keep social images as optimized JPEG for compatibility.
- [ ] Generate a common Korean font subset covering current site text, plus disjoint Unicode subsets for remaining supported characters; preserve full character coverage.
- [ ] Render responsive images with intrinsic dimensions; load the first article image eagerly and others lazily.
- [ ] Add actual modification timestamps only where Git history proves a substantive edit; show them on the article and in generated metadata, feed and llms.txt.
- [ ] Document regeneration and post-deployment Search Console/performance checks. Exclude development tooling from publication.
- [ ] Run a real Jekyll production build, the full Python suite and browser tests; inspect mobile/desktop output and review the diff.

## Decisions

- Implement in this clean, existing submodule checkout; do not create an unrelated worktree for the parent repository.
- Do not set today's date merely because image/font assets changed. Historical migration, footer removals and encoding changes are not proof of a substantive content revision.
- Search Console metrics need authenticated account access; document those checks rather than inventing measurements.
- Prepare local changes for review; deployment is a separate action.
