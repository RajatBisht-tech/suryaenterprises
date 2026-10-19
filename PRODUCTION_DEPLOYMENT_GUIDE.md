# Production Deployment & Architecture Guide
**SuryaPe Aggregator & Surya Enterprises Merchant of Record (MoR)**

---

## 1. System Architecture Overview

In production, the platform operates across three interconnected tiers:

```
                          ┌────────────────────────┐
                          │   CUSTOMER BROWSER     │
                          │   OR MERCHANT APP      │
                          └───────────┬────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│     SURYAPE FRONTEND      │                   │     SURYAPE BACKEND       │
│  (Merchant Portal & UI)   │                   │ (Core API & Smart Router) │
│ https://merchant.suryape.in│                   │   https://api.suryape.in  │
└───────────────────────────┘                   └─────────────┬─────────────┘
                                                              │
                                            MoR API Bridge    │
                                            (Bearer Auth)     ▼
                                                ┌───────────────────────────┐
                                                │     SURYA ENTERPRISES     │
                                                │ (Merchant of Record Store)│
                                                │  https://www.suryaenter.in│
                                                └─────────────┬─────────────┘
                                                              │
                                   Upstream Banking Protocols │
                     ┌────────────────────────────────────────┼────────────────────────────────────────┐
                     ▼                                        ▼                                        ▼
             ┌───────────────┐                        ┌───────────────┐                        ┌───────────────┐
             │     PAYU      │                        │   RAZORPAY    │                        │    PHONEPE    │
             │ (Production)  │                        │ (Live Mode)   │                        │ (Production)  │
             └───────────────┘                        └───────────────┘                        └───────────────┘
```

---

## 2. Domain & HTTPS Requirements

Payment gateways (PayU, Razorpay, PhonePe) **strictly reject** `http://` and `localhost` URLs in production. All endpoints must use valid SSL/TLS certificates (`https://`).

### Recommended Domain Allocation:
* **`https://www.suryaenter.in`** – Surya Enterprises MoR Storefront & Callback Receiver
* **`https://api.suryape.in`** – SuryaPe Backend API & Webhook Engine
* **`https://merchant.suryape.in`** – SuryaPe Merchant Console

---

## 3. Environment Variables Configuration

### A. Surya Enterprises (`suryaenterprises/.env.production`)

Deploy these variables to your production host (e.g. Vercel, AWS Amplify, or Linux VPS):

```bash
# ==============================================================================
# SURYA ENTERPRISES - PRODUCTION ENVIRONMENT
# ==============================================================================

# Public Host (MUST be HTTPS - used to generate bank return & callback URLs)
PUBLIC_BASE_URL=https://www.suryaenter.in

# MongoDB Atlas Production Database
MONGO_URL=mongodb+srv://<db_user>:<db_password>@cluster0.xxxxx.mongodb.net/?appName=SuryaEnterprises
DB_NAME=SURYAENTERPRISES

# Shared Machine-to-Machine Secret (Must match SURYA_PAYIN_API_TOKEN in Payin-Backend)
# Generate a fresh 64-character hex string for production: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
PAYIN_API_TOKEN=d8b7a692f44c381e9b21665a3d4f820c7e19b5d2a63084c81f3e9b7201a4e5c8

# Webhook relay URL to notify Payin-Backend on payment confirmation
PAYIN_BACKEND_WEBHOOK_URL=https://api.suryape.in/api/webhooks/payu/payment
PAYIN_BACKEND_RAZORPAY_WEBHOOK_URL=https://api.suryape.in/api/webhooks/razorpay/payment
PAYIN_BACKEND_PHONEPE_WEBHOOK_URL=https://api.suryape.in/api/webhooks/phonepe/payment

# PayU Production Gateway Credentials
PAYU_ENV=production
PAYU_KEY=your_live_payu_merchant_key
PAYU_SALT=your_live_payu_merchant_salt

# Razorpay Production Credentials (Fallback if not passed dynamically)
RAZORPAY_KEY=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_SECRET=your_live_razorpay_secret

# PhonePe Production Credentials (Fallback if not passed dynamically)
PHONEPE_ENV=production
PHONEPE_MERCHANT_ID=Mxxxxxxxxxxxxxxxx
PHONEPE_SALT_KEY=your_live_phonepe_salt_key

# Customer Session Secret (64-character hex)
CUSTOMER_JWT_SECRET=c91a45f8e02d41b697815cf392b47e189f3a61d054e792c3a5b6781290fe34ab
```

---

### B. SuryaPe Backend (`Payin-Backend/.env`)

Deploy these variables to your API server (e.g. AWS EC2, DigitalOcean, Railway, or Docker):

