import { db } from '@/db';
import { users, userEvents, userSessions, orders, orderItems, userProfiles, abandonedCartEmails } from '@/db/schema';

async function verifyDatabase() {
  console.log('🔍 验证数据库连接...\n');

  try {
    // 测试查询 - 检查表是否存在
    const tables = [
      { name: 'users', schema: users },
      { name: 'user_events', schema: userEvents },
      { name: 'user_sessions', schema: userSessions },
      { name: 'orders', schema: orders },
      { name: 'order_items', schema: orderItems },
      { name: 'user_profiles', schema: userProfiles },
      { name: 'abandoned_cart_emails', schema: abandonedCartEmails },
    ];

    for (const table of tables) {
      try {
        // 尝试查询表（限制 0 条记录，只检查表是否存在）
        await db.select().from(table.schema).limit(0);
        console.log(`✅ ${table.name} 表存在`);
      } catch (error) {
        console.log(`❌ ${table.name} 表不存在`);
        console.log(`   错误: ${(error as Error).message}`);
      }
    }

    console.log('\n✅ 数据库连接正常！');
  } catch (error) {
    console.error('\n❌ 数据库连接失败:');
    console.error((error as Error).message);
    process.exit(1);
  }
}

verifyDatabase();
