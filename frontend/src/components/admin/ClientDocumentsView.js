import React, { useState, useEffect } from 'react';
import { clientDocumentAPI } from '../../services/api';

function ClientDocumentsView({ clientId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'Other',
    file: null,
  });

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await clientDocumentAPI.getByClientId(clientId);
      setDocuments(data);
      setError('');
    } catch (err) {
      setError('Failed to load documents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setError('');
      await clientDocumentAPI.upload(
        clientId,
        formData.file,
        formData.title,
        formData.description,
        formData.document_type,
        'Admin' // TODO: Get from auth context
      );
      setFormData({ title: '', description: '', document_type: 'Other', file: null });
      setShowUploadForm(false);
      fetchDocuments();
    } catch (err) {
      setError('Failed to upload document: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await clientDocumentAPI.delete(documentId);
      fetchDocuments();
    } catch (err) {
      setError('Failed to delete document: ' + err.message);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const blob = await clientDocumentAPI.download(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download document: ' + err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleView = (document) => {
    setViewingDocument(document);
  };

  const canViewInBrowser = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const viewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt', 'html', 'htm'];
    return viewableTypes.includes(extension);
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-gray-800">Documents</h3>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 rounded-xl transition-all"
        >
          {showUploadForm ? 'Cancel' : '+ Upload Document'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {showUploadForm && (
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6 mb-6 hover:border-purple-300 hover:shadow-xl transition-all">
          <h4 className="text-lg font-black text-gray-800 mb-4">Upload Document</h4>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-purple-600 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-purple-600 mb-2">Document Type</label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
              >
                <option value="SOW">SOW (Scope of Work)</option>
                <option value="Contract">Contract</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-purple-600 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-purple-600 mb-2">File *</label>
              <input
                type="file"
                onChange={handleFileChange}
                required
                className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 text-sm font-bold text-purple-600 bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 disabled:opacity-50 transition-all"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-12 text-center hover:border-purple-300 hover:shadow-xl transition-all">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-black text-gray-800 mb-2">No documents</h3>
          <p className="text-gray-600 font-semibold">Upload documents related to this client</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border-2 border-purple-200 rounded-xl p-4 flex items-center justify-between hover:border-purple-300 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📄</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-gray-800">{doc.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 font-semibold flex-wrap">
                    <span>{doc.file_name}</span>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 border-2 border-purple-200 rounded-full text-xs font-bold">
                      {doc.document_type}
                    </span>
                    <span>•</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-600 font-semibold mt-1">{doc.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canViewInBrowser(doc.file_name) && (
                  <button
                    onClick={() => handleView(doc)}
                    className="px-3 py-2 text-sm font-bold text-purple-600 bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all"
                  >
                    View
                  </button>
                )}
                <button
                  onClick={() => handleDownload(doc.id, doc.file_name)}
                  className="px-3 py-2 text-sm font-bold text-purple-600 bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="px-3 py-2 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Document Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-purple-200 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-800">{viewingDocument.title}</h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-gray-600 hover:text-gray-800 text-2xl font-bold transition-all"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-6 min-h-0">
              {canViewInBrowser(viewingDocument.file_name) ? (
                <div className="w-full h-full min-h-0">
                  {viewingDocument.file_name.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={clientDocumentAPI.getViewUrl(viewingDocument.id)}
                      className="w-full h-full min-h-[600px] rounded-lg border-2 border-purple-200"
                      title={viewingDocument.title}
                    />
                  ) : viewingDocument.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <img
                        src={clientDocumentAPI.getViewUrl(viewingDocument.id)}
                        alt={viewingDocument.title}
                        className="max-w-full max-h-full rounded-lg border-2 border-purple-200"
                      />
                    </div>
                  ) : (
                    <iframe
                      src={clientDocumentAPI.getViewUrl(viewingDocument.id)}
                      className="w-full h-full min-h-[600px] rounded-lg border-2 border-purple-200 bg-white"
                      title={viewingDocument.title}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <p className="text-gray-600 font-semibold">This file type cannot be viewed in the browser. Please download it.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-purple-200 flex justify-end gap-3">
              <button
                onClick={() => handleDownload(viewingDocument.id, viewingDocument.file_name)}
                className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all"
              >
                Download
              </button>
              <button
                onClick={() => setViewingDocument(null)}
                className="px-4 py-2 text-sm font-bold text-purple-600 bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDocumentsView;
