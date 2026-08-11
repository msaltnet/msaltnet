# Uniform Project Card Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all six sidebar project cards exactly the same height at desktop and mobile breakpoints.

**Architecture:** Keep the existing project card markup and data flow unchanged. Add browser-level layout assertions, then replace the two responsive `min-height` declarations with fixed `height` declarations so card content cannot change the rendered box size.

**Tech Stack:** Jekyll 3, CSS Grid, Playwright, Python unittest, Docker

---

### Task 1: Add Equal-Height Browser Coverage

**Files:**
- Modify: `tests/site.spec.mjs:3-40`

- [ ] **Step 1: Add a reusable equal-height assertion**

Add this helper below the imports:

```js
async function expectProjectCardsToHaveOneHeight(page, expectedHeight) {
  const heights = await page.locator('.project-card').evaluateAll((cards) =>
    cards.map((card) => card.getBoundingClientRect().height),
  );

  expect(new Set(heights).size).toBe(1);
  expect(heights[0]).toBe(expectedHeight);
}
```

Call it in the desktop home test after the card count assertion:

```js
await expectProjectCardsToHaveOneHeight(page, 78);
```

Call it in the mobile home test after `page.goto('/')`:

```js
await expectProjectCardsToHaveOneHeight(page, 88);
```

- [ ] **Step 2: Run the focused browser tests and verify they fail**

Run:

```bash
npx playwright test tests/site.spec.mjs --grep "desktop home|mobile keeps" --reporter=line
```

Expected: FAIL because the current `min-height` rules allow at least one card to exceed the expected desktop or mobile height.

### Task 2: Fix Card Heights and Verify the Site

**Files:**
- Modify: `assets/css/style.css:300-310`
- Modify: `assets/css/style.css:532-535`

- [ ] **Step 1: Apply fixed responsive heights**

In the base `.project-card` rule, replace:

```css
min-height: 78px;
```

with:

```css
height: 78px;
```

In the mobile `.project-card` rule, replace:

```css
min-height: 88px;
```

with:

```css
height: 88px;
```

- [ ] **Step 2: Rebuild the Jekyll output**

Run:

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
  -v "$PWD:/srv/jekyll" \
  -w /srv/jekyll \
  ruby:3.2 bundle exec jekyll build
```

Expected: exit code 0 and `done` in the Jekyll output.

- [ ] **Step 3: Run the focused browser tests**

Run:

```bash
npx playwright test tests/site.spec.mjs --grep "desktop home|mobile keeps" --reporter=line
```

Expected: 2 passed.

- [ ] **Step 4: Run the complete verification suite**

Run:

```bash
npm test
npx playwright test --reporter=line
git diff --check
```

Expected: 12 Python tests pass, 5 Playwright tests pass, and `git diff --check` produces no output.

- [ ] **Step 5: Review generated screenshots**

Inspect `test-results/home-desktop.png` and `test-results/home-mobile.png`. Confirm all project cards align to a single height, images fill the card height, truncated text remains readable, and no content overlaps.

- [ ] **Step 6: Commit the implementation**

```bash
git add assets/css/style.css tests/site.spec.mjs
git commit -m "fix: unify sidebar project card heights"
```
