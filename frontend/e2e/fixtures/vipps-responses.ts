/**
 * Mock Vipps API responses for E2E tests
 */

/**
 * Shipping details for different test scenarios
 */
export const testShippingDetails = {
  standard: {
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
  },

  withPickupPoint: {
    firstName: 'Test',
    lastName: 'Testesen',
    email: 'test@example.com',
    streetAddress: 'Testveien 456',
    postalCode: '0456',
    city: 'Bergen',
    country: 'NO',
    phoneNumber: '+4787654321',
    shippingMethodId: 'posten-hentested',
    amount: { value: 19900, currency: 'NOK' },
    pickupPoint: {
      id: 'pickup-123',
      name: 'Narvesen Testveien',
      address: 'Testveien 789',
      postalCode: '0789',
      city: 'Bergen',
    },
  },

  international: {
    firstName: 'Test',
    lastName: 'Tester',
    email: 'test@international.com',
    streetAddress: 'Test Street 123',
    postalCode: '12345',
    city: 'Stockholm',
    country: 'SE',
    phoneNumber: '+46701234567',
    shippingMethodId: 'international-standard',
    amount: { value: 29900, currency: 'NOK' },
  },
};

/**
 * Vipps session states
 */
export const vippsSessionStates = {
  paymentSuccessful: 'PaymentSuccessful' as const,
  paymentTerminated: 'PaymentTerminated' as const,
  sessionExpired: 'SessionExpired' as const,
};

/**
 * Mock checkout creation response
 */
export function createCheckoutResponse(orderNumber: string, orderId = 12345) {
  return {
    order_id: orderId,
    order_number: orderNumber,
    checkout_url: `http://localhost:3000/e2e-mock-vipps?reference=${orderNumber}`,
    reference: orderNumber,
  };
}

/**
 * Mock order status response
 */
export function createOrderStatusResponse(
  orderNumber: string,
  status: 'pending_payment' | 'paid' | 'cancelled' | 'expired',
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'failed',
  orderId = 12345
) {
  return {
    order_id: orderId,
    order_number: orderNumber,
    status,
    payment_status: paymentStatus,
    total_amount: 50000,
    currency: 'NOK',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Mock webhook payload
 */
export function createWebhookPayload(
  reference: string,
  sessionState: 'PaymentSuccessful' | 'PaymentTerminated' | 'SessionExpired',
  shippingDetails = testShippingDetails.standard
) {
  return {
    reference,
    sessionState,
    shippingDetails,
  };
}
