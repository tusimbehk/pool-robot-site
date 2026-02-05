import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { contactInfo, companyInfo } from "@/lib/cms/content";

export const metadata: Metadata = {
  title: "Terms of Service - PoolClean Pro",
  description: "Terms and conditions for using PoolClean Pro website",
};

export default function TermsPage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: 2024-01-01
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using {companyInfo.name} website, you agree to be bound by these
              Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Account Terms</h2>
            <p className="text-muted-foreground mb-4">
              When you create an account with us, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-1">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain security of your account credentials</li>
              <li>Notify us immediately of unauthorized access</li>
              <li>Only use our services for lawful purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Products and Services</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify, suspend, or discontinue any product or service
              at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Pricing and Payment</h2>
            <p className="text-muted-foreground mb-4">
              All prices are in USD unless otherwise noted. We reserve the right to modify prices at
              any time without notice. Payment is due at time of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              All content, features, and functionality on this website are owned by {companyInfo.name}
              and protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              {companyInfo.name} shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages resulting from your use or inability to use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of the United States and the State of California.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at:
            </p>
            <Card>
              <CardContent className="p-4">
                <p className="font-medium">Email: {contactInfo.email}</p>
                <p className="font-medium">Phone: {contactInfo.phone}</p>
                <p className="font-medium">Address: {contactInfo.headquarters}</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
