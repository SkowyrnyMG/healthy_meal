import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for the Landing Page
 * Encapsulates landing page elements and interactions
 */
export class LandingPage {
  readonly page: Page;

  // Locators
  readonly heading: Locator;
  readonly getStartedButton: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly featuresSection: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators using resilient selectors
    this.heading = page.getByRole("heading", { level: 1 });
    this.getStartedButton = page.getByRole("link", { name: /get started|rozpocznij/i });
    this.loginButton = page.getByRole("link", { name: /log in|zaloguj/i });
    this.registerButton = page.getByRole("link", { name: /sign up|zarejestruj/i });
    this.featuresSection = page
      .locator('[data-testid="features-section"]')
      .or(page.getByRole("region", { name: /features|funkcje/i }));
  }

  /**
   * Navigate to the landing page
   */
  async goto() {
    await this.page.goto("/");
  }

  /**
   * Click the "Get Started" button
   */
  async clickGetStarted() {
    await this.getStartedButton.click();
  }

  /**
   * Click the "Log In" button
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * Click the "Sign Up" button
   */
  async clickRegister() {
    await this.registerButton.click();
  }

  /**
   * Check if the page is loaded by verifying heading is visible
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.heading.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the main heading text
   */
  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) || "";
  }

  /**
   * Check if features section is visible
   */
  async hasFeaturesSection(): Promise<boolean> {
    try {
      await this.featuresSection.waitFor({ state: "visible", timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}
