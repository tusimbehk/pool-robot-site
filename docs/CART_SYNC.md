# Shopify Cart API Integration

## Overview

The cart system supports both local storage (for development) and Shopify sync (for production).

## Features

- ✅ Optimistic UI updates
- ✅ Automatic retry with exponential backoff
- ✅ Error handling and user feedback
- ✅ Local storage fallback
- ✅ Cart ID persistence

## API Methods

### cartApi.create(input)

Create a new cart in Shopify.

```ts
const cart = await cartApi.create({
  lines: [
    { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 1 }
  ]
});
```

### cartApi.addLines(cartId, lines)

Add items to existing cart.

```ts
const cart = await cartApi.addLines(cartId, [
  { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2 }
]);
```

### cartApi.updateLines(cartId, lines)

Update line quantities.

```ts
const cart = await cartApi.updateLines(cartId, [
  { id: "line-id-1", quantity: 3 }
]);
```

### cartApi.removeLines(cartId, lineIds)

Remove items from cart.

```ts
const cart = await cartApi.removeLines(cartId, ["line-id-1"]);
```

### cartApi.addDiscountCode(cartId, discountCodes)

Apply discount codes.

```ts
const cart = await cartApi.addDiscountCode(cartId, ["SUMMER2024"]);
```

## Store Methods

### addItemWithSync(item)

Add item to cart and sync with Shopify.

```ts
const { addItemWithSync } = useCartStore();
await addItemWithSync({
  merchandiseId: "gid://shopify/ProductVariant/1",
  quantity: 1,
  title: "Product Name",
  handle: "product-handle",
  price: "99.00",
  image: "https://..."
});
```

### updateQuantityWithSync(merchandiseId, quantity)

Update quantity and sync.

```ts
await updateQuantityWithSync("gid://shopify/ProductVariant/1", 2);
```

### removeItemWithSync(merchandiseId)

Remove item and sync.

```ts
await removeItemWithSync("gid://shopify/ProductVariant/1");
```

## Error Handling

The cart API includes:
- Automatic retry (3 attempts)
- Exponential backoff
- User-friendly error messages
- Local fallback when Shopify is unavailable

## Testing

Run tests with:
```bash
pnpm test src/lib/shopify/cart-api.test.ts
```
