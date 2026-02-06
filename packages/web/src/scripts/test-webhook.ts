async function testOrderCreatedWebhook() {
  const mockOrder = {
    id: '123456789',
    order_number: 1001,
    email: 'shopify.test@example.com',
    phone: '+1234567890',
    customer: {
      id: 'cust_123',
      email: 'shopify.test@example.com',
      phone: '+1234567890',
      first_name: 'Jane',
      last_name: 'Smith',
    },
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    subtotal_price: '299.00',
    total_tax: '23.92',
    total_shipping_price_set: { shop_money_amount: '15.00' },
    total_price: '337.92',
    currency: 'USD',
    processed_at: new Date().toISOString(),
    line_items: [
      {
        product_id: 'prod_poolclean_x1',
        variant_id: 'var_poolclean_x1_blue',
        name: 'PoolClean Pro X1',
        variant_title: 'Blue',
        sku: 'PC-X1-BLU',
        quantity: 1,
        price: '299.00',
        total_discount: '0.00',
      },
    ],
    shipping_address: {
      first_name: 'Jane',
      last_name: 'Smith',
      address1: '456 Oak Avenue',
      city: 'Los Angeles',
      province: 'CA',
      country: 'US',
      zip: '90001',
    },
    billing_address: {
      first_name: 'Jane',
      last_name: 'Smith',
      address1: '456 Oak Avenue',
      city: 'Los Angeles',
      province: 'CA',
      country: 'US',
      zip: '90001',
    },
  };

  console.log('Sending test order to webhook...');

  const response = await fetch('http://localhost:3001/api/webhooks/shopify/order-created', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-shop-domain': '2cowcai.myshopify.com',
      'x-shopify-topic': 'orders/create',
      'x-shopify-hmac-sha256': 'test-dev-mode-skip', // 测试模式跳过验证
    },
    body: JSON.stringify(mockOrder),
  });

  console.log('Status:', response.status);
  const result = await response.json();
  console.log('Response:', result);
}

testOrderCreatedWebhook().catch(console.error);