```bash
# ==============================================================================
# SURYAPE BACKEND - PRODUCTION ENVIRONMENT
# ==============================================================================

NODE_ENV=production
PORT=8001

# Public HTTPS URL of this backend API (used for payment links and QR generation)
API_PUBLIC_URL=https://api.suryape.in

# Surya Enterprise MoR Bridge Endpoints
SURYA_PAYIN_CREATE_URL=https://www.suryaenter.in/api/payin/create-order
SURYA_PAYIN_BASE_URL=https://www.suryaenter.in
SURYA_PAYIN_API_TOKEN=d8b7a692f44c381e9b21665a3d4f820c7e19b5d2a63084c81f3e9b7201a4e5c8

# Allowed CORS Origins (Comma-separated, no trailing slash)
CORS_ORIGINS=https://merchant.suryape.in,https://app.suryape.in

# MongoDB Atlas Production Database
MONGO_URI=mongodb+srv://<db_user>:<db_password>@cluster0.xxxxx.mongodb.net/?appName=SuryaPe
DB_NAME=payin_platform

# JWT Security Secrets (Minimum 32 characters each)
JWT_SECRET=your_super_strong_production_jwt_secret_key_minimum_32_chars
MERCHANT_JWT_SECRET=your_super_strong_merchant_jwt_secret_key_minimum_32_chars
ENCRYPTION_KEY=32_byte_hex_encryption_key_for_secrets_xxxxxxxxxxxxxxxxxxxxxxx

# Payment Link Expiry (Seconds)
PAYMENT_LINK_TTL_SECONDS=1800
```

---

### C. SuryaPe Frontend (`Payin-Frontend/.env.production`)

Build-time variable for Vite (`npm run build`):

```bash
# Point directly to your public HTTPS API backend
VITE_API_URL=https://api.suryape.in/api
```

> **Note:** The frontend build tool automatically validates that `VITE_API_URL` begins with `https://`.

---

## 4. Payment Gateway Webhook & Portal Configuration

Log in to each banking dashboard and configure production webhooks and whitelists:

### 1. PayU Production Portal
* **Return URL (Success/Failure):** `https://www.suryaenter.in/api/payin/payu-callback`
* **Server IP Whitelisting:** If your PayU account has IP whitelisting enabled, add your production server’s static outbound IPv4 address.
* Verify that your Merchant Category Code (MCC) and GST details are verified.

### 2. Razorpay Dashboard
* Navigate to **Settings ➔ API Keys** and generate **Live Mode** Key ID and Key Secret.
* Navigate to **Settings ➔ Webhooks**:
  * **Webhook URL:** `https://www.suryaenter.in/api/payin/razorpay-callback`
  * **Active Events to Enable:**
    - `order.paid`
    - `payment.captured`
    - `payment.failed`
  * Copy the Webhook Secret and save it in your SuryaPe gateway credentials.

### 3. PhonePe Business Portal
* Contact your PhonePe integration manager to activate production status.
* Provide the technical team with your Server-to-Server (S2S) Callback URL:
  * **S2S Callback URL:** `https://www.suryaenter.in/api/payin/phonepe-callback`
* Confirm your Production Merchant ID (`M...`), Salt Key, and Salt Index (typically `1`).

---

## 5. MongoDB Atlas Production Security

1. **Network Access (IP Whitelist):**
   * Do **NOT** leave `0.0.0.0/0` (Allow Access from Anywhere) enabled in production.
   * Add the static public IP addresses of your web servers and backend instances.
2. **Dedicated Database Users:**
   * Create separate database users with read/write privileges:
     - `suryaenterprises_prod_user` with access only to `SURYAENTERPRISES`
     - `suryape_prod_user` with access only to `payin_platform`
3. **Connection Pooling:**
   * Ensure `maxPoolSize` is configured (default: `10-20` connections per instance) to avoid exhausting MongoDB Atlas connection limits.

---

## 6. Process Management & Zero Downtime (PM2)

In production, never run the application using plain `node` or `npm run dev`. Use **PM2** for cluster management, automatic restart on crash, and log rotation:

### Setup Commands for Linux Server:

```bash
# 1. Install PM2 globally
sudo npm install -g pm2

# 2. Start SuryaPe Backend in Cluster Mode (uses all CPU cores)
cd /var/www/Payin-Backend
pm2 start src/server.js --name "suryape-backend" -i max --env production

# 3. Start Surya Enterprises Next.js Production Server
cd /var/www/suryaenterprises
npm run build
pm2 start npm --name "suryaenterprises-store" -- start -- -p 3000

# 4. Save PM2 state to resurrect automatically on server reboot
pm2 startup
pm2 save
```

### Useful PM2 Monitoring Commands:
* `pm2 status` – View running instances and memory/CPU usage
* `pm2 logs suryape-backend` – View real-time streaming logs
* `pm2 reload all` – Zero-downtime rolling restart

---

## 7. Nginx Reverse Proxy & SSL Configuration

Example Nginx block with SSL termination, HTTP/2, and security headers:

```nginx
# /etc/nginx/sites-available/api.suryape.in
server {
    listen 80;
    server_name api.suryape.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.suryape.in;

    ssl_certificate /etc/letsencrypt/live/api.suryape.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.suryape.in/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

---

## 8. Post-Deployment Smoke Test (Verification)

Run this sequence once production deployment is complete:

1. **Health Check:**
   * Open `https://api.suryape.in/health` ➔ should return `{ "status": "ok" }`.
   * Open `https://www.suryaenter.in` ➔ should load the storefront home page.
2. **Live Low-Value Transaction (₹1.00 - ₹10.00):**
   * Create an order via API for ₹10.00.
   * Open the payment link and complete the transaction using real UPI (GPay/PhonePe).
3. **Verify Reconciliation:**
   * Verify the receipt transition on screen.
   * Verify the live webhook reaches the merchant server with `X-Surya-Signature`.
   * Check the **Merchant Console** (`https://merchant.suryape.in`): confirm `payoutBalance` increments by ₹10.00.
   * Check the **Surya Enterprise Admin Console** (`https://www.suryaenter.in/admin`): confirm the order is marked `Paid`.
