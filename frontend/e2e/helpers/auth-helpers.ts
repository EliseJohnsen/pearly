import { Page } from '@playwright/test';

/**
 * AuthHelpers - Utilities for admin authentication in E2E tests
 *
 * This class provides methods to:
 * - Login as admin user
 * - Logout
 * - Set authentication cookie directly
 */
export class AuthHelpers {
  private page: Page;
  private apiUrl: string;

  constructor(page: Page, apiUrl: string) {
    this.page = page;
    this.apiUrl = apiUrl;
  }

  /**
   * Login as admin using API key
   * Sets the session_token cookie for authenticated requests
   */
  async loginAsAdmin(apiKey: string): Promise<void> {
    console.log('🔐 Logging in as admin...');

    try {
      const response = await this.page.request.post(`${this.apiUrl}/api/auth/login`, {
        data: {
          api_key: apiKey,
        },
      });

      if (!response.ok()) {
        throw new Error(`Login failed with status ${response.status()}`);
      }

      const data = await response.json();
      const token = data.access_token;

      // Set the session_token cookie
      await this.page.context().addCookies([
        {
          name: 'session_token',
          value: token,
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ]);

      console.log(`✅ Logged in as admin: ${data.admin_name} (${data.admin_email})`);
    } catch (error) {
      console.error('❌ Failed to login as admin:', error);
      throw error;
    }
  }

  /**
   * Logout by clearing the session cookie
   */
  async logout(): Promise<void> {
    console.log('🚪 Logging out...');

    try {
      await this.page.request.post(`${this.apiUrl}/api/auth/logout`);

      // Clear the session_token cookie
      await this.page.context().clearCookies();

      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Failed to logout:', error);
      throw error;
    }
  }

  /**
   * Verify that the admin is authenticated
   */
  async verifyAuthenticated(): Promise<boolean> {
    try {
      const response = await this.page.request.get(`${this.apiUrl}/api/auth/me`);
      return response.ok();
    } catch (error) {
      return false;
    }
  }

  /**
   * Set authentication token directly (for faster setup)
   * Use this if you already have a valid JWT token
   */
  async setAuthToken(token: string): Promise<void> {
    await this.page.context().addCookies([
      {
        name: 'session_token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  }
}
