"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaTachometerAlt,
  FaBoxes,
  FaTags,
  FaShoppingCart,
  FaStar,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: FaTachometerAlt },
    // { name: 'Users', path: '/admin/users', icon: FaUsers },
    { name: "Products", path: "/admin/products", icon: FaBoxes },
    { name: "Categories", path: "/admin/categories", icon: FaTags },
    { name: "Orders", path: "/admin/orders", icon: FaShoppingCart },
    { name: "Reviews", path: "/admin/reviews", icon: FaStar },
    { name: "Promo Codes", path: "/admin/promocodes", icon: FaTags },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-dark" role="status"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-layout">
      <style>{`
        .admin-layout h1 {
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 26px !important;
          font-weight: 700 !important;
          letter-spacing: -.02em !important;
          line-height: 1.2 !important;
          color: #0f172a !important;
          margin-top: 0 !important;
        }

        .admin-main-content {
          padding: 24px !important;
        }

        .admin-layout {
          --admin-card-border: #e2e8f0;
          --admin-card-shadow: 0 2px 16px rgba(0, 0, 0, 0.055);
          --admin-card-shadow-hover: 0 6px 24px rgba(0, 0, 0, 0.09);
          --admin-card-radius: 14px;
        }

        .admin-layout :where(
          .card,
          .ad-card,
          .pm-card,
          .pm-product-card,
          .ac-category-card,
          .rv-stat,
          .rv-table-card
        ) {
          background: #ffffff !important;
          border: 1px solid var(--admin-card-border) !important;
          border-radius: var(--admin-card-radius) !important;
          box-shadow: var(--admin-card-shadow) !important;
        }

        .admin-layout .ao-shell:not(.dark) :where(
          .acard,
          .ao-table-scroll,
          .ao-filter-sidebar
        ) {
          background: #ffffff !important;
          border: 1px solid var(--admin-card-border) !important;
          border-radius: var(--admin-card-radius) !important;
          box-shadow: var(--admin-card-shadow) !important;
        }

        .admin-layout :where(
          .card,
          .ad-card,
          .pm-card,
          .pm-product-card,
          .ac-category-card,
          .rv-stat
        ),
        .admin-layout .ao-shell:not(.dark) .acard {
          transition: box-shadow 0.2s ease, transform 0.2s ease !important;
        }

        .admin-layout :where(
          .card,
          .ad-card,
          .pm-card,
          .pm-product-card,
          .ac-category-card,
          .rv-stat
        ):hover,
        .admin-layout .ao-shell:not(.dark) .acard:hover {
          box-shadow: var(--admin-card-shadow-hover) !important;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .admin-layout h1 {
            font-size: 22px !important;
          }

          .admin-main-content {
            padding: 16px !important;
          }
        }
      `}</style>
      {/* Mobile Header with Hamburger */}
      <div className="d-lg-none bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-normal">Air Collection Admin</h5>
        <button
          className="btn btn-link text-dark p-0"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      <div className="container-fluid px-0">
        <div className="row g-0">
          {/* Sidebar - hidden on mobile by default, shown when toggled */}
          <div
            className={`col-lg-2 px-0 ${sidebarOpen ? "d-block" : "d-none d-lg-block"}`}
          >
            <div
              className="bg-white border-end vh-lg-100 p-3"
              style={{ minHeight: "calc(100vh - 56px)" }}
            >
              <div className="d-none d-lg-block mb-4 pt-3">
                <h4 className="fw-normal">Air Collection</h4>
                <p className="text-muted small">Admin Panel</p>
              </div>
              <ul className="nav nav-pills flex-column">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <li className="nav-item mb-2" key={item.path}>
                      <Link
                        href={item.path}
                        className={`nav-link d-flex align-items-center gap-2 ${isActive ? "active bg-dark text-white" : "text-dark"}`}
                        onClick={() => setSidebarOpen(false)}
                        style={{ borderRadius: "0.5rem" }}
                      >
                        <Icon size={18} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
                <li className="nav-item mt-4">
                  <button
                    className="nav-link text-dark d-flex align-items-center gap-2"
                    onClick={() => {
                      logout();
                      router.push("/auth/signin");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <FaSignOutAlt size={18} />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div
            className="col-lg-10 admin-main-content"
            style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", minWidth: 0 }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
