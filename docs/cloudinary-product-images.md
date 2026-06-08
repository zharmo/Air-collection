# Cloudinary Product Images

> Deprecated: this was the old upload flow. New deployments save product and category images on the Hostinger VPS instead. Use `docs/hostinger-deployment.md` for production setup.

## What This Adds

- Admin users can upload product images from `Admin > Products > Add New Product`.
- The first uploaded product image is marked as primary by default.
- Color variant images also upload through the same Cloudinary-backed endpoint.
- Uploaded image URLs are stored in `product_images.image_url`.

## Required Server Env

Add these values to `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=air-collection/products
```

Never commit `server/.env`.

## Local Setup

Run this once after pulling the branch:

```bash
cd server
npm run init-db
```

Restart the API after changing env values:

```bash
npm run dev
```

## API Flow

1. `POST /api/products` creates the product.
2. `POST /api/products/:id/images` uploads each selected image to Cloudinary.
3. `PUT /api/products/:id/full` saves color and size variants.
4. `PUT /api/products/:id/images/:imageId/primary` changes the primary image.
