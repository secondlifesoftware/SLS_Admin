import React, { useState, useEffect } from 'react';
import { clientNoteAPI, clientAPI } from '../../services/api';

function ClientNotesView({ clientId, onRefresh }) {
  const [notes, setNotes] = useState([]);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    note_type: 'General',
    meeting_date: '',
  });

  useEffect(() => {
    fetchNotes();
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const data = await clientAPI.getById(clientId);
      setClient(data);
    } catch (err) {
      console.error('Error fetching client:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await clientNoteAPI.getByClientId(clientId);
      setNotes(data);
      setError('');
    } catch (err) {
      setError('Failed to load notes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        // Update existing note
        await clientNoteAPI.update(editingNote.id, {
          ...formData,
          meeting_date: formData.meeting_date ? new Date(formData.meeting_date).toISOString() : null,
        });
        setEditingNote(null);
      } else {
        // Create new note
        await clientNoteAPI.create({
          client_id: parseInt(clientId),
          ...formData,
          meeting_date: formData.meeting_date ? new Date(formData.meeting_date).toISOString() : null,
          created_by: 'Current User', // TODO: Get from auth context
        });
        setShowAddModal(false);
      }
      setFormData({
        title: '',
        content: '',
        note_type: 'General',
        meeting_date: '',
      });
      fetchNotes();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(editingNote ? 'Failed to update note: ' + err.message : 'Failed to create note: ' + err.message);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content || '',
      note_type: note.note_type || 'General',
      meeting_date: note.meeting_date ? new Date(note.meeting_date).toISOString().split('T')[0] : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      content: '',
      note_type: 'General',
      meeting_date: '',
    });
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    try {
      await clientNoteAPI.delete(noteId);
      fetchNotes();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Failed to delete note: ' + err.message);
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

  const noteTypes = ['General', 'Meeting', 'Call', 'Email', 'Follow-up'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Client Notes</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50 hover:border-cyan-400"
        >
          + Add Note
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {notes.length === 0 && (!client || !client.notes_from_last_meeting) ? (
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-white mb-2">No notes yet</h3>
          <p className="text-gray-400 mb-6">Start documenting your conversations and meetings</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50"
          >
            Add First Note
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show legacy notes_from_last_meeting if it exists and hasn't been converted to a note */}
          {client && client.notes_from_last_meeting && !notes.some(n => n.content === client.notes_from_last_meeting) && (
            <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 text-xs font-bold bg-gray-700 text-gray-300 border border-gray-600 rounded-full">
                      Legacy Meeting
                    </span>
                    {client.updated_at && (
                      <span className="text-sm text-gray-400">
                        Meeting: {formatDate(client.updated_at)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Meeting Notes</h3>
                  <p className="text-gray-300 whitespace-pre-wrap mb-3">{client.notes_from_last_meeting}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 border-t border-gray-800 pt-3">
                {client.updated_at && `Last updated ${formatDateTime(client.updated_at)}`}
              </div>
            </div>
          )}
          
          {notes.map((note) => (
            <div key={note.id} className="bg-[#1f1f1f] border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
                      {note.note_type}
                    </span>
                    {note.meeting_date && (
                      <span className="text-sm text-gray-400">
                        Meeting: {formatDate(note.meeting_date)}
                      </span>
                    )}
                  </div>
                  {note.title && (
                    <h3 className="text-lg font-bold text-white mb-2">{note.title}</h3>
                  )}
                  <p className="text-gray-300 whitespace-pre-wrap mb-3">{note.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="px-3 py-2 text-sm font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="px-3 py-2 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 border-t border-gray-800 pt-3">
                Created {formatDateTime(note.created_at)}
                {note.created_by && ` by ${note.created_by}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {(showAddModal || editingNote) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1f1f1f] border border-cyan-500/40 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-bold text-white">{editingNote ? 'Edit Note' : 'Add Note'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Note Type</label>
                <select
                  value={formData.note_type}
                  onChange={(e) => setFormData({ ...formData, note_type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                >
                  {noteTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {formData.note_type === 'Meeting' && (
                <div>
                  <label className="block text-sm font-medium text-cyan-400 mb-2">Meeting Date</label>
                  <input
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  placeholder="Brief title for this note"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-400 mb-2">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="8"
                  className="w-full px-4 py-2.5 bg-[#252525] border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50"
                  required
                  placeholder="Write your notes here..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    if (editingNote) {
                      handleCancelEdit();
                    } else {
                      setShowAddModal(false);
                    }
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-[#252525] border border-gray-800 rounded-xl hover:bg-[#2a2a2a] hover:border-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-cyan-500 rounded-xl hover:bg-cyan-600 border border-cyan-400/50 transition-all"
                >
                  {editingNote ? 'Update Note' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientNotesView;
