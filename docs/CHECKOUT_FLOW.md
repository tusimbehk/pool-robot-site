# Checkout Flow Documentation

## Overview

The checkout flow integrates with Shopify for secure payment processing while maintaining a seamless user experience.

## Flow Diagram

```
Cart Page → Checkout Button → /checkout (redirect) → Shopify Checkout
                                                             ↓
                                                    Payment Processing
                                                             ↓
                                                    Order Confirmation
                                                             ↓
                                                    /thank-you?cart=xxx
                                                             ↓
                                                    Clear Cart
```

## Pages

### `/cart`
Shopping cart page with:
- Item list with quantities
- Order summary (subtotal, shipping, total)
- "Proceed to Checkout" button → `/checkout`

### `/checkout`
Redirect page that:
- Validates cart has items
- Redirects to Shopify checkout URL
- Falls back to `/thank-you` for mock flow

### `/thank-you`
Order confirmation page with:
- Order number and details
- Estimated delivery date
- What's next steps
- Continue shopping button

## Shopify Checkout Integration

### Production Flow

```ts
// Get checkout URL from Shopify cart
const checkoutUrl = cart.checkoutUrl;
window.location.href = checkoutUrl;
```

### Redirect After Checkout

Shopify can be configured to redirect back to your site:
1. In Shopify Admin: Settings > Checkout
2. Set "After checkout" redirect to `https://yoursite.com/thank-you`

The URL will include order parameters:
```
/thank-you?order_id=12345&token=abc123
```

## Cart State Management

The cart is cleared after successful order:
- Triggered when user lands on `/thank-you`
- Cart ID is reset
- Items are cleared from localStorage

## Error Handling

| Scenario | Handling |
|----------|----------|
| Empty cart at checkout | Redirect to `/products` |
| Shopify connection error | Show error, keep items in cart |
| Checkout abandoned | Cart persists for 24h |

## Testing

### Test the full flow:
1. Add items to cart
2. Go to `/cart`
3. Click "Proceed to Checkout"
4. Complete mock checkout
5. Verify `/thank-you` page
6. Verify cart is cleared

### Test with Shopify:
1. Configure Shopify credentials
2. Follow same flow
3. Complete actual checkout on Shopify
4. Verify redirect back to `/thank-you`

## Future Enhancements

- [ ] Webhook for order updates
- [ ] Order status page
- [ ] Guest checkout support
- [ ] Multiple shipping addresses
- [ ] Gift wrapping options
