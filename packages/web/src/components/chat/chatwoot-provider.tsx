"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isChatwootConfigured, getChatwootConfig } from "@/lib/chatwoot";

interface ChatwootProviderProps {
  children: React.ReactNode;
}

/**
 * Chatwoot Widget Provider
 *
 * Loads and initializes the Chatwoot chat widget
 * Handles user identification when logged in
 */
export function ChatwootProvider({ children }: ChatwootProviderProps) {
  const { user, loading } = useAuth();
  const hasInitialized = useRef(false);
  const hasIdentified = useRef(false);

  useEffect(() => {
    if (!isChatwootConfigured() || hasInitialized.current) {
      return;
    }

    const config = getChatwootConfig();

    // Load Chatwoot script
    const script = document.createElement("script");
    script.src = `${config.baseUrl}/packs/js/sdk/chats.js`;
    script.async = true;

    script.onload = () => {
      const chatwoot = (window as any).$chatwoot;

      if (chatwoot) {
        chatwoot.init(config.websiteToken, {
          locale: "en",
          type: "expanded_bubble",
          position: "right",
        });
      }

      hasInitialized.current = true;
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      const existingScript = document.querySelector(`script[src*="chats.js"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Identify user when logged in
  useEffect(() => {
    if (!hasInitialized.current || loading || !user || hasIdentified.current) {
      return;
    }

    const chatwoot = (window as any).$chatwoot;

    if (chatwoot && chatwoot.user) {
      chatwoot.user.set({
        identifier: user.email || user.id,
        name: user.name || "",
        email: user.email || "",
      });

      hasIdentified.current = true;
    }
  }, [user, loading]);

  return <>{children}</>;
}

/**
 * Chatwoot Bubble Component
 *
 * Floating chat button that opens the chat widget
 */
export function ChatwootBubble() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isChatwootConfigured()) {
    return null;
  }

  const config = getChatwootConfig();

  function toggleChat() {
    const chatwoot = (window as any).$chatwoot;

    if (chatwoot) {
      if (isOpen) {
        chatwoot.popups.close();
      } else {
        chatwoot.popups.open();
      }
      setIsOpen(!isOpen);
    }
  }

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      aria-label="Open chat"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </button>
  );
}
