'use client';

import Link from 'next/link';
import { FaLeaf, FaRecycle, FaHandsHelping, FaFeatherAlt } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-light py-5" style={{ background: 'linear-gradient(135deg, #f5f0eb 0%, #e8e0d8 100%)' }}>
        <div className="container py-5">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h1 className="display-1 fw-bold mb-3">AIR COLLECTION</h1>
              <p className="lead fs-3">Where Comfort Meets Conscience</p>
              <div className="mt-4">
                <Link href="/products" className="btn btn-dark btn-lg rounded-0 px-5">
                  Explore Collection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-md-6">
            <h2 className="fw-bold mb-3">Our Story</h2>
            <p className="lead">Founded in 2024, Air Collection was born from a simple idea: clothing should feel like a second skin — weightless, breathable, and effortless.</p>
            <p>We started with a small atelier in the city, sourcing organic European flax and working with artisans who share our passion for slow fashion. Today, we create pieces that transcend seasons, designed to age with grace and reduce waste.</p>
            <p>Every garment is a testament to mindful production, ethical labor, and uncompromised comfort.</p>
          </div>
          <div className="col-md-6">
            <div className="bg-light p-4 text-center" style={{ minHeight: 300 }}>
              <img
                src="/images/about/story-image.jpg"
                alt="Our atelier"
                className="img-fluid"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholders/placeholder.jpg'; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">What We Stand For</h2>
          <div className="row g-4 text-center">
            <div className="col-md-3">
              <div className="p-4">
                <FaLeaf className="fs-1 mb-3 text-success" />
                <h4>Sustainable</h4>
                <p className="text-muted">100% organic, biodegradable materials from ethical sources.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4">
                <FaFeatherAlt className="fs-1 mb-3 text-primary" />
                <h4>Light as Air</h4>
                <p className="text-muted">Weightless fabrics that move with you, never against you.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4">
                <FaRecycle className="fs-1 mb-3 text-secondary" />
                <h4>Circular Design</h4>
                <p className="text-muted">Garments made to last, repair, and eventually return to nature.</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-4">
                <FaHandsHelping className="fs-1 mb-3 text-dark" />
                <h4>Fair Craftsmanship</h4>
                <p className="text-muted">Living wages and safe working conditions for all partners.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Mission / Quote */}
      <div className="bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h3 className="fw-bold fst-italic fs-2">“We believe that luxury is not about price, but about feeling — the feel of the fabric, the freedom of movement, the quiet confidence of wearing less but better.”</h3>
              <p className="mt-4 fw-semibold">— Elena Marchetti, Creative Director</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Stats */}
      <div className="container py-5">
        <div className="row text-center g-4">
          <div className="col-md-3">
            <div className="display-3 fw-bold">100%</div>
            <p className="text-muted">Organic Materials</p>
          </div>
          <div className="col-md-3">
            <div className="display-3 fw-bold">-45%</div>
            <p className="text-muted">Water Usage vs Industry</p>
          </div>
          <div className="col-md-3">
            <div className="display-3 fw-bold">0</div>
            <p className="text-muted">Single‑use Plastic</p>
          </div>
          <div className="col-md-3">
            <div className="display-3 fw-bold">1%</div>
            <p className="text-muted">Donated to Environmental Causes</p>
          </div>
        </div>
      </div>

      {/* Join the movement CTA */}
      <div className="bg-dark text-white py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-3">Be Part of the Change</h2>
          <p className="lead mb-4">Join a community that values quality, ethics, and the planet.</p>
          <Link href="/auth/signup" className="btn btn-outline-light rounded-0 px-5 py-2">
            Sign Up for Updates
          </Link>
        </div>
      </div>
    </div>
  );
}