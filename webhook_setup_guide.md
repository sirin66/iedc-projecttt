# SMS Webhook & Automated Confirmation Setup Guide

This guide details how to host and configure the automated SMS Webhook pipeline that links incoming bank credit alerts to instant workshop registration confirmations.

---

## 🔗 Your Live Webhook URL Endpoint

After deploying the Firebase Cloud Functions, copy and paste this exact URL into your Android SMS Forwarder app settings:

```text
https://us-central1-iedc-ux.cloudfunctions.net/smsWebhook
```

*(Note: If you decide to deploy the functions in a region other than the default `us-central1`, replace `us-central1` with your target region in the URL above).*

---

## 🔧 Android SMS Forwarder Configuration

Download a standard SMS Webhook/Forwarder app from the Google Play Store (such as "SMS Forwarder", "SMS Gateway", or a similar webhook utility). Configure the app using the following settings:

1. **Target URL / Webhook Endpoint**: `https://us-central1-iedc-ux.cloudfunctions.net/smsWebhook`
2. **HTTP Request Method**: `POST`
3. **HTTP Header (Content-Type)**: `application/json`
4. **Trigger Filters**:
   - Limit messages to matching bank alert senders (e.g. `MD-HDFCBK`, `AD-FBLBNK`, `MD-ICICIB`) or numbers containing payment keywords to avoid unnecessary API requests.
5. **Payload Parameters (JSON mapping)**:
   Ensure the app outputs the message text in one of these JSON fields: `"text"`, `"message"`, or `"body"`. (Most apps send this by default under `message` or `text`).

---

## ⚡ Deployment Instructions

To deploy the Cloud Function to your Live Firebase project (`iedc-ux`), execute the following commands in your local project terminal:

1. **Install Firebase CLI globally** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. **Log in to your Google Account**:
   ```bash
   firebase login
   ```
3. **Initialize/Switch to your project**:
   ```bash
   firebase use iedc-ux
   ```
4. **Install the cloud functions dependencies**:
   ```bash
   cd functions
   npm install
   cd ..
   ```
5. **Deploy the SMS Webhook Cloud Function**:
   ```bash
   firebase deploy --only functions
   ```

---

## 🔍 How the Parsing & Reconciliation Logic Works

The webhook uses a multi-layered verification strategy when a bank alert is forwarded:

1. **Safety Filter**: Rejects any incoming POST message that does not contain credit markers (`credit`, `credited`, `deposit`, `added`, `received`).
2. **Direct Match (High Precision)**: 
   - If a user sends a UPI transfer and attaches their unique registration ID in the remarks (e.g. `reg-123456`), the bank alert will contain that note.
   - The webhook parses `reg-\d{6}` out of the text, queries Firestore directly by document ID, updates `status: "Confirmed"`, and decrements event seats.
3. **FIFO Reconciliation (Automatic Fallback)**:
   - If the remarks are stripped (common in standard bank SMS), the webhook extracts the numeric amount (e.g. `150`) and queries all pending registrations for that specific fee amount.
   - It selects the **oldest matching pending registration** (FIFO logic), confirms it, updates the database with the UTR ref number, and decrements available seats.
