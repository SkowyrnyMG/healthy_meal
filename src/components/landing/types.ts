/**
 * Types for Landing Page Components
 */

import type { LucideIcon } from "lucide-react";

/**
 * Navigation link interface used in header and mobile menu
 */
export interface NavLink {
  href: string;
  label: string;
}

/**
 * Feature card interface for FeaturesSection
 */
export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Step card interface for HowItWorksSection
 */
export interface Step {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Footer link interface
 */
export interface FooterLink {
  label: string;
  href: string;
}

/**
 * Footer link group interface
 */
export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}
