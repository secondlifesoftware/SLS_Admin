import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import ClientList from './admin/ClientList';
import InvoiceGenerator from './admin/InvoiceGenerator';
import ScopeOfWorkGenerator from './admin/ScopeOfWorkGenerator';
import MyProfile from './admin/MyProfile';

function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { path: '/admin/clients', label: 'Clients', icon: '👥' },
    { path: '/admin/invoices', label: 'Invoices', icon: '📄' },
    { path: '/admin/scope', label: 'Scope of Work', icon: '📋' },
    { path: '/admin/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (path) => {
    const currentPath = location.pathname;
    return currentPath === path || (path === '/admin/clients' && currentPath === '/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">SLS</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Admin</span>
              <button
                onClick={() => navigate('/')}
                className="ml-4 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center"
                title="Go to main website"
              >
                <span className="mr-1.5">🏠</span>
                Home
              </button>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center"
                title="Open demo application"
              >
                <span className="mr-1.5">🎨</span>
                Demo
              </a>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive(item.path)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="clients" element={<ClientList />} />
          <Route path="invoices" element={<InvoiceGenerator />} />
          <Route path="scope" element={<ScopeOfWorkGenerator />} />
          <Route path="profile" element={<MyProfile user={user} />} />
          <Route index element={<ClientList />} />
        </Routes>
      </main>
    </div>
  );
}

export default AdminDashboard;

