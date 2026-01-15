import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientAPI, clientContactAPI } from '../../services/api';

function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    client_date: new Date().toISOString().split('T')[0],
    description: '',
    hourly_rate: '',
    notes_from_last_meeting: '',
    timeline: '',
    contract_status: 'No Contract',
    contract_type: '',
    contract_due_date: '',
    status: 'Active',
    company: '',
    address: '',
  });

  const [contacts, setContacts] = useState([
    { name: '', email: '', phone: '', title: '', order: 1 },
    { name: '', email: '', phone: '', title: '', order: 2 },
    { name: '', email: '', phone: '', title: '', order: 3 },
  ]);

  useEffect(() => {
    if (isEditing) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const client = await clientAPI.getById(id);
      
      // Format dates for input fields
      const clientDate = client.client_date ? new Date(client.client_date).toISOString().split('T')[0] : '';
      const contractDueDate = client.contract_due_date ? new Date(client.contract_due_date).toISOString().split('T')[0] : '';

      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        client_date: clientDate,
        description: client.description || '',
        hourly_rate: client.hourly_rate || '',
        notes_from_last_meeting: client.notes_from_last_meeting || '',
        timeline: client.timeline || '',
        contract_status: client.contract_status || 'No Contract',
        contract_type: client.contract_type || '',
        contract_due_date: contractDueDate,
        status: client.status || 'Active',
        company: client.company || '',
        address: client.address || '',
      });

      // Fetch contacts
      const clientContacts = await clientContactAPI.getByClientId(id);
      const contactsData = [...contacts];
      clientContacts.forEach((contact) => {
        if (contact.order >= 1 && contact.order <= 3) {
          contactsData[contact.order - 1] = {
            id: contact.id,
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            title: contact.title || '',
            order: contact.order,
          };
        }
      });
      setContacts(contactsData);
    } catch (err) {
      setError('Failed to load client: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Clean up the data - convert empty strings to null
      const cleanData = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value === '' || value === null || value === undefined) {
          cleanData[key] = null;
        } else {
          cleanData[key] = value;
        }
      });

      const submitData = {
        ...cleanData,
        hourly_rate: cleanData.hourly_rate ? parseFloat(cleanData.hourly_rate) : null,
        client_date: new Date(cleanData.client_date).toISOString(),
        contract_due_date: cleanData.contract_due_date ? new Date(cleanData.contract_due_date).toISOString() : null,
        contacts: contacts.filter(c => c.name.trim() !== '').map(c => ({
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          title: c.title || null,
          order: c.order,
        })),
      };

      console.log('Submitting client data:', submitData);

      let result;
      if (isEditing) {
        // Update client
        await clientAPI.update(id, submitData);
        
        // Update contacts
        for (let i = 0; i < contacts.length; i++) {
          const contact = contacts[i];
          if (contact.name.trim() !== '') {
            if (contact.id) {
              // Update existing contact
              await clientContactAPI.update(contact.id, {
                name: contact.name,
                email: contact.email || null,
                phone: contact.phone || null,
                title: contact.title || null,
                order: contact.order,
              });
            } else {
              // Create new contact
              await clientContactAPI.create({
                client_id: parseInt(id),
                name: contact.name,
                email: contact.email || null,
                phone: contact.phone || null,
                title: contact.title || null,
                order: contact.order,
              });
            }
          }
        }
        
        result = { id };
      } else {
        // Create new client
        result = await clientAPI.create(submitData);
      }

      navigate(`/admin/clients/${result.id}`);
    } catch (err) {
      console.error('Error saving client:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      
      // Better error message handling
      let errorMessage = 'Failed to save client';
      if (err.message) {
        errorMessage += ': ' + err.message;
      } else if (typeof err === 'string') {
        errorMessage += ': ' + err;
      } else {
        errorMessage += '. Please check the console for details.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/clients')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Clients
        </button>
        <h1 className="text-3xl font-semibold text-gray-900">
          {isEditing ? 'Edit Client' : 'Add New Client'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Date *
              </label>
              <input
                type="date"
                name="client_date"
                value={formData.client_date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Lead">Lead</option>
                <option value="Prospect">Prospect</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Status
              </label>
              <select
                name="contract_status"
                value={formData.contract_status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="No Contract">No Contract</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Contract Signed">Contract Signed</option>
                <option value="Completed">Completed</option>
                <option value="Not Heard Back">Not Heard Back</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description of Idea
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the client's project idea or requirements..."
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes from Last Meeting
            </label>
            <textarea
              name="notes_from_last_meeting"
              value={formData.notes_from_last_meeting}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notes from your last conversation or meeting..."
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeline on Contract
            </label>
            <input
              type="text"
              name="timeline"
              value={formData.timeline}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 3 months, 6 weeks, etc."
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type
              </label>
              <select
                name="contract_type"
                value={formData.contract_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">None</option>
                <option value="Fixed Price">Fixed Price</option>
                <option value="Milestone Based">Milestone Based</option>
                <option value="Hourly">Hourly</option>
              </select>
            </div>

            {formData.contract_type === 'Fixed Price' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Due Date
                </label>
                <input
                  type="date"
                  name="contract_due_date"
                  value={formData.contract_due_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contacts Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Points of Contact</h2>
          
          {contacts.map((contact, index) => (
            <div key={index} className="mb-6 p-6 border border-gray-200 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Point of Contact {contact.order}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={contact.title}
                    onChange={(e) => handleContactChange(index, 'title', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/clients')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientForm;

