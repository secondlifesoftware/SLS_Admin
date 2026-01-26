import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../services/api';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useTheme } from '../../contexts/ThemeContext';

function MyProfile({ user }) {
  const { theme, toggleTheme } = useTheme();
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
          // Note: Theme is already loaded by ThemeContext, no need to update here
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
              theme_preference: theme,
            }
          );
        } else {
          updatedProfile = await profileAPI.update(originalData.id, {
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            bio: formData.bio,
            role: formData.role,
            theme_preference: theme,
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
          theme_preference: theme,
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
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">My Profile</h1>
        <p className="text-gray-600 font-medium">Manage your account settings and personal information</p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          className={`mb-6 rounded-xl p-4 border-2 shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}
        >
          <p className="text-sm font-semibold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 hover:border-purple-300 hover:shadow-xl transition-all">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                <span className="text-4xl text-white font-bold">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{formData.name || 'User'}</h2>
              <p className="text-sm text-purple-600 font-bold">{formData.role}</p>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4 pt-6 border-t-2 border-purple-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Member Since</span>
                <span className="text-sm font-bold text-gray-800">
                  {originalData?.created_at
                    ? new Date(originalData.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recently'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Status</span>
                <span className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 border-2 border-emerald-300 rounded-full shadow-sm shadow-emerald-500/20">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 hover:border-purple-300 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Profile Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-50 border-2 border-purple-300 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">{formData.name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Email Address</label>
                <p className="text-gray-800 font-semibold">{formData.email}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-purple-400"
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">{formData.phone || 'Not set'}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Company</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-gray-800 font-semibold">{formData.company || 'Not set'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold text-purple-600 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 text-gray-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-purple-400"
                  />
                ) : (
                  <p className="text-gray-600 whitespace-pre-line font-medium">
                    {formData.bio || 'No bio provided'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t-2 border-purple-100">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-xl hover:bg-gray-200 hover:border-gray-400 transition-all duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings */}
          <div className="mt-6 bg-white border-2 border-purple-200 rounded-2xl p-8 hover:border-purple-300 hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Security & Preferences</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-gray-800">Password</div>
                  <div className="text-sm text-gray-600 font-medium">Change your account password</div>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-50 border-2 border-purple-300 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
                >
                  Reset Password
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="flex justify-between items-center pt-4 border-t-2 border-purple-100">
                <div>
                  <div className="text-sm font-bold text-gray-800">Theme</div>
                  <div className="text-sm text-gray-600 font-medium">Choose between light and dark mode</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm capitalize font-bold ${theme === 'light' ? 'text-purple-600' : 'text-gray-600'}`}>
                    {theme} mode
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleTheme();
                    }}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-md ${
                      theme === 'dark' ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-lg ${
                        theme === 'dark' ? 'translate-x-1' : 'translate-x-9'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
