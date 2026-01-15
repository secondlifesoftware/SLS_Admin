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
    <div className="min-h-screen bg-[#1a1a1a] relative">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 bg-[#1a1a1a] opacity-100" style={{
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}></div>
      
      <div className="relative z-10">
        {/* Top Navigation Bar */}
        <nav className="bg-[#1f1f1f] border-b border-cyan-500/30 sticky top-0 z-50 backdrop-blur-lg bg-[#1f1f1f]/95">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center border border-cyan-400/30">
                  <span className="text-white text-sm font-bold">SLS</span>
                </div>
                <span className="text-xl font-bold text-white">Admin</span>
                <button
                  onClick={() => navigate('/')}
                  className="ml-4 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors duration-200 flex items-center border border-gray-800"
                  title="Go to main website"
                >
                  <span className="mr-1.5">🏠</span>
                  Home
                </button>
                <a
                  href={process.env.REACT_APP_DEMO_URL || 'http://localhost:5173'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#252525] rounded-lg transition-colors duration-200 flex items-center border border-gray-800"
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
                      px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border
                      ${
                        isActive(item.path)
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                          : 'text-gray-400 hover:text-white hover:bg-[#252525] border-transparent hover:border-cyan-500/30'
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
                  <p className="text-sm font-semibold text-white">{user?.email}</p>
                  <p className="text-xs text-cyan-400">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors duration-200 hover:border-red-500/50"
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

