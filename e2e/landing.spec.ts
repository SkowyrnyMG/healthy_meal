import { test, expect } from "@playwright/test";
import { LandingPage } from "./pages/landing.page";

test.describe("Landing Page", () => {
  let landingPage: LandingPage;

  // Setup: Create page object before each test
  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
  });

  test("should load successfully", async () => {
    // Assert
    const isLoaded = await landingPage.isLoaded();
    expect(isLoaded).toBe(true);
  });

  test("should display main heading", async () => {
    // Act
    const headingText = await landingPage.getHeadingText();

    // Assert
    expect(headingText).toBeTruthy();
    expect(headingText.length).toBeGreaterThan(0);
  });

  test("should have navigation buttons", async () => {
    // Assert - Check if buttons are visible
    await expect(landingPage.getStartedButton.or(landingPage.loginButton)).toBeVisible();
  });

  test("should navigate to login page when login button clicked", async ({ page }) => {
    // Arrange - Check if login button exists
    const loginVisible = await landingPage.loginButton.isVisible().catch(() => false);

    if (!loginVisible) {
      test.skip();
    }

    // Act
    await landingPage.clickLogin();

    // Assert
    await expect(page).toHaveURL(/\/login/);
  });

  test("should navigate to register page when register button clicked", async ({ page }) => {
    // Arrange - Check if register button exists
    const registerVisible = await landingPage.registerButton.isVisible().catch(() => false);

    if (!registerVisible) {
      test.skip();
    }

    // Act
    await landingPage.clickRegister();

    // Assert
    await expect(page).toHaveURL(/\/register/);
  });

  test("should have proper page title", async ({ page }) => {
    // Assert
    await expect(page).toHaveTitle(/HealthyMeal|Healthy Meal/i);
  });

  test("should take screenshot of landing page", async ({ page }) => {
    // Visual regression test
    await expect(page).toHaveScreenshot("landing-page.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe("Landing Page - Responsive Design", () => {
  test("should display correctly on mobile viewport", async ({ page }) => {
    // Arrange - Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const landingPage = new LandingPage(page);

    // Act
    await landingPage.goto();

    // Assert
    const isLoaded = await landingPage.isLoaded();
    expect(isLoaded).toBe(true);

    await expect(page).toHaveScreenshot("landing-page-mobile.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("should display correctly on tablet viewport", async ({ page }) => {
    // Arrange - Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    const landingPage = new LandingPage(page);

    // Act
    await landingPage.goto();

    // Assert
    const isLoaded = await landingPage.isLoaded();
    expect(isLoaded).toBe(true);
  });
});
