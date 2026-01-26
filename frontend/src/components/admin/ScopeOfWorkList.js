import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scopeOfWorkAPI, clientAPI } from '../../services/api';
import { auth } from '../../firebase';

function ScopeOfWorkList() {
  const navigate = useNavigate();
  const [scopes, setScopes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [currentVersionIndex, setCurrentVersionIndex] = useState({}); // Track current version for each group
  const [animatingCards, setAnimatingCards] = useState({}); // Track animation state

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus && filterStatus.trim() !== '') {
        params.status = filterStatus;
      }
      const [scopesData, clientsData] = await Promise.all([
        scopeOfWorkAPI.getAll(params),
        clientAPI.getAll(),
      ]);
      
      setScopes(scopesData);
      const clientMap = {};
      clientsData.forEach(client => {
        clientMap[client.id] = client;
      });
      setClients(clientMap);
      setError('');
    } catch (err) {
      setError('Failed to load SOWs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredScopes = scopes.filter((scope) => {
    const matchesSearch = 
      scope.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (clients[scope.client_id] && 
        `${clients[scope.client_id].first_name} ${clients[scope.client_id].last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Group SOWs by client_id + title for version display
  const groupedScopes = filteredScopes.reduce((groups, scope) => {
    const key = `${scope.client_id}-${scope.title}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(scope);
    return groups;
  }, {});

  // Create display array with version info
  const displayScopes = Object.values(groupedScopes).map(group => {
    const sorted = group.sort((a, b) => {
      const versionA = parseFloat(a.version) || 1;
      const versionB = parseFloat(b.version) || 1;
      return versionB - versionA; // Latest version first
    });
    return {
      latest: sorted[0],
      versions: sorted,
      hasMultipleVersions: sorted.length > 1
    };
  });

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-100 text-gray-600 border-gray-300',
      Sent: 'bg-purple-100 text-purple-700 border-purple-300 shadow-sm shadow-purple-500/20',
      Approved: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/20',
      Rejected: 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm shadow-rose-500/20',
      'In Progress': 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm shadow-amber-500/20',
      Completed: 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm shadow-blue-500/20',
    };
    return (
      <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${badges[status] || badges.Draft}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusCounts = () => {
    const counts = {
      Draft: 0,
      Sent: 0,
      Approved: 0,
      Rejected: 0,
      'In Progress': 0,
      Completed: 0,
      Total: scopes.length,
    };
    scopes.forEach(scope => {
      if (counts.hasOwnProperty(scope.status)) {
        counts[scope.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const handleStatClick = (status) => {
    if (filterStatus === status) {
      setFilterStatus('');
    } else {
      setFilterStatus(status);
    }
  };

  const handleExportPDF = async (scopeId, title) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:8000'}/api/scope-of-work/${scopeId}/generate-pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOW_${title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
    }
  };

  const handleRegenerate = async (scopeId) => {
    if (!window.confirm('Regenerate this entire SOW using AI? This will replace all sections. Continue?')) {
      return;
    }
    try {
      setLoading(true);
      const userEmail = auth?.currentUser?.email || null;
      const result = await scopeOfWorkAPI.regenerateFull(scopeId, userEmail);
      if (result.sections) {
        navigate(`/admin/scope/${scopeId}/edit`, { 
          state: { 
            regeneratedSections: result.sections,
            suggestions: result.suggestions || []
          } 
        });
      }
    } catch (err) {
      setError('Failed to regenerate SOW: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scopeId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        await scopeOfWorkAPI.delete(scopeId);
        fetchData();
      } catch (err) {
        setError('Failed to delete SOW: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Scope of Work</h1>
            <p className="text-gray-600 font-medium mt-1">Manage and generate statements of work</p>
          </div>
          <button
            onClick={() => navigate('/admin/scope/create')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Generate New SOW
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6 shadow-sm">
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <button
          onClick={() => handleStatClick('')}
          className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-xl transition-all duration-200 ${
            filterStatus === '' ? 'border-purple-400 shadow-2xl shadow-purple-500/30 scale-105' : 'border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="text-2xl font-black text-gray-800">{statusCounts.Total}</div>
          <div className="text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-1">Total SOWs</div>
        </button>
        <button
          onClick={() => handleStatClick('Draft')}
          className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-xl transition-all duration-200 ${
            filterStatus === 'Draft' ? 'border-gray-400 shadow-2xl shadow-gray-500/30 scale-105' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-2xl font-black text-gray-600">{statusCounts.Draft}</div>
          <div className="text-xs font-bold text-gray-600 mt-1">Draft</div>
        </button>
        <button
          onClick={() => handleStatClick('Sent')}
          className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-xl transition-all duration-200 ${
            filterStatus === 'Sent' ? 'border-purple-400 shadow-2xl shadow-purple-500/30 scale-105' : 'border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="text-2xl font-black text-purple-600">{statusCounts.Sent}</div>
          <div className="text-xs font-bold text-purple-600 mt-1">Sent</div>
        </button>
        <button
          onClick={() => handleStatClick('Approved')}
          className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-xl transition-all duration-200 ${
            filterStatus === 'Approved' ? 'border-emerald-400 shadow-2xl shadow-emerald-500/30 scale-105' : 'border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-2xl font-black text-emerald-600">{statusCounts.Approved}</div>
          <div className="text-xs font-bold text-emerald-600 mt-1">Approved</div>
        </button>
        <button
          onClick={() => handleStatClick('In Progress')}
          className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-xl transition-all duration-200 ${
            filterStatus === 'In Progress' ? 'border-amber-400 shadow-2xl shadow-amber-500/30 scale-105' : 'border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-2xl font-black text-amber-600">{statusCounts['In Progress']}</div>
          <div className="text-xs font-bold text-amber-600 mt-1">In Progress</div>
        </button>
        <button
          onClick={() => handleStatClick('Completed')}
          className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-xl transition-all duration-200 ${
            filterStatus === 'Completed' ? 'border-blue-400 shadow-2xl shadow-blue-500/30 scale-105' : 'border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="text-2xl font-black text-blue-600">{statusCounts.Completed}</div>
          <div className="text-xs font-bold text-blue-600 mt-1">Completed</div>
        </button>
        <button
          onClick={() => handleStatClick('Rejected')}
          className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-xl transition-all duration-200 ${
            filterStatus === 'Rejected' ? 'border-rose-400 shadow-2xl shadow-rose-500/30 scale-105' : 'border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-2xl font-black text-rose-600">{statusCounts.Rejected}</div>
          <div className="text-xs font-bold text-rose-600 mt-1">Rejected</div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-purple-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search by title or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-purple-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 font-medium rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <div className="flex items-center gap-1 bg-white border-2 border-purple-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm rounded-lg font-bold transition-all ${
                viewMode === 'cards' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <span className="mr-1">📋</span> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm rounded-lg font-bold transition-all ${
                viewMode === 'table' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
              }`}
            >
              <span className="mr-1">📊</span> Table
            </button>
          </div>
        </div>
      </div>

      {/* SOW List - Group by client+title for versions */}
      {filteredScopes.length === 0 ? (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-bold text-white mb-2">
            {searchTerm || filterStatus ? 'No SOWs found' : 'No Scope of Work documents'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by generating your first SOW'}
          </p>
          {!searchTerm && !filterStatus && (
            <button
              onClick={() => navigate('/admin/scope/create')}
              className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all border border-cyan-400/50"
            >
              Generate New SOW
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayScopes.map((scopeGroup, groupIndex) => {
            const groupKey = `${scopeGroup.latest.client_id}-${scopeGroup.latest.title}`;
            const currentIndex = currentVersionIndex[groupKey] || 0;
            const scope = scopeGroup.versions[currentIndex];
            const client = clients[scope.client_id];
            const isAnimating = animatingCards[groupKey];

            const handlePrevious = (e) => {
              e.stopPropagation();
              if (currentIndex < scopeGroup.versions.length - 1) {
                setAnimatingCards({ ...animatingCards, [groupKey]: 'left' });
                setTimeout(() => {
                  setCurrentVersionIndex({ ...currentVersionIndex, [groupKey]: currentIndex + 1 });
                  setTimeout(() => setAnimatingCards({ ...animatingCards, [groupKey]: null }), 50);
                }, 200);
              }
            };

            const handleNext = (e) => {
              e.stopPropagation();
              if (currentIndex > 0) {
                setAnimatingCards({ ...animatingCards, [groupKey]: 'right' });
                setTimeout(() => {
                  setCurrentVersionIndex({ ...currentVersionIndex, [groupKey]: currentIndex - 1 });
                  setTimeout(() => setAnimatingCards({ ...animatingCards, [groupKey]: null }), 50);
                }, 200);
              }
            };

            return (
              <div
                key={groupKey}
                className="relative"
                style={{ marginBottom: scopeGroup.hasMultipleVersions ? '20px' : '0' }}
              >
                {/* Stacked versions visual effect */}
                {scopeGroup.hasMultipleVersions && (
                  <>
                    <div className="absolute top-2 left-2 right-2 h-full bg-purple-50 border-2 border-purple-100 rounded-2xl z-0" />
                    <div className="absolute top-4 left-4 right-4 h-full bg-purple-100 border-2 border-purple-100 rounded-2xl z-0" />
                  </>
                )}
                <div
                  className={`relative bg-white border-2 border-purple-200 rounded-2xl hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-200 z-10 ${
                    scopeGroup.hasMultipleVersions ? 'px-12 py-6' : 'p-6'
                  } ${
                    isAnimating === 'left' ? 'animate-slide-out-left' : isAnimating === 'right' ? 'animate-slide-out-right' : 'animate-slide-in'
                  }`}
                >
                {/* Navigation Arrows for Multiple Versions */}
                {scopeGroup.hasMultipleVersions && (
                  <>
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex >= scopeGroup.versions.length - 1}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-100 border-2 border-purple-200 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-200 hover:border-purple-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-20"
                      title="Previous version"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex <= 0}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-100 border-2 border-purple-200 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-200 hover:border-purple-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-20"
                      title="Next version"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-bold text-gray-800 mb-1 truncate cursor-help relative group"
                      title={scope.title}
                    >
                      <span className="truncate block">{scope.title}</span>
                      {/* Tooltip on hover */}
                      <span className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap max-w-xs border border-gray-600">
                        {scope.title}
                        <span className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></span>
                      </span>
                    </h3>
                    {client && (
                      <p className="text-sm text-gray-600 truncate" title={`${client.first_name} ${client.last_name}${client.company ? ` • ${client.company}` : ''}`}>
                        {client.first_name} {client.last_name}
                        {client.company && ` • ${client.company}`}
                      </p>
                    )}
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(scope.status)}
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📅</span>
                    <span className="font-semibold text-purple-600">v{scope.version}</span>
                    {scopeGroup.hasMultipleVersions && (
                      <span className="text-gray-500">of {scopeGroup.versions.length}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>🕒</span>
                    <span>Created: {new Date(scope.created_at).toLocaleDateString()} at {new Date(scope.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {scope.start_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>📆</span>
                      <span>{formatDate(scope.start_date)} → {formatDate(scope.end_date)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-purple-100">
                  <button
                    onClick={() => navigate(`/admin/scope/${scope.id}/edit`)}
                    className="flex-1 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-100 border-2 border-purple-200 rounded-xl hover:bg-purple-200 hover:shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleRegenerate(scope.id)}
                    className="flex-1 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-100 border-2 border-purple-200 rounded-xl hover:bg-purple-200 hover:shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <span>🤖</span>
                    <span>AI</span>
                  </button>
                  <button
                    onClick={() => handleExportPDF(scope.id, scope.title)}
                    className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-100 border-2 border-emerald-200 rounded-xl hover:bg-emerald-200 hover:shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <span>📄</span>
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleDelete(scope.id, scope.title)}
                    className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-100 border-2 border-rose-200 rounded-xl hover:bg-rose-200 hover:shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-purple-200 rounded-2xl overflow-x-auto shadow-lg">
          <table className="w-full divide-y-2 divide-purple-100">
            <thead className="bg-gradient-to-r from-purple-500 to-pink-500">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px]">Title</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[120px]">Client</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[60px]">Version</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[80px]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">End Date</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider min-w-[400px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-purple-100">
              {filteredScopes.map((scope) => {
                const client = clients[scope.client_id];
                return (
                  <tr key={scope.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-gray-800 max-w-[200px] truncate" title={scope.title}>
                        {scope.title}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        {client ? `${client.first_name} ${client.last_name}` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">v{scope.version}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(scope.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{formatDate(scope.start_date)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{formatDate(scope.end_date)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/admin/scope/${scope.id}/edit`)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-purple-600 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerate(scope.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors whitespace-nowrap"
                        >
                          🤖 Regenerate
                        </button>
                        <button
                          onClick={() => handleExportPDF(scope.id, scope.title)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors whitespace-nowrap"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={() => handleDelete(scope.id, scope.title)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ScopeOfWorkList;
