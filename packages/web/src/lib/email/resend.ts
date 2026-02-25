// packages/web/src/lib/email/resend.ts

import { Resend } from 'resend';

// Lazy initialize Resend only when API key is available
let resend: Resend | null = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@poolclean.com';

export interface CartItem {
  name: string;
  quantity: number;
  price: string;
}

export interface CartRecoveryEmailProps {
  to: string;
  cartItems: CartItem[];
  cartTotal: string;
  discountCode?: string;
  recoveryUrl?: string;
}

export async function sendCartRecoveryEmail({
  to,
  cartItems,
  cartTotal,
  discountCode,
  recoveryUrl,
}: CartRecoveryEmailProps) {
  // Generate items HTML
  const itemsHtml = cartItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        数量: ${item.quantity} | 价格: $${item.price}
      </td>
    </tr>
  `
    )
    .join('');

  // Generate discount section
  const discountHtml = discountCode
    ? `
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #0369a1;">
        <strong>限时优惠: 使用折扣码 <span style="background: #0284c7; color: white; padding: 4px 8px; border-radius: 4px;">${discountCode}</span> 享受 10% OFF</strong>
      </p>
    </div>
  `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; }
        .cart-table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #1e293b;">🛒 您购物车中的商品在等您</h1>
        <p style="color: #64748b; font-size: 18px;">您购物车中的商品可能很快售罄</p>
        </div>

        <table class="cart-table">
          ${itemsHtml}
        </table>

        <div style="text-align: right; padding: 20px 0; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b;">购物车总额:</p>
          <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1e293b;">
            $${cartTotal}
          </p>
        </div>

        ${discountHtml}

        <div style="text-align: center; margin: 40px 0;">
          <a href="${recoveryUrl || 'https://poolclean.com/cart'}"
             style="display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            返回购物车 →
          </a>
        </div>

        <p style="text-align: center; color: #94a3b8; font-size: 14px;">
          如果您不想再收到此类邮件，请<a href="#" style="color: #64748b;">退订</a>
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const client = getResendClient();
    if (!client) {
      console.error('[Resend] No API key configured');
      return { success: false, error: 'No API key configured' };
    }

    const data = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '🛒 您购物车中的商品在等您',
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('[Resend] Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
