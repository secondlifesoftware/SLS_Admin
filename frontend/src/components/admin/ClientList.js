import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI } from '../../services/api';

function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterContractStatus, setFilterContractStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleStatClick = (type, value) => {
    if (type === 'status') {
      setFilterStatus(value);
      setFilterContractStatus('All');
    } else if (type === 'contract') {
      setFilterContractStatus(value);
      setFilterStatus('All');
    }
  };

  useEffect(() => {
    fetchClients();
  }, [filterStatus, filterContractStatus]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'All') {
        params.status = filterStatus;
      }
      if (filterContractStatus !== 'All') {
        params.contract_status = filterContractStatus;
      }
      const data = await clientAPI.getAll(params);
      setClients(data);
      setError('');
    } catch (err) {
      setError('Failed to load clients: ' + err.message);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      Active: 'bg-green-500/20 text-green-400 border-green-500/30',
      Inactive: 'bg-gray-700 text-gray-300 border-gray-600',
      Lead: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      Prospect: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${badges[status] || badges.Inactive}`}>
        {status}
      </span>
    );
  };

  const getContractStatusBadge = (status) => {
    const badges = {
      'No Contract': 'bg-gray-700 text-gray-300 border-gray-600',
      'Negotiation': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Contract Signed': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Not Heard Back': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${badges[status] || badges['No Contract']}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDelete = async (clientId, clientName) => {
    if (!window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await clientAPI.delete(clientId);
      fetchClients();
    } catch (err) {
      setError('Failed to delete client: ' + err.message);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Clients</h1>
          <p className="text-gray-400">Manage your client relationships and projects</p>
        </div>
        <button
          onClick={() => navigate('/admin/clients/new')}
          className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50 hover:border-cyan-400 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add Client
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => handleStatClick('status', 'All')}
          className={`bg-[#1f1f1f] border rounded-xl p-6 transition-all duration-200 text-left hover:border-cyan-500/50 ${
            filterStatus === 'All' && filterContractStatus === 'All'
              ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/20'
              : 'border-cyan-500/30'
          }`}
        >
          <div className="text-sm text-cyan-400 mb-1 font-medium">Total Clients</div>
          <div className="text-3xl font-bold text-white">{clients.length}</div>
        </button>
        <button
          onClick={() => handleStatClick('status', 'Active')}
          className={`bg-[#1f1f1f] border rounded-xl p-6 transition-all duration-200 text-left hover:border-green-500/50 ${
            filterStatus === 'Active'
              ? 'border-green-500/60 shadow-lg shadow-green-500/20'
              : 'border-cyan-500/30'
          }`}
        >
          <div className="text-sm text-cyan-400 mb-1 font-medium">Active Clients</div>
          <div className="text-3xl font-bold text-green-400">
            {clients.filter((c) => c.status === 'Active').length}
          </div>
        </button>
        <button
          onClick={() => handleStatClick('contract', 'Contract Signed')}
          className={`bg-[#1f1f1f] border rounded-xl p-6 transition-all duration-200 text-left hover:border-blue-500/50 ${
            filterContractStatus === 'Contract Signed'
              ? 'border-blue-500/60 shadow-lg shadow-blue-500/20'
              : 'border-cyan-500/30'
          }`}
        >
          <div className="text-sm text-cyan-400 mb-1 font-medium">With Contracts</div>
          <div className="text-3xl font-bold text-blue-400">
            {clients.filter((c) => c.contract_status === 'Contract Signed').length}
          </div>
        </button>
        <button
          onClick={() => handleStatClick('contract', 'Negotiation')}
          className={`bg-[#1f1f1f] border rounded-xl p-6 transition-all duration-200 text-left hover:border-yellow-500/50 ${
            filterContractStatus === 'Negotiation'
              ? 'border-yellow-500/60 shadow-lg shadow-yellow-500/20'
              : 'border-cyan-500/30'
          }`}
        >
          <div className="text-sm text-cyan-400 mb-1 font-medium">In Negotiation</div>
          <div className="text-3xl font-bold text-yellow-400">
            {clients.filter((c) => c.contract_status === 'Negotiation').length}
          </div>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all duration-200 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400 whitespace-nowrap">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead">Lead</option>
              <option value="Prospect">Prospect</option>
            </select>

            <label className="text-sm text-gray-400 whitespace-nowrap ml-4">Contract:</label>
            <select
              value={filterContractStatus}
              onChange={(e) => setFilterContractStatus(e.target.value)}
              className="px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
            >
              <option value="All">All</option>
              <option value="No Contract">No Contract</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Contract Signed">Contract Signed</option>
              <option value="Completed">Completed</option>
              <option value="Not Heard Back">Not Heard Back</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-white mb-2">No clients found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filterStatus !== 'All' || filterContractStatus !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first client'}
          </p>
          {!searchTerm && filterStatus === 'All' && filterContractStatus === 'All' && (
            <button
              onClick={() => navigate('/admin/clients/new')}
              className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50"
            >
              Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/admin/clients/${client.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg border border-cyan-400/30">
                    {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {client.first_name} {client.last_name}
                    </h3>
                    {client.company && (
                      <p className="text-sm text-gray-400">{client.company}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>📧</span>
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>📅</span>
                  <span>Client since {formatDate(client.client_date)}</span>
                </div>
                {client.hourly_rate && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>💰</span>
                    <span>${client.hourly_rate}/hr</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {getStatusBadge(client.status)}
                {getContractStatusBadge(client.contract_status)}
              </div>

              {client.description && (
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{client.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/clients/${client.id}`);
                  }}
                  className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  View Details →
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(client.id, `${client.first_name} ${client.last_name}`);
                  }}
                  className="text-sm font-semibold text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientList;
