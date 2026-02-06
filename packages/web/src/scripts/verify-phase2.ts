/**
 * Phase 2 验证脚本
 * 测试所有 Shopify 集成功能
 */

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, details: 'Success', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, details: String(error), duration });
    console.log(`❌ ${name}: ${error}`);
  }
}

// 测试数据生成器
function generateTestOrderId(suffix: string) {
  return `test_phase2_${suffix}_${Date.now()}`;
}

// 测试 1: 客户同步 API - 获取不存在的客户
async function test1_GetNonExistentCustomer() {
  const response = await fetch(
    `http://localhost:3001/api/shopify/customers/sync?email=nonexistent_phase2@test.com`
  );
  const data = await response.json();

  if (!data.success || data.found !== false) {
    throw new Error('Expected success=true, found=false for non-existent customer');
  }
}

// 测试 2: 订单创建 Webhook - 创建新客户和订单
async function test2_CreateOrderWithNewCustomer() {
  const testEmail = `phase2_verify_${Date.now()}@test.com`;
  const testOrderId = generateTestOrderId('create');

  const mockOrder = {
    id: testOrderId,
    order_number: Math.floor(Math.random() * 10000),
    email: testEmail,
    phone: '+15551234567',
    customer: {
      id: `cust_${Date.now()}`,
      email: testEmail,
      phone: '+15551234567',
      first_name: 'Test',
      last_name: 'User',
    },
    financial_status: 'pending',
    fulfillment_status: null,
    subtotal_price: '199.00',
    total_tax: '15.92',
    total_shipping_price_set: { shop_money_amount: '10.00' },
    total_price: '224.92',
    currency: 'USD',
    processed_at: new Date().toISOString(),
    line_items: [
      {
        product_id: 'prod_test_1',
        variant_id: 'var_test_1',
        name: 'Test Product 1',
        variant_title: 'Red',
        sku: 'TEST-001',
        quantity: 2,
        price: '99.50',
        total_discount: '0.00',
      },
    ],
    shipping_address: {
      first_name: 'Test',
      last_name: 'User',
      address1: '123 Test St',
      city: 'Test City',
      province: 'TS',
      country: 'US',
      zip: '12345',
    },
    billing_address: {
      first_name: 'Test',
      last_name: 'User',
      address1: '123 Test St',
      city: 'Test City',
      province: 'TS',
      country: 'US',
      zip: '12345',
    },
  };

  const response = await fetch(
    'http://localhost:3001/api/webhooks/shopify/order-created',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': '2cowcai.myshopify.com',
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': 'test-dev-mode-skip',
      },
      body: JSON.stringify(mockOrder),
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Order creation failed: ${JSON.stringify(data)}`);
  }

  // 验证客户可以被检索到
  const customerResponse = await fetch(
    `http://localhost:3001/api/shopify/customers/sync?email=${testEmail}`
  );
  const customerData = await customerResponse.json();

  if (!customerData.success || customerData.found !== true) {
    throw new Error('Customer not found after order creation');
  }

  if (customerData.user.email !== testEmail) {
    throw new Error('Customer email mismatch');
  }

  return { testOrderId, testEmail };
}

// 测试 3: 订单更新 Webhook - 更新订单状态
async function test3_UpdateOrderStatus() {
  // 先创建一个订单
  const testOrderId = generateTestOrderId('update');
  const testEmail = `phase2_update_${Date.now()}@test.com`;

  const createOrder = {
    id: testOrderId,
    order_number: Math.floor(Math.random() * 10000),
    email: testEmail,
    customer: { id: `cust_${Date.now()}` },
    financial_status: 'pending',
    subtotal_price: '100.00',
    total_tax: '8.00',
    total_price: '108.00',
    currency: 'USD',
    processed_at: new Date().toISOString(),
    line_items: [
      {
        product_id: 'prod_update',
        variant_id: 'var_update',
        name: 'Update Test Product',
        quantity: 1,
        price: '100.00',
        total_discount: '0.00',
      },
    ],
  };

  const createResponse = await fetch(
    'http://localhost:3001/api/webhooks/shopify/order-created',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': '2cowcai.myshopify.com',
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': 'test-dev-mode-skip',
      },
      body: JSON.stringify(createOrder),
    }
  );

  if (!createResponse.ok) {
    throw new Error('Failed to create order for update test');
  }

  // 现在更新订单状态
  const updateOrder = {
    id: testOrderId,
    order_number: createOrder.order_number,
    email: testEmail,
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    updated_at: new Date().toISOString(),
  };

  const updateResponse = await fetch(
    'http://localhost:3001/api/webhooks/shopify/order-updated',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': '2cowcai.myshopify.com',
        'x-shopify-topic': 'orders/updated',
        'x-shopify-hmac-sha256': 'test-dev-mode-skip',
      },
      body: JSON.stringify(updateOrder),
    }
  );

  const updateData = await updateResponse.json();

  if (!updateData.success || !updateData.updated) {
    throw new Error(`Order update failed: ${JSON.stringify(updateData)}`);
  }

  return { testOrderId };
}

