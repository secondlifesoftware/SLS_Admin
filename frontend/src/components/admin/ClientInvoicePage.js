import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientAPI, timeEntryAPI, invoiceAPI, contractAPI, expenseAPI } from '../../services/api';
import TimeEntryForm from './TimeEntryForm';
import ExpenseForm from './ExpenseForm';

function ClientInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [allTimeEntries, setAllTimeEntries] = useState([]); // All entries including invoiced
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [generateOptions, setGenerateOptions] = useState({
    contract_id: null,
    project_name: '',
    tax: 0.0,
    due_date: '',
  });
  const [activeTab, setActiveTab] = useState('unbilled'); // 'unbilled', 'all', 'invoices'

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientData, unbilledEntries, allEntries, invoicesData, contractsData] = await Promise.all([
        clientAPI.getById(id),
        timeEntryAPI.getByClientId(id, false), // Only unbilled
        timeEntryAPI.getByClientId(id, null), // All entries
        invoiceAPI.getAll({ client_id: id }),
        contractAPI.getByClientId(id),
      ]);
      
      setClient(clientData);
      setTimeEntries(unbilledEntries);
      setAllTimeEntries(allEntries);
      setInvoices(invoicesData);
      setContracts(contractsData);
      
      // Set default project name from active contract
      if (contractsData.length > 0) {
        const activeContract = contractsData.find(c => c.status === 'Active' || c.status === 'Signed');
        if (activeContract) {
          setGenerateOptions(prev => ({
            ...prev,
            contract_id: activeContract.id,
            project_name: activeContract.title,
          }));
        }
      }
      
      setError('');
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEntryToggle = (entryId) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    const currentEntries = activeTab === 'unbilled' ? timeEntries : allTimeEntries.filter(e => !e.invoice_id);
    if (selectedEntries.length === currentEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(currentEntries.map(e => e.id));
    }
  };

  const handleGenerateInvoice = async () => {
    if (selectedEntries.length === 0) {
      setError('Please select at least one time entry');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const invoice = await invoiceAPI.generateFromTimeEntries(id, selectedEntries, {
        contract_id: generateOptions.contract_id || null,
        project_name: generateOptions.project_name || null,
        tax: parseFloat(generateOptions.tax) || 0.0,
        due_date: generateOptions.due_date ? new Date(generateOptions.due_date).toISOString() : null,
      });

      setShowGenerateModal(false);
      setSelectedEntries([]);
      setSuccessMessage(`Invoice ${invoice.invoice_number} created successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to generate invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) {
      return;
    }
    try {
      await timeEntryAPI.delete(entryId);
      fetchData();
      setSuccessMessage('Time entry deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to delete time entry: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const currentEntries = activeTab === 'unbilled' 
    ? timeEntries 
    : allTimeEntries.filter(e => !e.invoice_id);

  const totalHours = currentEntries
    .filter(e => selectedEntries.includes(e.id))
    .reduce((sum, e) => sum + e.hours, 0);
  
  const totalAmount = currentEntries
    .filter(e => selectedEntries.includes(e.id))
    .reduce((sum, e) => sum + e.amount, 0);

  const allHours = allTimeEntries.reduce((sum, e) => sum + e.hours, 0);
  const allAmount = allTimeEntries.reduce((sum, e) => sum + e.amount, 0);
  const unbilledHours = timeEntries.reduce((sum, e) => sum + e.hours, 0);
  const unbilledAmount = timeEntries.reduce((sum, e) => sum + e.amount, 0);

  if (loading && !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => navigate('/admin/clients')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/admin/clients/${id}`)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Client
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Invoice Management</h1>
            <p className="text-gray-600 mt-1">
              {client?.first_name} {client?.last_name}
              {client?.company && ` • ${client.company}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTimeEntryForm(!showTimeEntryForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              {showTimeEntryForm ? 'Cancel' : 'Add Time Entry'}
            </button>
            <button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              {showExpenseForm ? 'Cancel' : 'Add Fixed Cost'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Unbilled Hours</div>
          <div className="text-3xl font-semibold text-blue-600">{unbilledHours.toFixed(2)}</div>
          <div className="text-sm text-gray-600 mt-1">${unbilledAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Hours</div>
          <div className="text-3xl font-semibold text-gray-900">{allHours.toFixed(2)}</div>
          <div className="text-sm text-gray-600 mt-1">${allAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Generated Invoices</div>
          <div className="text-3xl font-semibold text-green-600">{invoices.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">Total Invoiced</div>
          <div className="text-3xl font-semibold text-purple-600">
            ${invoices.reduce((sum, inv) => sum + inv.total, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Time Entry Form */}
      {showTimeEntryForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
          </h2>
          <TimeEntryForm
            clientId={id}
            onSuccess={() => {
              setShowTimeEntryForm(false);
              setEditingEntry(null);
              fetchData();
            }}
            onCancel={() => {
              setShowTimeEntryForm(false);
              setEditingEntry(null);
            }}
          />
        </div>
      )}

      {/* Fixed Cost Form */}
      {showExpenseForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Fixed Cost</h2>
          <ExpenseForm
            clientId={id}
            onSuccess={async () => {
              setShowExpenseForm(false);
              fetchData();
            }}
            onCancel={() => setShowExpenseForm(false)}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('unbilled');
              setSelectedEntries([]);
            }}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${
                activeTab === 'unbilled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            ⏱️ Unbilled Time ({timeEntries.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedEntries([]);
            }}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            📋 All Time Entries ({allTimeEntries.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('invoices');
              setSelectedEntries([]);
            }}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
              ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            📄 Generated Invoices ({invoices.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'unbilled' || activeTab === 'all' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'unbilled' ? 'Unbilled Time Entries' : 'All Time Entries'}
            </h2>
            {currentEntries.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedEntries.length === currentEntries.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedEntries.length > 0 && (
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
                  >
                    Generate Invoice ({selectedEntries.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {currentEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏱️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === 'unbilled' ? 'No unbilled time entries' : 'No time entries'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'unbilled' 
                  ? 'All time entries have been invoiced'
                  : 'Add time entries to track work for this client'}
              </p>
              {activeTab === 'all' && (
                <button
                  onClick={() => setShowTimeEntryForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  Add Time Entry
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                        <input
                          type="checkbox"
                          checked={selectedEntries.length === currentEntries.length && currentEntries.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Person</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedEntries.includes(entry.id) ? 'bg-blue-50' : ''
                        } ${entry.invoice_id ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 py-3">
                          {!entry.invoice_id && (
                            <input
                              type="checkbox"
                              checked={selectedEntries.includes(entry.id)}
                              onChange={() => handleEntryToggle(entry.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.person}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={entry.description}>
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.hours.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">${entry.rate.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          ${entry.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {entry.invoice_id ? (
                            <span className="text-xs text-gray-500">Invoiced</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {selectedEntries.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          Selected Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{totalHours.toFixed(2)} hrs</td>
                        <td></td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                          ${totalAmount.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Invoices Tab */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Invoices</h2>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices generated yet</h3>
              <p className="text-gray-600 mb-4">Generate your first invoice from time entries above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(invoice.issue_date)} • {invoice.project_name || 'No project name'} • ${invoice.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8000'}/api/invoices/${invoice.id}/generate-pdf`);
                          if (!response.ok) throw new Error('Failed to generate PDF');
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `invoice_${invoice.invoice_number}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (err) {
                          alert('Failed to export PDF: ' + err.message);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      PDF
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8000'}/api/invoices/${invoice.id}/generate-csv`);
                          if (!response.ok) throw new Error('Failed to generate CSV');
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `SLS_${invoice.invoice_number}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (err) {
                          alert('Failed to export CSV: ' + err.message);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Generate Invoice</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={generateOptions.project_name}
                  onChange={(e) => setGenerateOptions({ ...generateOptions, project_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Propharma AI Web Application"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contract (Optional)</label>
                <select
                  value={generateOptions.contract_id || ''}
                  onChange={(e) => setGenerateOptions({
                    ...generateOptions,
                    contract_id: e.target.value ? parseInt(e.target.value) : null,
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">None</option>
                  {contracts.map(contract => (
                    <option key={contract.id} value={contract.id}>{contract.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={generateOptions.tax}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, tax: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={generateOptions.due_date}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal ({selectedEntries.length} entries):</span>
                  <span className="font-medium text-gray-900">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-900">${parseFloat(generateOptions.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">
                    ${(totalAmount + parseFloat(generateOptions.tax || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={loading || !generateOptions.project_name}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientInvoicePage;
