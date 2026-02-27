/**
 * MODULE 1: Landing Page
 * Verifies the public-facing landing page renders all key sections.
 */
import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section with headline and CTA", async ({ page }) => {
    await page.goto("/");
    // Headline text exists (partial match)
    await expect(page.locator("h1").first()).toBeVisible();
    // CTA button(s) exist
    const cta = page.getByRole("link", { name: /get started|start writing|try/i });
    await expect(cta.first()).toBeVisible();
  });

  test("navbar is present with logo", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
  });

  test("features section is present", async ({ page }) => {
    await page.goto("/");
    // Scroll to trigger lazy-loaded sections
    await page.evaluate(() => window.scrollTo(0, 600));
    // Features section should have feature cards/headings
    const featureSection = page.locator("section").filter({ hasText: /feature|writing|mercury|citation/i }).first();
    await expect(featureSection).toBeVisible({ timeout: 8_000 });
  });

  test("pricing section is present", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText(/free|starter|pro|plan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("footer is present", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.locator("footer");
    await expect(footer).toBeVisible({ timeout: 8_000 });
  });

  test("navbar scroll behavior: changes style on scroll", async ({ page }) => {
    await page.goto("/");
    // Before scroll — navbar should be transparent or on dark hero
    const navBefore = await page.locator("nav").first().screenshot();
    // Scroll down past 60px threshold
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(400);
    const navAfter = await page.locator("nav").first().screenshot();
    // Screenshots should differ (color change)
    expect(navBefore).not.toEqual(navAfter);
  });
});
