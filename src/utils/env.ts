/**
 * Environment Configuration Utility
 * Centralizes environment variable access and provides type safety
 */

export const env = {
  // API Configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  
  // App Configuration
  NODE_ENV: process.env.NODE_ENV as string || 'development',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-secret',
  
  // Debug Configuration
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
  ENABLE_API_LOGGING: process.env.NEXT_PUBLIC_ENABLE_API_LOGGING === 'true',
  ENABLE_REQUEST_LOGGING: process.env.NEXT_PUBLIC_ENABLE_REQUEST_LOGGING === 'true',
  
  // SSL Configuration
  SSL_ENABLED: process.env.SSL_ENABLED === 'true' || true,
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || './localhost.pem',
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || './localhost-key.pem',
  
  // Helper functions
  isDevelopment: () => env.NODE_ENV === 'development',
  isProduction: () => env.NODE_ENV === 'production',
  isStaging: () => env.NODE_ENV === 'staging',
  isHttpsEnabled: () => env.SSL_ENABLED && env.isDevelopment(),
} as const;

/**
 * Validates that all required environment variables are set
 * Call this function at app startup to catch configuration issues early
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required variables
  if (!env.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }
  
  if (!env.NEXTAUTH_SECRET || env.NEXTAUTH_SECRET === 'fallback-secret') {
    errors.push('NEXTAUTH_SECRET should be set to a secure random string');
  }
  
  // Validate URLs
  try {
    new URL(env.API_BASE_URL);
  } catch {
    errors.push('API_BASE_URL must be a valid URL');
  }
  
  try {
    new URL(env.NEXTAUTH_URL);
  } catch {
    errors.push('NEXTAUTH_URL must be a valid URL');
  }
  
  // Validate SSL configuration in development (only in Node.js environment)
  if (env.isDevelopment() && env.SSL_ENABLED && typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (!fs.existsSync(path.resolve(env.SSL_CERT_PATH))) {
        errors.push(`SSL certificate not found at ${env.SSL_CERT_PATH}`);
      }
      if (!fs.existsSync(path.resolve(env.SSL_KEY_PATH))) {
        errors.push(`SSL private key not found at ${env.SSL_KEY_PATH}`);
      }
    } catch (e) {
      errors.push('Unable to validate SSL certificate files');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Log environment status in development (only in Node.js environment)
if (env.isDevelopment() && env.DEBUG_MODE && typeof window === 'undefined') {
  console.log('🔧 Environment Configuration:', {
    NODE_ENV: env.NODE_ENV,
    API_BASE_URL: env.API_BASE_URL,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    DEBUG_MODE: env.DEBUG_MODE,
    SSL_ENABLED: env.SSL_ENABLED,
    HTTPS_MODE: env.isHttpsEnabled() ? 'ENABLED' : 'DISABLED',
  });
  
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('⚠️ Environment validation warnings:', validation.errors);
  } else if (env.isHttpsEnabled()) {
    console.log('🔒 HTTPS enabled - Ready for Office API integration!');
  }
}