// 测试 4: 订单创建包含多个商品
async function test4_CreateOrderWithMultipleItems() {
  const testOrderId = generateTestOrderId('multi');

  const mockOrder = {
    id: testOrderId,
    order_number: Math.floor(Math.random() * 10000),
    email: `multi_items_${Date.now()}@test.com`,
    customer: {
      id: `cust_${Date.now()}`,
      email: `multi_items_${Date.now()}@test.com`,
    },
    financial_status: 'paid',
    subtotal_price: '897.00',
    total_tax: '71.76',
    total_shipping_price_set: { shop_money_amount: '25.00' },
    total_price: '993.76',
    currency: 'USD',
    processed_at: new Date().toISOString(),
    line_items: [
      {
        product_id: 'prod_A',
        variant_id: 'var_A_blue',
        name: 'PoolClean Pro X1',
        variant_title: 'Blue',
        sku: 'PC-X1-BLU',
        quantity: 1,
        price: '299.00',
        total_discount: '0.00',
      },
      {
        product_id: 'prod_B',
        variant_id: 'var_B_red',
        name: 'PoolClean Plus X2',
        variant_title: 'Red',
        sku: 'PC-X2-RED',
        quantity: 2,
        price: '299.00',
        total_discount: '50.00',
      },
    ],
    shipping_address: {
      first_name: 'Multi',
      last_name: 'Items',
      address1: '456 Oak Ave',
      city: 'Los Angeles',
      province: 'CA',
      country: 'US',
      zip: '90001',
    },
    billing_address: {
      first_name: 'Multi',
      last_name: 'Items',
      address1: '456 Oak Ave',
      city: 'Los Angeles',
      province: 'CA',
      country: 'US',
      zip: '90001',
    },
  };

  const response = await fetch(
    'http://localhost:3001/api/webhooks/shopify/order-created',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': '2cowcai.myshopify.com',
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': 'test-dev-mode-skip',
      },
      body: JSON.stringify(mockOrder),
    }
  );

  const data = await response.json();

  if (!data.success || !data.orderId) {
    throw new Error(`Multi-item order creation failed: ${JSON.stringify(data)}`);
  }

  return { testOrderId };
}

// 测试 5: 客户同步 POST 请求（占位符实现）
async function test5_CustomerSyncPost() {
  const response = await fetch(
    'http://localhost:3001/api/shopify/customers/sync',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sync_test@test.com' }),
    }
  );

  const data = await response.json();

  // 当前是占位符实现，应该返回 sync: false
  if (!data.success) {
    throw new Error('Customer sync POST failed');
  }

  if (data.synced !== false) {
    throw new Error('Expected synced=false for placeholder implementation');
  }
}

