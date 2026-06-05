'use client';

import Link from 'next/link';
import { FaStar, FaRegStar, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function HomePage() {
  // Dummy data for featured products (matches design)
  const featuredProducts = [
    { id: 1, name: 'Linen Blend Shirt', price: 120.00, image: '/images/linen-shirt.jpg' },
    { id: 2, name: 'The Air S.', price: 185.00, image: '/images/air-s.jpg' },
  ];

  // Categories (design shows APPAREL, ACCESSORIES, HOME, WELLNESS)
  const categories = [
    { name: 'APPAREL', slug: 'apparel', icon: '👕' },
    { name: 'ACCESSORIES', slug: 'accessories', icon: '👜' },
    { name: 'HOME', slug: 'home', icon: '🏠' },
    { name: 'WELLNESS', slug: 'wellness', icon: '🧘' },
  ];

  // Best sellers dummy
  const bestSellers = [
    { id: 3, name: 'Light Blouse', price: 89, image: '/images/light-blouse.jpg' },
    { id: 4, name: 'Active Trainer', price: 120, image: '/images/active-trainer.jpg' },
    { id: 5, name: 'Nomad Waist Trainer', price: 75, image: '/images/nomad-waist.jpg' },
  ];

  // New arrivals dummy
  const newArrivals = [
    { id: 6, name: 'Silk Kimono', price: 210, oldPrice: 280, image: '/images/silk-kimono.jpg' },
    { id: 7, name: 'Linen Trousers', price: 145, image: '/images/linen-trousers.jpg' },
    { id: 8, name: 'Bamboo Socks', price: 25, image: '/images/bamboo-socks.jpg' },
  ];

  // Flash sale discounts
  const flashSale = [
    { id: 9, name: 'Cotton Oversized Tee', price: 39, oldPrice: 69, discount: '40% OFF', image: '/images/cotton-tee.jpg' },
    { id: 10, name: 'Leather Sandals', price: 89, oldPrice: 149, discount: '40% OFF', image: '/images/leather-sandals.jpg' },
  ];

  // AI recommended (personalized later)
  const aiRecommended = [
    { id: 11, name: 'Merino Wool Sweater', price: 159, image: '/images/merino-sweater.jpg' },
    { id: 12, name: 'Slip-on Clogs', price: 99, image: '/images/clogs.jpg' },
    { id: 13, name: 'Linen Joggers', price: 119, image: '/images/linen-joggers.jpg' },
  ];

  // Customer review (static from design)
  const review = {
    rating: 5,
    text: '"The quality of the linen is unmatched. It truly feels like wearing air."',
    author: '— Olivia Chen',
  };

  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      // API call would go here
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <>
      {/* Hero Section – "Light as Air" with SHOP NEW ARRIVALS button */}
      <div className="hero-section bg-light d-flex align-items-center" style={{ minHeight: '70vh', backgroundImage: 'linear-gradient(135deg, #f5f0eb 0%, #e8e0d8 100%)' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-1 fw-bold mb-3" style={{ letterSpacing: '-0.02em' }}>
                Light as Air
              </h1>
              <p className="lead mb-4">Discover effortless style and breathable comfort.</p>
              <Link href="/products?new=true" className="btn btn-dark btn-lg rounded-0 px-5 py-3">
                SHOP NEW ARRIVALS <FaArrowRight className="ms-2" />
              </Link>
            </div>
            <div className="col-lg-6 text-center">
              {/* Hero image placeholder (replace with actual) */}
              <div className="bg-white rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{ width: 300, height: 300, boxShadow: '0 20px 30px -10px rgba(0,0,0,0.1)' }}>
                <span className="display-1">🪶</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products section (matches design: Linen Blend Shirt & The Air S.) */}
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Featured</h2>
          <Link href="/products" className="text-dark text-decoration-none">View All →</Link>
        </div>
        <div className="row g-4">
          {featuredProducts.map((product) => (
            <div key={product.id} className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="bg-light text-center p-4" style={{ height: 300 }}>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="img-fluid h-100 object-fit-contain"
                    onError={(e) => { e.target.src = '/images/placeholders/placeholder.jpg'; }}
                  />
                </div>
                <div className="card-body text-center">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text fw-bold">${product.price.toFixed(2)}</p>
                  <Link href={`/products/${product.id}`} className="btn btn-outline-dark rounded-0 px-4">Shop Now</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Categories (APPAREL, ACCESSORIES, HOME, WELLNESS) */}
      <div className="bg-light py-5">
        <div className="container">
          <h2 className="fw-bold text-center mb-5">Shop by Category</h2>
          <div className="row g-4">
            {categories.map((cat) => (
              <div key={cat.slug} className="col-md-3 col-6">
                <Link href={`/categories/${cat.slug}`} className="text-decoration-none">
                  <div className="card border-0 text-center bg-transparent">
                    <div className="bg-white rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{ width: 120, height: 120, transition: '0.2s' }}>
                      <span style={{ fontSize: 48 }}>{cat.icon}</span>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title text-dark">{cat.name}</h5>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best Sellers section (with items from design: Light Blouse, Active Trainer, Nomad Waist Trainer) */}
      <div className="container py-5">
        <h2 className="fw-bold mb-4">Best Sellers</h2>
        <div className="row g-4">
          {bestSellers.map((product) => (
            <div key={product.id} className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="bg-light text-center p-4" style={{ height: 250 }}>
                  <span className="display-1">👚</span>
                </div>
                <div className="card-body text-center">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text fw-bold">${product.price}</p>
                  <button className="btn btn-sm btn-outline-dark rounded-0">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Arrivals + Flash Sale hybrid (can be two rows) */}
      <div className="bg-white py-5">
        <div className="container">
          <h2 className="fw-bold mb-4">New Arrivals</h2>
          <div className="row g-4 mb-5">
            {newArrivals.map((product) => (
              <div key={product.id} className="col-md-4">
                <div className="card border-0 shadow-sm">
                  <div className="bg-light text-center p-3 position-relative">
                    {product.oldPrice && <span className="badge bg-danger position-absolute top-0 start-0 m-2 rounded-0">NEW</span>}
                    <span className="display-1">✨</span>
                  </div>
                  <div className="card-body text-center">
                    <h5>{product.name}</h5>
                    <p className="mb-0">
                      <span className="fw-bold">${product.price}</span>
                      {product.oldPrice && <span className="text-muted ms-2"><del>${product.oldPrice}</del></span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Flash Sale / Discounts section */}
          <h2 className="fw-bold mb-4">⚡ Flash Sale – Up to 40% OFF</h2>
          <div className="row g-4">
            {flashSale.map((product) => (
              <div key={product.id} className="col-md-6">
                <div className="card border-0 bg-light overflow-hidden">
                  <div className="row g-0 align-items-center">
                    <div className="col-4 text-center p-3">
                      <span className="display-3">🔥</span>
                    </div>
                    <div className="col-8">
                      <div className="card-body">
                        <h5>{product.name}</h5>
                        <p className="mb-1"><span className="fw-bold">${product.price}</span> <del className="text-muted ms-2">${product.oldPrice}</del></p>
                        <p className="text-danger fw-bold">{product.discount}</p>
                        <Link href={`/products/${product.id}`} className="btn btn-sm btn-dark rounded-0">Grab Deal</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommended Products */}
      <div className="container py-5">
        <div className="d-flex align-items-center mb-4">
          <span className="badge bg-info text-dark me-2 px-3 py-2 rounded-0">✨ AI PICK</span>
          <h2 className="fw-bold mb-0">Recommended for You</h2>
        </div>
        <div className="row g-4">
          {aiRecommended.map((product) => (
            <div key={product.id} className="col-md-4 col-lg-3">
              <div className="card border-0 shadow-sm">
                <div className="bg-light text-center p-3">
                  <span className="display-4">🤖</span>
                </div>
                <div className="card-body text-center">
                  <h6>{product.name}</h6>
                  <p className="fw-bold">${product.price}</p>
                  <button className="btn btn-outline-dark btn-sm rounded-0 w-100">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Reviews (design quote with stars) */}
      <div className="bg-light py-5">
        <div className="container text-center">
          <div className="mb-3">
            {[...Array(review.rating)].map((_, i) => <FaStar key={i} className="text-warning fs-3 mx-1" />)}
          </div>
          <p className="fs-3 fst-italic">{review.text}</p>
          <p className="fw-bold">{review.author}</p>
          <div className="mt-3">
            <FaCheckCircle className="text-success me-2" />
            <span>Verified Customer · 5,000+ Happy Customers</span>
          </div>
        </div>
      </div>

      {/* Newsletter Subscription (exactly as design: Stay in the Air) */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <h2 className="fw-bold">Stay in the Air</h2>
            <p className="mb-4 text-muted">Receive exclusive access to new drops and stories.</p>
            {subscribed ? (
              <div className="alert alert-success">Thank you for subscribing!</div>
            ) : (
              <form onSubmit={handleSubscribe} className="row g-2 justify-content-center">
                <div className="col-sm-8">
                  <input
                    type="email"
                    className="form-control form-control-lg rounded-0"
                    placeholder="EMAIL ADDRESS"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-sm-auto">
                  <button type="submit" className="btn btn-dark btn-lg rounded-0 px-5">SUBSCRIBE</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer is already included from layout, but we can add some extra brand links? 
          The layout already has a global Footer, so we don't duplicate here. */}
    </>
  );
}