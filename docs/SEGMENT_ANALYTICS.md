# Segment Analytics Integration

## Configuration

Add your Segment Write Key to `.env.local`:

```env
NEXT_PUBLIC_SEGMENT_WRITE_KEY=your_segment_write_key_here
```

## Setup

1. Get your Write Key from Segment dashboard
2. Add it to environment variables
3. Analytics will auto-initialize on app load

## Features

### Automatic Page Tracking

Page views are automatically tracked when users navigate:

```ts
// Handled automatically by AnalyticsProvider
// No code needed in components
```

### Custom Event Tracking

```ts
import { useAnalytics } from "@/hooks/use-analytics";

function MyComponent() {
  const { track } = useAnalytics();

  const handleClick = () => {
    track("Button Clicked", { button_id: "submit" });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### E-commerce Events

```ts
const { trackProduct, trackAddToCart, trackCheckout } = useAnalytics();

// Product viewed
trackProduct({
  id: "prod-123",
  name: "PoolClean Pro",
  price: 1299,
  currency: "USD",
  category: "Robots"
});

// Added to cart
trackAddToCart({
  id: "prod-123",
  name: "PoolClean Pro",
  price: 1299,
  quantity: 1,
  currency: "USD"
});

// Checkout started
trackCheckout({
  cartId: "cart-123",
  total: 1299,
  currency: "USD",
  itemCount: 1
});
```

## Available Events

| Event | Description | Properties |
|-------|-------------|------------|
| Product Viewed | User viewed product | product_id, name, price, category |
| Product Added | Added to cart | product_id, name, price, quantity, revenue |
| Product Removed | Removed from cart | product_id, name, price, quantity |
| Checkout Started | Started checkout process | cart_id, revenue, item_count |
| Order Completed | Order successfully placed | order_id, revenue, products |
| Products Searched | Performed search | query, results_count |
| Product Shared | Shared product | product_id, share_platform |

## Destinations

Configure destinations in Segment dashboard:

- Google Analytics 4
- Meta Pixel (Facebook/Instagram)
- Google Ads
- Klaviyo
- Customer.io
- Any other Segment destination

## Development Mode

When `NODE_ENV=development` or no write key is configured:
- Events are logged to console
- No data sent to Segment
- Prefix: `[Segment]`

## Testing

Run tests:
```bash
pnpm test src/lib/analytics.test.ts
```

## Type Safety

All events are fully typed for better developer experience:

```ts
import type { SegmentEvent, SegmentPage } from "@/lib/analytics";

const event: SegmentEvent = {
  event: "Custom Event",
  properties: { customProp: "value" },
};
```
