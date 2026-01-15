import React, { useState, useEffect } from 'react';
import { contractAPI } from '../../services/api';

function ClientContractsView({ clientId, onRefresh }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    contract_type: 'Fixed Price',
    title: '',
    total_amount: '',
    status: 'Draft',
    start_date: '',
    due_date: '',
    signed_date: '',
    description: '',
    terms: '',
  });
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    fetchContracts();
  }, [clientId]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await contractAPI.getByClientId(clientId);
      setContracts(data);
      setError('');
    } catch (err) {
      setError('Failed to load contracts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const contractData = {
        client_id: parseInt(clientId),
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        signed_date: formData.signed_date ? new Date(formData.signed_date).toISOString() : null,
        milestones: formData.contract_type === 'Milestone Based' 
          ? milestones.filter(m => m.title.trim() !== '').map(m => ({
              title: m.title,
              description: m.description || null,
              amount: parseFloat(m.amount),
              due_date: m.due_date ? new Date(m.due_date).toISOString() : null,
              order: m.order,
            }))
          : [],
      };
      
      await contractAPI.create(contractData);
      setShowAddModal(false);
      resetForm();
      fetchContracts();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Failed to create contract: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      contract_type: 'Fixed Price',
      title: '',
      total_amount: '',
      status: 'Draft',
      start_date: '',
      due_date: '',
      signed_date: '',
      description: '',
      terms: '',
    });
    setMilestones([]);
  };

  const handleDelete = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) {
      return;
    }
    try {
      await contractAPI.delete(contractId);
      fetchContracts();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Failed to delete contract: ' + err.message);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      title: '',
      description: '',
      amount: '',
      due_date: '',
      order: milestones.length + 1,
    }]);
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i + 1 })));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-700 text-gray-300 border-gray-600',
      Sent: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      Signed: 'bg-green-500/20 text-green-400 border-green-500/30',
      Active: 'bg-green-500/20 text-green-400 border-green-500/30',
      Completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${badges[status] || badges.Draft}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Contracts</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50 hover:border-cyan-400"
        >
          + Add Contract
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {contracts.length === 0 ? (
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-bold text-white mb-2">No contracts yet</h3>
          <p className="text-gray-400 mb-6">Create a contract to track project agreements</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50"
          >
            Add First Contract
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {contracts.map((contract) => (
            <div key={contract.id} className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white">{contract.title}</h3>
                    {getStatusBadge(contract.status)}
                    <span className="px-3 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                      {contract.contract_type}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    ${contract.total_amount.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(contract.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {contract.start_date && (
                  <div>
                    <div className="text-xs text-cyan-400 mb-1 font-medium">Start Date</div>
                    <div className="text-sm font-semibold text-white">{formatDate(contract.start_date)}</div>
                  </div>
                )}
                {contract.due_date && (
                  <div>
                    <div className="text-xs text-cyan-400 mb-1 font-medium">Due Date</div>
                    <div className="text-sm font-semibold text-white">{formatDate(contract.due_date)}</div>
                  </div>
                )}
                {contract.signed_date && (
                  <div>
                    <div className="text-xs text-cyan-400 mb-1 font-medium">Signed Date</div>
                    <div className="text-sm font-semibold text-white">{formatDate(contract.signed_date)}</div>
                  </div>
                )}
              </div>

              {contract.description && (
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">{contract.description}</p>
              )}

              {contract.contract_type === 'Milestone Based' && contract.milestones && contract.milestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-bold text-white mb-3">Milestones</h4>
                  <div className="space-y-3">
                    {contract.milestones.map((milestone, index) => (
                      <div key={milestone.id || index} className="bg-[#252525] border border-gray-800 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white">Milestone {milestone.order}</span>
                              <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                                {milestone.status}
                              </span>
                            </div>
                            <h5 className="text-sm font-bold text-white">{milestone.title}</h5>
                            {milestone.description && (
                              <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">${milestone.amount.toLocaleString()}</div>
                            {milestone.due_date && (
                              <div className="text-xs text-gray-400">{formatDate(milestone.due_date)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1f1f] border border-cyan-500/40 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">Add Contract</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Contract Type *</label>
                <select
                  value={formData.contract_type}
                  onChange={(e) => {
                    setFormData({ ...formData, contract_type: e.target.value });
                    if (e.target.value === 'Fixed Price') {
                      setMilestones([]);
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  required
                >
                  <option value="Fixed Price">Fixed Price</option>
                  <option value="Milestone Based">Milestone Based</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Total Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Signed">Signed</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Signed Date</label>
                  <input
                    type="date"
                    value={formData.signed_date}
                    onChange={(e) => setFormData({ ...formData, signed_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Terms</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                />
              </div>

              {formData.contract_type === 'Milestone Based' && (
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-cyan-400">Milestones</label>
                    <button
                      type="button"
                      onClick={addMilestone}
                      className="px-4 py-2 text-sm font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20"
                    >
                      + Add Milestone
                    </button>
                  </div>
                  {milestones.map((milestone, index) => (
                    <div key={index} className="mb-4 p-4 bg-[#252525] border border-gray-800 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-white">Milestone {milestone.order}</span>
                        <button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-cyan-400 mb-1">Title *</label>
                          <input
                            type="text"
                            value={milestone.title}
                            onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-[#1f1f1f] border border-gray-800 text-white rounded-lg text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-cyan-400 mb-1">Amount ($) *</label>
                          <input
                            type="number"
                            step="0.01"
                            value={milestone.amount}
                            onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                            className="w-full px-3 py-2 bg-[#1f1f1f] border border-gray-800 text-white rounded-lg text-sm"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-cyan-400 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={milestone.due_date}
                            onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
                            className="w-full px-3 py-2 bg-[#1f1f1f] border border-gray-800 text-white rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-cyan-400 mb-1">Description</label>
                        <textarea
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 bg-[#1f1f1f] border border-gray-800 text-white rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-[#252525] border border-gray-800 rounded-xl hover:bg-[#2a2a2a] hover:border-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-cyan-500 rounded-xl hover:bg-cyan-600 border border-cyan-400/50 transition-all"
                >
                  Create Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientContractsView;

