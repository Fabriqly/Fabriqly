// lib/env-validation.ts - Comprehensive Environment Variable Validation
'use server';

interface EnvConfig {
  // NextAuth Configuration
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  
  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  
  // Firebase Client (Public)
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  
  // Firebase Admin (Server-side)
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  
  // Optional
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
}

class EnvValidator {
  private static instance: EnvValidator;
  private validated = false;
  private errors: string[] = [];

  static getInstance(): EnvValidator {
    if (!EnvValidator.instance) {
      EnvValidator.instance = new EnvValidator();
    }
    return EnvValidator.instance;
  }

  validate(): { isValid: boolean; errors: string[] } {
    if (this.validated) {
      return { isValid: this.errors.length === 0, errors: this.errors };
    }

    this.errors = [];
    const requiredVars: (keyof EnvConfig)[] = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];

    // Check required variables
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate specific formats
    this.validateUrls();
    this.validateFirebaseConfig();
    this.validateGoogleConfig();

    this.validated = true;
    
    if (this.errors.length > 0) {
      console.error('❌ Environment validation failed:', this.errors);
      throw new Error(`Environment validation failed: ${this.errors.join(', ')}`);
    }

    console.log('✅ Environment validation passed');
    return { isValid: true, errors: [] };
  }

  private validateUrls(): void {
    if (process.env.NEXTAUTH_URL && !this.isValidUrl(process.env.NEXTAUTH_URL)) {
      this.errors.push('NEXTAUTH_URL must be a valid URL');
    }
  }

  private validateFirebaseConfig(): void {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const adminProjectId = process.env.FIREBASE_PROJECT_ID;
    
    if (projectId && adminProjectId && projectId !== adminProjectId) {
      this.errors.push('Firebase project IDs must match between client and admin configs');
    }

    // Validate Firebase private key format
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      this.errors.push('FIREBASE_PRIVATE_KEY must be a valid PEM format private key');
    }
  }

  private validateGoogleConfig(): void {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && !clientId.includes('.apps.googleusercontent.com')) {
      this.errors.push('GOOGLE_CLIENT_ID must be a valid Google OAuth client ID');
    }
  }

  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  getConfig(): Partial<EnvConfig> {
    this.validate();
    return {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL!,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY!,
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
  }
}

// Export singleton instance
export const envValidator = EnvValidator.getInstance();

// Export validation function for easy use
export function validateEnvironment(): void {
  envValidator.validate();
}

// Export config getter
export function getValidatedConfig(): Partial<EnvConfig> {
  return envValidator.getConfig();
}
