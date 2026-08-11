import { test, expect } from '@playwright/test';

async function expectProjectCardsToHaveOneHeight(page, expectedHeight) {
  const heights = await page.locator('.project-card').evaluateAll((cards) =>
    cards.map((card) => card.getBoundingClientRect().height),
  );

  expect(new Set(heights).size).toBe(1);
  expect(heights[0]).toBe(expectedHeight);
}

test('desktop home uses an editorial sidebar and exposes the next section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '맛소금' })).toBeVisible();
  await expect(page.locator('.project-card')).toHaveCount(6);
  await expectProjectCardsToHaveOneHeight(page, 78);

  const sidebar = await page.locator('.home-sidebar').boundingBox();
  const main = await page.locator('.home-main').boundingBox();
  const articles = await page.locator('#article').boundingBox();
  expect(sidebar.x).toBeLessThan(main.x);
  expect(sidebar.width).toBeLessThan(main.width);
  expect(articles.y).toBeLessThan(900);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await page.locator('#article').scrollIntoViewIfNeeded();
  await expect(page.locator('#article')).toHaveClass(/is-visible/);
  await expect(page.locator('#article')).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
});

test('mobile keeps hero copy and places sidebar content after articles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expectProjectCardsToHaveOneHeight(page, 88);
  await expect(page.getByText('지구별에서 소프트웨어를 만들고,')).toBeVisible();
  await expect(page.getByText('때때로 생각을 적습니다.')).toBeVisible();

  const main = await page.locator('.home-main').boundingBox();
  const sidebar = await page.locator('.home-sidebar').boundingBox();
  expect(main.y).toBeLessThan(sidebar.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await page.locator('#article').scrollIntoViewIfNeeded();
  await expect(page.locator('#article')).toHaveClass(/is-visible/);
  await expect(page.locator('#article')).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
});

test('Korean webfonts load from local assets', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans KR"', '맛소금'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "Noto Serif KR"', '젊은 시인에게 주는 충고'))).toBe(true);
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
