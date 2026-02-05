/**
 * Simple CMS System
 *
 * Content management for static pages
 * In production, this would connect to a headless CMS or database
 */

export interface ContentSection {
  id: string;
  title: string;
  content: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  description: string;
  founded: number;
  headquarters: string;
  email: string;
  phone: string;
}

// Company Information
export const companyInfo: CompanyInfo = {
  name: "PoolClean Pro",
  tagline: "Premium Pool Cleaning Robots for Modern Homes",
  description:
    "We design and manufacture advanced pool cleaning robots that make pool maintenance effortless. Our products combine cutting-edge technology with elegant design, delivering cleaner pools with less hassle.",
  founded: 2018,
  headquarters: "California, USA",
  email: "info@poolcleanpro.com",
  phone: "+1 (800) 123-4567",
};

// Contact Information (for privacy/terms pages)
export const contactInfo = {
  email: companyInfo.email,
  phone: companyInfo.phone,
  headquarters: companyInfo.headquarters,
};

// About Page Content
export const aboutSections: ContentSection[] = [
  {
    id: "story",
    title: "Our Story",
    content:
      "Founded in 2018, PoolClean Pro started with a simple mission: make pool maintenance effortless. Our founders, frustrated with traditional pool cleaners that constantly got stuck and missed spots, set out to build something better.",
  },
  {
    id: "mission",
    title: "Our Mission",
    content:
      "To revolutionize pool care through intelligent robotics that save time, energy, and money while delivering cleaner pools. We believe technology should enhance your leisure time, not add to your chores.",
  },
  {
    id: "values",
    title: "Our Values",
    content:
      "Innovation drives us. Quality defines us. Customer satisfaction guides us. Every product we build reflects our commitment to excellence and our passion for solving real problems for pool owners everywhere.",
  },
];

// Team Members
export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "CEO & Co-Founder",
    bio: "Former engineer at Tesla with 15 years in robotics and automation.",
  },
  {
    id: "2",
    name: "Michael Torres",
    role: "CTO & Co-Founder",
    bio: "PhD in Robotics from MIT, specializing in autonomous navigation.",
  },
  {
    id: "3",
    name: "Emma Larson",
    role: "Head of Product",
    bio: "10+ years in product development at leading consumer electronics companies.",
  },
  {
    id: "4",
    name: "David Park",
    role: "Head of Engineering",
    bio: "Former lead engineer at iRobot, expert in pool technology.",
  },
];

// Stats
export const companyStats = [
  { value: "50K+", label: "Happy Customers" },
  { value: "5", label: "Countries Served" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "2 Years", label: "Warranty" },
];

// Features
export const keyFeatures = [
  {
    title: "AI Navigation",
    description:
      "Advanced algorithms learn your pool's shape for efficient cleaning paths.",
    icon: "brain",
  },
  {
    title: "Powerful Cleaning",
    description:
      "High-performance scrubbers remove dirt, algae, and debris effectively.",
    icon: "sparkles",
  },
  {
    title: "Energy Efficient",
    description: "Smart power management reduces energy consumption by up to 50%.",
    icon: "zap",
  },
  {
    title: "Mobile App Control",
    description: "Monitor and control your cleaner from anywhere.",
    icon: "smartphone",
  },
];

/**
 * Get content section by ID
 */
export function getContentSection(id: string): ContentSection | undefined {
  return aboutSections.find((section) => section.id === id);
}

/**
 * Get all content sections
 */
export function getAllContentSections(): ContentSection[] {
  return aboutSections;
}

/**
 * Get team member by ID
 */
export function getTeamMember(id: string): TeamMember | undefined {
  return teamMembers.find((member) => member.id === id);
}

/**
 * Get all team members
 */
export function getAllTeamMembers(): TeamMember[] {
  return teamMembers;
}

/**
 * Get company info
 */
export function getCompanyInfo(): CompanyInfo {
  return companyInfo;
}
