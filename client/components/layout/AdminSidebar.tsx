'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaTachometerAlt, FaUsers, FaBoxes, FaTags, FaShoppingCart, FaStar, FaSignOutAlt } from 'react-icons/fa';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FaTachometerAlt },
    { name: 'Users', path: '/admin/users', icon: FaUsers },
    { name: 'Products', path: '/admin/products', icon: FaBoxes },
    { name: 'Categories', path: '/admin/categories', icon: FaTags },
    { name: 'Orders', path: '/admin/orders', icon: FaShoppingCart },
    { name: 'Reviews', path: '/admin/reviews', icon: FaStar },
  ];

  return (
    <div className="bg-dark text-white vh-100 p-3" style={{ width: '260px', position: 'sticky', top: 0 }}>
      <div className="mb-4 pt-3">
        <h4 className="fw-bold">Air Collection</h4>
        <p className="text-white-50 small">Admin Panel</p>
      </div>
      <ul className="nav nav-pills flex-column">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <li className="nav-item mb-2" key={item.path}>
              <Link
                href={item.path}
                className={`nav-link text-white d-flex align-items-center gap-2 ${isActive ? 'active bg-white text-dark' : ''}`}
                style={{ borderRadius: '0.5rem' }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            </li>
          );
        })}
        <li className="nav-item mt-4">
          <button
            className="nav-link text-white d-flex align-items-center gap-2"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/auth/signin';
            }}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', borderRadius: '0.5rem' }}
          >
            <FaSignOutAlt size={18} />
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}