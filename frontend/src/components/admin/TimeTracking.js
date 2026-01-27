import React, { useState, useEffect, useRef } from 'react';
import { timeEntryAPI, invoiceAPI, expenseAPI, contractAPI, clientAPI } from '../../services/api';
import { auth } from '../../firebase';
import ExpenseForm from './ExpenseForm';

function TimeTracking({ clientId }) {
  const [timeEntries, setTimeEntries] = useState([]);
  const [client, setClient] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Timer state
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);
  
  // Form state for manual entry
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    person: '',
    description: '',
    hours: '',
    rate: '',
    amount: '',
  });
  
  // Invoice creation state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    project_name: '',
    contract_id: null,
    tax: 0.0,
    due_date: '',
  });
  const [emailInvoice, setEmailInvoice] = useState(false);
  const [emailTo, setEmailTo] = useState('');

  useEffect(() => {
    fetchData();
    // Get current user email for default person
    if (auth?.currentUser?.email) {
      setFormData(prev => ({ ...prev, person: auth.currentUser.email }));
    }
  }, [clientId]);

  useEffect(() => {
    if (isTracking && trackingStartTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - trackingStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, trackingStartTime]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientData, entries, contractsData] = await Promise.all([
        clientAPI.getById(clientId),
        timeEntryAPI.getByClientId(clientId, false), // Get unbilled entries
        contractAPI.getByClientId(clientId),
      ]);
      setClient(clientData);
      setTimeEntries(entries);
      setContracts(contractsData);
      
      // Set default rate from client
      if (clientData.hourly_rate) {
        setFormData(prev => ({ ...prev, rate: clientData.hourly_rate }));
      }
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    const diffMs = endDate - startDate;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const enhanceDescription = async (description) => {
    if (!description || !description.trim()) return description;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/time-entries/enhance-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to enhance description');
      }
      
      const data = await response.json();
      return data.enhanced_description || description;
    } catch (err) {
      console.error('Error enhancing description:', err);
      return description; // Return original if enhancement fails
    }
  };

  const handleStartStop = async () => {
    if (!isTracking) {
      // Start tracking
      const now = new Date();
      setTrackingStartTime(now.getTime());
      setIsTracking(true);
      setElapsedTime(0);
    } else {
      // Stop tracking and create entry
      if (!trackingStartTime) return;
      
      const startTime = new Date(trackingStartTime);
      const endTime = new Date();
      const hours = Math.round((endTime - startTime) / (1000 * 60 * 60) * 100) / 100;
      
      const startTimeStr = startTime.toTimeString().slice(0, 5);
      const endTimeStr = endTime.toTimeString().slice(0, 5);
      const dateStr = startTime.toISOString().split('T')[0];
      
      // Calculate amount if rate is set
      const rate = parseFloat(formData.rate) || client?.hourly_rate || 0;
      const amount = hours * rate;
      
      // Show form to add description
      setFormData({
        date: dateStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        person: auth?.currentUser?.email || formData.person,
        description: '',
        hours: hours.toFixed(2),
        rate: rate.toString(),
        amount: amount.toFixed(2),
      });
      
      setShowManualForm(true);
      setIsTracking(false);
      setTrackingStartTime(null);
      setElapsedTime(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Recalculate hours if times change
      if (name === 'start_time' || name === 'end_time') {
        const hours = calculateHours(updated.start_time, updated.end_time);
        updated.hours = hours ? hours.toFixed(2) : '';
        if (hours && updated.rate) {
          updated.amount = (hours * parseFloat(updated.rate)).toFixed(2);
        }
      }
      
      // Recalculate amount if rate or hours change
      if (name === 'rate' || name === 'hours') {
        const hours = parseFloat(updated.hours) || calculateHours(updated.start_time, updated.end_time);
        if (hours && updated.rate) {
          updated.amount = (hours * parseFloat(updated.rate)).toFixed(2);
        }
      }
      
      // If amount is manually changed and no start/end time, allow manual amount
      if (name === 'amount' && !updated.start_time && !updated.end_time) {
        // Allow manual amount entry
      }
      
      return updated;
    });
  };

  const handleEnhanceDescription = async () => {
    if (!formData.description.trim()) {
      setError('Please enter a description first');
      return;
    }
    
    try {
      setLoading(true);
      const enhanced = await enhanceDescription(formData.description);
      setFormData(prev => ({ ...prev, description: enhanced }));
      setSuccessMessage('Description enhanced successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to enhance description: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Enhance description before saving
      let finalDescription = formData.description;
      if (formData.description.trim()) {
        finalDescription = await enhanceDescription(formData.description);
      }
      
      const dateTime = new Date(`${formData.date}T${formData.start_time || '00:00'}:00`);
      const hours = parseFloat(formData.hours) || calculateHours(formData.start_time, formData.end_time);
      const rate = parseFloat(formData.rate) || client?.hourly_rate || 0;
      const amount = formData.start_time && formData.end_time 
        ? (hours * rate) 
        : parseFloat(formData.amount) || 0;
      
      const entryData = {
        client_id: parseInt(clientId),
        date: dateTime.toISOString(),
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        person: formData.person || auth?.currentUser?.email || 'System',
        description: finalDescription,
        hours: hours || null,
        rate: rate,
        amount: amount,
      };
      
      if (editingEntry) {
        await timeEntryAPI.update(editingEntry.id, entryData);
        setSuccessMessage('Time entry updated successfully!');
      } else {
        await timeEntryAPI.create(entryData);
        setSuccessMessage('Time entry saved successfully!');
      }
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        person: auth?.currentUser?.email || '',
        description: '',
        hours: '',
        rate: client?.hourly_rate?.toString() || '',
        amount: '',
      });
      setShowManualForm(false);
      setEditingEntry(null);
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save time entry: ' + err.message);
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

  const handleEditEntry = (entry) => {
    const entryDate = new Date(entry.date);
    setFormData({
      date: entryDate.toISOString().split('T')[0],
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      person: entry.person || auth?.currentUser?.email || '',
      description: entry.description || '',
      hours: entry.hours?.toString() || '',
      rate: entry.rate?.toString() || client?.hourly_rate?.toString() || '',
      amount: entry.amount?.toString() || '',
    });
    setEditingEntry(entry);
    setShowManualForm(true);
  };

  const handleCreateInvoice = async () => {
    if (selectedEntries.length === 0) {
      setError('Please select at least one time entry');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Fetch expenses if not already loaded
      if (expenses.length === 0) {
        const expensesData = await expenseAPI.getByClientId(clientId);
        setExpenses(expensesData.filter(e => !e.invoice_id));
      }
      
      setShowInvoiceModal(true);
    } catch (err) {
      setError('Failed to prepare invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      
      const invoice = await invoiceAPI.generateFromTimeEntries(
        clientId,
        selectedEntries,
        selectedExpenses,
        {
          contract_id: invoiceData.contract_id || null,
          project_name: invoiceData.project_name,
          tax: parseFloat(invoiceData.tax) || 0.0,
          due_date: invoiceData.due_date ? new Date(invoiceData.due_date).toISOString() : null,
        }
      );
      
      // If email is requested, send it
      if (emailInvoice && emailTo) {
        try {
          await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/invoices/${invoice.id}/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to_email: emailTo }),
          });
          setSuccessMessage(`Invoice ${invoice.invoice_number} created and sent to ${emailTo}!`);
        } catch (err) {
          setSuccessMessage(`Invoice ${invoice.invoice_number} created, but failed to send email: ${err.message}`);
        }
      } else {
        setSuccessMessage(`Invoice ${invoice.invoice_number} created successfully!`);
      }
      
      setShowInvoiceModal(false);
      setSelectedEntries([]);
      setSelectedExpenses([]);
      fetchData();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError('Failed to generate invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
  const totalAmount = timeEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const selectedTotal = timeEntries
    .filter(e => selectedEntries.includes(e.id))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  if (loading && !timeEntries.length) {
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

      {/* Timer Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Time Tracker</h2>
          <button
            onClick={handleStartStop}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
              isTracking
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isTracking ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-white rounded-full"></span>
                <span>Stop ({formatTime(elapsedTime)})</span>
              </div>
            ) : (
              '▶ Start Timer'
            )}
          </button>
        </div>
        
        {isTracking && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-800">
              ⏱️ Tracking time... Click Stop when finished
            </p>
          </div>
        )}
      </div>

      {/* Manual Entry Form */}
      {showManualForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
          </h3>
          
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Person *</label>
                <input
                  type="text"
                  name="person"
                  value={formData.person}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                <input
                  type="number"
                  step="0.01"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={formData.start_time && formData.end_time}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.start_time && formData.end_time ? 'bg-gray-50 text-gray-600' : ''
                  }`}
                />
                {formData.start_time && formData.end_time && (
                  <p className="text-xs text-gray-500 mt-1">Calculated from hours × rate</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <div className="flex gap-2">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the work performed..."
                />
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={!formData.description.trim() || loading}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  ✨ Enhance
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">AI will improve formatting, grammar, and clarity (30 words or less)</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowManualForm(false);
                  setEditingEntry(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    start_time: '',
                    end_time: '',
                    person: auth?.currentUser?.email || '',
                    description: '',
                    hours: '',
                    rate: client?.hourly_rate?.toString() || '',
                    amount: '',
                  });
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Time Entries List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Time Entries</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: {timeEntries.length} entries • {totalHours.toFixed(2)} hrs • ${totalAmount.toFixed(2)}
            </div>
            {selectedEntries.length > 0 && (
              <button
                onClick={handleCreateInvoice}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700"
              >
                Create Invoice ({selectedEntries.length})
              </button>
            )}
          </div>
        </div>

        {timeEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No time entries yet. Start tracking time or add an entry manually.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 border rounded-xl transition-all ${
                  selectedEntries.includes(entry.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntries([...selectedEntries, entry.id]);
                        } else {
                          setSelectedEntries(selectedEntries.filter(id => id !== entry.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-medium text-gray-900">{entry.person}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        {entry.start_time && entry.end_time && (
                          <span className="text-sm text-gray-600">
                            {entry.start_time} - {entry.end_time}
                          </span>
                        )}
                        <span className="text-sm text-gray-600">{entry.hours || 0} hrs</span>
                        <span className="text-sm font-semibold text-gray-900">${entry.amount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Creation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create Invoice</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={invoiceData.project_name}
                    onChange={(e) => setInvoiceData({ ...invoiceData, project_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract (Optional)</label>
                  <select
                    value={invoiceData.contract_id || ''}
                    onChange={(e) => setInvoiceData({ ...invoiceData, contract_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>{contract.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax (%)</label>
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

              {/* Expenses Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fixed Costs</h3>
                  <button
                    onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700"
                  >
                    + Add Fixed Cost
                  </button>
                </div>

                {showAddExpenseForm && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <ExpenseForm
                      clientId={clientId}
                      onSuccess={async () => {
                        setShowAddExpenseForm(false);
                        const expensesData = await expenseAPI.getByClientId(clientId);
                        setExpenses(expensesData.filter(e => !e.invoice_id));
                      }}
                      onCancel={() => setShowAddExpenseForm(false)}
                    />
                  </div>
                )}

                {expenses.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {expenses.map((expense) => (
                      <label key={expense.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExpenses([...selectedExpenses, expense.id]);
                            } else {
                              setSelectedExpenses(selectedExpenses.filter(id => id !== expense.id));
                            }
                          }}
                        />
                        <span className="text-sm">{expense.description} - ${expense.amount.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Email Option */}
              <div className="mb-6">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={emailInvoice}
                    onChange={(e) => setEmailInvoice(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">Email invoice to client</span>
                </label>
                {emailInvoice && (
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder={client?.email || "Client email"}
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-semibold text-blue-900">
                    ${(selectedTotal + selectedExpenses.reduce((sum, id) => {
                      const exp = expenses.find(e => e.id === id);
                      return sum + (exp?.amount || 0);
                    }, 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowInvoiceModal(false);
                    setEmailInvoice(false);
                    setEmailTo('');
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : emailInvoice ? 'Create & Email Invoice' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeTracking;
