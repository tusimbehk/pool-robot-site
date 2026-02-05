import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { contactInfo } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "Privacy Policy - PoolClean Pro",
  description: "Our privacy policy and how we handle your data",
};

export default function PrivacyPage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: 2024-01-01
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us: account information, shipping
              address, payment information (processed securely through Shopify), and support
              communications.
            </p>
            <p className="text-muted-foreground">
              We also collect device information, usage data, and location information through cookies
              and tracking technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground mb-4">
              Under GDPR, you have the right to access, rectify, erase, port, and object to the
              processing of your personal data.
            </p>
            <p className="text-muted-foreground">
              To exercise these rights, contact us at {contactInfo.email}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. CCPA Rights</h2>
            <p className="text-muted-foreground mb-4">
              California residents have the right to know, delete, and opt-out of the sale of their personal
              data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Contact Us</h2>
            <p className="text-muted-foreground">
              Email: {contactInfo.email}<br/>
              Phone: {contactInfo.phone}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
