import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI, clientAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/themeUtils';

function InvoiceGenerator() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterClient, setFilterClient] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterClient, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'All') {
        params.status = filterStatus;
      }
      if (filterClient !== 'All') {
        params.client_id = parseInt(filterClient);
      }
      params.archived = activeTab === 'archived';
      
      const [invoicesData, clientsData] = await Promise.all([
        invoiceAPI.getAll(params),
        clientAPI.getAll(),
      ]);
      
      setInvoices(invoicesData);
      setClients(clientsData);
      setError('');
    } catch (err) {
      setError('Failed to load invoices: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.project_name && invoice.project_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice.client && `${invoice.client.first_name} ${invoice.client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-600 border-gray-300',
      Sent: 'bg-purple-100 text-purple-700 border-purple-300 shadow-sm shadow-purple-500/20',
      Paid: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/20',
      Overdue: 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm shadow-rose-500/20',
      Cancelled: 'bg-gray-100 text-gray-500 border-gray-300',
      Finalized: 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm shadow-blue-500/20',
      Archived: 'bg-gray-100 text-gray-600 border-gray-300',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${badges[status] || badges.Draft}`}>
        {status}
      </span>
    );
  };

  const totalRevenue = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + i.total, 0);
  
  const pendingAmount = invoices
    .filter(i => i.status === 'Sent' || i.status === 'Draft')
    .reduce((sum, i) => sum + i.total, 0);

  const overdueAmount = invoices
    .filter(i => i.status === 'Overdue')
    .reduce((sum, i) => sum + i.total, 0);

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Invoices</h1>
            <p className="text-gray-600 font-medium">Manage and track all your invoices</p>
          </div>
          <button
            onClick={() => navigate('/admin/invoices/create')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create Invoice
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-purple-100">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`
                py-4 px-1 border-b-2 font-bold text-sm transition-all duration-200
                ${
                  activeTab === 'active'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }
              `}
            >
              Active Invoices
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`
                py-4 px-1 border-b-2 font-bold text-sm transition-all duration-200
                ${
                  activeTab === 'archived'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
                }
              `}
            >
              Archived Invoices
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6 shadow-sm">
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 hover:shadow-xl hover:border-purple-300 transition-all">
          <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Total Invoices</div>
          <div className="text-4xl font-black text-gray-800">{invoices.length}</div>
        </div>
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 hover:shadow-xl hover:border-emerald-300 transition-all">
          <div className="text-sm font-bold text-emerald-600 mb-2">Paid Revenue</div>
          <div className="text-4xl font-black text-emerald-600">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 hover:shadow-xl hover:border-amber-300 transition-all">
          <div className="text-sm font-bold text-amber-600 mb-2">Pending</div>
          <div className="text-4xl font-black text-amber-600">${pendingAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white border-2 border-rose-200 rounded-2xl p-6 hover:shadow-xl hover:border-rose-300 transition-all">
          <div className="text-sm font-bold text-rose-600 mb-2">Overdue</div>
          <div className="text-4xl font-black text-rose-600">${overdueAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-purple-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search by invoice number, project name, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-purple-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 font-bold whitespace-nowrap">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Finalized">Finalized</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <label className="text-sm text-gray-700 font-bold whitespace-nowrap ml-4">Client:</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="All">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-12 text-center shadow-lg">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No invoices found</h3>
          <p className="text-gray-600 font-medium mb-6">
            {searchTerm || filterStatus !== 'All' || filterClient !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating an invoice from a client'}
          </p>
          {!searchTerm && filterStatus === 'All' && filterClient === 'All' && activeTab === 'active' && (
            <button
              onClick={() => navigate('/admin/invoices/create')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105"
            >
              Create Your First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-purple-200 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-purple-100">
              <thead className="bg-gradient-to-r from-purple-500 to-pink-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-purple-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{invoice.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/clients/${invoice.client_id}`)}
                        className="text-sm text-purple-600 hover:text-purple-700 hover:underline font-semibold"
                      >
                        {invoice.client?.first_name} {invoice.client?.last_name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm max-w-xs truncate text-gray-600 font-medium">
                        {invoice.project_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-medium">{formatDate(invoice.issue_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-medium">{formatDate(invoice.due_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-800">${invoice.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                        className="text-purple-600 hover:text-purple-700 font-bold hover:underline mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/admin/clients/${invoice.client_id}/invoices`)}
                        className={`${themeClasses.textTertiary} hover:${themeClasses.textSecondary}`}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceGenerator;
