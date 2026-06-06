'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
    FaShoppingCart, FaHeart, FaUser, FaSearch,
    FaTimes, FaChevronDown, FaSignOutAlt, FaTachometerAlt,
    FaBoxOpen, FaUserCircle
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const { user, logout } = useAuth();
    const { cart } = useCart();
    const { wishlist } = useWishlist();

    const cartCount = cart?.items?.length || 0;
    const wishlistCount = wishlist?.items?.length || 0;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (showSearch && searchRef.current) searchRef.current.focus();
    }, [showSearch]);

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    const navLinks = [
        { label: 'Home', href: '/' },
        { label: 'Categories', href: '/categories' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
    ];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

                :root {
                    --nav-height: 72px;
                    --ink: #0a0a0a;
                    --ink-soft: #5a5a5a;
                    --surface: #ffffff;
                    --accent: #c8a96e;
                    --accent-dark: #a8893e;
                    --border: rgba(0,0,0,0.08);
                }

                .air-navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    height: var(--nav-height);
                    display: flex;
                    align-items: center;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    background: rgba(255,255,255,0);
                    border-bottom: 1px solid transparent;
                }

                .air-navbar.scrolled {
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom-color: var(--border);
                    box-shadow: 0 1px 40px rgba(0,0,0,0.06);
                }

                .air-navbar.menu-open {
                    background: var(--surface);
                    border-bottom-color: var(--border);
                }

                .nav-inner {
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 32px;
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    gap: 24px;
                }

                .nav-logo {
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 600;
                    font-size: 22px;
                    letter-spacing: 0.12em;
                    color: var(--ink);
                    text-decoration: none;
                    text-transform: uppercase;
                    transition: opacity 0.2s;
                    grid-column: 2;
                    white-space: nowrap;
                }

                .nav-logo:hover { opacity: 0.7; color: var(--ink); }

                .nav-links {
                    display: flex;
                    align-items: center;
                    gap: 36px;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    grid-column: 1;
                }

                .nav-links a {
                    font-family: 'Jost', sans-serif;
                    font-size: 11.5px;
                    font-weight: 500;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: var(--ink);
                    text-decoration: none;
                    position: relative;
                    padding-bottom: 4px;
                    transition: color 0.2s;
                }

                .nav-links a::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 0;
                    height: 1px;
                    background: var(--accent);
                    transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .nav-links a:hover::after,
                .nav-links a.active-link::after {
                    width: 100%;
                }

                .nav-links a.active-link {
                    color: var(--ink);
                }

                .nav-links a:hover {
                    color: var(--ink);
                }

                .nav-actions {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    grid-column: 3;
                    justify-content: flex-end;
                }

                .nav-icon-btn {
                    background: none;
                    border: none;
                    padding: 6px;
                    cursor: pointer;
                    color: var(--ink);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: opacity 0.2s, transform 0.2s;
                    text-decoration: none;
                }

                .nav-icon-btn:hover {
                    opacity: 0.55;
                    transform: translateY(-1px);
                    color: var(--ink);
                }

                .nav-badge {
                    position: absolute;
                    top: -4px;
                    right: -6px;
                    background: var(--ink);
                    color: #fff;
                    font-family: 'Jost', sans-serif;
                    font-size: 9px;
                    font-weight: 600;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    letter-spacing: 0;
                }

                .nav-divider {
                    width: 1px;
                    height: 20px;
                    background: var(--border);
                }

                /* Search overlay */
                .search-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1100;
                    background: rgba(10,10,10,0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: flex-start;
                    padding-top: 120px;
                    justify-content: center;
                    animation: fadeIn 0.25s ease;
                }

                .search-box {
                    background: var(--surface);
                    width: 100%;
                    max-width: 640px;
                    margin: 0 24px;
                    padding: 8px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border-bottom: 2px solid var(--ink);
                }

                .search-box input {
                    flex: 1;
                    border: none;
                    outline: none;
                    font-family: 'Jost', sans-serif;
                    font-size: 20px;
                    font-weight: 300;
                    letter-spacing: 0.04em;
                    color: var(--ink);
                    background: transparent;
                    padding: 12px 0;
                }

                .search-box input::placeholder { color: #aaa; }

                .search-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--ink-soft);
                    padding: 8px;
                    transition: color 0.2s;
                }

                .search-close:hover { color: var(--ink); }

                /* User dropdown */
                .user-dropdown {
                    position: relative;
                }

                .user-menu {
                    position: absolute;
                    top: calc(100% + 16px);
                    right: 0;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    min-width: 200px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
                    animation: dropDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 200;
                }

                .user-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 20px;
                    font-family: 'Jost', sans-serif;
                    font-size: 12px;
                    font-weight: 500;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: var(--ink);
                    text-decoration: none;
                    cursor: pointer;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    transition: background 0.15s;
                    border-bottom: 1px solid var(--border);
                }

                .user-menu-item:last-child { border-bottom: none; }
                .user-menu-item:hover { background: #fafaf8; }
                .user-menu-item svg { opacity: 0.5; }

                /* Mobile menu */
                .mobile-menu {
                    position: fixed;
                    top: var(--nav-height);
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--surface);
                    z-index: 999;
                    padding: 40px 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    overflow-y: auto;
                    transform: translateX(${isMenuOpen ? '0' : '100%'});
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .mobile-nav-link {
                    display: block;
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 36px;
                    font-weight: 500;
                    color: var(--ink);
                    text-decoration: none;
                    padding: 16px 0;
                    border-bottom: 1px solid var(--border);
                    letter-spacing: 0.04em;
                    transition: opacity 0.2s, padding-left 0.3s;
                }

                .mobile-nav-link:hover {
                    opacity: 0.5;
                    padding-left: 8px;
                }

                .mobile-user-section {
                    margin-top: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                .mobile-user-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: 'Jost', sans-serif;
                    font-size: 12px;
                    font-weight: 500;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    text-decoration: none;
                    padding: 14px 0;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    transition: color 0.2s;
                }

                .mobile-user-link:hover { color: var(--ink); }

                .hamburger-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px;
                    color: var(--ink);
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    display: none;
                }

                .ham-line {
                    width: 24px;
                    height: 1.5px;
                    background: var(--ink);
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                    transform-origin: center;
                }

                .ham-line.open:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
                .ham-line.open:nth-child(2) { opacity: 0; transform: scaleX(0); }
                .ham-line.open:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes dropDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 1024px) {
                    .nav-inner {
                        grid-template-columns: auto 1fr auto;
                        padding: 0 20px;
                    }
                    .nav-logo { grid-column: 2; text-align: center; }
                    .nav-links { display: none; }
                    .hamburger-btn { display: flex; grid-column: 1; }
                    .nav-actions { grid-column: 3; }
                }
            `}</style>

            <nav className={`air-navbar ${scrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
                <div className="nav-inner">
                    {/* Hamburger — mobile only */}
                    <button
                        className="hamburger-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span className={`ham-line ${isMenuOpen ? 'open' : ''}`} />
                        <span className={`ham-line ${isMenuOpen ? 'open' : ''}`} />
                        <span className={`ham-line ${isMenuOpen ? 'open' : ''}`} />
                    </button>

                    {/* Nav links — desktop */}
                    <ul className="nav-links">
                        {navLinks.map(link => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={pathname === link.href ? 'active-link' : ''}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Logo */}
                    <Link href="/" className="nav-logo">Air Collection</Link>

                    {/* Action icons */}
                    <div className="nav-actions">
                        <button className="nav-icon-btn" onClick={() => setShowSearch(true)} aria-label="Search">
                            <FaSearch size={16} />
                        </button>

                        <div className="nav-divider" />

                        <Link href="/wishlist" className="nav-icon-btn" aria-label="Wishlist">
                            <FaHeart size={16} />
                            {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
                        </Link>

                        <Link href="/cart" className="nav-icon-btn" aria-label="Cart">
                            <FaShoppingCart size={16} />
                            {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                        </Link>

                        {/* Desktop user dropdown */}
                        <div className="user-dropdown" style={{ display: 'none' }} id="desktop-user">
                            <button
                                className="nav-icon-btn"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                aria-label="Account"
                            >
                                <FaUser size={15} />
                                <FaChevronDown size={9} style={{ marginLeft: 4, opacity: 0.5 }} />
                            </button>
                            {showUserMenu && (
                                <>
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="user-menu">
                                        {user ? (
                                            <>
                                                <Link href="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    <FaUserCircle size={13} /> Profile
                                                </Link>
                                                <Link href="/orders" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    <FaBoxOpen size={13} /> My Orders
                                                </Link>
                                                {user.role === 'admin' && (
                                                    <Link href="/admin/dashboard" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                        <FaTachometerAlt size={13} /> Admin Panel
                                                    </Link>
                                                )}
                                                <button className="user-menu-item" onClick={handleLogout}>
                                                    <FaSignOutAlt size={13} /> Logout
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link href="/auth/signin" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    Login
                                                </Link>
                                                <Link href="/auth/signup" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    Register
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Always visible user icon (desktop) */}
                        <div className="user-dropdown" style={{ display: 'flex' }}>
                            <button
                                className="nav-icon-btn"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                aria-label="Account"
                            >
                                <FaUser size={15} />
                            </button>
                            {showUserMenu && (
                                <>
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="user-menu">
                                        {user ? (
                                            <>
                                                <Link href="/profile" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    <FaUserCircle size={13} /> Profile
                                                </Link>
                                                <Link href="/orders" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    <FaBoxOpen size={13} /> My Orders
                                                </Link>
                                                {user.role === 'admin' && (
                                                    <Link href="/admin/dashboard" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                        <FaTachometerAlt size={13} /> Admin Panel
                                                    </Link>
                                                )}
                                                <button className="user-menu-item" onClick={handleLogout}>
                                                    <FaSignOutAlt size={13} /> Logout
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link href="/auth/signin" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    Login
                                                </Link>
                                                <Link href="/auth/signup" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                                                    Register
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Search Overlay */}
            {showSearch && (
                <div className="search-overlay" onClick={() => setShowSearch(false)}>
                    <div className="search-box" onClick={e => e.stopPropagation()}>
                        <FaSearch size={16} style={{ color: '#999', flexShrink: 0 }} />
                        <form action="/search" method="GET" style={{ flex: 1 }}>
                            <input
                                ref={searchRef}
                                type="search"
                                name="q"
                                placeholder="Search for products…"
                            />
                        </form>
                        <button className="search-close" onClick={() => setShowSearch(false)}>
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Menu */}
            <div
                className="mobile-menu"
                style={{
                    transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'fixed',
                    top: 'var(--nav-height)',
                    left: 0, right: 0, bottom: 0,
                    background: '#fff',
                    zIndex: 999,
                    padding: '40px 32px',
                    overflowY: 'auto',
                }}
            >
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="mobile-nav-link"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {link.label}
                    </Link>
                ))}
                <div className="mobile-user-section">
                    {user ? (
                        <>
                            <Link href="/profile" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                                <FaUserCircle size={14} /> Profile
                            </Link>
                            <Link href="/orders" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                                <FaBoxOpen size={14} /> My Orders
                            </Link>
                            {user.role === 'admin' && (
                                <Link href="/admin/dashboard" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                                    <FaTachometerAlt size={14} /> Admin Panel
                                </Link>
                            )}
                            <button className="mobile-user-link" onClick={handleLogout}>
                                <FaSignOutAlt size={14} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/signin" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                                Login
                            </Link>
                            <Link href="/auth/signup" className="mobile-user-link" onClick={() => setIsMenuOpen(false)}>
                                Create Account
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Navbar spacer */}
            <div style={{ height: 'var(--nav-height)' }} />
        </>
    );
}
