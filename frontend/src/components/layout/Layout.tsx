import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export function Layout({ children, showNavigation = true }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Meeting Prep', href: '/', current: location.pathname === '/' },
    { name: 'Customer Research', href: '/research', current: location.pathname === '/research' },
  ];

  return (
    <div className="min-h-screen bg-cro-plat-100">
      {/* Header */}
      <header className="bg-white border-b border-cro-plat-300 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-cro-blue-700" />
              <Link to="/" className="text-2xl font-bold text-cro-soft-black-700 hover:text-cro-blue-700 transition-colors">
                Meeting Prepper
              </Link>
            </div>

            {/* Desktop Navigation */}
            {showNavigation && (
              <nav className="hidden md:flex space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-cro-blue-100 text-cro-blue-700'
                        : 'text-cro-soft-black-600 hover:text-cro-blue-700 hover:bg-cro-plat-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            )}

            {/* Mobile menu button */}
            {showNavigation && (
              <div className="md:hidden">
                <button
                  type="button"
                  className="p-2 rounded-md text-cro-soft-black-600 hover:text-cro-blue-700 hover:bg-cro-plat-100 transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          {showNavigation && mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-cro-plat-200">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      item.current
                        ? 'bg-cro-blue-100 text-cro-blue-700'
                        : 'text-cro-soft-black-600 hover:text-cro-blue-700 hover:bg-cro-plat-100'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}