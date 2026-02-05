/**
 * Cookie Consent Component
 *
 * GDPR/CCPA compliant cookie consent banner
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { X } from "lucide-react";

interface ConsentOptions {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CONSENT_STORAGE_KEY = "cookie_consent";

/**
 * Get saved consent preferences
 */
function getSavedConsent(): ConsentOptions | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Save consent preferences
 */
function saveConsent(consent: ConsentOptions): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));

  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent("cookieConsent", { detail: consent }));
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentOptions | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const saved = getSavedConsent();

    if (saved) {
      setConsent(saved);
      // Still show banner if they haven't made a choice
      if (!saved) {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const newConsent: ConsentOptions = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    const newConsent: ConsentOptions = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowBanner(false);
  };

  const savePreferences = (preferences: Partial<ConsentOptions>) => {
    const newConsent: ConsentOptions = {
      necessary: true,
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
      preferences: preferences.preferences ?? false,
    };
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowBanner(false);
  };

  return {
    consent,
    showBanner,
    acceptAll,
    acceptNecessary,
    savePreferences,
  };
}

/**
 * Cookie Consent Banner Component
 */
export function CookieBanner() {
  const { consent, showBanner, acceptAll, acceptNecessary } = useCookieConsent();
  const [dismissed, setDismissed] = useState(false);

  if (!showBanner || !consent || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-none bg-muted/50">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">🍪 Cookie Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to improve your experience. By continuing to use this site,
                  you agree to our use of cookies.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissed(true)}
              >
                Hide
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={acceptNecessary}
              >
                Necessary Only
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Cookie Settings Dialog
 */
export function CookieSettings() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: true,
    marketing: false,
    preferences: false,
  });

  const savedConsent = getSavedConsent();

  function handleSave() {
    saveConsent({
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      preferences: preferences.preferences,
    });
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        Cookie Settings
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cookie Preferences</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Necessary Cookies</p>
                    <p className="text-sm text-muted-foreground">
                      Required for the site to function
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="h-4 w-4 rounded border-input"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics Cookies</p>
                    <p className="text-sm text-muted-foreground">
                      Help us improve the site
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Cookies</p>
                    <p className="text-sm text-muted-foreground">
                      Used for advertising and social media
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Preferences</Button>
              </div>

              {savedConsent && (
                <p className="text-xs text-muted-foreground text-center">
                  You can change these settings anytime
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
