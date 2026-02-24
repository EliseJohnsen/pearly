/**
 * WebhookSimulator - Simulates Vipps webhook callbacks to backend
 *
 * This class sends HTTP POST requests to the backend webhook endpoint,
 * simulating the callbacks that Vipps would send in a real scenario.
 */
export class WebhookSimulator {
  constructor(
    private apiUrl: string,
    private secretKey: string
  ) {}

  /**
   * Send a Vipps webhook to the backend
   *
   * @param reference - Order reference (order_number)
   * @param sessionState - Vipps session state
   * @param shippingDetails - Optional custom shipping details
   */
  async sendWebhook(
    reference: string,
    sessionState: 'PaymentSuccessful' | 'PaymentTerminated' | 'SessionExpired',
    shippingDetails?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      streetAddress?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      phoneNumber?: string;
      shippingMethodId?: string;
      amount?: { value: number; currency?: string };
      pickupPoint?: {
        id: string;
        name: string;
        address: string;
        postalCode: string;
        city: string;
      };
    }
  ): Promise<Response> {
    // Default shipping details if not provided
    const defaultShippingDetails = {
      firstName: 'Test',
      lastName: 'Testesen',
      email: 'test@example.com',
      streetAddress: 'Testveien 123',
      postalCode: '0123',
      city: 'Oslo',
      country: 'NO',
      phoneNumber: '+4712345678',
      shippingMethodId: 'posten-servicepakke',
      amount: { value: 9900, currency: 'NOK' },
    };

    const payload = {
      reference,
      sessionState,
      shippingDetails: shippingDetails || defaultShippingDetails,
    };

    console.log(`📤 Sending ${sessionState} webhook for ${reference}`);

    try {
      const response = await fetch(`${this.apiUrl}/api/webhooks/vipps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.secretKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`✅ Webhook sent successfully (${response.status})`);
      } else {
        console.error(`❌ Webhook failed (${response.status})`);
        const text = await response.text();
        console.error('Response:', text);
      }

      return response;
    } catch (error) {
      console.error('❌ Webhook request failed:', error);
      throw error;
    }
  }

  /**
   * Send a successful payment webhook
   */
  async sendPaymentSuccessful(reference: string, shippingDetails?: any): Promise<Response> {
    return this.sendWebhook(reference, 'PaymentSuccessful', shippingDetails);
  }

  /**
   * Send a payment terminated (cancelled) webhook
   */
  async sendPaymentTerminated(reference: string): Promise<Response> {
    return this.sendWebhook(reference, 'PaymentTerminated');
  }

  /**
   * Send a session expired webhook
   */
  async sendSessionExpired(reference: string): Promise<Response> {
    return this.sendWebhook(reference, 'SessionExpired');
  }

  /**
   * Wait for a specified amount of time
   * Useful for waiting after sending webhook before polling
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Send webhook and wait for backend to process
   * Recommended delay: 500-1000ms
   */
  async sendWebhookAndWait(
    reference: string,
    sessionState: 'PaymentSuccessful' | 'PaymentTerminated' | 'SessionExpired',
    shippingDetails?: any,
    delayMs = 1000
  ): Promise<Response> {
    const response = await this.sendWebhook(reference, sessionState, shippingDetails);
    await this.wait(delayMs);
    return response;
  }
}
