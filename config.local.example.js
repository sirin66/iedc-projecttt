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
  ADMIN_PASSWORD: "admin123",
  GATE_PASSWORD_PRIMARY: "15192406",
  GATE_PASSWORD_SECONDARY: "15192421",

  // Firebase Configuration
  FIREBASE_API_KEY: "AIzaSyD4_h3WU2tkzE5G6jXimQUjYj2bUVliYUk",
  FIREBASE_AUTH_DOMAIN: "iedc-ux.firebaseapp.com",
  FIREBASE_PROJECT_ID: "iedc-ux",
  FIREBASE_STORAGE_BUCKET: "iedc-ux.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: "362260352304",
  FIREBASE_APP_ID: "1:362260352304:web:27374dbb9b51182807ccf5",
  FIREBASE_MEASUREMENT_ID: "G-2KH08MNGSX",

  // Supabase Storage Configuration (for product and poster uploads)
  SUPABASE_URL: "https://qcqneyayyaieekroyxdt.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_0CE1Cl1OLGMRziQU2Y7jgg_vq8ePDBf",

  // EmailJS Ticket Dispatch Configuration
  EMAILJS_PUBLIC_KEY: "3eNLy2tU8mQEiQIqG",
  EMAILJS_SERVICE_ID: "service_u4ve6g2",
  EMAILJS_TEMPLATE_ID: "template_0zvf2rs"
};
