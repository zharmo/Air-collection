'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FaStar, FaStarHalfAlt, FaRegStar, FaTruck, FaUndo } from 'react-icons/fa';

// Dummy product data (simulate API fetch)
const dummyProduct = {
  id: 1,
  name: 'Linen Lounge Shirt',
  price: 145,
  comparePrice: null,
  description: 'Woven from 100% organic European flax, our signature shirt captures the essence of weightless movement. A garment designed to age with grace, offering a breathable, textured feel that evolves with every wear.',
  sustainability: 'SUSTAINABILITY FIRST',
  rating: 4.9,
  reviewCount: 124,
  images: [
    '/images/linen-shirt-1.jpg',
    '/images/linen-shirt-2.jpg',
    '/images/linen-shirt-3.jpg',
  ],
  colors: ['Natural', 'Oatmeal', 'Charcoal'],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  inStock: true,
  deliveryBadges: [
    { icon: FaTruck, text: 'CARBON NEUTRAL DELIVERY' },
    { icon: FaUndo, text: '30-DAY CURATED RETURNS' },
  ],
  reviews: [
    {
      id: 1,
      author: 'ELENA V.',
      rating: 5,
      date: 'March 2024',
      text: 'The texture is beyond anything I\'ve found in other brands. It feels like air against the skin but has a beautiful, substantial weight that makes it hang perfectly. Truly an essential piece.',
    },
    {
      id: 2,
      author: 'MARCUS T.',
      rating: 5,
      date: 'February 2024',
      text: 'The fit is generous but structured. I wore this through a humid week in Milan and it stayed crisp and cool. The sustainability aspect makes the purchase even more rewarding.',
    },
  ],
  relatedProducts: [
    { id: 2, name: 'Tailored Wool Trouser', price: 220, image: '/images/wool-trouser.jpg', slug: 'tailored-wool-trouser' },
    { id: 3, name: 'Minimalist Leather Slide', price: 185, image: '/images/leather-slide.jpg', slug: 'minimalist-leather-slide' },
  ],
  recommendedProducts: [
    { id: 4, name: 'ESSENTIAL COTTON TEE', price: 65, image: '/images/cotton-tee.jpg', slug: 'essential-cotton-tee' },
    { id: 5, name: 'RELAXED CHINO', price: 130, image: '/images/relaxed-chino.jpg', slug: 'relaxed-chino' },
  ],
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId;
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(0);

  // Simulate API fetch
  useEffect(() => {
    // In real app: fetch from API using productId
    setProduct(dummyProduct);
    setSelectedColor(dummyProduct.colors[0]);
    setLoading(false);
  }, [productId]);

  const handleAddToCart = () => {
    // Will connect to CartContext later
    alert(`Added ${product?.name} (${selectedColor}, ${selectedSize}) to cart`);
  };

  const handleBuyNow = () => {
    // Redirect to checkout after adding to cart
    handleAddToCart();
    // window.location.href = '/checkout';
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h2>Product not found</h2>
        <Link href="/" className="btn btn-dark rounded-0">Back to Home</Link>
      </div>
    );
  }

  // Render star rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    return (
      <>
        {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} className="text-warning" />)}
        {hasHalf && <FaStarHalfAlt className="text-warning" />}
        {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} className="text-warning" />)}
      </>
    );
  };

  return (
    <div className="container py-5">
      {/* Product details main row */}
      <div className="row g-5 mb-5">
        {/* Product Images (gallery) */}
        <div className="col-md-6">
          <div className="mb-3 bg-light text-center p-4" style={{ minHeight: 400 }}>
            {/* Main image placeholder – replace with actual img tag */}
            <img
              src={product.images[mainImage] || '/images/placeholder.jpg'}
              alt={product.name}
              className="img-fluid"
              style={{ maxHeight: 400, objectFit: 'contain' }}
              onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
            />
          </div>
          <div className="d-flex gap-2">
            {product.images.map((img, idx) => (
              <div
                key={idx}
                className={`border p-1 ${mainImage === idx ? 'border-dark' : 'border-muted'}`}
                style={{ width: 80, cursor: 'pointer' }}
                onClick={() => setMainImage(idx)}
              >
                <img src={img} alt={`Thumb ${idx}`} className="img-fluid" onError={(e) => { e.target.src = '/images/placeholder.jpg'; }} />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-start">
            <h1 className="display-6 fw-bold">{product.name}</h1>
            <div className="text-end">
              <span className="badge bg-success rounded-0 px-3 py-2">{product.sustainability}</span>
              <div className="mt-2">
                <strong>{product.rating}</strong> <span className="text-muted">/ 5.0</span>
              </div>
            </div>
          </div>

          <p className="fs-2 fw-bold mt-3">${product.price}</p>
          {product.comparePrice && (
            <p className="text-muted"><del>${product.comparePrice}</del> <span className="text-danger">Sale</span></p>
          )}

          <p className="mt-3">{product.description}</p>

          {/* Color selection */}
          <div className="mt-4">
            <label className="fw-bold mb-2">COLOR / {selectedColor}</label>
            <div className="d-flex gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  className={`btn btn-sm rounded-0 ${selectedColor === color ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size selection */}
          <div className="mt-4">
            <label className="fw-bold mb-2">SELECT SIZE</label>
            <div className="d-flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`btn btn-sm rounded-0 ${selectedSize === size ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-4">
            <label className="fw-bold mb-2">QUANTITY</label>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-secondary rounded-0"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <span className="px-3 py-1 border">{quantity}</span>
              <button
                className="btn btn-outline-secondary rounded-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 d-flex gap-3">
            <button className="btn btn-dark rounded-0 px-5 py-2 flex-grow-1" onClick={handleAddToCart}>
              ADD TO BAG
            </button>
            <button className="btn btn-outline-dark rounded-0 px-5 py-2" onClick={handleBuyNow}>
              BUY NOW
            </button>
          </div>

          {/* Delivery badges */}
          <div className="mt-4 d-flex flex-wrap gap-3">
            {product.deliveryBadges.map((badge, idx) => (
              <div key={idx} className="d-flex align-items-center gap-2 text-muted small">
                <badge.icon />
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete the Look (Related Products) */}
      <div className="mb-5">
        <h2 className="fw-bold mb-4">Complete the Look</h2>
        <div className="row g-4">
          {product.relatedProducts.map((related) => (
            <div key={related.id} className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="bg-light text-center p-4" style={{ height: 250 }}>
                  <img src={related.image} alt={related.name} className="img-fluid h-100" onError={(e) => { e.target.src = '/images/placeholder.jpg'; }} />
                </div>
                <div className="card-body text-center">
                  <h5 className="card-title">{related.name}</h5>
                  <p className="card-text fw-bold">${related.price}</p>
                  <Link href={`/products/${related.id}`} className="btn btn-outline-dark rounded-0">
                    SHOP NOW
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Curated Reviews Section */}
      <div className="bg-light p-4 p-md-5 mb-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold">CURATED REVIEWS</h2>
          <div className="d-flex justify-content-center align-items-center gap-2 mt-2">
            <span className="fs-2 fw-bold">{product.rating}</span>
            <span className="fs-4">/ 5.0</span>
            <div className="ms-2">{renderStars(product.rating)}</div>
          </div>
          <p className="text-muted mt-1">BASED ON {product.reviewCount} VERIFIED OWNERS</p>
        </div>

        <div className="row g-4">
          {product.reviews.map((review) => (
            <div key={review.id} className="col-md-6">
              <div className="mb-3">
                <div className="mb-2">{renderStars(review.rating)}</div>
                <p className="fst-italic">"{review.text}"</p>
                <div className="d-flex justify-content-between">
                  <strong>{review.author}</strong>
                  <span className="text-muted">{review.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <button className="btn btn-outline-dark rounded-0 px-5 py-2">READ ALL REVIEWS</button>
        </div>
      </div>

      {/* Recommended for You (AI recommended) */}
      <div>
        <h2 className="fw-bold mb-4">RECOMMENDED FOR YOU</h2>
        <div className="row g-4">
          {product.recommendedProducts.map((rec) => (
            <div key={rec.id} className="col-md-6 col-lg-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="bg-light text-center p-4" style={{ height: 200 }}>
                  <img src={rec.image} alt={rec.name} className="img-fluid h-100" onError={(e) => { e.target.src = '/images/placeholder.jpg'; }} />
                </div>
                <div className="card-body text-center">
                  <h6>{rec.name}</h6>
                  <p className="fw-bold">${rec.price}</p>
                  <Link href={`/products/${rec.id}`} className="btn btn-sm btn-outline-dark rounded-0 w-100">
                    VIEW PRODUCT
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}