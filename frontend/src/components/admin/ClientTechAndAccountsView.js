import React, { useState, useEffect } from 'react';
import { clientTechStackAPI, clientAdminAccountAPI } from '../../services/api';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';

function ClientTechAndAccountsView({ clientId, userEmail }) {
  const [techStack, setTechStack] = useState([]);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tech'); // 'tech' or 'accounts'
  const [showTechForm, setShowTechForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({}); // { accountId: { password, timeout } }
  const [passwordPrompt, setPasswordPrompt] = useState(null); // { accountId, callback }

  const [techFormData, setTechFormData] = useState({
    technology: '',
    category: '',
    version: '',
    notes: '',
  });

  const [accountFormData, setAccountFormData] = useState({
    service_name: '',
    account_type: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    tech_stack_category: '',
  });

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [techData, accountsData] = await Promise.all([
        clientTechStackAPI.getByClientId(clientId),
        clientAdminAccountAPI.getByClientId(clientId),
      ]);
      setTechStack(techData);
      setAdminAccounts(accountsData);
      setError('');
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealPassword = async (accountId) => {
    // Prompt for user password
    const userPassword = prompt('Enter your password to reveal this account password:');
    if (!userPassword) return;

    try {
      // Verify password with Firebase
      if (!auth || !userEmail) {
        setError('Authentication required');
        return;
      }

      // Verify user password
      await signInWithEmailAndPassword(auth, userEmail, userPassword);
      
      // Get revealed password
      const response = await clientAdminAccountAPI.revealPassword(accountId, userPassword);
      const password = response.password;

      // Show password for 10 seconds
      setRevealedPasswords(prev => ({
        ...prev,
        [accountId]: { password, timestamp: Date.now() }
      }));

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setRevealedPasswords(prev => {
          const updated = { ...prev };
          delete updated[accountId];
          return updated;
        });
      }, 10000);

    } catch (err) {
      setError('Invalid password or failed to reveal: ' + err.message);
    }
  };

  const handleAddTech = async (e) => {
    e.preventDefault();
    try {
      await clientTechStackAPI.create({
        client_id: clientId,
        ...techFormData,
      });
      setTechFormData({ technology: '', category: '', version: '', notes: '' });
      setShowTechForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to add technology: ' + err.message);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await clientAdminAccountAPI.create({
        client_id: clientId,
        ...accountFormData,
      });
      setAccountFormData({
        service_name: '',
        account_type: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        tech_stack_category: '',
      });
      setShowAccountForm(false);
      fetchData();
    } catch (err) {
      setError('Failed to add account: ' + err.message);
    }
  };

  const handleDeleteTech = async (techId) => {
    if (!window.confirm('Are you sure you want to delete this technology?')) return;
    try {
      await clientTechStackAPI.delete(techId);
      fetchData();
    } catch (err) {
      setError('Failed to delete: ' + err.message);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await clientAdminAccountAPI.delete(accountId);
      fetchData();
    } catch (err) {
      setError('Failed to delete: ' + err.message);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Frontend: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      Backend: 'bg-green-500/20 text-green-400 border-green-500/30',
      Database: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      DevOps: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Tools: 'bg-gray-700 text-gray-300 border-gray-600',
    };
    return colors[category] || 'bg-gray-700 text-gray-300 border-gray-600';
  };

  if (loading && techStack.length === 0 && adminAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Tech Stack & Admin Accounts</h3>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('tech')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tech'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Tech Stack
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'accounts'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Admin Accounts
          </button>
        </nav>
      </div>

      {/* Tech Stack Tab */}
      {activeTab === 'tech' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowTechForm(!showTechForm)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-cyan-500 rounded-xl hover:bg-cyan-600 transition-all border border-cyan-400/50"
            >
              {showTechForm ? 'Cancel' : '+ Add Technology'}
            </button>
          </div>

          {showTechForm && (
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-bold text-white mb-4">Add Technology</h4>
              <form onSubmit={handleAddTech} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Technology *</label>
                    <input
                      type="text"
                      value={techFormData.technology}
                      onChange={(e) => setTechFormData({ ...techFormData, technology: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                      placeholder="e.g., React, Node.js, PostgreSQL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Category</label>
                    <select
                      value={techFormData.category}
                      onChange={(e) => setTechFormData({ ...techFormData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                    >
                      <option value="">Select Category</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Database">Database</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Tools">Tools</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Version</label>
                    <input
                      type="text"
                      value={techFormData.version}
                      onChange={(e) => setTechFormData({ ...techFormData, version: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                      placeholder="e.g., 18.2.0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Notes</label>
                  <textarea
                    value={techFormData.notes}
                    onChange={(e) => setTechFormData({ ...techFormData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-cyan-500 rounded-xl hover:bg-cyan-600 border border-cyan-400/50 transition-all"
                  >
                    Add Technology
                  </button>
                </div>
              </form>
            </div>
          )}

          {techStack.length === 0 ? (
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-lg font-bold text-white mb-2">No technologies</h3>
              <p className="text-gray-400">Add technologies used by this client</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techStack.map((tech) => (
                <div
                  key={tech.id}
                  className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{tech.technology}</h4>
                      {tech.version && (
                        <p className="text-sm text-gray-400">v{tech.version}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTech(tech.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                  {tech.category && (
                    <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getCategoryColor(tech.category)}`}>
                      {tech.category}
                    </span>
                  )}
                  {tech.notes && (
                    <p className="text-sm text-gray-400 mt-2">{tech.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Accounts Tab */}
      {activeTab === 'accounts' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAccountForm(!showAccountForm)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-cyan-500 rounded-xl hover:bg-cyan-600 transition-all border border-cyan-400/50"
            >
              {showAccountForm ? 'Cancel' : '+ Add Admin Account'}
            </button>
          </div>

          {showAccountForm && (
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-bold text-white mb-4">Add Admin Account</h4>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Service Name *</label>
                    <input
                      type="text"
                      value={accountFormData.service_name}
                      onChange={(e) => setAccountFormData({ ...accountFormData, service_name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                      placeholder="e.g., AWS, GitHub, Stripe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Account Type</label>
                    <input
                      type="text"
                      value={accountFormData.account_type}
                      onChange={(e) => setAccountFormData({ ...accountFormData, account_type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                      placeholder="e.g., Cloud Service, Payment Gateway"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Username</label>
                    <input
                      type="text"
                      value={accountFormData.username}
                      onChange={(e) => setAccountFormData({ ...accountFormData, username: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Password</label>
                    <input
                      type="password"
                      value={accountFormData.password}
                      onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">URL</label>
                    <input
                      type="url"
                      value={accountFormData.url}
                      onChange={(e) => setAccountFormData({ ...accountFormData, url: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-400 mb-2">Category</label>
                    <select
                      value={accountFormData.tech_stack_category}
                      onChange={(e) => setAccountFormData({ ...accountFormData, tech_stack_category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                    >
                      <option value="">Select Category</option>
                      <option value="Backend">Backend</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Database">Database</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Notes</label>
                  <textarea
                    value={accountFormData.notes}
                    onChange={(e) => setAccountFormData({ ...accountFormData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-cyan-500 rounded-xl hover:bg-cyan-600 border border-cyan-400/50 transition-all"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {adminAccounts.length === 0 ? (
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-lg font-bold text-white mb-2">No admin accounts</h3>
              <p className="text-gray-400">Add admin accounts and credentials for this client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminAccounts.map((account) => {
                const revealed = revealedPasswords[account.id];
                const isRevealed = revealed && (Date.now() - revealed.timestamp < 10000);
                
                return (
                  <div
                    key={account.id}
                    className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-white">{account.service_name}</h4>
                          {account.account_type && (
                            <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded-full">
                              {account.account_type}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          {account.username && (
                            <p><span className="font-semibold text-white">Username:</span> {account.username}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">Password:</span>
                            {isRevealed ? (
                              <span className="font-mono text-green-400">{revealed.password}</span>
                            ) : (
                              <span className="text-gray-500">••••••••</span>
                            )}
                            {!isRevealed && (
                              <button
                                onClick={() => handleRevealPassword(account.id)}
                                className="text-cyan-400 hover:text-cyan-300"
                                title="Click to reveal password (requires your password)"
                              >
                                👁️
                              </button>
                            )}
                            {isRevealed && (
                              <span className="text-xs text-gray-500">(visible for 10 seconds)</span>
                            )}
                          </div>
                          {account.url && (
                            <p>
                              <span className="font-semibold text-white">URL:</span>{' '}
                              <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline">
                                {account.url}
                              </a>
                            </p>
                          )}
                          {account.notes && (
                            <p><span className="font-semibold text-white">Notes:</span> {account.notes}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-red-400 hover:text-red-300 ml-4 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientTechAndAccountsView;

