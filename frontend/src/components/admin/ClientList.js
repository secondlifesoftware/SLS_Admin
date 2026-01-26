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
      Active: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/20',
      Inactive: 'bg-gray-100 text-gray-600 border-gray-300',
      Lead: 'bg-purple-100 text-purple-700 border-purple-300 shadow-sm shadow-purple-500/20',
      Prospect: 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm shadow-amber-500/20',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${badges[status] || badges.Inactive}`}>
        {status}
      </span>
    );
  };

  const getContractStatusBadge = (status) => {
    const badges = {
      'No Contract': 'bg-gray-100 text-gray-600 border-gray-300',
      'Negotiation': 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm shadow-amber-500/20',
      'Contract Signed': 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/20',
      'Not Heard Back': 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm shadow-rose-500/20',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${badges[status] || badges['No Contract']}`}>
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
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Clients</h1>
          <p className="text-gray-600 font-medium">Manage your client relationships and projects</p>
        </div>
        <button
          onClick={() => navigate('/admin/clients/new')}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/30 transition-all border-2 border-transparent hover:scale-105 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add Client
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6 shadow-sm">
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => handleStatClick('status', 'All')}
          className={`bg-white border-2 rounded-2xl p-6 transition-all duration-200 text-left hover:shadow-xl ${
            filterStatus === 'All' && filterContractStatus === 'All'
              ? 'border-purple-400 shadow-2xl shadow-purple-500/30 scale-105'
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Total Clients</div>
          <div className="text-4xl font-black text-gray-800">{clients.length}</div>
        </button>
        <button
          onClick={() => handleStatClick('status', 'Active')}
          className={`bg-white border-2 rounded-2xl p-6 transition-all duration-200 text-left hover:shadow-xl ${
            filterStatus === 'Active'
              ? 'border-emerald-400 shadow-2xl shadow-emerald-500/30 scale-105'
              : 'border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-sm font-bold text-emerald-600 mb-2">Active Clients</div>
          <div className="text-4xl font-black text-emerald-600">
            {clients.filter((c) => c.status === 'Active').length}
          </div>
        </button>
        <button
          onClick={() => handleStatClick('contract', 'Contract Signed')}
          className={`bg-white border-2 rounded-2xl p-6 transition-all duration-200 text-left hover:shadow-xl ${
            filterContractStatus === 'Contract Signed'
              ? 'border-blue-400 shadow-2xl shadow-blue-500/30 scale-105'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-sm font-bold text-blue-600 mb-2">With Contracts</div>
          <div className="text-4xl font-black text-blue-600">
            {clients.filter((c) => c.contract_status === 'Contract Signed').length}
          </div>
        </button>
        <button
          onClick={() => handleStatClick('contract', 'Negotiation')}
          className={`bg-white border-2 rounded-2xl p-6 transition-all duration-200 text-left hover:shadow-xl ${
            filterContractStatus === 'Negotiation'
              ? 'border-amber-400 shadow-2xl shadow-amber-500/30 scale-105'
              : 'border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="text-sm font-bold text-amber-600 mb-2">In Negotiation</div>
          <div className="text-4xl font-black text-amber-600">
            {clients.filter((c) => c.contract_status === 'Negotiation').length}
          </div>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-purple-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-purple-400"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 font-bold whitespace-nowrap">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead">Lead</option>
              <option value="Prospect">Prospect</option>
            </select>

            <label className="text-sm text-gray-700 font-bold whitespace-nowrap ml-4">Contract:</label>
            <select
              value={filterContractStatus}
              onChange={(e) => setFilterContractStatus(e.target.value)}
              className="px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-12 text-center shadow-lg">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No clients found</h3>
          <p className="text-gray-600 font-medium mb-6">
            {searchTerm || filterStatus !== 'All' || filterContractStatus !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first client'}
          </p>
          {!searchTerm && filterStatus === 'All' && filterContractStatus === 'All' && (
            <button
              onClick={() => navigate('/admin/clients/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105"
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
              className="bg-white border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-200 cursor-pointer hover:scale-105"
              onClick={() => navigate(`/admin/clients/${client.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
                    {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {client.first_name} {client.last_name}
                    </h3>
                    {client.company && (
                      <p className="text-sm text-gray-600 font-medium">{client.company}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <span>📧</span>
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <span>📅</span>
                  <span>Client since {formatDate(client.client_date)}</span>
                </div>
                {client.hourly_rate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
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
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{client.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t-2 border-purple-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/clients/${client.id}`);
                  }}
                  className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline"
                >
                  View Details →
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(client.id, `${client.first_name} ${client.last_name}`);
                  }}
                  className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline"
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
