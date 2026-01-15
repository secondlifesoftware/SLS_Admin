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
      Draft: 'bg-gray-700 text-gray-300 border-gray-600',
      Sent: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      Paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      Overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
      Cancelled: 'bg-gray-700 text-gray-400 border-gray-600',
      Finalized: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      Archived: 'bg-gray-600 text-gray-300 border-gray-500',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${badges[status] || badges.Draft}`}>
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
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={themeClasses.bgPrimary}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${themeClasses.textPrimary}`}>Invoices</h1>
            <p className={themeClasses.textSecondary}>Manage and track all your invoices</p>
          </div>
          <button
            onClick={() => navigate('/admin/invoices/create')}
            className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50 hover:border-cyan-400 flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create Invoice
          </button>
        </div>

        {/* Tabs */}
        <div className={`border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === 'active'
                    ? 'border-cyan-400 text-cyan-400'
                    : `border-transparent ${theme === 'light' ? 'text-gray-600 hover:text-gray-800 hover:border-gray-300' : 'text-gray-500 hover:text-gray-300 hover:border-gray-700'}`
                }
              `}
            >
              Active Invoices
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === 'archived'
                    ? 'border-cyan-400 text-cyan-400'
                    : `border-transparent ${theme === 'light' ? 'text-gray-600 hover:text-gray-800 hover:border-gray-300' : 'text-gray-500 hover:text-gray-300 hover:border-gray-700'}`
                }
              `}
            >
              Archived Invoices
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${themeClasses.cardBg} border-cyan-500/30 rounded-xl p-6 ${themeClasses.cardHover} transition-all`}>
          <div className="text-sm text-cyan-400 mb-1 font-medium">Total Invoices</div>
          <div className={`text-3xl font-bold ${themeClasses.textPrimary}`}>{invoices.length}</div>
        </div>
        <div className={`${themeClasses.cardBg} border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all`}>
          <div className="text-sm text-cyan-400 mb-1 font-medium">Paid Revenue</div>
          <div className="text-3xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className={`${themeClasses.cardBg} border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition-all`}>
          <div className="text-sm text-cyan-400 mb-1 font-medium">Pending</div>
          <div className="text-3xl font-bold text-yellow-400">${pendingAmount.toFixed(2)}</div>
        </div>
        <div className={`${themeClasses.cardBg} border-red-500/30 rounded-xl p-6 hover:border-red-500/50 transition-all`}>
          <div className="text-sm text-cyan-400 mb-1 font-medium">Overdue</div>
          <div className="text-3xl font-bold text-red-400">${overdueAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`${themeClasses.cardBg} ${themeClasses.borderPrimary} rounded-2xl p-6 mb-6`}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search by invoice number, project name, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2.5 ${themeClasses.inputBg} ${themeClasses.inputText} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 ${themeClasses.inputPlaceholder}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className={`text-sm ${themeClasses.textSecondary} whitespace-nowrap`}>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2.5 ${themeClasses.inputBg} ${themeClasses.inputText} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50`}
            >
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Finalized">Finalized</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <label className={`text-sm ${themeClasses.textSecondary} whitespace-nowrap ml-4`}>Client:</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className={`px-4 py-2.5 ${themeClasses.inputBg} ${themeClasses.inputText} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50`}
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
        <div className={`${themeClasses.cardBg} ${themeClasses.borderPrimary} rounded-2xl p-12 text-center`}>
          <div className="text-6xl mb-4">📄</div>
          <h3 className={`text-xl font-bold mb-2 ${themeClasses.textPrimary}`}>No invoices found</h3>
          <p className={`${themeClasses.textSecondary} mb-6`}>
            {searchTerm || filterStatus !== 'All' || filterClient !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating an invoice from a client'}
          </p>
          {!searchTerm && filterStatus === 'All' && filterClient === 'All' && activeTab === 'active' && (
            <button
              onClick={() => navigate('/admin/invoices/create')}
              className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50"
            >
              Create Your First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className={`${themeClasses.cardBg} ${themeClasses.borderPrimary} rounded-2xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-800'}`}>
              <thead className={themeClasses.bgTertiary}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase">Issue Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-cyan-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className={themeClasses.bgSecondary}>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className={`${themeClasses.bgSecondary} transition-colors duration-150 ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-[#252525]'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${themeClasses.textPrimary}`}>{invoice.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/clients/${invoice.client_id}`)}
                        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        {invoice.client?.first_name} {invoice.client?.last_name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm max-w-xs truncate ${themeClasses.textSecondary}`}>
                        {invoice.project_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${themeClasses.textSecondary}`}>{formatDate(invoice.issue_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${themeClasses.textSecondary}`}>{formatDate(invoice.due_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-bold ${themeClasses.textPrimary}`}>${invoice.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                        className="text-cyan-400 hover:text-cyan-300 mr-4"
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
