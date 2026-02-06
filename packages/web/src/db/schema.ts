import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, boolean } from 'drizzle-orm/pg-core';

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
