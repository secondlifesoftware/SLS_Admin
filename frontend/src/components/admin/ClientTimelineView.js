import React, { useState, useEffect } from 'react';
import { clientTimelineAPI } from '../../services/api';
import { parseNotionTimeline, convertMilestonesToTimelineEvents } from '../../utils/notionParser';

function ClientTimelineView({ clientId, onRefresh }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [projectInfo, setProjectInfo] = useState(null);
  const [formData, setFormData] = useState({
    event_type: 'Initial Contact',
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    next_steps: '',
  });

  useEffect(() => {
    fetchTimeline();
  }, [clientId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const data = await clientTimelineAPI.getByClientId(clientId);
      setTimeline(data);
      setError('');
    } catch (err) {
      setError('Failed to load timeline: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clientTimelineAPI.create({
        client_id: parseInt(clientId),
        ...formData,
        event_date: new Date(formData.event_date).toISOString(),
      });
      setShowAddModal(false);
      setFormData({
        event_type: 'Initial Contact',
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        next_steps: '',
      });
      fetchTimeline();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Failed to create timeline event: ' + err.message);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this timeline event?')) {
      return;
    }
    try {
      await clientTimelineAPI.delete(eventId);
      fetchTimeline();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Failed to delete timeline event: ' + err.message);
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Please paste your timeline text');
      return;
    }

    try {
      setImporting(true);
      setError('');
      
      // Use AI to parse the timeline text
      const parsed = await clientTimelineAPI.parseWithAI(importText, parseInt(clientId));
      
      if (!parsed.milestones || parsed.milestones.length === 0) {
        setError('No milestones found in the import. Please check the format or try rephrasing.');
        setImporting(false);
        return;
      }
      
      // Store project info
      setProjectInfo(parsed.projectInfo || {});
      
      // Helper function to normalize date to ISO format
      const normalizeDate = (dateString) => {
        if (!dateString) return null;
        
        // If already in ISO format with T, return as is
        if (dateString.includes('T')) {
          return dateString;
        }
        
        // If it's just a date (YYYY-MM-DD), add time component
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return `${dateString}T00:00:00.000Z`;
        }
        
        // Try to parse and convert to ISO
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (e) {
          console.error('Date parsing error:', e);
        }
        
        return null;
      };
      
      // Convert milestones to timeline events
      const events = parsed.milestones.map((milestone, index) => {
        // Normalize dates to ISO format
        const startDate = normalizeDate(milestone.startDate);
        const endDate = normalizeDate(milestone.endDate);
        const eventDate = startDate || endDate || new Date().toISOString();
        
        // Build description from milestone data
        let description = milestone.description || '';
        
        const metadata = [];
        if (milestone.startDate) {
          metadata.push(`Start: ${new Date(milestone.startDate).toLocaleDateString()}`);
        }
        if (milestone.endDate) {
          metadata.push(`End: ${new Date(milestone.endDate).toLocaleDateString()}`);
        }
        if (milestone.effort) {
          metadata.push(`Effort: ${milestone.effort}`);
        }
        if (milestone.acceptanceCriteria) {
          metadata.push(`Acceptance Criteria: ${milestone.acceptanceCriteria}`);
        }
        if (milestone.payment) {
          metadata.push(`Payment: ${milestone.payment}`);
        }
        if (milestone.keyDeliverables) {
          metadata.push(`Key Deliverables: ${milestone.keyDeliverables}`);
        }
        if (milestone.sprint) {
          metadata.push(`Sprint: ${milestone.sprint}`);
        }
        
        if (metadata.length > 0) {
          description += (description ? '\n\n' : '') + metadata.join('\n');
        }
        
        const nextSteps = milestone.acceptanceCriteria || '';
        const milestoneInfo = milestone.milestoneNumber ? `Milestone #${milestone.milestoneNumber}\n` : '';
        
        return {
          client_id: parseInt(clientId),
          event_type: 'Milestone Reached',
          title: milestone.title || `Milestone ${milestone.milestoneNumber || index + 1}`,
          description: description.trim(),
          event_date: eventDate,
          next_steps: milestoneInfo + nextSteps,
        };
      });
      
      // Create all events
      for (const event of events) {
        try {
          await clientTimelineAPI.create(event);
        } catch (err) {
          console.error('Error creating event:', event, err);
          throw new Error(`Failed to create event "${event.title}": ${err.message}`);
        }
      }
      
      setImportText('');
      setShowImportModal(false);
      fetchTimeline();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError('Failed to import timeline: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const eventTypes = [
    'Initial Contact',
    'Proposal Sent',
    'Meeting Scheduled',
    'Meeting Completed',
    'Follow-up',
    'Contract Sent',
    'Contract Signed',
    'Project Started',
    'Milestone Reached',
    'Project Completed',
    'Other',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800">Client Timeline</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="px-5 py-2.5 bg-white border-2 border-purple-200 text-purple-600 font-bold hover:bg-purple-50 rounded-xl transition-all"
          >
            {showRoadmap ? 'List View' : 'Roadmap View'}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-5 py-2.5 bg-white border-2 border-purple-200 text-purple-600 font-bold hover:bg-purple-50 rounded-xl transition-all"
          >
            Import from Notion
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 rounded-xl transition-all"
          >
            + Add Event
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {showRoadmap && timeline.length > 0 ? (
        <RoadmapView timeline={timeline} projectInfo={projectInfo} />
      ) : timeline.length === 0 ? (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-12 text-center hover:border-purple-300 hover:shadow-xl transition-all">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-black text-gray-800 mb-2">No timeline events yet</h3>
          <p className="text-gray-600 font-semibold mb-6">Start tracking your client journey by adding the first event or importing from Notion</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 font-bold hover:bg-purple-50 rounded-xl transition-all"
            >
              Import from Notion
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 rounded-xl transition-all"
            >
              Add First Event
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div
              key={event.id}
              className="bg-white border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-xl transition-all relative"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 border-2 border-purple-200 rounded-full">
                          {event.event_type}
                        </span>
                        <span className="text-sm text-gray-600 font-semibold">{formatDate(event.event_date)}</span>
                      </div>
                      <h3 className="text-lg font-black text-gray-800">{event.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-bold"
                    >
                      Delete
                    </button>
                  </div>
                  {event.description && (
                    <p className="text-gray-700 font-semibold mb-3 whitespace-pre-wrap">{event.description}</p>
                  )}
                  {event.next_steps && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="text-sm font-black text-purple-600 mb-2">Next Steps:</div>
                      <p className="text-sm text-gray-700 font-semibold whitespace-pre-wrap">{event.next_steps}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-purple-200">
              <h3 className="text-xl font-black text-gray-800">Add Timeline Event</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
                  required
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Next Steps</label>
                <textarea
                  value={formData.next_steps}
                  onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300"
                  placeholder="What are the next steps after this event?"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-purple-600 bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import from Notion Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-purple-200">
              <h3 className="text-xl font-black text-gray-800">Import Timeline with AI</h3>
              <p className="text-sm text-gray-600 font-semibold mt-2">Paste any timeline text - AI will intelligently parse it and create a roadmap. Works with Notion exports, sprint tables, milestone lists, or free-form text.</p>
            </div>
            <div className="p-6 space-y-5">
              {importing && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-purple-600 font-bold">Parsing timeline with AI...</p>
                  <p className="text-gray-600 font-semibold text-sm mt-2">This may take a few moments</p>
                </div>
              )}
              {!importing && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-purple-600 mb-2">Timeline Text *</label>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      rows="15"
                      disabled={importing}
                      className="w-full px-4 py-2.5 bg-purple-50 border-2 border-purple-200 text-gray-800 font-semibold rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Paste any timeline text here - sprint tables, milestone lists, or free-form text. AI will intelligently parse it and create your roadmap..."
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText('');
                    setError('');
                  }}
                  className="px-6 py-2.5 text-sm font-bold text-purple-600 bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || !importText.trim()}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 disabled:opacity-50 transition-all"
                >
                  {importing ? 'Importing...' : 'Import Timeline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Roadmap View Component
function RoadmapView({ timeline, projectInfo }) {
  // Filter milestones and sort by date
  const milestones = timeline
    .filter(event => event.event_type === 'Milestone Reached')
    .map(event => {
      // Parse milestone data from description
      const description = event.description || '';
      const startMatch = description.match(/Start:\s*([^\n]+)/);
      const endMatch = description.match(/End:\s*([^\n]+)/);
      const effortMatch = description.match(/Effort:\s*([^\n]+)/);
      const milestoneMatch = event.next_steps?.match(/Milestone\s*#(\d+)/);
      
      return {
        ...event,
        start_date: startMatch ? new Date(startMatch[1].trim()).toISOString() : null,
        end_date: endMatch ? new Date(endMatch[1].trim()).toISOString() : null,
        effort: effortMatch ? effortMatch[1].trim() : null,
        milestone_number: milestoneMatch ? milestoneMatch[1] : null
      };
    })
    .sort((a, b) => new Date(a.start_date || a.event_date) - new Date(b.start_date || b.event_date));

  // Get date range
  const dates = milestones
    .map(m => m.start_date ? new Date(m.start_date) : new Date(m.event_date))
    .filter(d => !isNaN(d.getTime()));
  
  const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
  
  // If we have end dates, use those for max
  const endDates = milestones
    .map(m => m.end_date ? new Date(m.end_date) : null)
    .filter(d => d && !isNaN(d.getTime()));
  
  if (endDates.length > 0) {
    maxDate.setTime(Math.max(maxDate.getTime(), ...endDates.map(d => d.getTime())));
  }

  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  const daysRange = totalDays || 1;

  const getDatePosition = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 0;
    const daysDiff = Math.ceil((date - minDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, (daysDiff / daysRange) * 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-xl transition-all">
      {projectInfo && (
        <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
          <h3 className="text-lg font-black text-gray-800 mb-3">Project Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {projectInfo.duration && (
              <div>
                <span className="text-purple-600 font-bold">Duration:</span>
                <span className="text-gray-700 font-semibold ml-2">{projectInfo.duration}</span>
              </div>
            )}
            {projectInfo.startDate && (
              <div>
                <span className="text-purple-600 font-bold">Start:</span>
                <span className="text-gray-700 font-semibold ml-2">{formatDate(projectInfo.startDate)}</span>
              </div>
            )}
            {projectInfo.endDate && (
              <div>
                <span className="text-purple-600 font-bold">End:</span>
                <span className="text-gray-700 font-semibold ml-2">{formatDate(projectInfo.endDate)}</span>
              </div>
            )}
            {projectInfo.engagement && (
              <div>
                <span className="text-purple-600 font-bold">Engagement:</span>
                <span className="text-gray-700 font-semibold ml-2">{projectInfo.engagement}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Timeline axis */}
        <div className="relative h-2 bg-purple-100 rounded-full mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          {milestones.map((milestone, index) => {
            const position = getDatePosition(milestone.start_date || milestone.event_date);
            return (
              <div
                key={milestone.id}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white shadow-lg"></div>
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 font-semibold">
                  {formatDate(milestone.start_date || milestone.event_date)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone cards */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const startPos = getDatePosition(milestone.start_date || milestone.event_date);
            const endPos = milestone.end_date ? getDatePosition(milestone.end_date) : startPos;
            const width = Math.max(5, Math.abs(endPos - startPos));
            const left = Math.min(startPos, endPos);

            return (
              <div
                key={milestone.id}
                className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-black">
                      {milestone.milestone_number || index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-800">{milestone.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 font-semibold">
                        {milestone.start_date && (
                          <span>Start: {formatDate(milestone.start_date)}</span>
                        )}
                        {milestone.end_date && (
                          <>
                            <span>•</span>
                            <span>End: {formatDate(milestone.end_date)}</span>
                          </>
                        )}
                        {milestone.effort && (
                          <>
                            <span>•</span>
                            <span>Effort: {milestone.effort}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {milestone.description && (
                  <p className="text-gray-700 font-semibold mb-3 whitespace-pre-wrap">{milestone.description}</p>
                )}

                {/* Visual timeline bar */}
                <div className="relative h-3 bg-purple-100 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ClientTimelineView;
