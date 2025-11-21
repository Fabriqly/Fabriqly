// Application type definitions for designer and shop applications

import { Timestamp } from 'firebase/firestore';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface DesignerApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  businessName: string;
  bio: string;
  portfolioUrl?: string;
  sampleDesigns?: string[]; // URLs to sample design images
  specialties: string[];
  contactInfo: {
    phone?: string;
    website?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  status: ApplicationStatus;
  appliedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface BusinessDocument {
  id: string;
  label: string;
  url: string;
  fileName: string;
}

export interface ShopApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  shopName: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
  };
  businessDocuments?: BusinessDocument[];
  businessRegistrationNumber?: string;
  taxId?: string;
  operatingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  specialties?: string[];
  // Section E: Shop Profile & Branding
  profileBanner?: string;
  shopLogo?: string;
  tagline?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    linkedin?: string;
  };
  websiteUrl?: string;
  // Section F: Categories & Tags
  shopCategory?: string;
  serviceTags?: string[];
  materialSpecialties?: string[];
  // Section G: Payment & Transaction Details
  paymentMethods?: string[];
  paymentAccountInfo?: string;
  // Section H: Shop Policies
  returnPolicy?: string;
  processingTime?: string;
  shippingOptions?: string[];
  status: ApplicationStatus;
  appliedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface CreateDesignerApplicationData {
  businessName: string;
  bio: string;
  portfolioUrl?: string;
  sampleDesigns?: string[];
  specialties: string[];
  contactInfo: {
    phone?: string;
    website?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface CreateShopApplicationData {
  shopName: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
  };
  businessDocuments?: BusinessDocument[];
  businessRegistrationNumber?: string;
  taxId?: string;
  operatingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  specialties?: string[];
  // Section E: Shop Profile & Branding
  profileBanner?: string;
  shopLogo?: string;
  tagline?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    linkedin?: string;
  };
  websiteUrl?: string;
  // Section F: Categories & Tags
  shopCategory?: string;
  serviceTags?: string[];
  materialSpecialties?: string[];
  // Section G: Payment & Transaction Details
  paymentMethods?: string[];
  paymentAccountInfo?: string;
  // Section H: Shop Policies
  returnPolicy?: string;
  processingTime?: string;
  shippingOptions?: string[];
}

