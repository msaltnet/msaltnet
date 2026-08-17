# 읽기 쉬운 타이포그래피 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase the site's default and small supporting text sizes by roughly 15–20% while preserving existing hierarchy and responsive layouts.

**Architecture:** Keep the existing single stylesheet and font families. Adjust only the body rhythm and explicit small-text selectors; leave display headings and media dimensions unchanged.

**Tech Stack:** Jekyll, CSS, pytest, Playwright.

---

### Task 1: Apply readable typography scale

**Files:**
- Modify: `assets/css/style.css` around the base body, navigation, sidebar, project-card, article metadata, post metadata, and footer rules.

- [ ] **Step 1: Update the base rhythm and small text selectors**

  Set `body` line-height to `1.75`; increase `.site-header nav a` to `0.86rem`; `.section-kicker` to `0.8rem`; `.sidebar-poem h2` to `1.08rem`; `.poem-quote` to `0.96rem`; `.poem-author` to `0.86rem`; `.personal-note` to `0.98rem`; `.project-label` to `0.72rem`; `.project-card strong` to `0.9rem`; `.project-card-copy > span:last-child` to `0.78rem`; article dates to `0.82rem`; article links to `0.86rem`; `.latest-article > span` to `0.86rem`; `.article-list span` to `0.92rem`; `.back-link` to `0.86rem`; and `.site-footer` to `0.8rem`.

- [ ] **Step 2: Preserve responsive behavior**

  Review the existing `@media (max-width: 860px)` and `@media (max-width: 480px)` rules after the scale change. Keep the mobile navigation at least `0.78rem` and ensure no rule reintroduces a smaller value than the new desktop baseline without a layout reason.

### Task 2: Verify rendered output

**Files:**
- Test: `tests/test_source_content.py`
- Test: `tests/test_built_site.py`
- Test: `tests/site.spec.mjs`

- [ ] **Step 1: Run source and build tests**

  Run `python -m pytest tests/test_source_content.py tests/test_built_site.py -q`.
  Expected: all tests pass.

- [ ] **Step 2: Run browser tests**

  Run `npm test`.
  Expected: the Playwright suite passes with no horizontal overflow or card layout failures.

- [ ] **Step 3: Inspect the final diff**

  Run `git diff --check` and `git diff -- assets/css/style.css`.
  Expected: no whitespace errors and only the intended typography rules changed.
