import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import ClientList from './admin/ClientList';
import ClientDetail from './admin/ClientDetail';
import ClientForm from './admin/ClientForm';
import ClientInvoicePage from './admin/ClientInvoicePage';
import InvoiceGenerator from './admin/InvoiceGenerator';
import InvoiceDetail from './admin/InvoiceDetail';
import CreateInvoiceWizard from './admin/CreateInvoiceWizard';
import ScopeOfWorkGenerator from './admin/ScopeOfWorkGenerator';
import ScopeOfWorkList from './admin/ScopeOfWorkList';
import ScopeOfWorkEdit from './admin/ScopeOfWorkEdit';
import MyProfile from './admin/MyProfile';
import IdeasList from './admin/IdeasList';
import IdeaDetail from './admin/IdeaDetail';
import Budget from './admin/Budget';
import Subscriptions from './admin/Subscriptions';

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
    { path: '/admin/ideas', label: 'Ideas', icon: '💡' },
    { path: '/admin/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (path) => {
    const currentPath = location.pathname;
    return currentPath === path || (path === '/admin/clients' && currentPath === '/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF9] via-[#F8F5F2] to-[#FFF8F5] relative">
      {/* Decorative Background Pattern */}
      <div className="fixed inset-0 opacity-40" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
          linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: 'cover, cover, 60px 60px, 60px 60px'
      }}></div>

      <div className="relative z-10">
        {/* Top Navigation Bar */}
        <nav className="bg-white/95 border-b-2 border-purple-100 sticky top-0 z-50 backdrop-blur-xl shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 border border-purple-200">
                  <span className="text-white text-sm font-bold">SLS</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Admin</span>
                <button
                  onClick={() => navigate('/')}
                  className="ml-4 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center border border-gray-200 hover:border-purple-300"
                  title="Go to main website"
                >
                  <span className="mr-1.5">🏠</span>
                  Home
                </button>
                <a
                  href={process.env.REACT_APP_DEMO_URL || 'http://localhost:5173'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 flex items-center border border-gray-200 hover:border-purple-300"
                  title="Open demo application"
                >
                  <span className="mr-1.5">🎨</span>
                  Demo
                </a>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-2">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2
                      ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg shadow-purple-500/30'
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-transparent hover:border-purple-200'
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
                <div className="text-right bg-purple-50 px-4 py-2 rounded-xl border border-purple-100">
                  <p className="text-sm font-bold text-gray-800">{user?.email}</p>
                  <p className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 border-2 border-red-200 rounded-xl transition-all duration-200 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20"
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
              <Route path="clients/new" element={<ClientForm />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="clients/:id/edit" element={<ClientForm />} />
              <Route path="clients/:id/invoices" element={<ClientInvoicePage />} />
              <Route path="invoices" element={<InvoiceGenerator />} />
              <Route path="invoices/create" element={<CreateInvoiceWizard />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="scope" element={<ScopeOfWorkList />} />
              <Route path="scope/create" element={<ScopeOfWorkGenerator />} />
              <Route path="scope/:id/edit" element={<ScopeOfWorkEdit />} />
              <Route path="ideas" element={<IdeasList />} />
              <Route path="ideas/:id" element={<IdeaDetail />} />
              <Route path="budget" element={<Budget />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="profile" element={<MyProfile user={user} />} />
              <Route index element={<ClientList />} />
            </Routes>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;

