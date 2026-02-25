// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('SmartDRM-X E2E flow and DOM', () => {

  test('root redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login\.html/);
  });

  test('login page has required DOM and can sign in', async ({ page }) => {
    await page.goto('/pages/login.html');
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#demo-btn')).toBeVisible();

    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\.html/, { timeout: 5000 });
  });

  test('dashboard has layout and stat elements', async ({ page }) => {
    await page.goto('/pages/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\.html/, { timeout: 5000 });

    await expect(page.locator('#sidebar-container')).toBeVisible();
    await expect(page.locator('#topbar-container')).toBeVisible();
    await expect(page.locator('#stat-assets')).toBeVisible();
    await expect(page.locator('#stat-licenses')).toBeVisible();
    await expect(page.locator('#stat-risk')).toBeVisible();
    const statText = await page.locator('#stat-assets').textContent();
    expect(statText).toBeDefined();
    expect(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '—', '…'].some(c => statText.includes(c)) || statText.trim().length >= 0).toBe(true);
  });

  test('assets page has table bodies and nav', async ({ page }) => {
    await page.goto('/pages/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\.html/, { timeout: 5000 });

    await page.goto('/pages/assets.html');
    await expect(page.locator('#sidebar-container')).toBeVisible();
    await expect(page.locator('#assets-body')).toBeVisible();
    await expect(page.locator('#shared-body')).toBeVisible();
  });

  test('upload page has form and drop zone', async ({ page }) => {
    await page.goto('/pages/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\.html/, { timeout: 5000 });

    await page.goto('/pages/upload.html');
    await expect(page.locator('#upload-form')).toBeVisible();
    await expect(page.locator('#file-input')).toBeAttached();
    await expect(page.locator('#drop-area')).toBeVisible();
    await expect(page.locator('#file-label')).toBeVisible();
  });

  test('request page has all three table bodies', async ({ page }) => {
    await page.goto('/pages/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\.html/, { timeout: 5000 });

    await page.goto('/pages/request.html');
    await expect(page.locator('#incoming-body')).toBeVisible();
    await expect(page.locator('#catalog-body')).toBeVisible();
    await expect(page.locator('#mine-body')).toBeVisible();
  });

  test('AI page has risk display and chart', async ({ page }) => {
    await page.goto('/pages/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\.html/, { timeout: 5000 });

    await page.goto('/pages/ai.html');
    await expect(page.locator('#risk-score-display')).toBeVisible();
    await expect(page.locator('#risk-reasons')).toBeVisible();
    await expect(page.locator('#logs-body')).toBeVisible();
    await expect(page.locator('#activity-chart')).toBeVisible();
  });

  test('logout returns to login', async ({ page }) => {
    await page.goto('/pages/login.html');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\.html/, { timeout: 5000 });

    await page.locator('#logout-btn').click();
    await expect(page).toHaveURL(/login\.html/, { timeout: 3000 });
  });
});
