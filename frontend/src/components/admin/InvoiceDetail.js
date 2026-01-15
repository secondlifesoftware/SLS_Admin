import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI, clientAPI } from '../../services/api';

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    project_name: '',
    tax: 0,
    due_date: '',
    notes: '',
    issue_date: '',
  });

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const invoiceData = await invoiceAPI.getById(id);
      setInvoice(invoiceData);
      
      // Populate edit form data
      setEditFormData({
        project_name: invoiceData.project_name || '',
        tax: invoiceData.tax || 0,
        due_date: invoiceData.due_date ? invoiceData.due_date.split('T')[0] : '',
        notes: invoiceData.notes || '',
        issue_date: invoiceData.issue_date ? invoiceData.issue_date.split('T')[0] : '',
      });
      
      if (invoiceData.client_id) {
        const clientData = await clientAPI.getById(invoiceData.client_id);
        setClient(clientData);
      }
      
      setError('');
    } catch (err) {
      setError('Failed to load invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTableDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-800',
      Sent: 'bg-blue-100 text-blue-800',
      Paid: 'bg-green-100 text-green-800',
      Overdue: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-600',
      Finalized: 'bg-purple-100 text-purple-800',
      Archived: 'bg-gray-200 text-gray-700',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${badges[status] || badges.Draft}`}>
        {status}
      </span>
    );
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8000'}/api/invoices/${id}/generate-pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SLS_${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export PDF: ' + err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8000'}/api/invoices/${id}/generate-csv`);
      if (!response.ok) {
        throw new Error('Failed to generate CSV');
      }
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
      setError('Failed to export CSV: ' + err.message);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await invoiceAPI.update(id, { status: newStatus });
      fetchInvoice();
    } catch (err) {
      setError('Failed to update status: ' + err.message);
    }
  };

  const handleFinalize = async () => {
    try {
      setLoading(true);
      await invoiceAPI.finalize(id);
      fetchInvoice();
      setError('');
    } catch (err) {
      setError('Failed to finalize invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this invoice? It will be moved to the archived section.')) {
      return;
    }
    try {
      setLoading(true);
      await invoiceAPI.archive(id);
      fetchInvoice();
      setError('');
      // Optionally navigate back to invoices list
      setTimeout(() => navigate('/admin/invoices'), 2000);
    } catch (err) {
      setError('Failed to archive invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original invoice data
    if (invoice) {
      setEditFormData({
        project_name: invoice.project_name || '',
        tax: invoice.tax || 0,
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        notes: invoice.notes || '',
        issue_date: invoice.issue_date ? invoice.issue_date.split('T')[0] : '',
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate new total
      const laborSubtotal = invoice.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const expenseSubtotal = invoice.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const subtotal = laborSubtotal + expenseSubtotal;
      const newTotal = subtotal + parseFloat(editFormData.tax || 0);
      
      await invoiceAPI.update(id, {
        project_name: editFormData.project_name || null,
        tax: parseFloat(editFormData.tax || 0),
        total: newTotal,
        amount: subtotal,
        due_date: editFormData.due_date || null,
        notes: editFormData.notes || null,
        issue_date: editFormData.issue_date || null,
      });
      
      setIsEditing(false);
      fetchInvoice();
    } catch (err) {
      setError('Failed to update invoice: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = invoice && invoice.status !== 'Paid' && invoice.status !== 'Sent';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800">{error || 'Invoice not found'}</p>
        <button
          onClick={() => navigate('/admin/invoices')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Invoices
        </button>
      </div>
    );
  }

  // Group time entries by person for better display
  const entriesByPerson = {};
  invoice.items?.forEach(item => {
    if (!entriesByPerson[item.person]) {
      entriesByPerson[item.person] = [];
    }
    entriesByPerson[item.person].push(item);
  });

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Invoice {invoice.invoice_number}</h1>
            <p className="text-gray-600 mt-1">
              {client && `${client.first_name} ${client.last_name}`}
              {invoice.project_name && ` • ${invoice.project_name}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(invoice.status)}
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                📄 PDF
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                📊 CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
        {/* Company Header and Invoice Header - Side by Side */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-8">
            {/* Company Header - Left Side */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-0.5 leading-tight">Second Life Software Consulting</h2>
              <div className="text-[10px] text-gray-600 leading-tight space-y-0">
                <div>1125 Birch Street SW</div>
                <div>Atlanta, GA 30310</div>
                <div className="mt-0.5">Phone: (770) 696-3187</div>
                <div>Email: info@secondlifesoftware.com</div>
              </div>
            </div>
            {/* Invoice Header - Right Side */}
            <div className="text-right">
              <div className="text-[28px] font-bold text-gray-900 mb-1 leading-tight">INVOICE</div>
              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-end items-center gap-2">
                  <span className="text-gray-600">Invoice #:</span>
                  <span className="font-semibold text-gray-900">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-end items-center gap-2">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold text-gray-900">
                    {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        {client && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">TO:</div>
            <div className="text-sm text-gray-900 space-y-1">
              <div className="font-semibold">{client.first_name} {client.last_name}</div>
              {client.company && <div>{client.company}</div>}
              {client.address && <div>{client.address}</div>}
              {client.email && <div>{client.email}</div>}
              {client.contacts && client.contacts.length > 0 && client.contacts[0].phone && (
                <div>{client.contacts[0].phone}</div>
              )}
            </div>
          </div>
        )}

        {/* Contract Name and Description - Same Line */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={editFormData.project_name}
                  onChange={(e) => setEditFormData({ ...editFormData, project_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description/Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Labor – AI Development & Engineering"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={editFormData.issue_date}
                    onChange={(e) => setEditFormData({ ...editFormData, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editFormData.due_date}
                    onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.tax}
                  onChange={(e) => setEditFormData({ ...editFormData, tax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Contract Name: </span>
                <span className="text-gray-900">{invoice.project_name || 'N/A'}</span>
              </div>
              <div className="text-sm text-right">
                <div>
                  <span className="font-semibold text-gray-900">{invoice.notes || 'Labor – AI Development & Engineering'}</span>
                </div>
                {(() => {
                  // Calculate contract rate from invoice items
                  let contractRate = null;
                  if (invoice.items && invoice.items.length > 0) {
                    const rates = invoice.items.map(item => item.rate);
                    const rateCounts = {};
                    rates.forEach(rate => {
                      rateCounts[rate] = (rateCounts[rate] || 0) + 1;
                    });
                    contractRate = Object.keys(rateCounts).reduce((a, b) => 
                      rateCounts[a] > rateCounts[b] ? a : b
                    );
                  }
                  if (!contractRate && client && client.hourly_rate) {
                    contractRate = client.hourly_rate;
                  }
                  return contractRate ? (
                    <div className="mt-1 text-xs text-gray-600">
                      Contract Rate: ${parseFloat(contractRate).toFixed(2)}/hr
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Time Entries by Person */}
        <div className="mb-8">
          {Object.entries(entriesByPerson).map(([person, entries]) => (
            <div key={person} className="mb-6">
              <table className="w-full divide-y divide-gray-200 mb-4 border border-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '12%' }}>DATE</th>
                    <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '13%' }}>PERSON</th>
                    <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '40%' }}>DESCRIPTION</th>
                    <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '12%' }}>TIME</th>
                    <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '8%' }}>HRS</th>
                    <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '15%' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((item) => {
                    // Show full description - let it wrap naturally
                    const description = item.description;
                    
                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-2 py-2 text-[9px] text-gray-900 whitespace-nowrap text-center" style={{ width: '12%' }}>
                          {formatTableDate(item.date)}
                        </td>
                        <td className="px-2 py-2 text-[9px] text-gray-900 whitespace-nowrap text-center" style={{ width: '13%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.person}
                        </td>
                        <td className="px-2 py-2 text-[9px] text-gray-900 text-center" style={{ 
                          width: '40%', 
                          wordWrap: 'break-word', 
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal',
                          maxWidth: '40%'
                        }}>
                          {description}
                        </td>
                        <td className="px-2 py-2 text-[9px] text-gray-600 whitespace-nowrap text-center" style={{ width: '12%' }}>
                          {item.start_time} - {item.end_time}
                        </td>
                        <td className="px-2 py-2 text-[9px] text-gray-900 whitespace-nowrap text-center" style={{ width: '8%' }}>
                          {item.hours.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-[9px] font-medium text-gray-900 whitespace-nowrap text-center" style={{ width: '15%' }}>
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Expenses Section */}
        {invoice.expenses && invoice.expenses.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">EXPENSES / REIMBURSEMENTS</h3>
            <table className="w-full divide-y divide-gray-200 mb-4 border border-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '12%' }}>DATE</th>
                  <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '13%' }}>PERSON</th>
                  <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '40%' }}>DESCRIPTION</th>
                  <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '12%' }}>TIME</th>
                  <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '8%' }}>HRS</th>
                  <th className="px-2 py-2 text-center text-[9px] font-semibold text-gray-600 uppercase" style={{ width: '15%' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.expenses.map((expense) => {
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
                    <tr key={expense.id} className="align-top">
                      <td className="px-2 py-2 text-[9px] text-gray-900 whitespace-nowrap text-center" style={{ width: '12%' }}>
                        {formatTableDate(expense.date)}
                      </td>
                      <td className="px-2 py-2 text-[9px] text-gray-900 whitespace-nowrap text-center" style={{ width: '13%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {person}
                      </td>
                      <td className="px-2 py-2 text-[9px] text-gray-900 text-center" style={{ 
                        width: '40%', 
                        wordWrap: 'break-word', 
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        maxWidth: '40%'
                      }}>
                        {expense.description}
                      </td>
                      <td className="px-2 py-2 text-[9px] text-gray-600 whitespace-nowrap text-center" style={{ width: '12%' }}>
                        {timeStr}
                      </td>
                      <td className="px-2 py-2 text-[9px] text-gray-900 whitespace-nowrap text-center" style={{ width: '8%' }}>
                        {hoursStr}
                      </td>
                      <td className="px-2 py-2 text-[9px] font-medium text-gray-900 whitespace-nowrap text-center" style={{ width: '15%' }}>
                        ${expense.amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="border-t-2 border-gray-300 pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              {invoice.items && invoice.items.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Labor hours</span>
                    <span className="font-medium text-gray-900">
                      {invoice.items.reduce((sum, item) => sum + item.hours, 0).toFixed(2)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Labor subtotal</span>
                    <span className="font-medium text-gray-900">
                      ${invoice.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {invoice.expenses && invoice.expenses.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expenses subtotal</span>
                  <span className="font-medium text-gray-900">
                    ${invoice.expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  ${isEditing ? (
                    ((invoice.items?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
                     (invoice.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0)).toFixed(2)
                  ) : invoice.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">
                  ${isEditing ? parseFloat(editFormData.tax || 0).toFixed(2) : invoice.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span className="text-gray-900">TOTAL DUE</span>
                <span className="text-blue-600">
                  ${isEditing ? (
                    ((invoice.items?.reduce((sum, item) => sum + item.amount, 0) || 0) + 
                     (invoice.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0) + 
                     parseFloat(editFormData.tax || 0)).toFixed(2)
                  ) : invoice.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <div className="text-xs text-gray-600 mb-2">Make all checks payable to Second Life Software LLC</div>
          <div className="text-xs font-semibold text-gray-700 mb-4">THANK YOU FOR YOUR BUSINESS!</div>
          <div className="text-sm font-bold text-gray-900 mb-4">
            Please remit payment within 14 days of invoice date.
          </div>
          <div className="text-xs text-gray-600 leading-relaxed max-w-3xl mx-auto">
            TERMS AND CONDITIONS: All invoices are due and payable within fourteen (14) days of the invoice date. Late payments may be subject to interest charges at the rate of 1.5% per month (18% per annum) on any outstanding balance. Payment shall be made in United States Dollars by check, wire transfer, or other mutually agreed upon method.
          </div>
        </div>
      </div>

      {/* Invoice Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/admin/clients/${invoice.client_id}/invoices`)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Manage Client Invoices
          </button>
          {invoice.status !== 'Finalized' && invoice.status !== 'Archived' && (
            <>
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50"
              >
                Finalize Invoice
              </button>
              <select
                value={invoice.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </>
          )}
          {invoice.status === 'Finalized' && invoice.status !== 'Archived' && (
            <button
              onClick={handleArchive}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-xl hover:bg-gray-700 disabled:opacity-50"
            >
              Archive Invoice
            </button>
          )}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
        {invoice.status === 'Finalized' && (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm text-purple-800">
              <span className="font-medium">Finalized:</span> This invoice has been finalized and locked. You can archive it to move it to the archived section.
            </p>
          </div>
        )}
        {invoice.status === 'Archived' && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-800">
              <span className="font-medium">Archived:</span> This invoice has been archived and moved to the archived section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceDetail;

