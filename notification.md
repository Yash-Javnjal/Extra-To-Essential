# Real-Time Notification System Documentation

This document outlines the setup, configuration, and current state of the real-time notification system for the Extra-to-Essential platform.

## 1. Firebase Configuration Steps

The system uses **Firebase Cloud Messaging (FCM)** for push notifications. You must set up a Firebase project and generate a service account key.

### Step 1: Create a Firebase Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the setup prompts (name your project, e.g., "extra-to-essential").
3.  Disable Google Analytics if not needed, or configure it as desired.
4.  Click **"Create project"**.

### Step 2: Generate Service Account Key (Backend)
1.  In the Firebase Console, click the **Gear icon** (Project settings) > **Service accounts**.
2.  Click **"Generate new private key"**.
3.  This will download a `.json` file containing your credentials. **Keep this file secure.**

### Step 3: Enable APIs (If required)
1.  Ensure the **Cloud Messaging API** is enabled in the Google Cloud Console for your project (usually enabled by default).

### Step 4: Configure Environment Variables
Open your backend `.env` file and add the following keys using values from the downloaded JSON file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
# IMPORTANT: Use double quotes for the private key to handle newlines correctly
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour...\n-----END PRIVATE KEY-----\n"
```

## 2. Backend Notification Features

### ✅ Currently Implemented
The `notificationService.js` and `firebaseAdmin.js` files currently support:

*   **Firebase Admin Initialization**: Securely initializes with service account credentials.
*   **Notification Logging**: All notification attempts are logged to Supabase (`notification_logs` table) with status (pending, sent, failed).
*   **Structure for Push Notifications**: The `sendNotification` function is structured to send FCM messages if `messaging` is initialized.
*   **Pre-defined Notification Types**:
    *   `claim_alert`: When a donation is claimed.
    *   `pickup_alert`: Schedule updates for pickup.
    *   `delivery_alert`: Updates on delivery status (assigned, in_transit, delivered).
    *   `expiry_warning`: Alerts for expiring food.
    *   `completion_notice`: Impact updates for donors.
    *   `bulk_notifications`: Setup for mass alerts.

### 🚧 Pending / Missing Features
The following are **NOT** yet fully implemented or require external service integration:

1.  **SMS Integration**:
    *   *Current State*: `sendNotification` logic only simulates success or prepares for FCM.
    *   *Action*: Integrate an SMS provider like Twilio, MSG91, or AWS SNS if SMS is a hard requirement alongside App push notifications.

2.  **Email Integration**:
    *   *Current State*: Not present in `notificationService.js`.
    *   *Action*: Integrate `nodemailer` or a service like SendGrid/AWS SES.

3.  **Direct Call**:
    *   *Current State*: This is primarily a frontend feature (using `tel:` links). Backend support would only be for masking numbers (optional).

4.  **FCM Token Management**:
    *   *Current State*: The code notes `// In a real app, we'd look up the owner's FCM token`.
    *   *Action*: You need a mechanism to store and retrieve FCM device tokens (`registration_token`) for users in the `profiles` table.

## 3. Full Notification Flow (Donor → Server → NGO)

1.  **Trigger Event**:
    *   *Example*: An NGO clicks "Claim" on a donation.
2.  **Backend Processing**:
    *   The API endpoint calls `notificationService.sendClaimAlert(donorPhone, ...)`.
3.  **Logging**:
    *   Service inserts a record into `notification_logs` with status `pending`.
4.  **Dispatch**:
    *   Service checks for `FIREBASE_PROJECT_ID`.
    *   **If configured**: Attempts to send a push notification via FCM (requires user's device token).
    *   **If not configured**: Logs a warning but updates the database log to `sent` (simulation mode).
5.  **Delivery**:
    *   The Donor's app receives the push notification.

## 4. Testing Steps

To verify the system is working:

1.  **Check Logs**:
    *   Look at the `notification_logs` table in Supabase. You should see new rows with `delivery_status = 'sent'` after performing actions like Claiming a donation.
2.  **Verify Console Output**:
    *   Run the backend and check for `Firebase Admin initialized successfully`.
    *   Trigger an action and look for `Notification log created for ...`.
3.  **Test Environment Variables**:
    *   Temporarily remove `FIREBASE_PRIVATE_KEY` from `.env` and restart the server.
    *   You should see a warning: `Firebase env variables not set... Push notifications will be disabled.`

## 5. Required API Keys & Configuration

| Service | Key/Variable | Description |
| :--- | :--- | :--- |
| **Supabase** | `SUPABASE_URL` | Check `notification_logs` |
| **Supabase** | `SUPABASE_SERVICE_ROLE_KEY` | Admin access for logging |
| **Firebase** | `FIREBASE_PROJECT_ID` | Project Identifier |
| **Firebase** | `FIREBASE_CLIENT_EMAIL` | Service Account Email |
| **Firebase** | `FIREBASE_PRIVATE_KEY` | Service Account Private Key |
