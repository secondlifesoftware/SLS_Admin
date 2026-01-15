import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI, timeEntryAPI, invoiceAPI, contractAPI, expenseAPI } from '../../services/api';
import TimeEntryForm from './TimeEntryForm';
import ExpenseForm from './ExpenseForm';

function CreateInvoiceWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddTimeEntryForm, setShowAddTimeEntryForm] = useState(false);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState('time'); // 'time' or 'expenses'
  
  // Invoice form data
  const [invoiceData, setInvoiceData] = useState({
    project_name: '',
    contract_id: null,
    tax: 0.0,
    due_date: '',
    // Editable client info
    client_name: '',
    client_company: '',
    client_address: '',
    client_email: '',
    client_phone: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientDetails();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const data = await clientAPI.getAll();
      setClients(data);
    } catch (err) {
      setError('Failed to load clients: ' + err.message);
    }
  };

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const [clientData, entriesData, expensesData, contractsData] = await Promise.all([
        clientAPI.getById(selectedClient),
        timeEntryAPI.getByClientId(selectedClient, false), // Only unbilled
        expenseAPI.getByClientId(selectedClient), // Get unbilled expenses (invoice_id is null)
        contractAPI.getByClientId(selectedClient),
      ]);
      
      setClientDetails(clientData);
      setTimeEntries(entriesData);
      // Filter expenses to only show unbilled ones (invoice_id is null)
      const unbilledExpenses = expensesData.filter(exp => !exp.invoice_id);
      setExpenses(unbilledExpenses);
      setContracts(contractsData);
      
      // Auto-populate invoice data from client
      setInvoiceData(prev => ({
        ...prev,
        client_name: `${clientData.first_name} ${clientData.last_name}`,
        client_company: clientData.company || '',
        client_address: clientData.address || '',
        client_email: clientData.email || '',
        client_phone: clientData.contacts && clientData.contacts.length > 0 ? clientData.contacts[0].phone || '' : '',
        project_name: contractsData.find(c => c.status === 'Active' || c.status === 'Signed')?.title || '',
        contract_id: contractsData.find(c => c.status === 'Active' || c.status === 'Signed')?.id || null,
      }));
      
      setError('');
    } catch (err) {
      setError('Failed to load client details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedClient) {
      setError('Please select a client');
      return;
    }
    if (step === 2 && selectedEntries.length === 0 && selectedExpenses.length === 0) {
      setError('Please select at least one time entry or expense');
      return;
    }
    if (step === 3) {
      // Validate required fields
      if (!invoiceData.project_name) {
        setError('Project name is required');
        return;
      }
      if (!invoiceData.client_name) {
        setError('Client name is required');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleEntryToggle = (entryId) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    if (activeTab === 'time') {
      if (selectedEntries.length === timeEntries.length) {
        setSelectedEntries([]);
      } else {
        setSelectedEntries(timeEntries.map(e => e.id));
      }
    } else {
      if (selectedExpenses.length === expenses.length) {
        setSelectedExpenses([]);
      } else {
        setSelectedExpenses(expenses.map(e => e.id));
      }
    }
  };

  const handleExpenseToggle = (expenseId) => {
    setSelectedExpenses(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleGenerateInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      
      const invoice = await invoiceAPI.generateFromTimeEntries(
        selectedClient,
        selectedEntries,
        selectedExpenses,
        {
          contract_id: invoiceData.contract_id || null,
          project_name: invoiceData.project_name,
          tax: parseFloat(invoiceData.tax) || 0.0,
          due_date: invoiceData.due_date ? new Date(invoiceData.due_date).toISOString() : null,
        }
      );

      navigate(`/admin/invoices/${invoice.id}`);
    } catch (err) {
      setError('Failed to generate invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const totalHours = timeEntries
    .filter(e => selectedEntries.includes(e.id))
    .reduce((sum, e) => sum + e.hours, 0);
  
  const laborSubtotal = timeEntries
    .filter(e => selectedEntries.includes(e.id))
    .reduce((sum, e) => sum + e.amount, 0);
  
  const expenseSubtotal = expenses
    .filter(e => selectedExpenses.includes(e.id))
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalAmount = laborSubtotal + expenseSubtotal;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/invoices')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Invoices
        </button>
        <h1 className="text-3xl font-semibold text-gray-900">Create Invoice</h1>
        <p className="text-gray-600 mt-1">Step {step} of 4</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                <div className="mt-2 text-xs text-center text-gray-600">
                  {s === 1 && 'Select Client'}
                  {s === 2 && 'Select Items'}
                  {s === 3 && 'Review Details'}
                  {s === 4 && 'Generate'}
                </div>
              </div>
              {s < 4 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Step 1: Select Client */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Client</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`w-full p-4 text-left border-2 rounded-xl transition-all ${
                  selectedClient === client.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {client.first_name} {client.last_name}
                    </div>
                    {client.company && (
                      <div className="text-sm text-gray-600">{client.company}</div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">{client.email}</div>
                  </div>
                  {selectedClient === client.id && (
                    <span className="text-blue-600 text-xl">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Time Entries & Expenses */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Select Time Entries & Expenses</h2>
            <div className="flex gap-2">
              {activeTab === 'time' ? (
                <button
                  onClick={() => setShowAddTimeEntryForm(!showAddTimeEntryForm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  {showAddTimeEntryForm ? 'Cancel' : 'Add Time Entry'}
                </button>
              ) : (
                <button
                  onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="text-xl">+</span>
                  {showAddExpenseForm ? 'Cancel' : 'Add Expense'}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('time')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'time'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⏱️ Time Entries ({timeEntries.length})
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'expenses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💰 Expenses ({expenses.length})
              </button>
            </nav>
          </div>

          {/* Add Time Entry Form */}
          {showAddTimeEntryForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Time Entry</h3>
              <TimeEntryForm
                clientId={selectedClient}
                defaultRate={clientDetails?.hourly_rate || 150.00}
                onSuccess={async () => {
                  setShowAddTimeEntryForm(false);
                  // Refresh time entries and auto-select newly added ones
                  try {
                    const previousEntryIds = new Set(timeEntries.map(e => e.id));
                    const entriesData = await timeEntryAPI.getByClientId(selectedClient, false);
                    setTimeEntries(entriesData);
                    
                    // Find and auto-select newly added entries
                    const newEntryIds = entriesData
                      .filter(e => !previousEntryIds.has(e.id))
                      .map(e => e.id);
                    
                    if (newEntryIds.length > 0) {
                      setSelectedEntries([...selectedEntries, ...newEntryIds]);
                    }
                  } catch (err) {
                    setError('Failed to refresh time entries: ' + err.message);
                  }
                }}
                onCancel={() => setShowAddTimeEntryForm(false)}
              />
            </div>
          )}

          {/* Add Expense Form */}
          {showAddExpenseForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Fixed Cost</h3>
              <ExpenseForm
                clientId={selectedClient}
                onSuccess={async () => {
                  setShowAddExpenseForm(false);
                  // Refresh expenses and auto-select newly added ones
                  try {
                    const previousExpenseIds = new Set(expenses.map(e => e.id));
                    const expensesData = await expenseAPI.getByClientId(selectedClient);
                    const unbilledExpenses = expensesData.filter(exp => !exp.invoice_id);
                    setExpenses(unbilledExpenses);
                    
                    // Find and auto-select newly added expenses
                    const newExpenseIds = unbilledExpenses
                      .filter(e => !previousExpenseIds.has(e.id))
                      .map(e => e.id);
                    
                    if (newExpenseIds.length > 0) {
                      setSelectedExpenses([...selectedExpenses, ...newExpenseIds]);
                    }
                  } catch (err) {
                    setError('Failed to refresh expenses: ' + err.message);
                  }
                }}
                onCancel={() => setShowAddExpenseForm(false)}
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'time' ? (
            timeEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⏱️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No unbilled time entries</h3>
                <p className="text-gray-600 mb-4">This client has no unbilled time entries to invoice.</p>
                <button
                  onClick={() => setShowAddTimeEntryForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  Add Time Entry
                </button>
              </div>
            ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600">
                  {clientDetails && `${clientDetails.first_name} ${clientDetails.last_name}`} • {timeEntries.length} entries available
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedEntries.length === timeEntries.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                        <input
                          type="checkbox"
                          checked={selectedEntries.length === timeEntries.length && timeEntries.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Person</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`hover:bg-gray-50 ${
                          selectedEntries.includes(entry.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedEntries.includes(entry.id)}
                            onChange={() => handleEntryToggle(entry.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.person}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.start_time} - {entry.end_time}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{entry.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.hours.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">${entry.rate.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          ${entry.amount.toFixed(2)}
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
                          ${laborSubtotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
            )
          ) : (
            expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No unbilled fixed cost</h3>
                <p className="text-gray-600 mb-4">This client has no unbilled fixed costs to invoice.</p>
                <button
                  onClick={() => setShowAddExpenseForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
                >
                  Add Fixed Cost
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600">
                    {clientDetails && `${clientDetails.first_name} ${clientDetails.last_name}`} • {expenses.length} fixed costs available
                  </p>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectedExpenses.length === expenses.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Person</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hrs</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => {
                        // For fixed costs: Person = "System", Time = "0:00 - 0:00", Hours = "0.00"
                        const person = "System";
                        let timeStr = "0:00 - 0:00";
                        let hoursStr = "0.00";
                        
                        // If expense has actual time/hours data, use it (for backwards compatibility)
                        if (expense.start_time && expense.end_time) {
                          timeStr = `${expense.start_time} - ${expense.end_time}`;
                        }
                        if (expense.hours && expense.hours > 0) {
                          hoursStr = expense.hours.toFixed(2);
                        }
                        
                        return (
                          <tr
                            key={expense.id}
                            className={`hover:bg-gray-50 ${
                              selectedExpenses.includes(expense.id) ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedExpenses.includes(expense.id)}
                                onChange={() => handleExpenseToggle(expense.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(expense.date)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{person}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{expense.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{timeStr}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{hoursStr}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              ${expense.amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {selectedExpenses.length > 0 && (
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="6" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            Selected Total:
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            ${expenseSubtotal.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* Step 3: Review & Edit Details */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review & Edit Invoice Details</h2>
          
          <div className="space-y-6">
            {/* Project Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={invoiceData.project_name}
                    onChange={(e) => setInvoiceData({ ...invoiceData, project_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract (Optional)</label>
                  <select
                    value={invoiceData.contract_id || ''}
                    onChange={(e) => setInvoiceData({ ...invoiceData, contract_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">None</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>{contract.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Client Information (Editable) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={invoiceData.client_name}
                    onChange={(e) => setInvoiceData({ ...invoiceData, client_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={invoiceData.client_company}
                    onChange={(e) => setInvoiceData({ ...invoiceData, client_company: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={invoiceData.client_email}
                    onChange={(e) => setInvoiceData({ ...invoiceData, client_email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={invoiceData.client_phone}
                    onChange={(e) => setInvoiceData({ ...invoiceData, client_phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={invoiceData.client_address}
                    onChange={(e) => setInvoiceData({ ...invoiceData, client_address: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceData.tax}
                    onChange={(e) => setInvoiceData({ ...invoiceData, tax: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={invoiceData.due_date}
                    onChange={(e) => setInvoiceData({ ...invoiceData, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              {selectedEntries.length > 0 && (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Labor hours:</span>
                    <span className="font-medium text-gray-900">{totalHours.toFixed(2)} hrs</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Labor subtotal ({selectedEntries.length} entries):</span>
                    <span className="font-medium text-gray-900">${laborSubtotal.toFixed(2)}</span>
                  </div>
                </>
              )}
              {selectedExpenses.length > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Expenses subtotal ({selectedExpenses.length} items):</span>
                  <span className="font-medium text-gray-900">${expenseSubtotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium text-gray-900">${parseFloat(invoiceData.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total:</span>
                <span className="text-blue-600">
                  ${(totalAmount + parseFloat(invoiceData.tax || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Generate */}
      {step === 4 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ready to Generate Invoice</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Invoice Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium text-gray-900">{invoiceData.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project:</span>
                  <span className="font-medium text-gray-900">{invoiceData.project_name}</span>
                </div>
                {selectedEntries.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Entries:</span>
                      <span className="font-medium text-gray-900">{selectedEntries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="font-medium text-gray-900">{totalHours.toFixed(2)} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor subtotal:</span>
                      <span className="font-medium text-gray-900">${laborSubtotal.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {selectedExpenses.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses ({selectedExpenses.length} items):</span>
                    <span className="font-medium text-gray-900">${expenseSubtotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-900">${parseFloat(invoiceData.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-300">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">
                    ${(totalAmount + parseFloat(invoiceData.tax || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Note:</span> Once generated, you can finalize and archive this invoice from the invoice detail page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        {step < 4 ? (
          <button
            onClick={handleNext}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleGenerateInvoice}
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Invoice'}
          </button>
        )}
      </div>
    </div>
  );
}

export default CreateInvoiceWizard;

