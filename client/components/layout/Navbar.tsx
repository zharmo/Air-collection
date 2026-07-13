"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  FaShoppingCart,
  FaHeart,
  FaUser,
  FaSearch,
  FaTimes,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBoxOpen,
  FaUserCircle,
  FaArrowRight,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { HiMenuAlt2, HiOutlineMenu } from "react-icons/hi";

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
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMenuOpen(false);
    window.location.href = "/";
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "All Products", href: "/products" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  // Drawer's account section mirrors the desktop dropdown, so tablet/mobile
  // users get the same routes (Profile, Orders, Admin Panel, Logout) the
  // icon-based dropdown gives desktop users.
  interface DrawerAccountLink {
    label: string;
    href: string;
    icon: React.ReactNode;
    count?: number;
  }

  const drawerAccountLinks: DrawerAccountLink[] = user
    ? [
        { label: "My Account", href: "/profile", icon: <FaUserCircle size={11} /> },
        { label: "My Orders", href: "/orders", icon: <FaBoxOpen size={11} /> },
        { label: "Wishlist", href: "/wishlist", icon: <FaHeart size={11} />, count: wishlistCount },
        ...(user.role === "admin"
          ? [{ label: "Admin Panel", href: "/admin/dashboard", icon: <FaTachometerAlt size={11} /> }]
          : []),
      ]
    : [
        { label: "Wishlist", href: "/wishlist", icon: <FaHeart size={11} />, count: wishlistCount },
        { label: "Login", href: "/auth/signin", icon: <FaUserCircle size={11} /> },
        { label: "Register", href: "/auth/signup", icon: <FaUserCircle size={11} /> },
      ];

  return (
    <>
      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

                :root {
                    --nav-h: 66px;
                    --ink: #0a0a0a;
                    --ink-soft: #5c5c5c;
                    --ink-faint: #aaa;
                    --white: #ffffff;
                    --warm: #fafaf7;
                    --accent: #c8a96e;
                    --border: rgba(0,0,0,0.09);
                }

                /* ─── Navbar shell ─── */
                .ac-nav {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 1000;
                    height: var(--nav-h);
                    transition: background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
                    background: transparent;
                    border-bottom: 1px solid transparent;
                }
                .ac-nav.is-scrolled,
                .ac-nav.is-open {
                    background: rgba(255,255,255,0.96);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    border-bottom-color: var(--border);
                    box-shadow: 0 2px 28px rgba(0,0,0,0.07);
                }

                /* ─── Three-column flex bar ─── */
                .ac-bar {
                    height: var(--nav-h);
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 36px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                }

                /* ─── Left: desktop links OR hamburger ─── */
                .ac-left {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 32px;
                    list-style: none;
                    margin: 0; padding: 0;
                    min-width: 0;
                }

                /* Desktop nav link */
                .ac-left a {
                    font-family: 'Jost', sans-serif;
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: var(--ink);
                    text-decoration: none;
                    position: relative;
                    padding-bottom: 3px;
                    white-space: nowrap;
                    transition: opacity 0.2s;
                }
                .ac-left a::after {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0;
                    width: 0; height: 1px;
                    background: var(--accent);
                    transition: width 0.32s cubic-bezier(0.16,1,0.3,1);
                }
                .ac-left a:hover { opacity: 0.55; }
                .ac-left a:hover::after,
                .ac-left a.is-active::after { width: 100%; }

                /* Hamburger button — hidden on desktop */
                .ac-burger {
                    display: none;
                    flex-direction: column;
                    justify-content: center;
                    gap: 5px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px 4px;
                    -webkit-tap-highlight-color: transparent;
                }
                .ac-burger-line {
                    width: 22px;
                    height: 1.5px;
                    background: var(--ink);
                    border-radius: 2px;
                    transition: transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.2s;
                    transform-origin: center;
                }
                .ac-burger.is-open .ac-burger-line:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
                .ac-burger.is-open .ac-burger-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
                .ac-burger.is-open .ac-burger-line:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

                /* ─── Center: logo ─── */
                .ac-logo {
                    flex-shrink: 0;
                    font-family: 'Cormorant Garamond', serif;
                    font-weight: 600;
                    font-size: 20px;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    color: var(--ink);
                    text-decoration: none;
                    transition: opacity 0.2s;
                    white-space: nowrap;
                }
                .ac-logo:hover { opacity: 0.6; color: var(--ink); }

                /* ─── Right: icons ─── */
                .ac-icons {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                }

                .ac-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 38px;
                    height: 38px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--ink);
                    text-decoration: none;
                    border-radius: 50%;
                    transition: background 0.18s, opacity 0.18s;
                    -webkit-tap-highlight-color: transparent;
                    flex-shrink: 0;
                }
                .ac-icon:hover { background: rgba(0,0,0,0.05); color: var(--ink); }

                .ac-badge {
                    position: absolute;
                    top: 4px; right: 4px;
                    background: var(--ink);
                    color: #fff;
                    font-family: 'Jost', sans-serif;
                    font-size: 8px;
                    font-weight: 700;
                    min-width: 14px;
                    height: 14px;
                    border-radius: 7px;
                    padding: 0 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    pointer-events: none;
                }

                .ac-divider {
                    width: 1px;
                    height: 16px;
                    background: rgba(0,0,0,0.12);
                    flex-shrink: 0;
                    margin: 0 2px;
                }

                /* Icons that only make sense once the desktop account dropdown
                   is available — hidden on tablet/mobile, where the drawer
                   carries Wishlist and account links instead. */
                @media (max-width: 1024px) {
                    .ac-icon-desktop-only { display: none; }
                }

                /* ─── User dropdown ─── */
                .ac-user-wrap { position: relative; }
                .ac-dropdown {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: var(--white);
                    border: 1px solid rgba(0,0,0,0.11);
                    min-width: 190px;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.13);
                    z-index: 500;
                    animation: acDropIn 0.2s cubic-bezier(0.16,1,0.3,1);
                }
                .ac-drop-item {
                    display: flex; align-items: center; gap: 10px;
                    padding: 13px 18px;
                    font-family: 'Jost', sans-serif;
                    font-size: 11px; font-weight: 500;
                    letter-spacing: 0.12em; text-transform: uppercase;
                    color: var(--ink); text-decoration: none;
                    cursor: pointer; background: none; border: none;
                    width: 100%; text-align: left;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.14s;
                }
                .ac-drop-item:last-child { border-bottom: none; }
                .ac-drop-item:hover { background: var(--warm); }
                .ac-drop-item svg { opacity: 0.4; flex-shrink: 0; }

                /* ─── Search overlay ─── */
                .ac-search-overlay {
                    position: fixed; inset: 0; z-index: 1200;
                    background: rgba(10,10,10,0.5);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    padding-top: 100px;
                    animation: acFadeIn 0.2s ease;
                }
                .ac-search-box {
                    background: var(--white);
                    width: 100%; max-width: 600px;
                    margin: 0 20px;
                    display: flex; align-items: center;
                    gap: 14px;
                    padding: 8px 20px;
                    border-bottom: 2px solid var(--ink);
                    min-height: 68px;
                }
                .ac-search-form {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                }
                .ac-search-box input {
                    flex: 1; width: 100%; min-width: 0;
                    border: none; outline: none;
                    font-family: 'Jost', sans-serif;
                    font-size: 22px; font-weight: 300;
                    color: var(--ink); background: transparent;
                    padding: 14px 0;
                    letter-spacing: 0.03em;
                }
                .ac-search-box input::-webkit-search-decoration,
                .ac-search-box input::-webkit-search-cancel-button,
                .ac-search-box input::-webkit-search-results-button,
                .ac-search-box input::-webkit-search-results-decoration {
                    display: none;
                }
                .ac-search-box input[type="search"] {
                    appearance: textfield;
                    -webkit-appearance: textfield;
                }
                .ac-search-box input::placeholder { color: #ccc; }
                .ac-search-close {
                    background: none; border: none; cursor: pointer;
                    color: var(--ink-faint); padding: 8px;
                    transition: color 0.18s;
                    display: flex; align-items: center;
                }
                .ac-search-close:hover { color: var(--ink); }

                /* ─── Mobile drawer ─── */
                .ac-drawer {
                    position: fixed;
                    top: var(--nav-h);
                    left: 0; right: 0;
                    background: var(--white);
                    z-index: 999;
                    border-bottom: 1px solid var(--border);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    transition: transform 0.34s cubic-bezier(0.16,1,0.3,1),
                                opacity 0.3s ease;
                    overflow: hidden;
                    max-height: calc(100vh - var(--nav-h));
                    overflow-y: auto;
                }
                .ac-drawer.drawer-closed {
                    transform: translateY(-8px);
                    opacity: 0;
                    pointer-events: none;
                }
                .ac-drawer.drawer-open {
                    transform: translateY(0);
                    opacity: 1;
                }

                .ac-drawer-list {
                    list-style: none; margin: 0; padding: 8px 0;
                }
                .ac-drawer-link {
                    display: flex; align-items: center;
                    justify-content: space-between;
                    padding: 15px 28px;
                    font-family: 'Jost', sans-serif;
                    font-size: 12px; font-weight: 500;
                    letter-spacing: 0.18em; text-transform: uppercase;
                    color: var(--ink); text-decoration: none;
                    border-bottom: 1px solid var(--border);
                    background: none;
                    border-left: none; border-right: none; border-top: none;
                    width: 100%;
                    cursor: pointer;
                    text-align: left;
                    transition: background 0.15s, padding-left 0.22s, color 0.15s;
                }
                .ac-drawer-link:last-child { border-bottom: none; }
                .ac-drawer-link:hover,
                .ac-drawer-link.drawer-active {
                    background: var(--warm);
                    padding-left: 36px;
                }
                .ac-drawer-link.drawer-active { color: var(--accent); }
                .ac-drawer-link svg { opacity: 0.2; transition: opacity 0.2s, transform 0.2s; }
                .ac-drawer-link:hover svg { opacity: 0.5; transform: translateX(3px); }

                .ac-drawer-link-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .ac-drawer-link-left svg { opacity: 0.35; flex-shrink: 0; }

                .ac-drawer-link-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .ac-drawer-count {
                    font-family: 'Jost', sans-serif;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    color: var(--ink);
                    background: var(--warm);
                    border: 1px solid var(--border);
                    min-width: 20px;
                    height: 20px;
                    padding: 0 5px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ac-drawer-link.is-logout {
                    color: #b3413d;
                }
                .ac-drawer-link.is-logout svg { opacity: 0.5; color: #b3413d; }

                .ac-drawer-divider {
                    height: 1px;
                    background: var(--border);
                    margin: 4px 28px;
                }

                .ac-drawer-eyebrow {
                    padding: 14px 28px 6px;
                    font-family: 'Jost', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: var(--ink-faint);
                }

                /* ─── Keyframes ─── */
                @keyframes acFadeIn  { from { opacity:0 } to { opacity:1 } }
                @keyframes acDropIn  { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }

                /* ─── Responsive ─── */

                /* Tablet (≤1024px): hide desktop links, show hamburger */
                @media (max-width: 1024px) {
                    .ac-left-links { display: none !important; }
                    .ac-burger     { display: flex; }
                    .ac-bar        { padding: 0 24px; }
                }

                /* Mobile (≤640px): smaller padding, tighter icon gap */
                @media (max-width: 640px) {
                    .ac-bar  { padding: 0 16px; gap: 8px; }
                    .ac-icons { gap: 2px; }
                    .ac-icon  { width: 34px; height: 34px; }
                    .ac-logo  { font-size: 17px; letter-spacing: 0.12em; }
                    .ac-search-overlay { padding-top: 86px; }
                    .ac-search-box {
                        margin: 0 16px;
                        max-width: calc(100vw - 32px);
                        min-height: 64px;
                        padding: 8px 16px;
                    }
                    .ac-search-box input { font-size: 20px; }
                }

                /* Very small (≤360px): even tighter */
                @media (max-width: 360px) {
                    .ac-bar   { padding: 0 10px; }
                    .ac-icon  { width: 30px; height: 30px; }
                    .ac-icons { gap: 0; }
                }
            `}</style>

      {/* ── Navbar ── */}
      <nav
        className={`ac-nav${scrolled ? " is-scrolled" : ""}${isMenuOpen ? " is-open" : ""}`}
      >
        <div className="ac-bar">
          {/* ── LEFT: desktop nav links / mobile hamburger ── */}
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            {/* Desktop links */}
            <ul className="ac-left ac-left-links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={pathname === link.href ? "is-active" : ""}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Hamburger — tablet & mobile */}
            <button
              className={`ac-burger${isMenuOpen ? " is-open" : ""}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <HiOutlineMenu size={20} />
            </button>
          </div>

          {/* ── CENTER: logo ── */}
          <Link
            href="/"
            className="ac-logo"
            onClick={() => setIsMenuOpen(false)}
          >
            Air Collection
          </Link>

          {/* ── RIGHT: icons ── */}
          <div className="ac-icons">
            {/* Search — always visible */}
            <button
              className="ac-icon"
              onClick={() => {
                setShowSearch(true);
                setIsMenuOpen(false);
              }}
              aria-label="Search"
            >
              <FaSearch size={15} />
            </button>

            <span className="ac-divider" />

            {/* Wishlist — desktop only; lives in the drawer on tablet/mobile */}
            <Link
              href="/wishlist"
              className="ac-icon ac-icon-desktop-only"
              aria-label="Wishlist"
            >
              <FaHeart size={15} />
              {wishlistCount > 0 && (
                <span className="ac-badge">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart — always visible */}
            <Link href="/cart" className="ac-icon" aria-label="Cart">
              <FaShoppingCart size={15} />
              {cartCount > 0 && (
                <span className="ac-badge">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Account — desktop only; lives in the drawer on tablet/mobile */}
            <div className="ac-user-wrap ac-icon-desktop-only">
              <button
                className="ac-icon"
                onClick={() => setShowUserMenu((prev) => !prev)}
                aria-label="Account"
              >
                <FaUser size={15} />
              </button>

              {showUserMenu && (
                <>
                  {/* Backdrop to close */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 499 }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="ac-dropdown">
                    {user ? (
                      <>
                        <Link
                          href="/profile"
                          className="ac-drop-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FaUserCircle size={12} /> Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="ac-drop-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FaBoxOpen size={12} /> My Orders
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            href="/admin/dashboard"
                            className="ac-drop-item"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FaTachometerAlt size={12} /> Admin Panel
                          </Link>
                        )}
                        <button className="ac-drop-item" onClick={handleLogout}>
                          <FaSignOutAlt size={12} /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/signin"
                          className="ac-drop-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Login
                        </Link>
                        <Link
                          href="/auth/signup"
                          className="ac-drop-item"
                          onClick={() => setShowUserMenu(false)}
                        >
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

      {/* ── Search overlay ── */}
      {showSearch && (
        <div className="ac-search-overlay" onClick={() => setShowSearch(false)}>
          <div className="ac-search-box" onClick={(e) => e.stopPropagation()}>
            <FaSearch size={14} style={{ color: "#ccc", flexShrink: 0 }} />
            <form action="/search" method="GET" className="ac-search-form">
              <input
                ref={searchRef}
                type="search"
                name="q"
                placeholder="Search products…"
              />
            </form>
            <button
              className="ac-search-close"
              onClick={() => setShowSearch(false)}
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile / tablet drawer ── */}
      {/* Nav links, then an account section that reflects real login state:
          logged-out visitors see Login/Register, logged-in users see
          My Account/Orders/Wishlist (+ Admin Panel if they're an admin)
          plus a working Logout — the same routes the desktop dropdown offers. */}
      <div
        className={`ac-drawer ${isMenuOpen ? "drawer-open" : "drawer-closed"}`}
      >
        <ul className="ac-drawer-list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`ac-drawer-link${pathname === link.href ? " drawer-active" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
                <FaArrowRight size={10} />
              </Link>
            </li>
          ))}
        </ul>

        <div className="ac-drawer-divider" />

        {user && (
          <div className="ac-drawer-eyebrow">
            Signed in as {user.name || user.email}
          </div>
        )}

        <ul className="ac-drawer-list">
          {drawerAccountLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`ac-drawer-link${pathname === link.href ? " drawer-active" : ""}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="ac-drawer-link-left">
                  {link.icon}
                  {link.label}
                </span>
                <span className="ac-drawer-link-right">
                  {(link.count ?? 0) > 0 && (
                    <span className="ac-drawer-count">
                      {(link.count ?? 0) > 9 ? "9+" : link.count}
                    </span>
                  )}
                  <FaArrowRight size={10} />
                </span>
              </Link>
            </li>
          ))}

          {user && (
            <li>
              <button className="ac-drawer-link is-logout" onClick={handleLogout}>
                <span className="ac-drawer-link-left">
                  <FaSignOutAlt size={11} />
                  Logout
                </span>
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Spacer so page content starts below fixed navbar */}
      <div style={{ height: "var(--nav-h)" }} />
    </>
  );
}