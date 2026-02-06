'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const COOKIE_CONSENT_KEY = 'cookie-consent';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState<ConsentPreferences>(DEFAULT_CONSENT);

  useEffect(() => {
    // 检查是否已存储同意
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setShowBanner(true);
    } else {
      setConsent(JSON.parse(stored));
      // 如果已同意分析，初始化分析
      const parsed = JSON.parse(stored) as ConsentPreferences;
      if (parsed.analytics) {
        enableAnalytics();
      }
    }
  }, []);

  const handleAccept = (type: 'all' | 'essential') => {
    const newConsent: ConsentPreferences = type === 'all'
      ? { necessary: true, analytics: true, marketing: true }
      : { necessary: true, analytics: false, marketing: false };

    setConsent(newConsent);
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent));
    setShowBanner(false);

    // 根据同意启用/禁用追踪
    if (newConsent.analytics) {
      enableAnalytics();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="container mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground">
            我们使用 Cookie 来改善您的体验并分析网站使用情况。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleAccept('essential')}>
            仅必要
          </Button>
          <Button size="sm" onClick={() => handleAccept('all')}>
            接受所有
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/privacy">隐私政策</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 获取当前 Cookie 同意设置
 */
export function getCookieConsent(): ConsentPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_CONSENT;
  }

  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) {
    return DEFAULT_CONSENT;
  }

  return JSON.parse(stored) as ConsentPreferences;
}

/**
 * 检查是否允许分析追踪
 */
export function isAnalyticsAllowed(): boolean {
  const consent = getCookieConsent();
  return consent.analytics;
}

function enableAnalytics() {
  // 初始化 Segment Analytics（如果在客户端）
  if (typeof window !== 'undefined' && (window as any).analytics) {
    const writeKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '';
    if (writeKey && writeKey !== 'your-segment-write-key') {
      (window as any).analytics.load(writeKey);
    }
  }
}
