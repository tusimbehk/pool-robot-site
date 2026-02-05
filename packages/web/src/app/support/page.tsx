"use client";

import { useState } from "react";
import { supportCategories, helpArticles, searchHelpArticles, getHelpArticles } from "@/lib/cms/faq";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Search, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useDeferredValue } from "react";

export default function SupportClientPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const deferredQuery = useDeferredValue(searchQuery);

  const filteredArticles =
    deferredQuery.length > 0
      ? searchHelpArticles(deferredQuery)
      : selectedCategory === "all"
      ? helpArticles
      : getHelpArticles(selectedCategory);

  const category = supportCategories.find((c) => c.id === selectedCategory);

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Help Center
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Guides, tutorials, and troubleshooting for your PoolClean Pro robot
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto max-w-xl mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {supportCategories.map((cat) => (
          <Card
            key={cat.id}
            className={`cursor-pointer transition-colors hover:bg-accent ${
              selectedCategory === cat.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSearchQuery("");
            }}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-3 text-3xl">{cat.icon}</div>
              <h3 className="font-semibold">{cat.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {cat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Articles */}
      <div className="mx-auto max-w-3xl">
        {selectedCategory !== "all" && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {category?.icon} {category?.name}
            </h2>
            <p className="text-muted-foreground">{category?.description}</p>
          </div>
        )}

        {deferredQuery.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Search results for "{deferredQuery}"
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"} found
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No articles found for "{deferredQuery}"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try different keywords or browse our categories
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2">
                        {supportCategories.find((c) => c.id === article.category)?.name}
                      </Badge>
                      <h3 className="text-lg font-semibold mb-2">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2">
                        {article.content}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/support/article/${article.slug}`}>
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Manuals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download user manuals and quick start guides
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/docs/manuals">View Manuals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Video Tutorials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Watch step-by-step video guides
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/support/videos">Watch Videos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Can't find what you need? Our team is here to help
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/contact">Get Help</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
