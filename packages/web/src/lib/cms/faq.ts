/**
 * FAQ and Help Content
 *
 * Common questions and answers for customer support
 */

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  related?: string[];
}

export interface SupportCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// FAQ Categories
export const faqCategories = [
  { id: "general", name: "General", icon: "📋" },
  { id: "products", name: "Products", icon: "🤖" },
  { id: "orders", name: "Orders & Shipping", icon: "📦" },
  { id: "support", name: "Support & Warranty", icon: "🔧" },
  { id: "returns", name: "Returns", icon: "↩️" },
];

// FAQ Items
export const faqs: FAQ[] = [
  // General
  {
    id: "g1",
    question: "What is PoolClean Pro?",
    answer:
      "PoolClean Pro is a line of intelligent pool cleaning robots designed to make pool maintenance effortless. Our robots use advanced AI navigation to clean your pool efficiently, saving you time and energy.",
    category: "general",
    keywords: ["about", "introduction", "what is"],
  },
  {
    id: "g2",
    question: "Where are PoolClean Pro robots made?",
    answer:
      "Our robots are designed in California and manufactured in ISO-certified facilities to ensure the highest quality standards.",
    category: "general",
    keywords: ["made", "manufacture", "origin", "where"],
  },
  {
    id: "g3",
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to the United States, Canada, Europe, Australia, and several other countries. Shipping costs and delivery times vary by location.",
    category: "general",
    keywords: ["shipping", "international", "delivery"],
  },

  // Products
  {
    id: "p1",
    question: "Which pool cleaner is right for me?",
    answer:
      "The PoolClean Essential E1 ($449) is perfect for small to medium pools. The PoolClean Pro M2 ($899) handles most residential pools with advanced features. The PoolClean Elite X1 ($1,299) is our premium model with AI navigation for complex pool shapes.",
    category: "products",
    keywords: ["choose", "which", "comparison", "recommendation"],
  },
  {
    id: "p2",
    question: "What pool types are compatible?",
    answer:
      "Our robots work with all in-ground pools and most above-ground pools. They handle concrete, fiberglass, vinyl, and tile surfaces. Minimum pool depth should be 3 feet.",
    category: "products",
    keywords: ["compatible", "pool type", "depth", "surface"],
  },
  {
    id: "p3",
    question: "How long does the battery last?",
    answer:
      "Battery life varies by model and pool size. The Essential E1 runs up to 2 hours, the Pro M2 up to 3 hours, and the Elite X1 up to 4 hours on a single charge.",
    category: "products",
    keywords: ["battery", "runtime", "charge", "how long"],
  },
  {
    id: "p4",
    question: "Is it safe to leave the robot in the pool?",
    answer:
      "Yes, all our robots are designed to be left in the pool when not in use. They're built with UV-resistant materials and can safely stay submerged.",
    category: "products",
    keywords: ["leave", "submerge", "storage", "safe"],
  },

  // Orders & Shipping
  {
    id: "o1",
    question: "How long does shipping take?",
    answer:
      "Standard shipping takes 5-7 business days within the US. Express shipping (2-3 days) is available for an additional cost. International shipping varies by destination.",
    category: "orders",
    keywords: ["shipping", "delivery", "how long", "time"],
  },
  {
    id: "o2",
    question: "Can I track my order?",
    answer:
      "Yes! Once your order ships, you'll receive an email with a tracking number. You can also track your order in your account under Order History.",
    category: "orders",
    keywords: ["track", "tracking", "order status"],
  },
  {
    id: "o3",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and financing through Affirm for qualifying purchases.",
    category: "orders",
    keywords: ["payment", "credit card", "paypal", "financing"],
  },

  // Support & Warranty
  {
    id: "s1",
    question: "What's included in the warranty?",
    answer:
      "All PoolClean Pro robots come with a 2-year warranty covering manufacturing defects and motor failure. Extended warranty options are available for purchase.",
    category: "support",
    keywords: ["warranty", "coverage", "guarantee"],
  },
  {
    id: "s2",
    question: "How do I contact customer support?",
    answer:
      "You can reach our support team via email at support@poolcleanpro.com, phone at +1 (800) 123-4567, or through the contact form on our website. Support hours are Monday-Friday 9AM-6PM PST.",
    category: "support",
    keywords: ["contact", "support", "help", "phone", "email"],
  },
  {
    id: "s3",
    question: "My robot isn't working properly. What should I do?",
    answer:
      "First, check our troubleshooting guides in the Support Center. If the issue persists, contact our support team with your robot's model and serial number. Most issues can be resolved remotely.",
    category: "support",
    keywords: ["troubleshoot", "problem", "issue", "broken"],
  },

  // Returns
  {
    id: "r1",
    question: "What is your return policy?",
    answer:
      "We offer a 30-day money-back guarantee. If you're not satisfied, you can return your robot for a full refund. The robot must be in like-new condition with all original packaging and accessories.",
    category: "returns",
    keywords: ["return", "refund", "money-back", "policy"],
  },
  {
    id: "r2",
    question: "How do I return my order?",
    answer:
      "To initiate a return, contact our support team or use the return request form in your account. We'll provide a prepaid shipping label and instructions for packaging your return.",
    category: "returns",
    keywords: ["return process", "how to return", "shipping label"],
  },
];

