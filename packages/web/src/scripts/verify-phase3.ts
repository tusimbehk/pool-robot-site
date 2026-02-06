// packages/web/src/scripts/verify-phase3.ts

/**
 * Phase 3 验证脚本 - 测试管理员后台功能
 */

async function testAdminLogin() {
  console.log('Testing admin login...');
  const response = await fetch('http://localhost:3001/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'admin123' }),
  });

  const data = await response.json();
  if (!data.success || !data.token) {
    throw new Error('Login failed');
  }

  return data.token;
}

async function testUserActivityAPI(token: string) {
  console.log('Testing user activity API...');
  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/user-activity?days=7',
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('User activity API failed');
  }

  const data = await response.json();
  console.log('  User activity data points:', data.data?.length || 0);
}

async function testOrderFunnelAPI(token: string) {
  console.log('Testing order funnel API...');
  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/order-funnel',
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Order funnel API failed');
  }

  const data = await response.json();
  console.log('  Funnel stages:', data.data?.length || 0);
}

async function testProductSalesAPI(token: string) {
  console.log('Testing product sales API...');
  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/product-sales?limit=5',
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Product sales API failed');
  }

  const data = await response.json();
  console.log('  Products:', data.data?.length || 0);
}

async function testUnauthorizedAccess() {
  console.log('Testing unauthorized access...');

  const response = await fetch(
    'http://localhost:3001/api/admin/analytics/user-activity'
  );

  if (response.status !== 401) {
    throw new Error('Expected 401 for unauthorized access');
  }

  console.log('  ✓ Unauthorized access correctly blocked');
}

async function main() {
  console.log('🧪 Phase 3 验证测试\n');

  try {
    // Test login
    const token = await testAdminLogin();
    console.log('  ✓ Login successful\n');

    // Test APIs
    await testUserActivityAPI(token);
    await testOrderFunnelAPI(token);
    await testProductSalesAPI(token);

    // Test auth
    await testUnauthorizedAccess();

    console.log('\n✅ 所有测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