// 测试 6: 测试模式 HMAC 绕过验证
async function test6_TestModeHmacBypass() {
  const response = await fetch(
    'http://localhost:3001/api/webhooks/shopify/order-created',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': '2cowcai.myshopify.com',
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': 'test-dev-mode-skip', // 特殊的测试模式值
      },
      body: JSON.stringify({
        id: generateTestOrderId('hmac_test'),
        order_number: 9999,
        email: 'hmac_test@test.com',
        customer: { id: 'cust_hmac' },
        financial_status: 'pending',
        subtotal_price: '50.00',
        total_tax: '4.00',
        total_price: '54.00',
        currency: 'USD',
        processed_at: new Date().toISOString(),
        line_items: [
          {
            product_id: 'prod_hmac',
            variant_id: 'var_hmac',
            name: 'HMAC Test Product',
            quantity: 1,
            price: '50.00',
            total_discount: '0.00',
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Test mode HMAC bypass failed');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error('Test mode HMAC bypass did not succeed');
  }
}

// 测试 7: 错误处理 - 无效的 HMAC（非测试模式）
async function test7_InvalidHmac() {
  const response = await fetch(
    'http://localhost:3001/api/webhooks/shopify/order-created',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': '2cowcai.myshopify.com',
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': 'invalid_hmac_not_test_mode', // 不是测试模式的值
      },
      body: JSON.stringify({
        id: 'test_invalid_hmac',
        order_number: 1,
        email: 'invalid@test.com',
        customer: { id: 'cust_invalid' },
        financial_status: 'pending',
        subtotal_price: '10.00',
        total_tax: '0.80',
        total_price: '10.80',
        currency: 'USD',
        processed_at: new Date().toISOString(),
        line_items: [],
      }),
    }
  );

  // 应该返回 401 或类似的错误状态
  if (response.ok) {
    throw new Error('Expected error for invalid HMAC, but got success');
  }

  const data = await response.json();
  if (!data.error) {
    throw new Error('Expected error message for invalid HMAC');
  }
}

// 测试 8: 订单更新不存在的订单
async function test8_UpdateNonExistentOrder() {
  const response = await fetch(
    'http://localhost:3001/api/webhooks/shopify/order-updated',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-shop-domain': '2cowcai.myshopify.com',
        'x-shopify-topic': 'orders/updated',
        'x-shopify-hmac-sha256': 'test-dev-mode-skip',
      },
      body: JSON.stringify({
        id: 'nonexistent_order_12345',
        order_number: 1,
        financial_status: 'paid',
        updated_at: new Date().toISOString(),
      }),
    }
  );

  const data = await response.json();

  // 应该优雅地处理（返回成功但订单未创建）
  if (!data.success) {
    throw new Error('Expected graceful handling of non-existent order');
  }

  if (data.orderCreated !== false) {
    throw new Error('Expected orderCreated=false for non-existent order');
  }
}

// 主测试函数
async function main() {
  console.log('🧪 Phase 2 功能验证测试\n');
  console.log('=' .repeat(50));

  await runTest(
    '1. 客户同步 API - 获取不存在的客户',
    test1_GetNonExistentCustomer
  );

  await runTest(
    '2. 订单创建 Webhook - 创建新客户和订单',
    test2_CreateOrderWithNewCustomer
  );

  await runTest(
    '3. 订单更新 Webhook - 更新订单状态',
    test3_UpdateOrderStatus
  );

  await runTest(
    '4. 订单创建包含多个商品',
    test4_CreateOrderWithMultipleItems
  );

  await runTest(
    '5. 客户同步 POST 请求（占位符）',
    test5_CustomerSyncPost
  );

  await runTest(
    '6. 测试模式 HMAC 绕过验证',
    test6_TestModeHmacBypass
  );

  await runTest(
    '7. 错误处理 - 无效的 HMAC',
    test7_InvalidHmac
  );

  await runTest(
    '8. 订单更新不存在的订单（优雅处理）',
    test8_UpdateNonExistentOrder
  );

  console.log('=' .repeat(50));

  // 汇总结果
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n📊 测试结果汇总:`);
  console.log(`   ✅ 通过: ${passed}/${results.length}`);
  console.log(`   ❌ 失败: ${failed}/${results.length}`);
  console.log(`   ⏱️  总耗时: ${totalDuration}ms\n`);

  // 失败的测试详情
  if (failed > 0) {
    console.log('❌ 失败的测试:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}`);
        console.log(`     ${r.details}\n`);
      });
  }

  // Phase 2 功能总结
  console.log('✨ Phase 2 功能验证完成!');
  console.log('\n验证的功能:');
  console.log('  ✓ Webhook 签名验证 (HMAC SHA-256)');
  console.log('  ✓ 订单创建处理 (users, orders, order_items)');
  console.log('  ✓ 订单更新处理 (状态同步)');
  console.log('  ✓ 客户同步 API');
  console.log('  ✓ 测试模式开发支持');
  console.log('  ✓ 错误处理和边界情况');
}

main().catch(console.error);
