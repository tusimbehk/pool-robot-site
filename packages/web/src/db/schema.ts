import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, boolean, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 50 }),
  shopifyCustomerId: varchar('shopify_customer_id', { length: 255 }),
  signupSource: varchar('signup_source', { length: 50 }),
  gdprConsent: boolean('gdpr_consent').default(false),
  dataConsentGivenAt: timestamp('data_consent_given_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSeenAt: timestamp('last_seen_at'),
});

export const userEvents = pgTable('user_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  anonymousId: varchar('anonymous_id', { length: 255 }),
  userId: uuid('user_id').references(() => users.id),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  eventProperties: jsonb('event_properties'),
  pageUrl: text('page_url'),
  pageTitle: varchar('page_title', { length: 500 }),
  referrerUrl: text('referrer_url'),
  utmSource: varchar('utm_source', { length: 50 }),
  utmMedium: varchar('utm_medium', { length: 50 }),
  utmCampaign: varchar('utm_campaign', { length: 50 }),
  deviceType: varchar('device_type', { length: 20 }),
  browser: varchar('browser', { length: 50 }),
  os: varchar('os', { length: 50 }),
  countryCode: varchar('country_code', { length: 2 }),
  city: varchar('city', { length: 100 }),
  occurredAt: timestamp('occurred_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  anonymousId: varchar('anonymous_id', { length: 255 }),
  userId: uuid('user_id').references(() => users.id),
  sessionStart: timestamp('session_start').defaultNow(),
  sessionEnd: timestamp('session_end'),
  pageViews: integer('page_views').default(0),
  durationSeconds: integer('duration_seconds'),
  entryPage: text('entry_page'),
  exitPage: text('exit_page'),
  trafficSource: varchar('traffic_source', { length: 50 }),
  addedToCart: boolean('added_to_cart').default(false),
  startedCheckout: boolean('started_checkout').default(false),
  completedPurchase: boolean('completed_purchase').default(false),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  shopifyOrderId: varchar('shopify_order_id', { length: 255 }).unique(),
  shopifyOrderNumber: varchar('shopify_order_number', { length: 50 }),
  status: varchar('status', { length: 50 }),
  financialStatus: varchar('financial_status', { length: 50 }),
  fulfillmentStatus: varchar('fulfillment_status', { length: 50 }),
  subtotalPrice: decimal('subtotal_price', { precision: 10, scale: 2 }),
  totalTax: decimal('total_tax', { precision: 10, scale: 2 }),
  totalShipping: decimal('total_shipping', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id),
  shopifyProductId: varchar('shopify_product_id', { length: 255 }),
  shopifyVariantId: varchar('shopify_variant_id', { length: 255 }),
  productTitle: varchar('product_title', { length: 255 }),
  variantTitle: varchar('variant_title', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity'),
  price: decimal('price', { precision: 10, scale: 2 }),
  totalDiscount: decimal('total_discount', { precision: 10, scale: 2 }),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).unique(),
  countryCode: varchar('country_code', { length: 2 }),
  timezone: varchar('timezone', { length: 50 }),
  language: varchar('language', { length: 10 }).default('zh-CN'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  preferredPriceRange: varchar('preferred_price_range', { length: 20 }),
  productCategoryPreference: jsonb('product_category_preference'), // string[]
  tags: jsonb('tags'), // string[]
  totalOrders: integer('total_orders').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
  avgOrderValue: decimal('avg_order_value', { precision: 10, scale: 2 }),
  lastPurchaseAt: timestamp('last_purchase_at'),
  rScore: integer('r_score'), // Recency score 1-5
  fScore: integer('f_score'), // Frequency score 1-5
  mScore: integer('m_score'), // Monetary score 1-5
  segment: varchar('segment', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const abandonedCartEmails = pgTable('abandoned_cart_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).unique(),
  userId: uuid('user_id').references(() => users.id),
  email: varchar('email', { length: 255 }),
  sentAt: timestamp('sent_at').defaultNow(),
  clickedAt: timestamp('clicked_at'),
  recoveredAt: timestamp('recovered_at'),
  discountCode: varchar('discount_code', { length: 50 }),
  cartItems: jsonb('cart_items'), // Store cart snapshot
  cartTotal: decimal('cart_total', { precision: 10, scale: 2 }),
});
