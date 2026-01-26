const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const error = await response.json();
      // FastAPI validation errors have a 'detail' field that can be a string or array
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // Validation errors are arrays of objects with 'msg' and 'loc' fields
          errorMessage = error.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
        } else {
          errorMessage = error.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    } catch (e) {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// Profile API
export const profileAPI = {
  // Get profile by Firebase UID
  getByFirebaseUID: async (firebaseUID) => {
    const response = await fetch(`${API_BASE_URL}/api/profiles/firebase/${firebaseUID}`);
    return handleResponse(response);
  },

  // Get profile by email
  getByEmail: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/profiles/email/${email}`);
    return handleResponse(response);
  },

  // Create profile
  create: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/api/profiles/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Update profile by Firebase UID
  updateByFirebaseUID: async (firebaseUID, profileData) => {
    const response = await fetch(`${API_BASE_URL}/api/profiles/firebase/${firebaseUID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Update profile by ID
  update: async (profileId, profileData) => {
    const response = await fetch(`${API_BASE_URL}/api/profiles/${profileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },
};

// Client API
export const clientAPI = {
  // Get all clients
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/clients/${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get client by ID
  getById: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`);
    return handleResponse(response);
  },

  // Create client
  create: async (clientData) => {
    try {
      console.log('Creating client with data:', clientData);
      const response = await fetch(`${API_BASE_URL}/api/clients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      console.log('Response status:', response.status, response.statusText);
      return handleResponse(response);
    } catch (err) {
      console.error('Error in clientAPI.create:', err);
      throw err;
    }
  },

  // Update client
  update: async (clientId, clientData) => {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });
    return handleResponse(response);
  },

  // Delete client
  delete: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Client Contact API
export const clientContactAPI = {
  getByClientId: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-contacts/client/${clientId}`);
    return handleResponse(response);
  },

  create: async (contactData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-contacts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });
    return handleResponse(response);
  },

  update: async (contactId, contactData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });
    return handleResponse(response);
  },

  delete: async (contactId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-contacts/${contactId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Client Note API
export const clientNoteAPI = {
  getByClientId: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-notes/client/${clientId}`);
    return handleResponse(response);
  },

  create: async (noteData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    return handleResponse(response);
  },

  update: async (noteId, noteData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    return handleResponse(response);
  },

  delete: async (noteId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-notes/${noteId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Client Timeline API
export const clientTimelineAPI = {
  getByClientId: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-timeline/client/${clientId}`);
    return handleResponse(response);
  },

  create: async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-timeline/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    return handleResponse(response);
  },

  update: async (eventId, eventData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-timeline/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    return handleResponse(response);
  },

  delete: async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-timeline/${eventId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  parseWithAI: async (text, clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-timeline/parse-timeline-with-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, client_id: clientId }),
    });
    return handleResponse(response);
  },
};

// Contract API
export const contractAPI = {
  getByClientId: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/client/${clientId}`);
    return handleResponse(response);
  },

  getById: async (contractId) => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}`);
    return handleResponse(response);
  },

  create: async (contractData) => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractData),
    });
    return handleResponse(response);
  },

  update: async (contractId, contractData) => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contractData),
    });
    return handleResponse(response);
  },

  delete: async (contractId) => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  createMilestone: async (contractId, milestoneData) => {
    const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/milestones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(milestoneData),
    });
    return handleResponse(response);
  },
};

