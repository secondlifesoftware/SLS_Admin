import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scopeOfWorkAPI, clientAPI } from '../../services/api';
import { auth } from '../../firebase';
import TextEditorModal from './TextEditorModal';

const SOW_SECTIONS = [
  { title: "1. Executive Summary / Purpose", order: 1 },
  { title: "2. Definitions & Terminology", order: 2 },
  { title: "3. Scope of Work (Core Section)", order: 3 },
  { title: "4. Deliverables", order: 4 },
  { title: "5. Milestones & Timeline", order: 5 },
  { title: "6. Technical Architecture", order: 6 },
  { title: "7. Roles & Responsibilities", order: 7 },
  { title: "8. Acceptance Criteria & Review Process", order: 8 },
  { title: "9. Change Management", order: 9 },
  { title: "10. Pricing & Payment Terms", order: 10 },
  { title: "11. IP Ownership & Licensing", order: 11 },
  { title: "12. Confidentiality & Data Handling", order: 12 },
  { title: "13. Security & Compliance", order: 13 },
  { title: "14. Testing & QA", order: 14 },
  { title: "15. Deployment & Handoff", order: 15 },
  { title: "16. Support, Maintenance & Warranty", order: 16 },
  { title: "17. Assumptions & Constraints", order: 17 },
  { title: "18. Termination & Exit", order: 18 },
  { title: "19. Legal Boilerplate (Often Referenced)", order: 19 },
];

function ScopeOfWorkEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [scope, setScope] = useState(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set([0, 1, 2]));
  const [aiGeneratedSections, setAiGeneratedSections] = useState(new Set());
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  const [regeneratingFull, setRegeneratingFull] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // Sections that should be customizable vs. standardized
  const customizableSections = [
    "1. Executive Summary / Purpose",
    "3. Scope of Work (Core Section)",
    "4. Deliverables",
    "5. Milestones & Timeline",
    "6. Technical Architecture",
    "7. Roles & Responsibilities",
    "8. Acceptance Criteria & Review Process",
    "10. Pricing & Payment Terms",
    "17. Assumptions & Constraints",
  ];

  useEffect(() => {
    fetchSOWData();
  }, [id]);

  // Check for regenerated data from navigation state
  useEffect(() => {
    const state = window.history.state;
    if (state?.usr?.regeneratedSections) {
      setSections(state.usr.regeneratedSections);
      if (state.usr.suggestions) {
        setAiSuggestions(state.usr.suggestions);
        setShowSuggestions(true);
      }
      // Mark all as AI-generated
      setAiGeneratedSections(new Set(state.usr.regeneratedSections.map((_, idx) => idx)));
      showToastNotification('SOW regenerated with AI! Please review the changes.', 'success');
      // Clear the state
      window.history.replaceState({}, '');
    }
  }, []);

  const fetchSOWData = async () => {
    try {
      setLoading(true);
      setError('');
      const scopeData = await scopeOfWorkAPI.getById(id);
      setScope(scopeData);
      
      // Fetch client data
      const clientData = await clientAPI.getById(scopeData.client_id);
      setClient(clientData);
      
      // Sort sections by order
      const sortedSections = (scopeData.sections || []).sort((a, b) => a.order - b.order);
      setSections(sortedSections);
      
      setError('');
    } catch (err) {
      setError('Failed to load SOW: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToastNotification = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  const handleSectionChange = (index, content) => {
    const updatedSections = [...sections];
    updatedSections[index].content = content;
    setSections(updatedSections);
    // Remove AI marker if user edits the section
    if (aiGeneratedSections.has(index)) {
      const newAiGenerated = new Set(aiGeneratedSections);
      newAiGenerated.delete(index);
      setAiGeneratedSections(newAiGenerated);
    }
  };

  const handleRegenerateSection = async (sectionIndex) => {
    const section = sections[sectionIndex];
    if (!section) return;

    if (!window.confirm(`Regenerate "${section.title}" using AI? This will replace the current content.`)) {
      return;
    }

    try {
      setRegeneratingSection(sectionIndex);
      setError('');
      
      const userEmail = auth?.currentUser?.email || null;
      const result = await scopeOfWorkAPI.regenerateSection(id, section.title, userEmail);
      
      // Update the section content
      const updatedSections = [...sections];
      updatedSections[sectionIndex].content = result.content;
      setSections(updatedSections);
      
      // Mark as AI-generated
      const newAiGenerated = new Set(aiGeneratedSections);
      newAiGenerated.add(sectionIndex);
      setAiGeneratedSections(newAiGenerated);
      
      showToastNotification(`Section "${section.title}" regenerated successfully!`, 'success');
    } catch (err) {
      setError('Failed to regenerate section: ' + err.message);
      showToastNotification(`Failed to regenerate section: ${err.message}`, 'error');
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleRegenerateFull = async () => {
    if (!window.confirm('Regenerate this entire SOW using AI? This will replace all sections. Continue?')) {
      return;
    }

    try {
      setRegeneratingFull(true);
      setError('');
      
      const userEmail = auth?.currentUser?.email || null;
      const result = await scopeOfWorkAPI.regenerateFull(id, userEmail);
      
      if (result.sections) {
        // Sort sections by order
        const sortedSections = result.sections.sort((a, b) => a.order - b.order);
        setSections(sortedSections);
        
        // Store suggestions
        if (result.suggestions && result.suggestions.length > 0) {
          setAiSuggestions(result.suggestions);
          setShowSuggestions(true);
        }
        
        // Mark all as AI-generated
        setAiGeneratedSections(new Set(sortedSections.map((_, idx) => idx)));
        
        showToastNotification('SOW regenerated with AI! Please review all sections.', 'success');
      }
    } catch (err) {
      setError('Failed to regenerate SOW: ' + err.message);
      showToastNotification(`Failed to regenerate SOW: ${err.message}`, 'error');
    } finally {
      setRegeneratingFull(false);
    }
  };

  const handleSave = async (status = null) => {
    try {
      setSaving(true);
      setError('');
      
      const updateData = {
        sections: sections.map(s => ({
          title: s.title,
          content: s.content,
          order: s.order,
        })),
      };
      
      // Only update status if explicitly provided
      if (status) {
        updateData.status = status;
      }
      
      await scopeOfWorkAPI.update(id, updateData);
      showToastNotification('SOW updated successfully!', 'success');
      
      // Navigate back to list after a short delay
      setTimeout(() => {
        navigate('/admin/scope');
      }, 1500);
    } catch (err) {
      setError('Failed to save SOW: ' + err.message);
      showToastNotification(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8000'}/api/scope-of-work/${id}/generate-pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOW_${scope.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToastNotification('PDF exported successfully!', 'success');
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
      showToastNotification(`Failed to export PDF: ${err.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!scope) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800">SOW not found</p>
        <button
          onClick={() => navigate('/admin/scope')}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          Back to SOW List
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in`}>
          <div className={`rounded-lg shadow-lg p-4 flex items-start gap-3 ${
            toastType === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            toastType === 'error' ? 'bg-red-50 border border-red-200' :
            toastType === 'success' ? 'bg-green-50 border border-green-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex-shrink-0">
              {toastType === 'warning' && <span className="text-yellow-600 text-xl">⚠️</span>}
              {toastType === 'error' && <span className="text-red-600 text-xl">❌</span>}
              {toastType === 'success' && <span className="text-green-600 text-xl">✅</span>}
              {toastType === 'info' && <span className="text-blue-600 text-xl">ℹ️</span>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                toastType === 'warning' ? 'text-yellow-800' :
                toastType === 'error' ? 'text-red-800' :
                toastType === 'success' ? 'text-green-800' :
                'text-blue-800'
              }`}>
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/scope')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to SOW List
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Edit Scope of Work</h1>
            <p className="text-gray-600 mt-1">{scope.title}</p>
            {client && (
              <p className="text-sm text-gray-500 mt-1">
                Client: {client.first_name} {client.last_name} {client.company ? `(${client.company})` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
            >
              📄 Export PDF
            </button>
            <button
              onClick={handleRegenerateFull}
              disabled={regeneratingFull}
              className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {regeneratingFull ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Regenerate Full SOW</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
          scope.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
          scope.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
          scope.status === 'Approved' ? 'bg-green-100 text-green-800' :
          scope.status === 'Rejected' ? 'bg-red-100 text-red-800' :
          scope.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
          scope.status === 'Completed' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {scope.status}
        </span>
        <span className="ml-3 text-sm text-gray-600">Version {scope.version}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {showSuggestions && aiSuggestions.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-2">
            {aiSuggestions.map((suggestion, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SOW Sections */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">SOW Sections</h2>
            <p className="text-gray-600 mt-1">Edit all 19 required sections. All sections are editable.</p>
            {aiGeneratedSections.size > 0 && (
              <p className="text-sm text-purple-600 mt-2">
                ✨ {aiGeneratedSections.size} section{aiGeneratedSections.size !== 1 ? 's' : ''} regenerated by AI (highlighted below)
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
          {sections.map((section, index) => {
            const isExpanded = expandedSections.has(index);
            const isCustomizable = customizableSections.includes(section.title);
            const isAiGenerated = aiGeneratedSections.has(index);
            const isRegenerating = regeneratingSection === index;
            
            return (
              <div key={index} className={`border rounded-xl overflow-hidden transition-all ${
                isAiGenerated 
                  ? 'border-purple-400 bg-purple-50/50 shadow-md' 
                  : isCustomizable 
                    ? 'border-blue-300 bg-blue-50/30' 
                    : 'border-gray-200 bg-gray-50/30'
              }`}>
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedSections);
                    if (isExpanded) {
                      newExpanded.delete(index);
                    } else {
                      newExpanded.add(index);
                    }
                    setExpandedSections(newExpanded);
                  }}
                  className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                    isAiGenerated
                      ? 'bg-purple-50 hover:bg-purple-100'
                      : isCustomizable 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{section.title}</span>
                    {isAiGenerated && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-200 text-purple-800 rounded-full flex items-center gap-1">
                        <span>✨</span>
                        <span>AI Generated</span>
                      </span>
                    )}
                    {!isAiGenerated && isCustomizable && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-200 text-blue-800 rounded-full">
                        Customize
                      </span>
                    )}
                    {!isAiGenerated && !isCustomizable && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                        Standard
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="p-4">
                    {isAiGenerated && (
                      <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs text-purple-800">
                          <span className="font-medium">✨ AI Generated:</span> This section was regenerated by AI. Please review and customize as needed.
                        </p>
                      </div>
                    )}
                    {!isCustomizable && !isAiGenerated && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <span className="font-medium">ℹ️ Standard Section:</span> This section contains standard legal terms and processes. 
                          Only edit if you need to customize for this specific contract.
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Section Content</label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSectionIndex(index);
                            setIsModalOpen(true);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          Expand Editor
                        </button>
                      </div>
                      <textarea
                        value={section.content || ''}
                        onChange={(e) => handleSectionChange(index, e.target.value)}
                        rows="12"
                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono text-xs ${
                          isAiGenerated
                            ? 'border-purple-300 focus:ring-purple-500 bg-purple-50/30'
                            : isCustomizable
                              ? 'border-blue-300 focus:ring-blue-500'
                              : 'border-gray-300 focus:ring-gray-500'
                        }`}
                        placeholder={isCustomizable ? "Customize this section for this project..." : "Standard terms (edit only if needed)..."}
                      />
                      {isCustomizable && (
                        <button
                          onClick={() => handleRegenerateSection(index)}
                          disabled={isRegenerating}
                          className="text-xs px-3 py-1.5 text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isRegenerating ? (
                            <>
                              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Regenerating...</span>
                            </>
                          ) : (
                            <>
                              <span>🔄</span>
                              <span>Regenerate Section with AI</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => navigate('/admin/scope')}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {scope.status !== 'Sent' && scope.status !== 'Approved' && (
            <button
              onClick={() => handleSave('Sent')}
              disabled={saving}
              className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Mark as Sent'}
            </button>
          )}
        </div>
      </div>

      {/* Text Editor Modal for Sections */}
      {isModalOpen && editingSectionIndex !== null && (
        <TextEditorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSectionIndex(null);
          }}
          onSave={(newValue) => {
            handleSectionChange(editingSectionIndex, newValue);
            setEditingSectionIndex(null);
          }}
          title={`Edit: ${sections[editingSectionIndex]?.title || 'Section'}`}
          initialValue={sections[editingSectionIndex]?.content || ''}
          placeholder="Enter section content..."
        />
      )}
    </div>
  );
}

export default ScopeOfWorkEdit;

