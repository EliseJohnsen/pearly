import { Page, Route } from '@playwright/test';

/**
 * VippsMocker - Mocks Vipps API calls for E2E tests
 *
 * This class intercepts HTTP requests to the backend API and returns
 * mock responses, allowing us to test the payment flow without
 * hitting the real Vipps API.
 */
export class VippsMocker {
  constructor(private page: Page) {}

  /**
   * Mock the checkout creation endpoint
   * Intercepts POST /api/checkout and returns mock checkout URL
   */
  async mockCheckoutCreation(reference: string, success = true) {
    await this.page.route('**/api/checkout', async (route: Route) => {
      if (route.request().method() === 'POST') {
        if (success) {
          // Return successful checkout creation
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: Math.floor(Math.random() * 10000),
              order_number: reference,
              checkout_url: `http://localhost:3000/e2e-mock-vipps?reference=${reference}`,
              reference: reference,
            }),
          });
        } else {
          // Return error response
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              detail: 'Vipps checkout creation failed',
            }),
          });
        }
      } else {
        // Let other methods through
        await route.continue();
      }
    });
  }

  /**
   * Mock the order status polling endpoint
   * Intercepts GET /api/checkout/{reference}
   */
  async mockStatusPolling(
    reference: string,
    status: 'pending' | 'paid' | 'cancelled' | 'failed'
  ) {
    await this.page.route(`**/api/checkout/${reference}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        const orderStatus =
          status === 'paid'
            ? 'paid'
            : status === 'cancelled'
            ? 'cancelled'
            : status === 'failed'
            ? 'expired'
            : 'pending_payment';

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            order_id: Math.floor(Math.random() * 10000),
            order_number: reference,
            status: orderStatus,
            payment_status: status,
            total_amount: 50000,
            currency: 'NOK',
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });
  }

  /**
   * Mock Vipps redirect page
   * Creates a simple HTML page with approve/cancel buttons
   * that simulates the Vipps checkout interface
   */
  async mockVippsRedirectPage(reference: string) {
    await this.page.route('**/e2e-mock-vipps*', async (route: Route) => {
      const html = `
        <!DOCTYPE html>
        <html lang="no">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mock Vipps Checkout</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #ff5b24 0%, #ff8866 100%);
                color: white;
              }
              .container {
                background: white;
                color: #333;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                max-width: 400px;
                width: 90%;
              }
              h1 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
                color: #ff5b24;
              }
              .info {
                margin: 1rem 0;
                padding: 1rem;
                background: #f5f5f5;
                border-radius: 8px;
                font-size: 0.9rem;
              }
              .info strong {
                display: block;
                margin-bottom: 0.25rem;
              }
              .buttons {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-top: 1.5rem;
              }
              button {
                padding: 1rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.1s;
              }
              button:active {
                transform: scale(0.98);
              }
              #approve-payment {
                background: #ff5b24;
                color: white;
              }
              #approve-payment:hover {
                background: #ff4814;
                box-shadow: 0 4px 12px rgba(255, 91, 36, 0.4);
              }
              #cancel-payment {
                background: #e0e0e0;
                color: #333;
              }
              #cancel-payment:hover {
                background: #d0d0d0;
              }
              .badge {
                display: inline-block;
                background: #ff5b24;
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                margin-bottom: 1rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="badge">E2E TEST MODE</div>
              <h1>Mock Vipps Checkout</h1>
              <div class="info">
                <strong>Ordrenummer:</strong>
                <span id="reference">${reference}</span>
              </div>
              <div class="info">
                <strong>Beløp:</strong>
                <span>500,00 NOK</span>
              </div>
              <div class="buttons">
                <button id="approve-payment">✓ Godkjenn betaling</button>
                <button id="cancel-payment">✕ Avbryt</button>
              </div>
            </div>
            <script>
              document.getElementById('approve-payment').onclick = () => {
                window.location.href = '/betaling/resultat?reference=${reference}';
              };
              document.getElementById('cancel-payment').onclick = () => {
                window.location.href = '/betaling/resultat?reference=${reference}';
              };
            </script>
          </body>
        </html>
      `;

      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: html,
      });
    });
  }

  /**
   * Mock all Vipps-related endpoints at once
   * Convenience method to set up all mocks with default behavior
   */
  async mockAll(reference: string, finalStatus: 'paid' | 'cancelled' | 'failed' = 'paid') {
    // Mock checkout creation
    await this.mockCheckoutCreation(reference, true);

    // Mock Vipps redirect page
    await this.mockVippsRedirectPage(reference);

    // Mock status polling - initially pending
    await this.mockStatusPolling(reference, 'pending');
  }

  /**
   * Update the status polling mock
   * Call this after sending webhook to change the polling response
   */
  async updateStatusPolling(
    reference: string,
    status: 'pending' | 'paid' | 'cancelled' | 'failed'
  ) {
    // Remove existing route and add new one
    await this.page.unroute(`**/api/checkout/${reference}`);
    await this.mockStatusPolling(reference, status);
  }

  /**
   * Clear all mocks
   */
  async clearAllMocks() {
    await this.page.unrouteAll({ behavior: 'ignoreErrors' });
  }
}