// Support Categories
export const supportCategories: SupportCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: "🚀",
    description: "Setup guides and quick start tutorials",
  },
  {
    id: "troubleshooting",
    name: "Troubleshooting",
    icon: "🔧",
    description: "Common problems and solutions",
  },
  {
    id: "maintenance",
    name: "Maintenance & Care",
    icon: "🧹",
    description: "Keep your robot running smoothly",
  },
  {
    id: "orders",
    name: "Order Support",
    icon: "📦",
    description: "Shipping, returns, and order changes",
  },
];

// Help Articles
export const helpArticles: HelpArticle[] = [
  {
    id: "h1",
    title: "Unboxing and First Setup",
    slug: "unboxing-first-setup",
    category: "getting-started",
    content:
      "When you receive your PoolClean Pro, remove all packaging materials and charge the robot for at least 8 hours before first use...",
  },
  {
    id: "h2",
    title: "Understanding the Control Panel",
    slug: "understanding-control-panel",
    category: "getting-started",
    content: "The control panel features a power button, mode selector, and indicator lights...",
  },
  {
    id: "h3",
    title: "Robot Not Starting",
    slug: "robot-not-starting",
    category: "troubleshooting",
    content: "If your robot won't start, check that it's charged, the battery is properly seated...",
  },
  {
    id: "h4",
    title: "Robot Getting Stuck",
    slug: "robot-getting-stuck",
    category: "troubleshooting",
    content: "If your robot frequently gets stuck, it may need to learn your pool's shape...",
  },
  {
    id: "h5",
    title: "Cleaning the Filter",
    slug: "cleaning-the-filter",
    category: "maintenance",
    content: "Clean the filter after every use. Remove it from the robot, rinse with water...",
  },
  {
    id: "h6",
    title: "Battery Care Tips",
    slug: "battery-care-tips",
    category: "maintenance",
    content: "To extend battery life, avoid leaving it completely depleted for extended periods...",
  },
];

/**
 * Get FAQs by category
 */
export function getFAQsByCategory(category: string): FAQ[] {
  return faqs.filter((faq) => faq.category === category);
}

/**
 * Search FAQs
 */
export function searchFAQs(query: string): FAQ[] {
  const lowerQuery = query.toLowerCase();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery) ||
      faq.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get FAQ by ID
 */
export function getFAQById(id: string): FAQ | undefined {
  return faqs.find((faq) => faq.id === id);
}

/**
 * Get help articles by category
 */
export function getHelpArticles(category: string): HelpArticle[] {
  return helpArticles.filter((article) => article.category === category);
}

/**
 * Get help article by slug
 */
export function getHelpArticle(slug: string): HelpArticle | undefined {
  return helpArticles.find((article) => article.slug === slug);
}

/**
 * Search help articles
 */
export function searchHelpArticles(query: string): HelpArticle[] {
  const lowerQuery = query.toLowerCase();
  return helpArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery)
  );
}
