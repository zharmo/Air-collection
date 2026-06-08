# Hostinger VPS Deployment Guide

This project is a full-stack ecommerce app:

- `client/`: Next.js frontend
- `server/`: Express API
- PostgreSQL database
- Local image uploads stored on the hosting server in `uploads/`

The recommended production setup is a Hostinger VPS, not normal Web/Cloud hosting, because this project uses PostgreSQL and persistent uploaded product/category images.

## Target Domain

Initial domain:

```text
air-collection.softixel.com
```

Later client domain:

```text
client-domain.com
www.client-domain.com
```

Keep the app configured with environment variables so the domain can be changed without rewriting code.

## Production Architecture

```text
Visitor
  -> https://air-collection.softixel.com
  -> Nginx reverse proxy
     -> Next.js app on localhost:3000
     -> Express API on localhost:5000 for /api/*
     -> Express static uploads on localhost:5000 for /uploads/*
  -> PostgreSQL on same VPS
  -> Upload files stored at /var/www/air-collection/uploads
```

This keeps frontend, backend, database, and uploaded images on the Hostinger VPS.

## Required VPS Software

Install these on the VPS:

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib git curl unzip
```

Install Node.js 22:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install PM2:

```bash
sudo npm install -g pm2
```

## DNS Setup

In the DNS panel for `softixel.com`, add:

```text
Type: A
Name: air-collection
Value: YOUR_VPS_IP
TTL: Auto
```

After DNS points to the VPS, install SSL with Certbot.

## Clone Project

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/zharmo/Air-collection.git air-collection
cd air-collection
```

## PostgreSQL Setup

Create a production database and user:

```bash
sudo -u postgres psql
```

Inside PostgreSQL:

```sql
CREATE DATABASE air_collection;
CREATE USER air_collection_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE air_collection TO air_collection_user;
\q
```

Give schema permission:

```bash
sudo -u postgres psql -d air_collection
```

Inside PostgreSQL:

```sql
GRANT ALL ON SCHEMA public TO air_collection_user;
\q
```

## Server Environment

Create `server/.env` on the VPS:

```bash
nano server/.env
```

Use this template:

```env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_USER=air_collection_user
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
DB_NAME=air_collection

JWT_SECRET=CHANGE_THIS_LONG_RANDOM_SECRET
JWT_EXPIRE=30d
SESSION_SECRET=CHANGE_THIS_LONG_RANDOM_SESSION_SECRET

SITE_URL=https://air-collection.softixel.com
FRONTEND_URL=https://air-collection.softixel.com

EMAIL_USER=
EMAIL_PASS=
ADMIN_EMAIL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://air-collection.softixel.com/api/auth/google/callback

UPLOAD_DIR=/var/www/air-collection/uploads
UPLOAD_URL_PREFIX=/uploads
PRODUCT_UPLOAD_SUBDIR=products
CATEGORY_UPLOAD_SUBDIR=categories
```

Create the upload folders:

```bash
mkdir -p /var/www/air-collection/uploads/products
mkdir -p /var/www/air-collection/uploads/categories
```

## Client Environment

Create `client/.env.local` on the VPS:

```bash
nano client/.env.local
```

Use:

```env
NEXT_PUBLIC_API_URL=https://air-collection.softixel.com/api
```

## Install Dependencies

```bash
cd /var/www/air-collection/server
npm install --omit=dev

cd /var/www/air-collection/client
npm install
```

## Initialize Database Tables

```bash
cd /var/www/air-collection/server
npm run init-db
```

## Build Frontend

```bash
cd /var/www/air-collection/client
npm run build
```

## Start Apps With PM2

Start backend:

```bash
cd /var/www/air-collection/server
pm2 start server.js --name air-api
```

Start frontend:

```bash
cd /var/www/air-collection/client
pm2 start npm --name air-client -- start
```

Save PM2 processes:

```bash
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`.

## Nginx Config

Create:

```bash
sudo nano /etc/nginx/sites-available/air-collection
```

Paste:

```nginx
server {
    listen 80;
    server_name air-collection.softixel.com;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/air-collection /etc/nginx/sites-enabled/air-collection
sudo nginx -t
sudo systemctl reload nginx
```

## SSL

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Create SSL certificate:

```bash
sudo certbot --nginx -d air-collection.softixel.com
```

## Verify Deployment

Check backend health:

```bash
curl https://air-collection.softixel.com/api/health
```

Expected response:

```json
{"message":"Server is running","success":true}
```

Open:

```text
https://air-collection.softixel.com
```

Then test:

- Signup/login
- Admin login
- Add category with image
- Add product with image
- Product listing image display
- Cart
- Checkout as logged-in user
- Checkout as guest user
- Admin orders customer info

## Update Deployment

When new code is pushed:

```bash
cd /var/www/air-collection
git pull origin main

cd server
npm install --omit=dev
npm run init-db
pm2 restart air-api

cd ../client
npm install
npm run build
pm2 restart air-client
```

## Backup

Database backup:

```bash
mkdir -p /var/backups/air-collection
pg_dump -U air_collection_user -h localhost air_collection > /var/backups/air-collection/db-$(date +%F).sql
```

Uploads backup:

```bash
tar -czf /var/backups/air-collection/uploads-$(date +%F).tar.gz /var/www/air-collection/uploads
```

Restore database:

```bash
psql -U air_collection_user -h localhost air_collection < /path/to/backup.sql
```

Restore uploads:

```bash
tar -xzf /path/to/uploads-backup.tar.gz -C /
```

## Change To Client Domain Later

When the client gives the final domain:

1. Point the final domain DNS A record to the VPS IP.
2. Update `server/.env`:

```env
SITE_URL=https://client-domain.com
FRONTEND_URL=https://client-domain.com
GOOGLE_CALLBACK_URL=https://client-domain.com/api/auth/google/callback
```

3. Update `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://client-domain.com/api
```

4. Update Nginx `server_name`:

```nginx
server_name client-domain.com www.client-domain.com;
```

5. Rebuild/restart:

```bash
cd /var/www/air-collection/client
npm run build
pm2 restart air-client
pm2 restart air-api
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d client-domain.com -d www.client-domain.com
```

## Performance Notes

- Keep images in WebP or compressed JPEG when uploading.
- Keep Nginx cache headers for `/uploads/`.
- Use PM2 so Node apps restart after crashes and server reboot.
- Keep PostgreSQL on the same VPS for low latency.
- Upgrade VPS RAM/CPU if traffic grows or builds fail from memory pressure.
- Run backups before each major update.

## Important Notes

- Do not commit `.env` files.
- Do not delete `/var/www/air-collection/uploads` during deployment.
- If you redeploy by replacing the whole folder, backup `uploads/` first.
- Cloudinary is no longer required for new product/category uploads.
