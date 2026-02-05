/**
 * Chatwoot Integration
 *
 * Customer support chat widget using Chatwoot
 * Can be self-hosted or use cloud service
 */

interface ChatwootConfig {
  token: string;
  baseUrl: string;
  websiteToken: string;
}

const CHATWOOT_CONFIG: ChatwootConfig = {
  token: process.env.NEXT_PUBLIC_CHATWOOT_TOKEN || "",
  baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || "https://app.chatwoot.com",
  websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || "",
};

/**
 * Check if Chatwoot is configured
 */
export function isChatwootConfigured(): boolean {
  return !!CHATWOOT_CONFIG.websiteToken;
}

/**
 * Get Chatwoot config
 */
export function getChatwootConfig(): ChatwootConfig {
  return CHATWOOT_CONFIG;
}

/**
 * Initialize Chatwoot widget
 * Call this when user logs in to identify them
 */
export function initChatwootWidget(): void {
  if (!isChatwootConfigured() || typeof window === "undefined") {
    return;
  }

  // Chatwoot widget is loaded via script
  // This function can be used to reinitialize if needed
}

/**
 * Identify user in Chatwoot
 */
export function identifyChatwootUser(user: {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
}): void {
  if (!isChatwootConfigured() || typeof window === "undefined") {
    return;
  }

  const chatwoot = (window as any).$chatwoot;

  if (chatwoot && chatwoot.user) {
    chatwoot.user.set({
      identifier: user.email || user.id,
      name: user.name || "",
      email: user.email || "",
      phone_number: user.phone || "",
    });
  }
}

/**
 * Clear Chatwoot user (logout)
 */
export function clearChatwootUser(): void {
  if (!isChatwootConfigured() || typeof window === "undefined") {
    return;
  }

  const chatwoot = (window as any).$chatwoot;

  if (chatwoot && chatwoot.user) {
    chatwoot.user.reset();
  }
}

/**
 * Set custom attributes in Chatwoot
 */
export function setChatwootAttributes(attributes: Record<string, string | number>): void {
  if (!isChatwootConfigured() || typeof window === "undefined") {
    return;
  }

  const chatwoot = (window as any).$chatwoot;

  if (chatwoot && chatwoot.user) {
    chatwoot.user.setCustomAttributes(attributes);
  }
}

/**
 * Update Chatwoot language
 */
export function setChatwootLanguage(language: string): void {
  if (!isChatwootConfigured() || typeof window === "undefined") {
    return;
  }

  const chatwoot = (window as any).$chatwoot;

  if (chatwoot) {
    chatwoot.setLocale(language);
  }
}
