import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI, scopeOfWorkAPI, clientTechStackAPI, contractAPI } from '../../services/api';
import { auth } from '../../firebase';
import TextEditorModal from './TextEditorModal';

// Import section templates
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

function ScopeOfWorkGenerator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [regeneratingSectionIndex, setRegeneratingSectionIndex] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [techStack, setTechStack] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 19, status: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info'); // 'info', 'warning', 'error', 'success'
  
  // SOW form data
  const [sowData, setSowData] = useState({
    title: '',
    project_description: '',
    budget: null,
    start_date: '',
    end_date: '',
    duration_value: null,
    duration_unit: 'weeks', // 'days', 'weeks', 'months'
    pricing_type: 'milestones', // 'milestones' or 'hourly'
    num_milestones: 3,
    hourly_rate: null,
    // Editable client info
    client_name: '',
    client_company: '',
    client_address: '',
    client_email: '',
    client_phone: '',
  });
  
  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Sections content - track which were AI-generated
  const [sections, setSections] = useState([]);
  const [aiGeneratedSections, setAiGeneratedSections] = useState(new Set()); // Track AI-generated sections
  const [expandedSections, setExpandedSections] = useState(new Set([0, 1, 2])); // First 3 expanded by default
  const [sectionTemplates, setSectionTemplates] = useState([]);
  
  // PDF Preview
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  
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
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientDetails();
    }
  }, [selectedClient]);

  useEffect(() => {
    // Fetch section templates from backend
    const fetchTemplates = async () => {
      try {
        const templates = await scopeOfWorkAPI.getTemplates();
        setSectionTemplates(templates);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Initialize sections when moving to step 3 and templates are loaded
    // Sections will be prepopulated with templates (or AI if user clicked the button)
    if (step === 3 && sections.length === 0 && sectionTemplates.length > 0) {
      initializeSections(false); // Start with prepopulated templates, user can enhance with AI
    }
  }, [step, sectionTemplates]);

  // Generate PDF preview when reaching step 4
  useEffect(() => {
    if (step === 4 && sections.length > 0 && sowData.title) {
      generatePDFPreview();
    }
    
    // Cleanup on unmount or when leaving step 4
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }
    };
  }, [step, sections.length, sowData.title]);

  const generatePDFPreview = async () => {
    if (!sowData.title || sections.length === 0) {
      return;
    }

    try {
      setPdfPreviewLoading(true);
      
      const previewData = {
        title: sowData.title,
        start_date: sowData.start_date || null,
        end_date: sowData.end_date || null,
        client_name: sowData.client_name || 'N/A',
        client_company: sowData.client_company || null,
        client_email: sowData.client_email || null,
        client_address: sowData.client_address || null,
        sections: sections.map(s => ({
          title: s.title,
          content: s.content || '',
          order: s.order,
        })),
      };

      const url = await scopeOfWorkAPI.previewPDF(previewData);
      
      // Clean up old URL if exists
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      
      setPdfPreviewUrl(url);
    } catch (err) {
      console.error('Failed to generate PDF preview:', err);
      setError('Failed to generate PDF preview: ' + err.message);
    } finally {
      setPdfPreviewLoading(false);
    }
  };

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
      const [clientData, techData, contractsData] = await Promise.all([
        clientAPI.getById(selectedClient),
        clientTechStackAPI.getByClientId(selectedClient),
        contractAPI.getByClientId(selectedClient).catch(() => []), // Fetch contracts, but don't fail if none exist
      ]);
      
      setClientDetails(clientData);
      setTechStack(techData);
      
      // Get the most recent active/signed contract if available
      const activeContract = contractsData && contractsData.length > 0 
        ? contractsData.find(c => c.status === 'Active' || c.status === 'Signed') || contractsData[0]
        : null;
      
      // Format dates for date inputs (YYYY-MM-DD)
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };
      
      // Determine pricing type from contract or client data
      let pricingType = 'milestones';
      if (clientData.hourly_rate) {
        pricingType = 'hourly';
      } else if (activeContract) {
        // Use contract type if available
        if (activeContract.contract_type === 'Hourly') {
          pricingType = 'hourly';
        } else if (activeContract.contract_type === 'Milestone Based' || activeContract.contract_type === 'Fixed Price') {
          pricingType = 'milestones';
        }
      } else if (clientData.contract_type === 'Hourly') {
        pricingType = 'hourly';
      }
      
      // Auto-populate SOW data from client and contract
      setSowData(prev => ({
        ...prev,
        client_name: `${clientData.first_name} ${clientData.last_name}`,
        client_company: clientData.company || '',
        client_address: clientData.address || '',
        client_email: clientData.email || '',
        client_phone: clientData.contacts && clientData.contacts.length > 0 ? clientData.contacts[0].phone || '' : '',
        title: `SOW - ${clientData.company || `${clientData.first_name} ${clientData.last_name}`} Project`,
        project_description: clientData.description || '', // Prepopulate from client description
        budget: activeContract?.total_amount || null, // Use contract total_amount as budget
        start_date: formatDateForInput(activeContract?.start_date || clientData.contract_due_date), // Use contract start_date or client contract_due_date
        end_date: formatDateForInput(activeContract?.due_date || clientData.contract_due_date), // Use contract due_date or client contract_due_date
        hourly_rate: clientData.hourly_rate || null,
        pricing_type: pricingType,
        // Set num_milestones based on contract milestones if available
        num_milestones: activeContract?.milestones?.length || prev.num_milestones || 3,
      }));
      
      setError('');
    } catch (err) {
      setError('Failed to load client details: ' + err.message);
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
    }, 5000); // Auto-hide after 5 seconds
  };

  const initializeSections = async (useAI = false) => {
    if (useAI) {
      // Use AI to generate all sections
      try {
        setAiLoading(true);
        setAiProgress({ current: 0, total: 19, status: 'Connecting to AI service...' });
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setAiProgress(prev => {
            if (prev.current < prev.total - 1) {
              return {
                ...prev,
                current: prev.current + 1,
                status: `Generating section ${prev.current + 1} of ${prev.total}...`
              };
            }
            return prev;
          });
        }, 500); // Update every 500ms
        
        const userEmail = auth?.currentUser?.email || null;
        const data = await scopeOfWorkAPI.generateWithAI({
          client_id: selectedClient,
          project_title: sowData.title,
          project_description: sowData.project_description || null,
          budget: sowData.budget || null,
          start_date: sowData.start_date || null,
          end_date: sowData.end_date || null,
          pricing_type: sowData.pricing_type,
          num_milestones: sowData.pricing_type === 'milestones' ? sowData.num_milestones : null,
          hourly_rate: sowData.pricing_type === 'hourly' ? sowData.hourly_rate : null,
        }, userEmail);
        
        clearInterval(progressInterval);
        setAiProgress({ current: 19, total: 19, status: 'Finalizing...' });
        
        // Mark all sections as AI-generated
        const aiGenerated = new Set(data.sections.map((_, idx) => idx));
        setAiGeneratedSections(aiGenerated);
        
        setSections(data.sections.map(s => ({
          title: s.title,
          content: s.content,
          order: s.order,
        })));
        
        // Store AI suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          setAiSuggestions(data.suggestions);
        } else {
          setAiSuggestions([]);
        }
        
        setError('');
        
        // Show toast if AI was not available
        if (data.ai_available === false) {
          showToastNotification('OpenAI API is not available. Generated using templates. You can manually edit all sections.', 'warning');
          setAiGeneratedSections(new Set()); // Clear AI markers if using templates
        } else {
          showToastNotification('SOW generated with AI! All sections have been populated. Please review and customize as needed.', 'success');
        }
        
        setAiProgress({ current: 0, total: 19, status: '' });
        return;
      } catch (err) {
        console.error('AI generation error:', err);
        showToastNotification(`AI generation failed: ${err.message}. Using templates instead. You can manually edit all sections.`, 'error');
        setAiGeneratedSections(new Set()); // Clear AI markers
        // Fall through to template generation
      } finally {
        setAiLoading(false);
        setAiProgress({ current: 0, total: 19, status: '' });
      }
    }
    
    // Generate section content with templates (fallback or default)
    const initializedSections = SOW_SECTIONS.map((section, index) => {
      let content = getSectionTemplate(section.title);
      
      // Replace placeholders
      if (clientDetails) {
        content = content.replace(/\[CLIENT_NAME\]/g, sowData.client_name || clientDetails.company || `${clientDetails.first_name} ${clientDetails.last_name}`);
        content = content.replace(/\[CLIENT_COMPANY\]/g, sowData.client_company || clientDetails.company || '');
      }
      
      // Handle milestones
      if (section.title.includes('Milestones')) {
        content = generateMilestonesTemplate(
          sowData.num_milestones, 
          sowData.start_date, 
          sowData.end_date,
          sowData.budget,
          sowData.hourly_rate
        );
      }
      
      // Handle tech stack
      if (section.title.includes('Technical Architecture') && techStack.length > 0) {
        const techList = techStack.map(t => `- ${t.technology}${t.version ? ` (${t.version})` : ''}${t.category ? ` - ${t.category}` : ''}`).join('\n');
        content = content.replace(/\[FRONTEND_TECH\]/g, techStack.find(t => t.category === 'Frontend')?.technology || 'To be determined');
        content = content.replace(/\[BACKEND_TECH\]/g, techStack.find(t => t.category === 'Backend')?.technology || 'To be determined');
        content = content.replace(/\[DATABASE_TECH\]/g, techStack.find(t => t.category === 'Database')?.technology || 'To be determined');
        content = content.replace(/\[HOSTING_PROVIDER\]/g, techStack.find(t => t.category === 'Hosting')?.technology || 'To be determined');
        content = content.replace(/\[AUTH_METHOD\]/g, techStack.find(t => t.category === 'Authentication')?.technology || 'To be determined');
      }
      
      return {
        title: section.title,
        content: content,
        order: section.order,
      };
    });
    
    setSections(initializedSections);
    setAiGeneratedSections(new Set()); // Clear AI markers for template-generated sections
  };

  const getSectionTemplate = (title) => {
    // Find template from backend
    const template = sectionTemplates.find(t => t.title === title);
    if (template) {
      return template.template;
    }
    // Fallback if templates not loaded yet
    return `[Loading template for ${title}...]`;
  };

  const generateMilestonesTemplate = (numMilestones, startDate, endDate, budget = null, hourlyRate = null) => {
    if (numMilestones <= 0) return "No milestones defined.";
    
    // Calculate hourly estimates if we have budget and hourly rate
    let totalEstimatedHours = null;
    let hoursPerMilestone = null;
    
    if (budget && hourlyRate && hourlyRate > 0) {
      totalEstimatedHours = Math.round(budget / hourlyRate);
      hoursPerMilestone = Math.round(totalEstimatedHours / numMilestones);
    }
    
    const milestones = [];
    const header = `Project Timeline & Milestones

Total Estimated Hours: ${totalEstimatedHours || '[TBD]'} hours
Budget: $${budget ? budget.toLocaleString() : '[TBD]'}
Hourly Rate: $${hourlyRate || '[TBD]'}/hour

---

`;
    
    for (let i = 1; i <= numMilestones; i++) {
      let milestoneText = `Milestone ${i}:
- Name: [MILESTONE_${i}_NAME]
- Description: [MILESTONE_${i}_DESCRIPTION]
- Estimated Duration: [DURATION]`;
      
      if (hoursPerMilestone) {
        milestoneText += `\n- Estimated Hours: ~${hoursPerMilestone} hours`;
        milestoneText += `\n- Estimated Cost: $${(hoursPerMilestone * hourlyRate).toLocaleString()}`;
      }
      
      milestoneText += `\n- Start Date: ${startDate || '[START_DATE]'}
- End Date: ${endDate || '[END_DATE]'}
- Approval Checkpoint: [APPROVAL_REQUIRED]`;
      
      milestones.push(milestoneText);
    }
    return header + milestones.join('\n\n');
  };

  const handleNext = () => {
    if (step === 1 && !selectedClient) {
      setError('Please select a client');
      return;
    }
    if (step === 2) {
      if (!sowData.title) {
        setError('SOW title is required');
        return;
      }
      if (sowData.pricing_type === 'milestones' && (!sowData.num_milestones || sowData.num_milestones <= 0)) {
        setError('Number of milestones is required and must be greater than 0');
        return;
      }
      if (sowData.pricing_type === 'hourly' && (!sowData.hourly_rate || sowData.hourly_rate <= 0)) {
        setError('Hourly rate is required and must be greater than 0');
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

  const handleSave = async (status = 'Draft') => {
    try {
      setSaving(true);
      setError('');
      
      const scopeData = {
        client_id: selectedClient,
        title: sowData.title,
        version: "1.0",
        status: status,
        start_date: sowData.start_date ? new Date(sowData.start_date).toISOString() : null,
        end_date: sowData.end_date ? new Date(sowData.end_date).toISOString() : null,
        sections: sections.map(s => ({
          title: s.title,
          content: s.content,
          order: s.order,
        })),
      };
      
      const created = await scopeOfWorkAPI.create(scopeData);
      // SOW is now stored and attached to the client (via client_id)
      // Show success message and option to export PDF
      if (window.confirm('SOW saved successfully! Would you like to export it as PDF for client signature?')) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/scope-of-work/${created.id}/generate-pdf`);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SOW_${sowData.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } catch (err) {
          console.error('PDF export failed:', err);
        }
      }
      navigate(`/admin/scope`, { state: { message: 'SOW created successfully!', sowId: created.id } });
    } catch (err) {
      setError('Failed to save SOW: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-semibold text-gray-900">Generate Scope of Work</h1>
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
                  {s === 2 && 'SOW Details'}
                  {s === 3 && 'Edit Sections'}
                  {s === 4 && 'Review'}
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

      {/* Step 2: SOW Details */}
      {step === 2 && clientDetails && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">SOW Details</h2>
          
          <div className="space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SOW Title *</label>
              <input
                type="text"
                value={sowData.title}
                onChange={(e) => setSowData({ ...sowData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Project Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Project Description (Optional)</label>
                <button
                  type="button"
                  onClick={() => setIsDescriptionModalOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>
              <textarea
                value={sowData.project_description}
                onChange={(e) => setSowData({ ...sowData, project_description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the project goals, objectives, and key requirements. This will help AI generate more accurate SOW content."
              />
              <p className="text-xs text-gray-500 mt-1">Provide detailed project information to help AI generate better SOW content. Click "Edit" for a larger editor.</p>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Budget (Optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sowData.budget || ''}
                onChange={(e) => setSowData({ ...sowData, budget: parseFloat(e.target.value) || null })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 50000.00"
              />
              <p className="text-xs text-gray-500 mt-1">Total project budget. This will be used to inform pricing sections in the SOW</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date (Optional)</label>
                <input
                  type="date"
                  value={sowData.start_date}
                  onChange={(e) => {
                    setSowData({ ...sowData, start_date: e.target.value });
                    // If we have a duration and start date changes, recalculate end date
                    if (e.target.value && sowData.duration_value && !sowData.end_date) {
                      const startDate = new Date(e.target.value);
                      const durationDays = sowData.duration_unit === 'days' ? sowData.duration_value :
                                         sowData.duration_unit === 'weeks' ? sowData.duration_value * 7 :
                                         sowData.duration_value * 30;
                      const endDate = new Date(startDate);
                      endDate.setDate(endDate.getDate() + durationDays);
                      setSowData(prev => ({ ...prev, end_date: endDate.toISOString().split('T')[0] }));
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  value={sowData.end_date}
                  onChange={(e) => {
                    setSowData({ ...sowData, end_date: e.target.value });
                    // Clear duration when end date is manually set
                    if (e.target.value) {
                      setSowData(prev => ({ ...prev, duration_value: null }));
                    }
                  }}
                  min={sowData.start_date}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Duration (only show if start date exists and no end date) */}
            {sowData.start_date && !sowData.end_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Or estimate project duration:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="1"
                      value={sowData.duration_value || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || null;
                        setSowData({ ...sowData, duration_value: value });
                        
                        // Auto-calculate end date
                        if (value && sowData.start_date) {
                          const startDate = new Date(sowData.start_date);
                          const durationDays = sowData.duration_unit === 'days' ? value :
                                             sowData.duration_unit === 'weeks' ? value * 7 :
                                             value * 30;
                          const endDate = new Date(startDate);
                          endDate.setDate(endDate.getDate() + durationDays);
                          setSowData(prev => ({ ...prev, end_date: endDate.toISOString().split('T')[0] }));
                        }
                      }}
                      placeholder="How long?"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      value={sowData.duration_unit}
                      onChange={(e) => {
                        setSowData({ ...sowData, duration_unit: e.target.value });
                        
                        // Recalculate end date with new unit
                        if (sowData.duration_value && sowData.start_date) {
                          const startDate = new Date(sowData.start_date);
                          const durationDays = e.target.value === 'days' ? sowData.duration_value :
                                             e.target.value === 'weeks' ? sowData.duration_value * 7 :
                                             sowData.duration_value * 30;
                          const endDate = new Date(startDate);
                          endDate.setDate(endDate.getDate() + durationDays);
                          setSowData(prev => ({ ...prev, end_date: endDate.toISOString().split('T')[0] }));
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  💡 This will automatically calculate the end date
                </p>
              </div>
            )}

            {/* Pricing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricing_type"
                    value="milestones"
                    checked={sowData.pricing_type === 'milestones'}
                    onChange={(e) => setSowData({ ...sowData, pricing_type: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Milestone-Based</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricing_type"
                    value="hourly"
                    checked={sowData.pricing_type === 'hourly'}
                    onChange={(e) => setSowData({ ...sowData, pricing_type: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Hourly</span>
                </label>
              </div>
            </div>

            {/* Number of Milestones (only show if milestone-based) */}
            {sowData.pricing_type === 'milestones' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Milestones *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sowData.num_milestones}
                  onChange={(e) => setSowData({ ...sowData, num_milestones: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This will generate milestone placeholders in section 5</p>
              </div>
            )}

            {/* Hourly Rate (only show if hourly) */}
            {sowData.pricing_type === 'hourly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sowData.hourly_rate || ''}
                  onChange={(e) => setSowData({ ...sowData, hourly_rate: parseFloat(e.target.value) || null })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 150.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">The hourly rate for this project</p>
              </div>
            )}

            {/* Editable Client Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information (Editable)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={sowData.client_name}
                    onChange={(e) => setSowData({ ...sowData, client_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={sowData.client_company}
                    onChange={(e) => setSowData({ ...sowData, client_company: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={sowData.client_email}
                    onChange={(e) => setSowData({ ...sowData, client_email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={sowData.client_phone}
                    onChange={(e) => setSowData({ ...sowData, client_phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={sowData.client_address}
                    onChange={(e) => setSowData({ ...sowData, client_address: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Loading Overlay */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Generating SOW with AI</h3>
                <p className="text-sm text-gray-600 mt-1">{aiProgress.status || 'Processing...'}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(aiProgress.current / aiProgress.total) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>Section {aiProgress.current} of {aiProgress.total}</p>
              <p className="text-xs text-gray-500 mt-2">This may take 30-60 seconds...</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {aiSuggestions.length > 0 && step === 3 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
            </div>
            <button
              onClick={() => setAiSuggestions([])}
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

      {/* Step 3: Edit Sections - This will be a large component */}
      {step === 3 && sections.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Edit SOW Sections</h2>
              <p className="text-gray-600 mt-1">Review and customize all 19 required sections. All sections are editable.</p>
              {aiGeneratedSections.size > 0 && (
                <p className="text-sm text-purple-600 mt-2">
                  ✨ {aiGeneratedSections.size} section{aiGeneratedSections.size !== 1 ? 's' : ''} generated by AI (highlighted below)
                </p>
              )}
            </div>
            <button
              onClick={async () => {
                if (!window.confirm('This will use AI to generate all sections based on client and project information. This will replace current content. Continue?')) {
                  return;
                }
                try {
                  setError('');
                  await initializeSections(true); // Use AI
                  // Toast notification is handled in initializeSections
                } catch (err) {
                  setError('AI generation failed: ' + err.message);
                  showToastNotification('AI generation failed. You can manually edit all sections.', 'error');
                }
              }}
              disabled={aiLoading || !selectedClient || !sowData.title}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🤖</span>
              {aiLoading ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
          
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
            {sections.map((section, index) => {
              const isExpanded = expandedSections.has(index);
              const isCustomizable = customizableSections.includes(section.title);
              const isAiGenerated = aiGeneratedSections.has(index);
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
                            <span className="font-medium">✨ AI Generated:</span> This section was automatically generated by AI based on your client and project information. Please review and customize as needed.
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
                        <textarea
                          value={section.content}
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
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSectionIndex(index);
                              setIsSectionModalOpen(true);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            Expand Editor
                          </button>
                          {isCustomizable && aiGeneratedSections.size > 0 && (
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Regenerate "${section.title}" using AI? This will replace the current content.`)) {
                                  return;
                                }
                                try {
                                  setRegeneratingSectionIndex(index);
                                  showToastNotification('Regenerating section with AI...', 'info');
                                  
                                  // Call AI to regenerate just this section
                                  const userEmail = auth?.currentUser?.email || null;
                                  const response = await fetch(`http://localhost:8000/api/scope-of-work/ai/regenerate-section${userEmail ? `?user_email=${encodeURIComponent(userEmail)}` : ''}`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      scope_id: null, // No scope_id for unsaved SOWs
                                      section_title: section.title,
                                      client_name: clientDetails?.name || '',
                                      project_title: sowData.title,
                                      project_description: sowData.project_description,
                                    }),
                                  });
                                  
                                  if (!response.ok) {
                                    throw new Error('Failed to regenerate section');
                                  }
                                  
                                  const result = await response.json();
                                  
                                  // Update the section
                                  const updatedSections = [...sections];
                                  updatedSections[index].content = result.content;
                                  setSections(updatedSections);
                                  
                                  showToastNotification('Section regenerated successfully!', 'success');
                                } catch (err) {
                                  showToastNotification(`Failed to regenerate section: ${err.message}`, 'error');
                                } finally {
                                  setRegeneratingSectionIndex(null);
                                }
                              }}
                              disabled={regeneratingSectionIndex === index}
                              className="text-xs px-3 py-1.5 text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {regeneratingSectionIndex === index ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Regenerating...</span>
                                </>
                              ) : (
                                <>
                                  🔄 Regenerate Section
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review SOW</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">SOW Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title:</span>
                    <span className="font-medium text-gray-900">{sowData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium text-gray-900">{sowData.client_name}</span>
                  </div>
                  {sowData.start_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium text-gray-900">{new Date(sowData.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {sowData.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium text-gray-900">{new Date(sowData.end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sections:</span>
                    <span className="font-medium text-gray-900">{sections.length} sections</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Milestones:</span>
                    <span className="font-medium text-gray-900">{sowData.num_milestones}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Note:</span> You can save as Draft to continue editing later, or mark as Sent when ready to share with the client.
                </p>
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">PDF Preview</h3>
              {pdfPreviewLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating preview...</span>
                </div>
              )}
            </div>
            
            {pdfPreviewLoading ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Generating PDF preview...</p>
                </div>
              </div>
            ) : pdfPreviewUrl ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full"
                  style={{ height: '800px' }}
                  title="SOW PDF Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">No preview available. Please ensure all sections are filled.</p>
              </div>
            )}
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
          <div className="flex gap-3">
            <button
              onClick={() => handleSave('Draft')}
              disabled={saving}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSave('Sent')}
              disabled={saving}
              className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Confirm & Save SOW'}
            </button>
          </div>
        )}
      </div>

      {/* Text Editor Modals */}
      <TextEditorModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        onSave={(newValue) => setSowData({ ...sowData, project_description: newValue })}
        title="Edit Project Description"
        initialValue={sowData.project_description}
        placeholder="Describe the project goals, objectives, and key requirements. This will help AI generate more accurate SOW content."
      />

      {/* Section Editor Modal */}
      {isSectionModalOpen && editingSectionIndex !== null && (
        <TextEditorModal
          isOpen={isSectionModalOpen}
          onClose={() => {
            setIsSectionModalOpen(false);
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

export default ScopeOfWorkGenerator;
