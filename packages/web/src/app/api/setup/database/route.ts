import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { users, userEvents, userSessions, orders, orderItems, userProfiles, abandonedCartEmails } from '@/db/schema';

export const runtime = 'nodejs';

// 需要创建的表定义（与 schema.ts 一致）
const tables = [
  {
    name: 'users',
    sql: sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        shopify_customer_id VARCHAR(255),
        signup_source VARCHAR(50),
        gdpr_consent BOOLEAN DEFAULT false,
        data_consent_given_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_seen_at TIMESTAMP
      )
    `
  },
  {
    name: 'user_events',
    sql: sql`
      CREATE TABLE IF NOT EXISTS user_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        anonymous_id VARCHAR(255),
        user_id UUID REFERENCES users(id),
        event_name VARCHAR(100) NOT NULL,
        event_properties JSONB,
        page_url TEXT,
        page_title VARCHAR(500),
        referrer_url TEXT,
        utm_source VARCHAR(50),
        utm_medium VARCHAR(50),
        utm_campaign VARCHAR(50),
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        country_code VARCHAR(2),
        city VARCHAR(100),
        occurred_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
  },
  {
    name: 'user_sessions',
    sql: sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        anonymous_id VARCHAR(255),
        user_id UUID REFERENCES users(id),
        session_start TIMESTAMP DEFAULT NOW(),
        session_end TIMESTAMP,
        page_views INTEGER DEFAULT 0,
        duration_seconds INTEGER,
        entry_page TEXT,
        exit_page TEXT,
        traffic_source VARCHAR(50),
        added_to_cart BOOLEAN DEFAULT false,
        started_checkout BOOLEAN DEFAULT false,
        completed_purchase BOOLEAN DEFAULT false
      )
    `
  },
  {
    name: 'orders',
    sql: sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        shopify_order_id VARCHAR(255) UNIQUE,
        shopify_order_number VARCHAR(50),
        status VARCHAR(50),
        financial_status VARCHAR(50),
        fulfillment_status VARCHAR(50),
        subtotal_price DECIMAL(10,2),
        total_tax DECIMAL(10,2),
        total_shipping DECIMAL(10,2),
        total_price DECIMAL(10,2),
        currency VARCHAR(3),
        shipping_address JSONB,
        billing_address JSONB,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
  },
  {
    name: 'order_items',
    sql: sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id),
        shopify_product_id VARCHAR(255),
        shopify_variant_id VARCHAR(255),
        product_title VARCHAR(255),
        variant_title VARCHAR(255),
        sku VARCHAR(100),
        quantity INTEGER,
        price DECIMAL(10,2),
        total_discount DECIMAL(10,2)
      )
    `
  },
  {
    name: 'user_profiles',
    sql: sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) UNIQUE,
        country_code VARCHAR(2),
        timezone VARCHAR(50),
        language VARCHAR(10) DEFAULT 'zh-CN',
        currency VARCHAR(3) DEFAULT 'USD',
        preferred_price_range VARCHAR(20),
        product_category_preference JSONB,
        tags JSONB,
        total_orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT '0',
        avg_order_value DECIMAL(10,2),
        last_purchase_at TIMESTAMP,
        r_score INTEGER,
        f_score INTEGER,
        m_score INTEGER,
        segment VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
  },
  {
    name: 'abandoned_cart_emails',
    sql: sql`
      CREATE TABLE IF NOT EXISTS abandoned_cart_emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) UNIQUE,
        user_id UUID REFERENCES users(id),
        email VARCHAR(255),
        sent_at TIMESTAMP DEFAULT NOW(),
        clicked_at TIMESTAMP,
        recovered_at TIMESTAMP,
        discount_code VARCHAR(50),
        cart_items JSONB,
        cart_total DECIMAL(10,2)
      )
    `
  },
];

export async function POST(request: NextRequest) {
  try {
    // 验证请求（可选：添加 API Key 保护）
    const authHeader = request.headers.get('authorization');
    const setupSecret = process.env.SETUP_SECRET || 'setup-secret-123';

    if (authHeader !== `Bearer ${setupSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: Record<string, { success: boolean; error?: string }> = {};

    // 依次创建每个表
    for (const table of tables) {
      try {
        await db.execute(table.sql);
        results[table.name] = { success: true };
        console.log(`[Setup] Created table: ${table.name}`);
      } catch (error) {
        const errorMsg = (error as Error).message;
        // 如果表已存在，不算错误
        if (errorMsg.includes('already exists')) {
          results[table.name] = { success: true };
        } else {
          results[table.name] = { success: false, error: errorMsg };
        }
      }
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    const failedTables = Object.entries(results).filter(([_, r]) => !r.success);

    return NextResponse.json({
      success: failedTables.length === 0,
      message: `Created ${successCount}/${tables.length} tables`,
      results,
    });
  } catch (error) {
    console.error('[Setup] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup database',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// GET 端点用于检查表状态
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const setupSecret = process.env.SETUP_SECRET || 'setup-secret-123';

    if (authHeader !== `Bearer ${setupSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查表是否存在
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const existingTables: string[] = [];
    for (const row of result) {
      existingTables.push(row.table_name as string);
    }
    const expectedTables = tables.map(t => t.name);

    return NextResponse.json({
      success: true,
      existingTables,
      expectedTables,
      allCreated: expectedTables.every(t => existingTables.includes(t)),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check tables',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
