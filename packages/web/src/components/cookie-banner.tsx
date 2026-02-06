'use client';

import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 延迟显示，确保组件已挂载
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('cookie-consent');
      if (!stored) {
        setShowBanner(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!showBanner) return null;

  const handleAccept = (type: 'all' | 'essential') => {
    const consent = type === 'all'
      ? { necessary: true, analytics: true, marketing: true }
      : { necessary: true, analytics: false, marketing: false };

    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShowBanner(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: 'white',
      borderTop: '1px solid #ccc',
      padding: '16px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        alignItems: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          我们使用 Cookie 来改善您的体验并分析网站使用情况。
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleAccept('essential')}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              background: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            仅必要
          </button>
          <button
            onClick={() => handleAccept('all')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: '#2563eb',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            接受所有
          </button>
          <a
            href="/privacy"
            style={{
              padding: '8px 16px',
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            隐私政策
          </a>
        </div>
      </div>
    </div>
  );
}
