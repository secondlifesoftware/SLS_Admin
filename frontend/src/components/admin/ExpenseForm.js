import React, { useState } from 'react';
import { expenseAPI } from '../../services/api';

function ExpenseForm({ clientId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    person: 'System',
    description: '',
    hours: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Recalculate hours if times change
      if (name === 'start_time' || name === 'end_time') {
        const hours = calculateHours(updated.start_time, updated.end_time);
        updated.hours = hours || '';
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.description || !formData.amount) {
      setError('Description and amount are required');
      setLoading(false);
      return;
    }

    try {
      // Combine date and time for proper datetime (use 00:00 if no time provided)
      const dateTime = new Date(`${formData.date}T${formData.start_time || '00:00'}:00`);
      
      await expenseAPI.create({
        client_id: parseInt(clientId),
        date: dateTime.toISOString(),
        description: formData.description,
        category: null,
        amount: parseFloat(formData.amount),
        person: formData.person || 'System',
        start_time: formData.start_time && formData.start_time.trim() ? formData.start_time : null,
        end_time: formData.end_time && formData.end_time.trim() ? formData.end_time : null,
        hours: formData.hours && formData.hours.toString().trim() ? parseFloat(formData.hours) : null,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to create fixed cost: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hours = formData.hours || (formData.start_time && formData.end_time ? calculateHours(formData.start_time, formData.end_time) : '');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Person</label>
          <input
            type="text"
            name="person"
            value={formData.person}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
          <input
            type="number"
            step="0.01"
            name="hours"
            value={hours}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($) *</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows="3"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe the fixed cost..."
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Amount:</span>
          <span className="text-lg font-semibold text-blue-900">${formData.amount ? parseFloat(formData.amount).toFixed(2) : '0.00'}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Fixed Cost'}
        </button>
      </div>
    </form>
  );
}

export default ExpenseForm;
