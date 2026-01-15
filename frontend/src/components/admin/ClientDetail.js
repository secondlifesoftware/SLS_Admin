import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientAPI, clientContactAPI, clientNoteAPI, clientTimelineAPI, contractAPI } from '../../services/api';
import ClientTimelineView from './ClientTimelineView';
import ClientNotesView from './ClientNotesView';
import ClientContractsView from './ClientContractsView';
import ClientDocumentsView from './ClientDocumentsView';
import ClientTechAndAccountsView from './ClientTechAndAccountsView';
import { auth } from '../../firebase';
import ReactMarkdown from 'react-markdown';

function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteData, setNewNoteData] = useState({
    title: '',
    content: '',
    note_type: 'Meeting',
    meeting_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchClient();
    fetchMeetingNotes();
  }, [id]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const data = await clientAPI.getById(id);
      setClient(data);
      setError('');
    } catch (err) {
      setError('Failed to load client: ' + err.message);
      console.error('Error fetching client:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingNotes = async () => {
    try {
      const notes = await clientNoteAPI.getByClientId(id);
      // Filter for meeting notes and sort by date (most recent first)
      const meetings = notes
        .filter(note => note.note_type === 'Meeting')
        .sort((a, b) => {
          const dateA = a.meeting_date ? new Date(a.meeting_date) : new Date(a.created_at);
          const dateB = b.meeting_date ? new Date(b.meeting_date) : new Date(b.created_at);
          return dateB - dateA;
        });
      setMeetingNotes(meetings);
    } catch (err) {
      console.error('Error fetching meeting notes:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await clientNoteAPI.create({
        client_id: parseInt(id),
        ...newNoteData,
        meeting_date: newNoteData.meeting_date ? new Date(newNoteData.meeting_date).toISOString() : null,
        created_by: auth?.currentUser?.email || 'Admin',
      });
      setShowAddNoteModal(false);
      setNewNoteData({
        title: '',
        content: '',
        note_type: 'Meeting',
        meeting_date: new Date().toISOString().split('T')[0],
      });
      fetchMeetingNotes();
      fetchClient();
    } catch (err) {
      setError('Failed to add note: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      Active: 'bg-green-100 text-green-800',
      Inactive: 'bg-gray-100 text-gray-800',
      Lead: 'bg-blue-100 text-blue-800',
      Prospect: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${badges[status] || badges.Inactive}`}>
        {status}
      </span>
    );
  };

  const getContractStatusBadge = (status) => {
    const badges = {
      'No Contract': 'bg-gray-100 text-gray-800',
      'Negotiation': 'bg-yellow-100 text-yellow-800',
      'Contract Signed': 'bg-green-100 text-green-800',
      'Completed': 'bg-purple-100 text-purple-800',
      'Not Heard Back': 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${badges[status] || badges['No Contract']}`}>
        {status}
      </span>
    );
  };

  // Parse booking request details from notes_from_last_meeting
  const parseBookingDetails = (notes) => {
    if (!notes) return null;
    
    const details = {
      role_type: null,
      budget: null,
      urgency: null,
      start_date: null,
      end_date: null,
      original_description: null,
    };

    // Extract role type
    const roleMatch = notes.match(/Role Type:\s*(.+)/i);
    if (roleMatch) {
      details.role_type = roleMatch[1].trim();
    }

    // Extract budget
    const budgetMatch = notes.match(/Budget:\s*\$([\d,]+\.?\d*)/i);
    if (budgetMatch) {
      details.budget = parseFloat(budgetMatch[1].replace(/,/g, ''));
    }

    // Extract urgency
    const urgencyMatch = notes.match(/Urgency Level:\s*(\d+)\/10/i);
    if (urgencyMatch) {
      details.urgency = parseInt(urgencyMatch[1]);
    }

    // Extract start date
    const startDateMatch = notes.match(/Start Date:\s*([\d-]+)/i);
    if (startDateMatch) {
      details.start_date = startDateMatch[1];
    }

    // Extract end date
    const endDateMatch = notes.match(/End Date:\s*([\d-]+)/i);
    if (endDateMatch) {
      details.end_date = endDateMatch[1];
    }

    // Extract original description
    const descMatch = notes.match(/Original Project Description:\s*([\s\S]*?)(?:\n\n|$)/i);
    if (descMatch) {
      details.original_description = descMatch[1].trim();
    }

    // Check if this looks like a booking request
    const hasBookingData = details.role_type || details.budget || details.urgency || details.start_date;
    return hasBookingData ? details : null;
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800">{error || 'Client not found'}</p>
        <button
          onClick={() => navigate('/admin/clients')}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Clients
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'contracts', label: 'Contracts', icon: '📄' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'tech', label: 'Tech & Accounts', icon: '⚙️' },
  ];

  const bookingDetails = parseBookingDetails(client.notes_from_last_meeting);
  const hasBookingDetails = bookingDetails !== null;

  return (
    <div className="min-h-screen bg-[#1a1a1a] relative">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 bg-[#1a1a1a] opacity-100" style={{
        backgroundImage: `
          linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 pt-6">
          <button
            onClick={() => navigate('/admin/clients')}
            className="text-sm text-gray-400 hover:text-cyan-400 mb-6 flex items-center gap-2 transition-colors"
          >
            ← Back to Clients
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-cyan-500/20">
                {client.first_name.charAt(0)}{client.last_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  {client.first_name} {client.last_name}
                </h1>
                {client.company && (
                  <p className="text-lg text-gray-400">{client.company}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/admin/clients/${id}/invoices`)}
                className="px-5 py-2.5 text-sm font-medium text-cyan-400 bg-[#1f1f1f] border border-cyan-500/30 rounded-xl hover:bg-[#252525] hover:border-cyan-500/50 transition-all duration-200"
              >
                📄 Invoices
              </button>
              <button
                onClick={() => navigate(`/admin/clients/${id}/edit`)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#1f1f1f] border border-gray-700 rounded-xl hover:bg-[#252525] hover:border-gray-600 transition-all duration-200"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                  ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8 pb-12">
          {/* Hero Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
              <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Status</div>
              <div className="text-2xl font-bold text-white">{client.status}</div>
            </div>
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
              <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Contract Status</div>
              <div className="text-2xl font-bold text-white">{client.contract_status || 'No Contract'}</div>
            </div>
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300">
              <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Client Since</div>
              <div className="text-xl font-bold text-white">{formatDate(client.client_date)}</div>
            </div>
          </div>

          {/* Contract Details - Hero Widgets */}
          {(client.contract_type || client.contract_due_date || client.timeline || client.hourly_rate || client.client_date) && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Contract Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {client.contract_type && (
                  <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 hover:bg-[#252525] transition-all duration-300 cursor-pointer group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📋</div>
                    <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Contract Type</div>
                    <div className="text-xl font-bold text-white">{client.contract_type}</div>
                  </div>
                )}
                {client.contract_due_date && (
                  <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 hover:bg-[#252525] transition-all duration-300 cursor-pointer group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📅</div>
                    <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Due Date</div>
                    <div className="text-lg font-bold text-white">{formatDate(client.contract_due_date)}</div>
                  </div>
                )}
                {client.timeline && (
                  <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 hover:bg-[#252525] transition-all duration-300 cursor-pointer group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⏱️</div>
                    <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Timeline</div>
                    <div className="text-lg font-bold text-white">{client.timeline}</div>
                  </div>
                )}
                {client.hourly_rate && (
                  <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 hover:bg-[#252525] transition-all duration-300 cursor-pointer group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💰</div>
                    <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Hourly Rate</div>
                    <div className="text-2xl font-bold text-white">${client.hourly_rate}<span className="text-lg text-gray-400">/hr</span></div>
                  </div>
                )}
                {client.client_date && (
                  <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 hover:bg-[#252525] transition-all duration-300 cursor-pointer group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
                    <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Start Date</div>
                    <div className="text-xl font-bold text-white">{formatDate(client.client_date)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Contact & Points of Contact */}
            <div className="lg:col-span-4 space-y-6">
              {/* Contact Information */}
              <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-[#252525] rounded-xl border border-gray-800 hover:border-cyan-500/30 transition-colors">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                      <span className="text-cyan-400 text-xl">📧</span>
                    </div>
                    <span className="text-white font-medium">{client.email}</span>
                  </div>
                  {client.address && (
                    <div className="flex items-start gap-3 p-4 bg-[#252525] rounded-xl border border-gray-800 hover:border-cyan-500/30 transition-colors">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                        <span className="text-cyan-400 text-xl">📍</span>
                      </div>
                      <span className="text-white font-medium">{client.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Points of Contact */}
              {client.contacts && client.contacts.length > 0 && (
                <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-2xl">👥</span>
                    Points of Contact
                  </h2>
                  <div className="space-y-3">
                    {client.contacts
                      .filter(c => c.name)
                      .sort((a, b) => a.order - b.order)
                      .map((contact, index) => (
                        <div key={contact.id || index} className="p-4 bg-[#252525] rounded-xl border border-gray-800 hover:border-cyan-500/40 transition-all">
                          <div className="font-bold text-white mb-1">
                            {contact.name}
                          </div>
                          {contact.title && (
                            <div className="text-sm text-cyan-400 mb-3 font-medium">{contact.title}</div>
                          )}
                          <div className="space-y-2 text-sm text-gray-400">
                            {contact.email && (
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400">📧</span>
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400">📞</span>
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center - Description (Big & Prominent) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Booking Request Details */}
              {hasBookingDetails && (
                <div className="bg-[#1f1f1f] border border-cyan-500/40 rounded-2xl p-8 hover:border-cyan-500/60 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">🎯 Booking Request</h2>
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-full font-bold">NEW</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-[#252525] border border-gray-800 rounded-xl p-5">
                    {bookingDetails.role_type && (
                      <div>
                        <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Role</div>
                        <div className="text-lg font-bold text-white capitalize">
                          {bookingDetails.role_type.replace(/_/g, ' ')}
                        </div>
                      </div>
                    )}
                    {bookingDetails.budget && (
                      <div>
                        <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Budget</div>
                        <div className="text-2xl font-bold text-white">
                          ${bookingDetails.budget.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {bookingDetails.urgency !== null && (
                      <div className="col-span-2">
                        <div className="text-cyan-400 text-xs mb-3 font-medium uppercase tracking-wider">Urgency Level</div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${(bookingDetails.urgency / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xl font-bold text-white">{bookingDetails.urgency}/10</span>
                        </div>
                      </div>
                    )}
                    {bookingDetails.start_date && (
                      <div>
                        <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">Start Date</div>
                        <div className="text-lg font-bold text-white">
                          {formatDate(bookingDetails.start_date)}
                        </div>
                      </div>
                    )}
                    {bookingDetails.end_date && (
                      <div>
                        <div className="text-cyan-400 text-xs mb-2 font-medium uppercase tracking-wider">End Date</div>
                        <div className="text-lg font-bold text-white">
                          {formatDate(bookingDetails.end_date)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description of Idea - Big & Beautiful */}
              {client.description && (
                <div className="bg-[#1f1f1f] border border-cyan-500/40 rounded-2xl p-8 hover:border-cyan-500/60 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="text-3xl">💡</span>
                      Project Description
                    </h2>
                    <button
                      onClick={() => setExpandedDescription(true)}
                      className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all duration-200 border border-cyan-400/50 hover:border-cyan-400"
                    >
                      View Full →
                    </button>
                  </div>
                  <div className="bg-[#252525] border border-gray-800 rounded-xl p-6">
                    <div className="text-gray-300 text-lg leading-relaxed line-clamp-6 markdown-content">
                      <ReactMarkdown>{truncateText(client.description, 400)}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Meeting Notes */}
            <div className="lg:col-span-3 space-y-6">
              {/* Meeting Notes */}
              {(meetingNotes.length > 0 || client.notes_from_last_meeting) && (
                <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="text-2xl">📝</span>
                        Meeting Notes
                      </h2>
                      {meetingNotes.length > 0 && (
                        <p className="text-xs text-cyan-400 mt-2 font-medium">
                          {meetingNotes.length} meeting{meetingNotes.length !== 1 ? 's' : ''} recorded
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowAddNoteModal(true)}
                      className="text-sm text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 transition-all"
                    >
                      + Add
                    </button>
                  </div>
                  
                  {meetingNotes.length > 0 ? (
                    <div className="space-y-3">
                      {meetingNotes.slice(0, 2).map((note, index) => (
                        <div
                          key={note.id}
                          className="p-4 bg-[#252525] border border-gray-800 rounded-xl hover:border-cyan-500/40 transition-all cursor-pointer group"
                          onClick={() => {
                            setSelectedNoteIndex(index);
                            setExpandedNotes(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                                Meeting
                              </span>
                              {note.meeting_date && (
                                <span className="text-xs text-gray-400 font-medium">
                                  {formatDate(note.meeting_date)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                          {note.title && (
                            <h4 className="font-bold text-white mb-2 text-sm">{note.title}</h4>
                          )}
                          <p className="text-sm text-gray-300 line-clamp-3 mb-2">
                            {truncateText(note.content, 120)}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {formatDateTime(note.created_at)}
                          </p>
                        </div>
                      ))}
                      {meetingNotes.length > 2 && (
                        <button
                          onClick={() => setActiveTab('notes')}
                          className="w-full text-sm text-cyan-400 hover:text-cyan-300 font-bold py-3 bg-[#252525] border border-gray-800 rounded-lg hover:border-cyan-500/40 transition-all"
                        >
                          View all {meetingNotes.length} notes →
                        </button>
                      )}
                    </div>
                  ) : client.notes_from_last_meeting ? (
                    <div
                      className="p-4 bg-[#252525] border border-gray-800 rounded-xl hover:border-cyan-500/40 transition-all cursor-pointer group"
                      onClick={() => setExpandedNotes(true)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="px-2 py-1 text-xs font-bold bg-gray-700 text-gray-300 border border-gray-600 rounded-full">
                            Legacy
                          </span>
                          {client.updated_at && (
                            <span className="text-xs text-gray-500 ml-2 font-medium">
                              {formatDateTime(client.updated_at)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-4">
                        {hasBookingDetails && bookingDetails.original_description
                          ? truncateText(bookingDetails.original_description, 150)
                          : truncateText(client.notes_from_last_meeting, 150)}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Add Note Button if no notes exist */}
              {meetingNotes.length === 0 && !client.notes_from_last_meeting && (
                <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    Meeting Notes
                  </h2>
                  <p className="text-gray-400 mb-4 text-sm">No meeting notes yet.</p>
                  <button
                    onClick={() => setShowAddNoteModal(true)}
                    className="w-full px-4 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-all border border-cyan-400/50 hover:border-cyan-400"
                  >
                    + Add First Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <ClientTimelineView clientId={id} onRefresh={fetchClient} />
      )}

      {activeTab === 'notes' && (
        <ClientNotesView clientId={id} onRefresh={fetchClient} />
      )}

      {activeTab === 'contracts' && (
        <ClientContractsView clientId={id} onRefresh={fetchClient} />
      )}

      {activeTab === 'documents' && (
        <ClientDocumentsView clientId={id} />
      )}

      {activeTab === 'tech' && (
        <ClientTechAndAccountsView clientId={id} userEmail={auth?.currentUser?.email} />
      )}

      {/* Description Modal */}
      {expandedDescription && client.description && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1f1f1f] border border-cyan-500/40 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Description of Idea</h3>
              <button
                onClick={() => setExpandedDescription(false)}
                className="text-gray-400 hover:text-white text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-8 py-8 overflow-y-auto flex-1">
              <div className="markdown-content-full">
                <ReactMarkdown>{client.description}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {expandedNotes && (meetingNotes.length > 0 || client.notes_from_last_meeting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1f1f1f] border border-cyan-500/40 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {meetingNotes.length > 0 
                    ? `Meeting Note: ${meetingNotes[selectedNoteIndex]?.title || 'Untitled'}`
                    : 'Meeting Notes'}
                </h3>
                {meetingNotes.length > 0 && meetingNotes[selectedNoteIndex] ? (
                  <p className="text-sm text-cyan-400 mt-2">
                    {meetingNotes[selectedNoteIndex].meeting_date 
                      ? `Meeting Date: ${formatDate(meetingNotes[selectedNoteIndex].meeting_date)}`
                      : `Created: ${formatDateTime(meetingNotes[selectedNoteIndex].created_at)}`}
                  </p>
                ) : client.updated_at && (
                  <p className="text-sm text-cyan-400 mt-2">
                    Last updated: {formatDateTime(client.updated_at)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpandedNotes(false)}
                className="text-gray-400 hover:text-white text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-8 py-8 overflow-y-auto flex-1">
              {meetingNotes.length > 0 && meetingNotes[selectedNoteIndex] ? (
                <>
                  {meetingNotes[selectedNoteIndex].title && (
                    <h4 className="font-bold text-white mb-4 text-xl">
                      {meetingNotes[selectedNoteIndex].title}
                    </h4>
                  )}
                  <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap mb-6">
                    {meetingNotes[selectedNoteIndex].content}
                  </p>
                  <div className="text-sm text-gray-500 border-t border-gray-800 pt-4">
                    Created {formatDateTime(meetingNotes[selectedNoteIndex].created_at)}
                    {meetingNotes[selectedNoteIndex].created_by && 
                      ` by ${meetingNotes[selectedNoteIndex].created_by}`}
                  </div>
                </>
              ) : (
                <>
                  {hasBookingDetails && (
                    <div className="mb-6 bg-[#252525] border border-cyan-500/30 rounded-xl p-5">
                      <h4 className="font-bold text-white mb-4">Booking Request Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {bookingDetails.role_type && (
                          <div>
                            <span className="text-cyan-400">Role Type: </span>
                            <span className="font-medium text-white capitalize">
                              {bookingDetails.role_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                        {bookingDetails.budget && (
                          <div>
                            <span className="text-cyan-400">Budget: </span>
                            <span className="font-medium text-white">
                              ${bookingDetails.budget.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {bookingDetails.urgency !== null && (
                          <div>
                            <span className="text-cyan-400">Urgency Level: </span>
                            <span className="font-medium text-white">{bookingDetails.urgency}/10</span>
                          </div>
                        )}
                        {bookingDetails.start_date && (
                          <div>
                            <span className="text-cyan-400">Start Date: </span>
                            <span className="font-medium text-white">
                              {formatDate(bookingDetails.start_date)}
                            </span>
                          </div>
                        )}
                        {bookingDetails.end_date && (
                          <div>
                            <span className="text-cyan-400">End Date: </span>
                            <span className="font-medium text-white">
                              {formatDate(bookingDetails.end_date)}
                            </span>
                          </div>
                        )}
                      </div>
                      {bookingDetails.original_description && (
                        <div className="mt-5 pt-5 border-t border-gray-800">
                          <h5 className="font-bold text-white mb-3">Original Project Description:</h5>
                          <p className="text-gray-300 whitespace-pre-wrap">{bookingDetails.original_description}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white mb-3 text-lg">Full Notes:</h4>
                    <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{client.notes_from_last_meeting}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1f1f1f] border border-cyan-500/40 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add Meeting Note</h3>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddNote} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Meeting Date *</label>
                <input
                  type="date"
                  value={newNoteData.meeting_date}
                  onChange={(e) => setNewNoteData({ ...newNoteData, meeting_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={newNoteData.title}
                  onChange={(e) => setNewNoteData({ ...newNoteData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  placeholder="e.g., Initial Consultation, Follow-up Meeting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Notes *</label>
                <textarea
                  value={newNoteData.content}
                  onChange={(e) => setNewNoteData({ ...newNoteData, content: e.target.value })}
                  rows="8"
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  required
                  placeholder="Write your meeting notes here..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-[#252525] border border-gray-800 rounded-xl hover:bg-[#2a2a2a] hover:border-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-cyan-500 rounded-xl hover:bg-cyan-600 border border-cyan-400/50 transition-all"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default ClientDetail;
