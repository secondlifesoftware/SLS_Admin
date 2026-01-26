import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function IdeasList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const ideas = [
    {
      id: 'prompt-wars',
      name: 'Prompt Wars',
      description: 'A competitive platform for AI prompt engineering and battles',
      status: 'in-progress',
      icon: '⚔️',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'my-ever-afters',
      name: 'MyEverAfters',
      description: 'A platform for creating and managing your perfect endings',
      status: 'in-progress',
      icon: '✨',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'aibuild-me',
      name: 'AiBuild.me',
      description: 'AI-powered development platform for rapid prototyping',
      status: 'in-progress',
      icon: '🤖',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'aiguard',
      name: 'AIGuard',
      description: 'Deploy sandbox to AI responses to ensure operations within bounds',
      status: 'coming-soon',
      icon: '🛡️',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'meshchat',
      name: 'MeshChat',
      description: 'Text locally without WiFi or cell service via mesh networking',
      status: 'coming-soon',
      icon: '📡',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'brandsync',
      name: 'BrandSync',
      description: 'Track and manage brand deals and partnerships',
      status: 'coming-soon',
      icon: '🤝',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      id: 'codemobile',
      name: 'CodeMobile',
      description: 'Remote plugin to code from your phone',
      status: 'coming-soon',
      icon: '📱',
      color: 'from-teal-500 to-blue-600'
    },
    {
      id: 'clearpath',
      name: 'ClearPath',
      description: 'Track and monitor debt as we pay it off',
      status: 'in-progress',
      icon: '💰',
      color: 'from-red-500 to-orange-600'
    }
  ];

  const filteredIdeas = ideas.filter(idea =>
    idea.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inProgressIdeas = filteredIdeas.filter(idea => idea.status === 'in-progress');
  const comingSoonIdeas = filteredIdeas.filter(idea => idea.status === 'coming-soon');

  const getStatusBadge = (status) => {
    if (status === 'in-progress') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
          In Progress
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border-2 border-purple-300 shadow-sm shadow-purple-500/20">
        Coming Soon
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Ideas</h1>
        <p className="text-gray-600 font-medium">Projects in development and coming soon</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-800 placeholder-purple-400 font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400">🔍</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 border-green-500/30 hover:border-green-500/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium font-medium mb-1">In Progress</p>
              <p className="text-3xl font-bold text-green-400">{inProgressIdeas.length}</p>
            </div>
            <div className="text-4xl">🚀</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 rounded-xl p-6 border-purple-200 hover:border-purple-300 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium font-medium mb-1">Coming Soon</p>
              <p className="text-3xl font-black text-purple-600">{comingSoonIdeas.length}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="space-y-8">
        {/* In Progress Section */}
        {inProgressIdeas.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🚀</span>
              In Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressIdeas.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => navigate(`/admin/ideas/${idea.id}`)}
                  className="bg-white border-2 border-purple-200 rounded-xl p-6 cursor-pointer hover:border-purple-300 hover:bg-purple-50 hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${idea.color} flex items-center justify-center text-2xl`}>
                      {idea.icon}
                    </div>
                    {getStatusBadge(idea.status)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {idea.name}
                  </h3>
                  <p className="text-gray-600 text-sm font-medium mb-4 line-clamp-2">{idea.description}</p>
                  <div className="flex items-center text-purple-600 text-sm font-bold">
                    View Details
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming Soon Section */}
        {comingSoonIdeas.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⏳</span>
              Coming Soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonIdeas.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => navigate(`/admin/ideas/${idea.id}`)}
                  className="bg-white border-2 border-purple-200 rounded-xl p-6 cursor-pointer hover:border-purple-300 hover:bg-purple-50 hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${idea.color} flex items-center justify-center text-2xl`}>
                      {idea.icon}
                    </div>
                    {getStatusBadge(idea.status)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {idea.name}
                  </h3>
                  <p className="text-gray-600 text-sm font-medium mb-4 line-clamp-2">{idea.description}</p>
                  <div className="flex items-center text-purple-600 text-sm font-bold">
                    View Details
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredIdeas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No ideas found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default IdeasList;

