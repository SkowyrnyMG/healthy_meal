import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Login Page
 * Encapsulates login page elements and interactions
 */
export class LoginPage {
  readonly page: Page;

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Define locators using accessible selectors
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByLabel(/password|hasło/i);
    this.loginButton = page.getByRole('button', { name: /log in|zaloguj/i });
    this.errorMessage = page.getByRole('alert').or(
      page.locator('[role="alert"]')
    );
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password|zapomniałeś hasła/i });
    this.registerLink = page.getByRole('link', { name: /sign up|zarejestruj/i });
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Fill in the login form
   * @param email - User email
   * @param password - User password
   */
  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the login form
   */
  async submit() {
    await this.loginButton.click();
  }

  /**
   * Perform complete login action
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password);
    await this.submit();
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the error message text
   */
  async getErrorMessageText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click register link
   */
  async clickRegister() {
    await this.registerLink.click();
  }
}
