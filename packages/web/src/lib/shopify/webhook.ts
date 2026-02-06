import crypto from 'crypto';

/**
 * 验证 Shopify Webhook 请求的真实性
 */
export async function verifyShopifyWebhook(
  request: Request
): Promise<boolean> {
  const body = await request.text();
  const headers = request.headers;

  const shopifyHmac = headers.get('x-shopify-hmac-sha256');
  const topic = headers.get('x-shopify-topic');
  const shop = headers.get('x-shopify-shop-domain');

  if (!shopifyHmac || !topic || !shop) {
    return false;
  }

  // 从环境变量获取 Webhook 密钥
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
    return false;
  }

  // 计算 HMAC
  const hmac = crypto
    .createHmac('sha256', webhookSecret)
    .update(body, 'utf8')
    .digest('base64');

  // 安全比较
  return crypto.timingSafeEqual(
    Buffer.from(shopifyHmac),
    Buffer.from(hmac)
  );
}

/**
 * 解析 Webhook 主题
 */
export function parseWebhookTopic(request: Request): string | null {
  return request.headers.get('x-shopify-topic');
}

/**
 * 验证 Webhook 并返回解析后的 body
 * 便于在处理器中同时验证和读取数据
 */
export async function verifyAndParseWebhook<T = any>(
  request: Request
): Promise<{ isValid: boolean; body: T | null; error?: string }> {
  try {
    const bodyText = await request.text();
    const headers = request.headers;

    const shopifyHmac = headers.get('x-shopify-hmac-sha256');
    const topic = headers.get('x-shopify-topic');
    const shop = headers.get('x-shopify-shop-domain');

    if (!shopifyHmac || !topic || !shop) {
      return { isValid: false, body: null, error: 'Missing required headers' };
    }

    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Webhook] SHOPIFY_WEBHOOK_SECRET not configured');
      return { isValid: false, body: null, error: 'Webhook secret not configured' };
    }

    // 计算 HMAC
    const hmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText, 'utf8')
      .digest('base64');

    // 安全比较
    const isValid = crypto.timingSafeEqual(
      Buffer.from(shopifyHmac),
      Buffer.from(hmac)
    );

    if (!isValid) {
      return { isValid: false, body: null, error: 'Invalid HMAC' };
    }

    // 解析 JSON
    const body = JSON.parse(bodyText) as T;

    return { isValid: true, body };
  } catch (error) {
    console.error('[Webhook] Verification error:', error);
    return {
      isValid: false,
      body: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
