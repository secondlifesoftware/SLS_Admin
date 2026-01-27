import React, { useState, useEffect } from 'react';
import { contractAPI } from '../../services/api';

function ClientContractsView({ clientId, onRefresh }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
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
  const [showMilestones, setShowMilestones] = useState({});

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const contractData = {
        ...formData,
        client_id: parseInt(clientId),
        total_amount: parseFloat(formData.total_amount),
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        signed_date: formData.signed_date ? new Date(formData.signed_date).toISOString() : null,
        milestones: milestones,
      };

      if (editingContract) {
        await contractAPI.update(editingContract.id, contractData);
        setSuccessMessage('Contract updated successfully!');
      } else {
        await contractAPI.create(contractData);
        setSuccessMessage('Contract created successfully!');
      }

      setShowAddModal(false);
      setEditingContract(null);
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
      fetchContracts();
      if (onRefresh) onRefresh();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(editingContract ? 'Failed to update contract: ' + err.message : 'Failed to create contract: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      contract_type: contract.contract_type || 'Fixed Price',
      title: contract.title || '',
      total_amount: contract.total_amount?.toString() || '',
      status: contract.status || 'Draft',
      start_date: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '',
      due_date: contract.due_date ? new Date(contract.due_date).toISOString().split('T')[0] : '',
      signed_date: contract.signed_date ? new Date(contract.signed_date).toISOString().split('T')[0] : '',
      description: contract.description || '',
      terms: contract.terms || '',
    });
    setMilestones(contract.milestones || []);
    setShowAddModal(true);
  };

  const handleDelete = async (contractId) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) {
      return;
    }
    try {
      await contractAPI.delete(contractId);
      setSuccessMessage('Contract deleted successfully!');
      fetchContracts();
      if (onRefresh) onRefresh();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete contract: ' + err.message);
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingContract(null);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Sent': 'bg-blue-100 text-blue-800',
      'Signed': 'bg-green-100 text-green-800',
      'Active': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-emerald-100 text-emerald-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Contracts</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all"
        >
          + New Contract
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No contracts found</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold"
          >
            Create First Contract
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{contract.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                      {contract.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium text-gray-900">{contract.contract_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-medium text-gray-900">${contract.total_amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <p className="font-medium text-gray-900">{formatDate(contract.start_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <p className="font-medium text-gray-900">{formatDate(contract.due_date)}</p>
                    </div>
                  </div>

                  {contract.signed_date && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Signed: </span>
                      <span className="font-medium text-gray-900">{formatDate(contract.signed_date)}</span>
                    </div>
                  )}

                  {contract.description && (
                    <p className="mt-3 text-sm text-gray-700">{contract.description}</p>
                  )}

                  {contract.milestones && contract.milestones.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowMilestones(prev => ({ ...prev, [contract.id]: !prev[contract.id] }))}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {showMilestones[contract.id] ? 'Hide' : 'Show'} Milestones ({contract.milestones.length})
                      </button>
                      {showMilestones[contract.id] && (
                        <div className="mt-2 space-y-2">
                          {contract.milestones.map((milestone, idx) => (
                            <div key={milestone.id || idx} className="bg-gray-50 rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{milestone.title}</span>
                                <span className="text-gray-600">${milestone.amount?.toFixed(2) || '0.00'}</span>
                              </div>
                              {milestone.description && (
                                <p className="text-gray-600 mt-1">{milestone.description}</p>
                              )}
                              {milestone.due_date && (
                                <p className="text-gray-500 text-xs mt-1">Due: {formatDate(milestone.due_date)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(contract)}
                    className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {editingContract ? 'Edit Contract' : 'New Contract'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract Type *</label>
                    <select
                      name="contract_type"
                      value={formData.contract_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Fixed Price">Fixed Price</option>
                      <option value="Milestone Based">Milestone Based</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Signed">Signed</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Signed Date</label>
                    <input
                      type="date"
                      name="signed_date"
                      value={formData.signed_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms</label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingContract ? 'Update Contract' : 'Create Contract'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientContractsView;
