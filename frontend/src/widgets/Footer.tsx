/**
 * Footer Component
 * Footer navigation and company info
 */
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-3">🥬 Food Store</h3>
            <p className="text-gray-300 text-sm">
              Your one-stop shop for quality food products. Fresh, organic, and locally sourced.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-gray-300 hover:text-white transition">
                  Catalog
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-gray-300 hover:text-white transition">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-3">Contact</h4>
            <p className="text-gray-300 text-sm">
              Email: info@foodstore.com
            </p>
            <p className="text-gray-300 text-sm">
              Phone: +1 (555) 123-4567
            </p>
          </div>
        </div>

        <hr className="my-6 border-gray-700" />

        <div className="text-center text-gray-300 text-sm">
          <p>© {currentYear} Food Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
