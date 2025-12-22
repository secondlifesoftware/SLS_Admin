const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
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

