import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Subscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([
    {
      id: 1,
      name: 'Netflix',
      cost: 15.99,
      billing_period: 'monthly',
      cancel_url: 'https://www.netflix.com/cancelplan',
      username_email: 'darius@example.com',
      owner: 'Darius',
      paid_date: '2024-01-15',
      cancel_timing: 'custom',
      custom_cancel_date: '2024-12-31'
    },
    {
      id: 2,
      name: 'Spotify Premium',
      cost: 9.99,
      billing_period: 'monthly',
      cancel_url: 'https://www.spotify.com/account/subscription',
      username_email: 'katia@example.com',
      owner: 'Katia',
      paid_date: '2024-01-20',
      cancel_timing: '1month',
      custom_cancel_date: ''
    },
    {
      id: 3,
      name: 'Adobe Creative Cloud',
      cost: 52.99,
      billing_period: 'monthly',
      cancel_url: 'https://account.adobe.com/plans',
      username_email: 'darius@example.com',
      owner: 'Darius',
      paid_date: '2024-01-01',
      cancel_timing: '3months',
      custom_cancel_date: ''
    },
    {
      id: 4,
      name: 'Amazon Prime',
      cost: 139,
      billing_period: 'yearly',
      cancel_url: 'https://www.amazon.com/gp/primecentral',
      username_email: 'darius@example.com',
      owner: 'Darius',
      paid_date: '2024-01-10',
      cancel_timing: '6months',
      custom_cancel_date: ''
    },
    {
      id: 5,
      name: 'Gym Membership',
      cost: 49.99,
      billing_period: 'monthly',
      cancel_url: 'https://www.gym.com/cancel',
      username_email: 'katia@example.com',
      owner: 'Katia',
      paid_date: '2024-01-05',
      cancel_timing: 'custom',
      custom_cancel_date: '2024-06-30'
    },
    {
      id: 6,
      name: 'Microsoft 365',
      cost: 99.99,
      billing_period: 'yearly',
      cancel_url: 'https://account.microsoft.com/services',
      username_email: 'darius@example.com',
      owner: 'Darius',
      paid_date: '2023-12-15',
      cancel_timing: 'custom',
      custom_cancel_date: '2024-12-15'
    },
    {
      id: 7,
      name: 'Apple iCloud+',
      cost: 2.99,
      billing_period: 'monthly',
      cancel_url: 'https://www.icloud.com/settings',
      username_email: 'katia@example.com',
      owner: 'Katia',
      paid_date: '2024-01-12',
      cancel_timing: '7days',
      custom_cancel_date: ''
    },
    {
      id: 8,
      name: 'YouTube Premium',
      cost: 13.99,
      billing_period: 'monthly',
      cancel_url: 'https://www.youtube.com/premium',
      username_email: 'darius@example.com',
      owner: 'Darius',
      paid_date: '2024-01-18',
      cancel_timing: '1month',
      custom_cancel_date: ''
    }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState(new Set());
  const [viewMode, setViewMode] = useState('monthly'); // monthly, quarterly, yearly
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    cost: '',
    billing_period: 'monthly', // monthly, yearly, weekly
    cancel_url: '',
    username_email: '',
    owner: 'Darius',
    paid_date: new Date().toISOString().split('T')[0],
    cancel_timing: 'custom',
    custom_cancel_date: ''
  });

  const calculateCost = (subscription, period) => {
    const cost = parseFloat(subscription.cost) || 0;
    if (subscription.billing_period === 'monthly') {
      if (period === 'monthly') return cost;
      if (period === 'quarterly') return cost * 3;
      if (period === 'yearly') return cost * 12;
    } else if (subscription.billing_period === 'yearly') {
      if (period === 'monthly') return cost / 12;
      if (period === 'quarterly') return cost / 4;
      if (period === 'yearly') return cost;
    } else if (subscription.billing_period === 'weekly') {
      if (period === 'monthly') return cost * 4.33;
      if (period === 'quarterly') return cost * 13;
      if (period === 'yearly') return cost * 52;
    }
    return 0;
  };

  const getCancelDate = (subscription) => {
    const paidDate = new Date(subscription.paid_date);
    if (subscription.cancel_timing === '7days') {
      return new Date(paidDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (subscription.cancel_timing === '1month') {
      return new Date(paidDate.getFullYear(), paidDate.getMonth() + 1, paidDate.getDate());
    } else if (subscription.cancel_timing === '3months') {
      return new Date(paidDate.getFullYear(), paidDate.getMonth() + 3, paidDate.getDate());
    } else if (subscription.cancel_timing === '6months') {
      return new Date(paidDate.getFullYear(), paidDate.getMonth() + 6, paidDate.getDate());
    } else if (subscription.cancel_timing === 'custom') {
      return subscription.custom_cancel_date ? new Date(subscription.custom_cancel_date) : null;
    }
    return null;
  };

  const handleAddSubscription = () => {
    if (!newSubscription.name || !newSubscription.cost) {
      alert('Please fill in name and cost');
      return;
    }
    const subscription = {
      id: Date.now(),
      ...newSubscription,
      cost: parseFloat(newSubscription.cost)
    };
    setSubscriptions([...subscriptions, subscription]);
    setNewSubscription({
      name: '',
      cost: '',
      billing_period: 'monthly',
      cancel_url: '',
      username_email: '',
      owner: 'Darius',
      paid_date: new Date().toISOString().split('T')[0],
      cancel_timing: 'custom',
      custom_cancel_date: ''
    });
    setShowAddModal(false);
  };

  const handleDeleteSubscription = (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions(subscriptions.filter(s => s.id !== id));
      setSelectedSubscriptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const toggleSubscriptionSelection = (id) => {
    setSelectedSubscriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTotalCost = () => {
    if (selectedSubscriptions.size === 0) {
      return subscriptions.reduce((sum, sub) => sum + calculateCost(sub, viewMode), 0);
    }
    return Array.from(selectedSubscriptions).reduce((sum, id) => {
      const sub = subscriptions.find(s => s.id === id);
      return sum + (sub ? calculateCost(sub, viewMode) : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
            <p className="text-gray-400 mt-1">Track and manage all your subscriptions</p>
          </div>
          <button
            onClick={() => navigate('/admin/ideas/clearpath')}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span>
            Back to ClearPath
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Total Monthly</p>
          <p className="text-3xl font-bold text-cyan-400">
            ${subscriptions.reduce((sum, sub) => sum + calculateCost(sub, 'monthly'), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Total Quarterly</p>
          <p className="text-3xl font-bold text-cyan-400">
            ${subscriptions.reduce((sum, sub) => sum + calculateCost(sub, 'quarterly'), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Total Yearly</p>
          <p className="text-3xl font-bold text-cyan-400">
            ${subscriptions.reduce((sum, sub) => sum + calculateCost(sub, 'yearly'), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* View Mode Selector & Selected Total */}
      <div className="bg-[#1f1f1f] border border-gray-700 rounded-xl p-4 shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-300 font-medium">View Costs:</span>
            <div className="flex gap-2">
              {['monthly', 'quarterly', 'yearly'].map(period => (
                <button
                  key={period}
                  onClick={() => setViewMode(period)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    viewMode === period
                      ? 'bg-cyan-500 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 border border-gray-700 hover:border-cyan-500/50'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {selectedSubscriptions.size > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Selected Total ({viewMode}):</p>
              <p className="text-2xl font-bold text-cyan-400">
                ${getTotalCost().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subscription Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all shadow-lg hover:shadow-cyan-500/30"
        >
          + Add Subscription
        </button>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.length === 0 ? (
          <div className="bg-[#1f1f1f] border border-gray-700 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">No subscriptions added yet</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add Subscription" to get started</p>
          </div>
        ) : (
          subscriptions.map(subscription => {
            const cancelDate = getCancelDate(subscription);
            const isSelected = selectedSubscriptions.has(subscription.id);
            return (
              <div
                key={subscription.id}
                className={`bg-[#1f1f1f] border rounded-xl p-6 shadow-lg transition-all ${
                  isSelected ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-gray-700 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSubscriptionSelection(subscription.id)}
                      className="mt-1 w-5 h-5 text-cyan-500 bg-[#1a1a1a] border-gray-700 rounded focus:ring-cyan-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{subscription.name}</h3>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#1a1a1a] text-cyan-400 border border-cyan-500/30">
                          {subscription.owner}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Cost ({subscription.billing_period})</p>
                          <p className="text-white font-semibold">${subscription.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Cost ({viewMode})</p>
                          <p className="text-cyan-400 font-semibold">
                            ${calculateCost(subscription, viewMode).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Account</p>
                          <p className="text-white font-semibold">{subscription.username_email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Cancel Date</p>
                          <p className="text-white font-semibold">
                            {cancelDate ? cancelDate.toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                      </div>
                      {subscription.cancel_url && (
                        <div className="mt-3">
                          <a
                            href={subscription.cancel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Cancel Subscription
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSubscription(subscription.id)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Add Subscription</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subscription Name *</label>
                <input
                  type="text"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription({...newSubscription, name: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cost *</label>
                  <input
                    type="number"
                    value={newSubscription.cost}
                    onChange={(e) => setNewSubscription({...newSubscription, cost: e.target.value})}
                    step="0.01"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Billing Period *</label>
                  <select
                    value={newSubscription.billing_period}
                    onChange={(e) => setNewSubscription({...newSubscription, billing_period: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cancel URL</label>
                <input
                  type="url"
                  value={newSubscription.cancel_url}
                  onChange={(e) => setNewSubscription({...newSubscription, cancel_url: e.target.value})}
                  placeholder="https://..."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username/Email</label>
                <input
                  type="text"
                  value={newSubscription.username_email}
                  onChange={(e) => setNewSubscription({...newSubscription, username_email: e.target.value})}
                  placeholder="username@example.com"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Owner *</label>
                  <select
                    value={newSubscription.owner}
                    onChange={(e) => setNewSubscription({...newSubscription, owner: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Darius">Darius</option>
                    <option value="Katia">Katia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Paid Date *</label>
                  <input
                    type="date"
                    value={newSubscription.paid_date}
                    onChange={(e) => setNewSubscription({...newSubscription, paid_date: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cancel Timing</label>
                <select
                  value={newSubscription.cancel_timing}
                  onChange={(e) => setNewSubscription({...newSubscription, cancel_timing: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none mb-2"
                >
                  <option value="7days">7 Days</option>
                  <option value="1month">1 Month</option>
                  <option value="3months">3 Months</option>
                  <option value="6months">6 Months</option>
                  <option value="custom">Custom Date</option>
                </select>
                {newSubscription.cancel_timing === 'custom' && (
                  <input
                    type="date"
                    value={newSubscription.custom_cancel_date}
                    onChange={(e) => setNewSubscription({...newSubscription, custom_cancel_date: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none mt-2"
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubscription}
                className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-all"
              >
                Add Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions;

