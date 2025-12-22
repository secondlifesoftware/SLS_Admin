import React from 'react';

function InvoiceGenerator() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Invoice Generator</h1>
        <p className="text-gray-600">Create and manage professional invoices for your clients</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
        <div className="text-center max-w-md mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📄</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Coming Soon</h2>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            We're building a powerful invoice generator that will help you create professional
            invoices quickly and efficiently. This feature will include:
          </p>

          {/* Features List */}
          <div className="text-left space-y-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Template Library</div>
                <div className="text-sm text-gray-600">Professional invoice templates</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Client Integration</div>
                <div className="text-sm text-gray-600">Auto-populate from client database</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Payment Tracking</div>
                <div className="text-sm text-gray-600">Track invoice status and payments</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-blue-600 text-xs">✓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Export Options</div>
                <div className="text-sm text-gray-600">PDF, email, and print formats</div>
              </div>
            </div>
          </div>

          {/* Notification */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Stay tuned!</span> We'll notify you when this feature is
              ready.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Content Sections */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Invoices</h3>
          <p className="text-sm text-gray-500">No invoices yet</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Statistics</h3>
          <p className="text-sm text-gray-500">Statistics will appear here</p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceGenerator;

