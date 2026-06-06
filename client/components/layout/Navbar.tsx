'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaShoppingCart, FaHeart, FaUser, FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const { user, logout } = useAuth();
    const { cart } = useCart();
    const { wishlist } = useWishlist();

    const cartCount = cart?.items?.length || 0;
    const wishlistCount = wishlist?.items?.length || 0;

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container position-relative">
                {/* Hamburger button */}
                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle navigation"
                >
                    {isMenuOpen ? <FaTimes size={20} color="#000" /> : <FaBars size={20} color="#000" />}
                </button>

                {/* Logo */}
                <Link className="navbar-brand fw-normal mx-auto mx-lg-0" href="/" style={{ color: '#000' }}>
                    Air Collection
                </Link>

                {/* Right icons (always visible) */}
                <div className="d-flex align-items-center gap-3">
                    {/* Search icon - visible on mobile/tablet only */}
                    <button
                        className="btn btn-link p-0 d-lg-none"
                        style={{ color: '#000' }}
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                    >
                        <FaSearch size={18} />
                    </button>

                    <Link href="/wishlist" className="position-relative" style={{ color: '#000' }}>
                        <FaHeart size={20} />
                        {wishlistCount > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    <Link href="/cart" className="position-relative" style={{ color: '#000' }}>
                        <FaShoppingCart size={20} />
                        {cartCount > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* User dropdown - hidden on mobile/tablet, visible on desktop */}
                    <div className="dropdown d-none d-lg-block">
                        <button
                            className="btn btn-link p-0 dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ color: '#000' }}
                        >
                            <FaUser size={20} />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            {user ? (
                                <>
                                    <li><Link className="dropdown-item" href="/profile">Profile</Link></li>
                                    <li><Link className="dropdown-item" href="/orders">My Orders</Link></li>
                                    {user.role === 'admin' && (
                                        <li><Link className="dropdown-item" href="/admin/dashboard">Admin Panel</Link></li>
                                    )}
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                                </>
                            ) : (
                                <>
                                    <li><Link className="dropdown-item" href="/auth/signin">Login</Link></li>
                                    <li><Link className="dropdown-item" href="/auth/signup">Register</Link></li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Collapsible menu */}
                <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className={`nav-link ${pathname === '/' ? 'active' : ''}`} href="/" onClick={() => setIsMenuOpen(false)} style={{ color: '#000' }}>
                                Home
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${pathname === '/categories' ? 'active' : ''}`} href="/categories" onClick={() => setIsMenuOpen(false)} style={{ color: '#000' }}>
                                Categories
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${pathname === '/about' ? 'active' : ''}`} href="/about" onClick={() => setIsMenuOpen(false)} style={{ color: '#000' }}>
                                About
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${pathname === '/contact' ? 'active' : ''}`} href="/contact" onClick={() => setIsMenuOpen(false)} style={{ color: '#000' }}>
                                Contact
                            </Link>
                        </li>
                    </ul>

                    {/* Desktop search form */}
                    <form className="d-none d-lg-flex me-3" action="/search" method="GET">
                        <div className="input-group">
                            <input
                                className="form-control form-control-sm"
                                type="search"
                                name="q"
                                placeholder="Search"
                                aria-label="Search"
                                style={{ borderColor: '#ccc' }}
                            />
                            <button className="btn btn-outline-secondary btn-sm" type="submit" style={{ borderColor: '#ccc', color: '#000' }}>
                                <FaSearch />
                            </button>
                        </div>
                    </form>

                    {/* Mobile search input (toggled by search icon) */}
                    {showMobileSearch && (
                        <div className="d-lg-none mt-3">
                            <form action="/search" method="GET" className="w-100">
                                <div className="input-group">
                                    <input
                                        className="form-control form-control-sm"
                                        type="search"
                                        name="q"
                                        placeholder="Search products..."
                                        aria-label="Search"
                                        style={{ borderColor: '#ccc' }}
                                    />
                                    <button className="btn btn-outline-secondary btn-sm" type="submit" style={{ borderColor: '#ccc', color: '#000' }}>
                                        <FaSearch />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}