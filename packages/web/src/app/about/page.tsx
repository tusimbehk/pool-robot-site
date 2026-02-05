import { Metadata } from "next";
import { companyInfo, aboutSections, teamMembers, companyStats, keyFeatures } from "@/lib/cms/content";
import { Button } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - PoolClean Pro",
  description: "Learn about PoolClean Pro and our mission to revolutionize pool care",
};

export default function AboutPage() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          About {companyInfo.name}
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          {companyInfo.tagline}
        </p>
      </section>

      {/* Story Section */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg text-muted-foreground">
            {companyInfo.description}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {companyStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {aboutSections.map((section) => (
            <Card key={section.id}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">{section.title}</h3>
                <p className="mt-2 text-muted-foreground">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Why Choose Us</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {keyFeatures.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl">
                  {feature.icon === "brain" && "🧠"}
                  {feature.icon === "sparkles" && "✨"}
                  {feature.icon === "zap" && "⚡"}
                  {feature.icon === "smartphone" && "📱"}
                </span>
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Our Team</h2>
          <p className="text-muted-foreground">The people behind the innovation</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <span className="text-3xl font-bold text-primary">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-primary">{member.role}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {member.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <h2 className="text-2xl font-bold">Ready to Experience the Future of Pool Care?</h2>
        <p className="mt-2 text-muted-foreground">
          Join thousands of satisfied customers
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
