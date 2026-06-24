/**
 * IEDC RIT Event Platform - Local Environment Configuration Template
 * 
 * Instructions:
 * 1. Copy this file to 'config.local.js' in the same directory.
 * 2. Fill in your real production Firebase, Supabase, EmailJS, and Admin credentials below.
 * 3. Make sure 'config.local.js' is gitignored (added to .gitignore) so it is never pushed.
 */

window.ENV_CONFIG = {
  // Admin Panel Login & Verification Credentials
  ADMIN_EMAIL: "admin@rit.ac.in",
  ADMIN_PASSWORD: "your_real_password_here",
  GATE_PASSWORD_PRIMARY: "12345678",
  GATE_PASSWORD_SECONDARY: "your_secondary_password_here",

  // Firebase Configuration
  FIREBASE_API_KEY: "your_firebase_api_key",
  FIREBASE_AUTH_DOMAIN: "your_firebase_auth_domain",
  FIREBASE_PROJECT_ID: "your_firebase_project_id",
  FIREBASE_STORAGE_BUCKET: "your_firebase_storage_bucket",
  FIREBASE_MESSAGING_SENDER_ID: "your_firebase_messaging_sender_id",
  FIREBASE_APP_ID: "your_firebase_app_id",
  FIREBASE_MEASUREMENT_ID: "your_firebase_measurement_id",

  // Supabase Storage Configuration (for product and poster uploads)
  SUPABASE_URL: "https://your_supabase_project_id.supabase.co",
  SUPABASE_ANON_KEY: "your_supabase_anon_key",

  // EmailJS Ticket Dispatch Configuration
  EMAILJS_PUBLIC_KEY: "your_emailjs_public_key",
  EMAILJS_SERVICE_ID: "your_emailjs_service_id",
  EMAILJS_TEMPLATE_ID: "your_emailjs_template_id"
};
