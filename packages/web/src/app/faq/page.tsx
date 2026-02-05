"use client";

import { useState } from "react";
import { faqs, faqCategories, searchFAQs, getFAQsByCategory } from "@/lib/cms/faq";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Card, CardContent } from "@/components/ui";
import { Search, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useDeferredValue } from "react";

export default function FAQClientPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(searchQuery);

  const filteredFAQs =
    deferredQuery.length > 0
      ? searchFAQs(deferredQuery)
      : selectedCategory === "all"
      ? faqs
      : getFAQsByCategory(selectedCategory);

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Find answers to common questions about our products and services
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto max-w-xl mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          All
        </Button>
        {faqCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.icon} {category.name}
          </Button>
        ))}
      </div>

      {/* Results */}
      <div className="mx-auto max-w-3xl space-y-4">
        {filteredFAQs.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No results found for "{deferredQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or browse all categories
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFAQs.map((faq) => (
            <FAQCard
              key={faq.id}
              faq={faq}
              isExpanded={expandedId === faq.id}
              onToggle={() =>
                setExpandedId(expandedId === faq.id ? null : faq.id)
              }
            />
          ))
        )}
      </div>

      {/* Still Need Help */}
      <div className="mt-12 text-center">
        <Card className="mx-auto max-w-2xl bg-muted/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">
              Still can't find what you're looking for?
            </h2>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <a href="/contact">Contact Support</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/support">Help Center</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface FAQCardProps {
  faq: {
    id: string;
    question: string;
    answer: string;
    category: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQCard({ faq, isExpanded, onToggle }: FAQCardProps) {
  const category = faqCategories.find((c) => c.id === faq.category);

  return (
    <Card>
      <CardContent className="p-0">
        <button
          onClick={onToggle}
          className="flex w-full items-start justify-between p-6 text-left"
          aria-expanded={isExpanded}
        >
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{faq.question}</h3>
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {category.icon} {category.name}
                </Badge>
              )}
            </div>
            {isExpanded && (
              <p className="text-muted-foreground">{faq.answer}</p>
            )}
          </div>
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
