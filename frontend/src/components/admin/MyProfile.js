import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';

function MyProfile({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    role: 'Administrator',
    company: 'Second Life Software',
    bio: '',
  });
  const [originalData, setOriginalData] = useState(null);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        let profile;
        // Try to get by Firebase UID first
        try {
          profile = await profileAPI.getByFirebaseUID(user.uid);
        } catch (err) {
          // If not found by UID, try by email
          try {
            profile = await profileAPI.getByEmail(user.email);
          } catch (err2) {
            // Profile doesn't exist yet, use defaults
            profile = null;
          }
        }

        if (profile) {
          setFormData({
            name: profile.name || '',
            email: profile.email || user.email,
            phone: profile.phone || '',
            role: profile.role || 'Administrator',
            company: profile.company || 'Second Life Software',
            bio: profile.bio || '',
          });
          setOriginalData(profile);
        } else {
          // Set defaults based on email
          const defaults = getDefaultsForEmail(user.email);
          setFormData(defaults);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Get default values based on email
  const getDefaultsForEmail = (email) => {
    const defaults = {
      dks1018: {
        name: 'Darius Smith',
        phone: '7706963187',
        bio: 'Founder and CEO of Second Life Software. Passionate about building innovative software solutions that transform businesses. With expertise in full-stack development and strategic planning, I lead our team in delivering exceptional results for clients.',
      },
      darius: {
        name: 'Darius Smith',
        phone: '470-630-6086',
        bio: 'Co-founder and Technical Lead at Second Life Software. Specializing in enterprise software architecture and development. Dedicated to creating scalable solutions that drive business growth and operational efficiency.',
      },
      info: {
        name: 'Customer Service',
        phone: '470-630-6086',
        bio: 'Customer Service team at Second Life Software. We are here to assist you with any questions, support requests, or inquiries about our services. Our goal is to provide exceptional customer experience and ensure your satisfaction.',
      },
      katia: {
        name: 'Katerina Smith',
        phone: '9704811365',
        bio: 'Operations Manager at Second Life Software. Focused on streamlining business processes, managing client relationships, and ensuring smooth project delivery. Committed to excellence in every aspect of our operations.',
      },
    };

    const emailKey = email.toLowerCase().split('@')[0];
    const match = Object.keys(defaults).find((key) => emailKey.includes(key));

    return {
      name: match ? defaults[match].name : '',
      email: email,
      phone: match ? defaults[match].phone : '',
      role: 'Administrator',
      company: 'Second Life Software',
      bio: match ? defaults[match].bio : '',
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let updatedProfile;

      if (originalData) {
        // Update existing profile
        if (originalData.firebase_uid) {
          updatedProfile = await profileAPI.updateByFirebaseUID(
            originalData.firebase_uid,
            {
              name: formData.name,
              phone: formData.phone,
              company: formData.company,
              bio: formData.bio,
              role: formData.role,
            }
          );
        } else {
          updatedProfile = await profileAPI.update(originalData.id, {
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            bio: formData.bio,
            role: formData.role,
          });
        }
      } else {
        // Create new profile
        updatedProfile = await profileAPI.create({
          firebase_uid: user.uid,
          email: user.email,
          name: formData.name,
          phone: formData.phone,
          company: formData.company,
          bio: formData.bio,
          role: formData.role,
        });
      }

      setOriginalData(updatedProfile);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData({
        name: originalData.name || '',
        email: originalData.email || user.email,
        phone: originalData.phone || '',
        role: originalData.role || 'Administrator',
        company: originalData.company || 'Second Life Software',
        bio: originalData.bio || '',
      });
    }
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const handleChangePassword = async () => {
    if (!auth || !user?.email) {
      setMessage({ type: 'error', text: 'Unable to send password reset email.' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage({ type: 'success', text: 'Password reset email sent! Please check your inbox.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account settings and personal information</p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          className={`mb-6 rounded-xl p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-4xl text-white font-semibold">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{formData.name || 'User'}</h2>
              <p className="text-sm text-gray-600">{formData.role}</p>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {originalData?.created_at
                    ? new Date(originalData.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <p className="text-gray-900">{formData.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.phone || 'Not set'}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.company || 'Not set'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">
                    {formData.bio || 'No bio provided'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Security</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">Password</div>
                  <div className="text-sm text-gray-600">Change your account password</div>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