// Time Entry API
export const timeEntryAPI = {
  getByClientId: async (clientId, invoiced = null) => {
    const params = invoiced !== null ? `?invoiced=${invoiced}` : '';
    const response = await fetch(`${API_BASE_URL}/api/time-entries/client/${clientId}${params}`);
    return handleResponse(response);
  },

  getById: async (entryId) => {
    const response = await fetch(`${API_BASE_URL}/api/time-entries/${entryId}`);
    return handleResponse(response);
  },

  create: async (entryData) => {
    const response = await fetch(`${API_BASE_URL}/api/time-entries/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData),
    });
    return handleResponse(response);
  },

  update: async (entryId, entryData) => {
    const response = await fetch(`${API_BASE_URL}/api/time-entries/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData),
    });
    return handleResponse(response);
  },

  delete: async (entryId) => {
    const response = await fetch(`${API_BASE_URL}/api/time-entries/${entryId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Expense API
export const expenseAPI = {
  getByClientId: async (clientId, invoiceId = null) => {
    const params = invoiceId ? `?client_id=${clientId}&invoice_id=${invoiceId}` : `?client_id=${clientId}`;
    const response = await fetch(`${API_BASE_URL}/api/expenses/${params}`);
    return handleResponse(response);
  },

  getById: async (expenseId) => {
    const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`);
    return handleResponse(response);
  },

  create: async (expenseData) => {
    const response = await fetch(`${API_BASE_URL}/api/expenses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
    return handleResponse(response);
  },

  update: async (expenseId, expenseData) => {
    const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
    return handleResponse(response);
  },

  delete: async (expenseId) => {
    const response = await fetch(`${API_BASE_URL}/api/expenses/${expenseId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Invoice API (updated)
export const invoiceAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/api/invoices/${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getById: async (invoiceId) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`);
    return handleResponse(response);
  },

  generateFromTimeEntries: async (clientId, timeEntryIds = [], expenseIds = [], options = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        time_entry_ids: timeEntryIds,
        expense_ids: expenseIds,
        ...options,
      }),
    });
    return handleResponse(response);
  },

  create: async (invoiceData) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    return handleResponse(response);
  },

  update: async (invoiceId, invoiceData) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });
    return handleResponse(response);
  },

  delete: async (invoiceId) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  finalize: async (invoiceId) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/finalize`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  archive: async (invoiceId) => {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/archive`, {
      method: 'POST',
    });
    return handleResponse(response);
  },
};

// Client Document API
export const clientDocumentAPI = {
  getByClientId: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-documents/client/${clientId}/`);
    return handleResponse(response);
  },

  upload: async (clientId, file, title, description, documentType, uploadedBy) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', clientId);
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('document_type', documentType);
    if (uploadedBy) formData.append('uploaded_by', uploadedBy);

    const response = await fetch(`${API_BASE_URL}/api/client-documents/`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  update: async (documentId, documentData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-documents/${documentId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });
    return handleResponse(response);
  },

  delete: async (documentId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-documents/${documentId}/`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  download: async (documentId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-documents/${documentId}/download`);
    if (!response.ok) {
      throw new Error('Failed to download document');
    }
    const blob = await response.blob();
    return blob;
  },

  getViewUrl: (documentId) => {
    return `${API_BASE_URL}/api/client-documents/${documentId}/view`;
  },
};

// Client Admin Account API
export const clientAdminAccountAPI = {
  getByClientId: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-admin-accounts/client/${clientId}/`);
    return handleResponse(response);
  },

  getById: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-admin-accounts/${accountId}/`);
    return handleResponse(response);
  },

  revealPassword: async (accountId, userPassword) => {
    const response = await fetch(`${API_BASE_URL}/api/client-admin-accounts/${accountId}/reveal-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_password: userPassword }),
    });
    return handleResponse(response);
  },

  create: async (accountData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-admin-accounts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  update: async (accountId, accountData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-admin-accounts/${accountId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  delete: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-admin-accounts/${accountId}/`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Client Tech Stack API
export const clientTechStackAPI = {
  getByClientId: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-tech-stack/client/${clientId}/`);
    return handleResponse(response);
  },

  create: async (techData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-tech-stack/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(techData),
    });
    return handleResponse(response);
  },

  update: async (techId, techData) => {
    const response = await fetch(`${API_BASE_URL}/api/client-tech-stack/${techId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(techData),
    });
    return handleResponse(response);
  },

  delete: async (techId) => {
    const response = await fetch(`${API_BASE_URL}/api/client-tech-stack/${techId}/`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// Scope of Work API
export const scopeOfWorkAPI = {
  getAll: async (params = {}) => {
    // Filter out undefined, null, and empty string values
    const cleanParams = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = value;
      }
    });
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = `${API_BASE_URL}/api/scope-of-work/${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getById: async (scopeId) => {
    const response = await fetch(`${API_BASE_URL}/api/scope-of-work/${scopeId}`);
    return handleResponse(response);
  },

  create: async (scopeData) => {
    const response = await fetch(`${API_BASE_URL}/api/scope-of-work/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scopeData),
    });
    return handleResponse(response);
  },

  update: async (scopeId, scopeData) => {
    const response = await fetch(`${API_BASE_URL}/api/scope-of-work/${scopeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scopeData),
    });
    return handleResponse(response);
  },

  delete: async (scopeId) => {
    const response = await fetch(`${API_BASE_URL}/api/scope-of-work/${scopeId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/api/scope-of-work/templates/sections`);
    return handleResponse(response);
  },

  generateWithAI: async (requestData, userEmail = null) => {
    const url = userEmail 
      ? `${API_BASE_URL}/api/scope-of-work/ai/generate-sow?user_email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/api/scope-of-work/ai/generate-sow`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  getRateLimitStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/api/scope-of-work/ai/rate-limit-status`);
    return handleResponse(response);
  },

  regenerateSection: async (scopeId, sectionTitle, userEmail = null) => {
    const url = userEmail 
      ? `${API_BASE_URL}/api/scope-of-work/ai/regenerate-section?user_email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/api/scope-of-work/ai/regenerate-section`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope_id: scopeId,
        section_title: sectionTitle,
      }),
    });
    return handleResponse(response);
  },

  regenerateFull: async (scopeId, userEmail = null) => {
    const url = userEmail 
      ? `${API_BASE_URL}/api/scope-of-work/${scopeId}/ai/regenerate-full?user_email=${encodeURIComponent(userEmail)}`
      : `${API_BASE_URL}/api/scope-of-work/${scopeId}/ai/regenerate-full`;
    const response = await fetch(url, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  previewPDF: async (previewData) => {
    const response = await fetch(`${API_BASE_URL}/api/scope-of-work/preview-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(previewData),
    });
    // Return blob URL for PDF preview
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    throw new Error('Failed to generate PDF preview');
  },
};

// Debt Tracker API
export const debtTrackerAPI = {
  // Create Plaid Link token
  createLinkToken: async (userId = null) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/link-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  // Exchange public token for access token
  exchangePublicToken: async (publicToken, institutionId, institutionName) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/exchange-public-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_token: publicToken,
        institution_id: institutionId,
        institution_name: institutionName,
      }),
    });
    return handleResponse(response);
  },

  // Get all debt accounts
  getAccounts: async (owner = null, accountType = null, includePaidOff = false) => {
    const params = new URLSearchParams();
    if (owner) params.append('owner', owner);
    if (accountType) params.append('account_type', accountType);
    if (includePaidOff) params.append('include_paid_off', 'true');
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/debt-tracker/accounts${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Get debt account by ID
  getAccount: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/accounts/${accountId}`);
    return handleResponse(response);
  },

  // Create manual debt account
  createAccount: async (accountData) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  // Update debt account
  updateAccount: async (accountId, accountData) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/accounts/${accountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    return handleResponse(response);
  },

  // Delete debt account
  deleteAccount: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/accounts/${accountId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Sync account balance from Plaid
  syncAccount: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/accounts/${accountId}/sync`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // Get debt summary
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/summary`);
    return handleResponse(response);
  },

  // Create payment
  createPayment: async (accountId, paymentData) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/accounts/${accountId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Get account payments
  getAccountPayments: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/accounts/${accountId}/payments`);
    return handleResponse(response);
  },

  // AI suggest payment strategy
  aiSuggestPaymentStrategy: async () => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/ai/suggest-payment-strategy`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // AI estimate minimum payment
  aiEstimateMinimumPayment: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/debt-tracker/ai/estimate-minimum-payment/${accountId}`, {
      method: 'POST',
    });
    return handleResponse(response);
  },
};

