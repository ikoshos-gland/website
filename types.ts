import React, { ReactNode } from "react";

export interface NavLink {
  label: string;
  href: string;
}

export interface CaseStudy {
  id: number;
  title: string;
  category: string;
  duration: string;
  budget: string;
  image: string;
  isFeatured?: boolean;
  isAwarded?: boolean;
}

export interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  image: string;
}

export interface ProcessStep {
  icon: ReactNode;
  title: string;
  description: string[];
}