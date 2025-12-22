import React from 'react';

function ScopeOfWorkGenerator() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Scope of Work Generator</h1>
        <p className="text-gray-600">
          Create detailed project scopes and statements of work for your clients
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
        <div className="text-center max-w-md mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📋</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Coming Soon</h2>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            We're developing an intelligent scope of work generator that will streamline your
            project documentation process. This feature will include:
          </p>

          {/* Features List */}
          <div className="text-left space-y-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Smart Templates</div>
                <div className="text-sm text-gray-600">Pre-built templates for common projects</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Section Builder</div>
                <div className="text-sm text-gray-600">Drag-and-drop section organization</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Client Collaboration</div>
                <div className="text-sm text-gray-600">Share and get approvals in real-time</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Version Control</div>
                <div className="text-sm text-gray-600">Track changes and revisions</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-purple-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Export & Signing</div>
                <div className="text-sm text-gray-600">PDF export and e-signature integration</div>
              </div>
            </div>
          </div>

          {/* Notification */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <span className="font-medium">Coming soon!</span> This feature is currently in
              development.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Content Sections */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Scopes</h3>
          <p className="text-sm text-gray-500">No scopes of work yet</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Library</h3>
          <p className="text-sm text-gray-500">Templates will be available here</p>
        </div>
      </div>
    </div>
  );
}

export default ScopeOfWorkGenerator;

