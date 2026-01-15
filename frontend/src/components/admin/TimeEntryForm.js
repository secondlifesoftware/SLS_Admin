import React, { useState } from 'react';
import { timeEntryAPI } from '../../services/api';

function TimeEntryForm({ clientId, defaultRate = 150.00, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    person: 'Darius Smith',
    description: '',
    rate: defaultRate,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateHours = (start, end) => {
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
      
      // Recalculate hours and amount if times or rate change
      if (name === 'start_time' || name === 'end_time' || name === 'rate') {
        const hours = calculateHours(updated.start_time, updated.end_time);
        updated.hours = hours;
        updated.amount = Math.round(hours * updated.rate * 100) / 100;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const hours = calculateHours(formData.start_time, formData.end_time);
      const amount = Math.round(hours * formData.rate * 100) / 100;

      // Combine date and time for proper datetime
      const dateTime = new Date(`${formData.date}T${formData.start_time}:00`);
      
      await timeEntryAPI.create({
        client_id: parseInt(clientId),
        date: dateTime.toISOString(),
        start_time: formData.start_time,
        end_time: formData.end_time,
        person: formData.person,
        description: formData.description,
        hours: hours,
        rate: parseFloat(formData.rate),
        amount: amount,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to create time entry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hours = calculateHours(formData.start_time, formData.end_time);
  const amount = Math.round(hours * formData.rate * 100) / 100;

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
          <label className="block text-sm font-medium text-gray-700 mb-2">Person *</label>
          <input
            type="text"
            name="person"
            value={formData.person}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rate ($/hr) *</label>
          <input
            type="number"
            step="0.01"
            name="rate"
            value={formData.rate}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
          <input
            type="number"
            step="0.01"
            value={hours}
            disabled
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-gray-50 text-gray-600"
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
          placeholder="Describe the work performed..."
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Amount:</span>
          <span className="text-lg font-semibold text-blue-900">${amount.toFixed(2)}</span>
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
          {loading ? 'Adding...' : 'Add Time Entry'}
        </button>
      </div>
    </form>
  );
}

export default TimeEntryForm;

