import React, { useState, useEffect, useRef } from 'react';

const BookCallModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0); // 0 = disclaimer, 1 = basic info, 2 = project details, 3 = review (non-AI), 4 = review (post-AI submission)
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null); // Store submitted data for AI review
  const [showAISummary, setShowAISummary] = useState(false); // Show AI summary editor
  const [editingAISummary, setEditingAISummary] = useState(''); // Editable AI summary
  const [isEditingSummary, setIsEditingSummary] = useState(false); // Track if editing summary
  const [savingSummary, setSavingSummary] = useState(false); // Saving edited summary
  const progressIntervalRef = useRef(null); // Ref to store the progress interval
  const [showCalendarBooking, setShowCalendarBooking] = useState(false); // Show calendar booking step
  const [calendarEventCreated, setCalendarEventCreated] = useState(false); // Track if calendar event was created
  const [selectedDateTime, setSelectedDateTime] = useState(''); // Selected date/time for booking
  const [creatingEvent, setCreatingEvent] = useState(false); // Loading state for creating event
  const [hasUpcomingBooking, setHasUpcomingBooking] = useState(false); // Check if user already has a booking
  const [upcomingBookings, setUpcomingBookings] = useState([]); // List of upcoming bookings
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_type: '', // founder, employee, business_representative, other
    
    // Step 2: Project Details
    project_description: '',
    timeline: '',
    start_date: '',
    end_date: '',
    budget: '',
    urgency: 5,
    use_ai_summarization: false, // Opt-in for AI summarization
  });

  // CAPTCHA
  const [captchaQuestion, setCaptchaQuestion] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});

  // Generate CAPTCHA question
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    setCaptchaQuestion({ num1, num2, answer });
    setCaptchaAnswer('');
    setCaptchaError('');
  };

  // Initialize CAPTCHA when reaching review step
  useEffect(() => {
    if (isOpen && step === 3) {
      generateCaptcha();
    }
  }, [isOpen, step]);

  // Reset loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Reset loading states
      setLoading(false);
      setLoadingProgress(0);
      setError('');
      setShowCalendarBooking(false);
      setCalendarEventCreated(false);
      setSelectedDateTime('');
    }
  }, [isOpen]);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation (US format: (123) 456-7890 or 123-456-7890 or 1234567890)
  const validatePhone = (phone) => {
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    const digitsOnly = phone.replace(/\D/g, '');
    return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const formatPhoneNumber = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData({ ...formData, [name]: formatted });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const validateStep1 = () => {
    const errors = {};
    
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.role_type) {
      errors.role_type = 'Please select your role';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    if (!formData.project_description.trim()) {
      errors.project_description = 'Project description is required';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Estimated start date is required';
    }
    
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      errors.budget = 'Budget is required and must be greater than 0';
    }
    
    if (formData.urgency < 0 || formData.urgency > 10) {
      errors.urgency = 'Urgency must be between 0 and 10';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        // If AI summarization is enabled, submit immediately
        if (formData.use_ai_summarization) {
          // Set loading state before submitting
          setLoading(true);
          setLoadingProgress(0);
          await handleSubmit(null, true); // true = skip CAPTCHA for AI path
        } else {
          // Non-AI path: go to review step
          setStep(3);
        }
      }
    }
  };

  const handleClose = () => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    // Reset form when closing
    setStep(0);
    setLoading(false);
    setLoadingProgress(0);
    setError('');
    setSuccess(false);
    setSubmittedData(null);
    setShowAISummary(false);
    setEditingAISummary('');
    setIsEditingSummary(false);
    setSavingSummary(false);
    setCaptchaQuestion(null);
    setCaptchaAnswer('');
    setCaptchaError('');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role_type: '',
      project_description: '',
      timeline: '',
      start_date: '',
      end_date: '',
      budget: '',
      urgency: 5,
      use_ai_summarization: false,
    });
    onClose();
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
      setCaptchaError('');
    }
  };

  const handleSubmit = async (e, skipCaptcha = false) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate CAPTCHA (only for non-AI path)
    if (!skipCaptcha) {
      if (!captchaQuestion) {
        setCaptchaError('Please complete the CAPTCHA');
        return;
      }
      
      const userAnswer = parseInt(captchaAnswer);
      if (userAnswer !== captchaQuestion.answer) {
        setCaptchaError('Incorrect answer. Please try again.');
        generateCaptcha();
        return;
      }
    }

    // Clear any existing interval before starting a new one
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setLoading(true);
    setLoadingProgress(0);
    setError('');
    setCaptchaError('');

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      // Simulate progress
      progressIntervalRef.current = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      
      const response = await fetch(`${API_BASE_URL}/api/clients/book-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Clear interval and reset ref
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setLoadingProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit booking request');
      }

      // If AI path, show review page with submitted data
      if (skipCaptcha && formData.use_ai_summarization) {
        // Clear interval for AI path
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        // Store submitted data with AI summary
        setSubmittedData({ 
          ...formData, 
          ...data,
          ai_summarized_description: data.ai_summarized_description || formData.project_description,
          original_description: data.original_description || formData.project_description
        });
        setEditingAISummary(data.ai_summarized_description || formData.project_description);
        setStep(4); // Go to post-AI review step
        setLoading(false);
        setLoadingProgress(0);
        
        // Check for existing bookings
        if (data.client_id) {
          setTimeout(() => checkUpcomingBookings(data.client_id), 1000);
        }
      } else {
        // Non-AI path: show success message (no auto-close)
        setSuccess(true);
        setLoading(false);
        setLoadingProgress(0);
        
        // Check for existing bookings
        if (data.client_id) {
          setTimeout(() => checkUpcomingBookings(data.client_id), 1000);
        }
      }
    } catch (err) {
      // Clear interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setError(err.message || 'Failed to submit booking request. Please try again.');
      setLoadingProgress(0);
      setLoading(false);
    }
  };

  const getRoleTypeLabel = (role) => {
    const labels = {
      founder: 'Founder',
      employee: 'Employee',
      business_representative: 'Acting on behalf of a business',
      other: 'Other'
    };
    return labels[role] || role;
  };

  // Handle calendar event creation
  const handleCreateCalendarEvent = async (eventStart, eventEnd) => {
    if (!submittedData && !formData.email) {
      setError('Please complete the booking form first');
      return;
    }

    const clientData = submittedData || formData;
    const clientId = submittedData?.client_id;

    if (!clientId) {
      setError('Client ID not found. Please submit the booking form first.');
      return;
    }

    setCreatingEvent(true);
    setError('');

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/create-calendar-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          event_start: eventStart,
          event_end: eventEnd,
          client_name: `${clientData.first_name} ${clientData.last_name}`,
          client_email: clientData.email,
          client_phone: clientData.phone,
          project_description: clientData.ai_summarized_description || clientData.project_description || 'No description provided',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create calendar event');
      }

      setCalendarEventCreated(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to create calendar event. Please try again.');
    } finally {
      setCreatingEvent(false);
    }
  };

  // Check for upcoming bookings
  const checkUpcomingBookings = async (clientId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/upcoming-bookings`);
      if (response.ok) {
        const data = await response.json();
        setHasUpcomingBooking(data.has_upcoming_bookings);
        setUpcomingBookings(data.upcoming_events || []);
      }
    } catch (err) {
      console.error('Error checking upcoming bookings:', err);
    }
  };

  // Handle "Book a Call" button click - opens Google Calendar booking
  const handleBookCallClick = () => {
    // Warn if they already have a booking
    if (hasUpcomingBooking && upcomingBookings.length > 0) {
      const confirmMessage = `You already have ${upcomingBookings.length} upcoming booking(s). Are you sure you want to book another appointment?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }
    
    const calendarUrl = process.env.REACT_APP_GOOGLE_CALENDAR_BOOKING_URL || 'https://calendar.google.com/calendar/appointments/schedules';
    // Open in popup window (easier to close than new tab)
    const bookingWindow = window.open(
      calendarUrl, 
      'google-calendar-booking', 
      'width=900,height=700,scrollbars=yes,resizable=yes'
    );
    setShowCalendarBooking(true);
    
    // Check if window was closed (user might have closed it after booking)
    const checkWindow = setInterval(() => {
      if (bookingWindow && bookingWindow.closed) {
        clearInterval(checkWindow);
        // User closed the booking window - refresh booking status after a delay
        const clientId = submittedData?.client_id;
        if (clientId) {
          setTimeout(() => checkUpcomingBookings(clientId), 2000); // Wait 2 seconds for sync
        }
      }
    }, 1000);
    
    // Clean up interval after 10 minutes
    setTimeout(() => {
      clearInterval(checkWindow);
    }, 600000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            {step === 0 && 'Important Information'}
            {step === 1 && 'Your Information'}
            {step === 2 && 'Project Details'}
            {step === 3 && 'Review & Submit'}
            {step === 4 && 'Submission Complete'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Loading Bar */}
        {loading && (
          <div className="sticky top-[73px] bg-white border-b border-gray-200 px-6 py-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">Submitting your request... {loadingProgress}%</p>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6">
          {success && !submittedData ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600 mb-4">
                  Your booking request has been submitted successfully. We'll review your information and get back to you soon.
                </p>
                <p className="text-sm text-gray-500">
                  Your information has been saved to our system and a client profile has been created.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submitted Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium text-gray-900">{formData.first_name} {formData.last_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium text-gray-900">{formData.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium text-gray-900">{formData.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Role:</span>
                      <p className="font-medium text-gray-900">{getRoleTypeLabel(formData.role_type)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-medium text-gray-900">{new Date(formData.start_date).toLocaleDateString()}</p>
                    </div>
                    {formData.end_date && (
                      <div>
                        <span className="text-gray-600">End Date:</span>
                        <p className="font-medium text-gray-900">{new Date(formData.end_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <p className="font-medium text-gray-900">${parseFloat(formData.budget).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Urgency:</span>
                      <p className="font-medium text-gray-900">{formData.urgency}/10</p>
                    </div>
                  </div>
                  {formData.timeline && (
                    <div>
                      <span className="text-gray-600">Timeline:</span>
                      <p className="font-medium text-gray-900">{formData.timeline}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Project Description:</span>
                    <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{formData.project_description}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Step 0: Disclaimer */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Welcome to Second Life Software
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Thank you so much for your interest in booking a call with us. Before proceeding, please review the following information to ensure we're a good fit:
                    </p>
                    
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>We are <strong>not</strong> currently looking to sponsor, co-found, or be co-founders of new ventures.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>We do <strong>not</strong> accept pay-for-equity arrangements or equity-based compensation.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>Our minimum project budget is <strong>$5,000</strong>. We may consider smaller projects if they can be completed within 4 weeks and are paid in full upfront.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>Please only schedule a call if you intend to attend and are serious about working with us.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>Please do <strong>not</strong> submit fake information or use this form to test automations.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold">•</span>
                        <p>We are <strong>not</strong> currently hiring. Please do not submit a form if you are looking for employment opportunities.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Privacy Notice:</strong> By proceeding, you acknowledge that the information you provide will be stored in our database and a client profile will be created in our admin system. This helps us better serve you and manage our relationship.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Basic Information */}
              {step === 1 && (
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                          validationErrors.first_name
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {validationErrors.first_name && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.first_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                          validationErrors.last_name
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {validationErrors.last_name && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                        validationErrors.email
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(123) 456-7890"
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                        validationErrors.phone
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      required
                    />
                    {validationErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      I am a... <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role_type"
                      value={formData.role_type}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white ${
                        validationErrors.role_type
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      required
                    >
                      <option value="">Select your role</option>
                      <option value="founder">Founder</option>
                      <option value="employee">Employee</option>
                      <option value="business_representative">Acting on behalf of a business</option>
                      <option value="other">Other</option>
                    </select>
                    {validationErrors.role_type && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.role_type}</p>
                    )}
                  </div>
                </form>
              )}

              {/* Step 2: Project Details */}
              {step === 2 && (
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="project_description"
                      value={formData.project_description}
                      onChange={handleInputChange}
                      rows="6"
                      placeholder="Describe your project idea in detail. You can be as detailed or simple as you'd like."
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                        validationErrors.project_description
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      required
                    />
                    {validationErrors.project_description && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.project_description}</p>
                    )}
                  </div>

                  {/* AI Summarization Checkbox */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="use_ai_summarization"
                        checked={formData.use_ai_summarization}
                        onChange={handleInputChange}
                        className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Use AI to summarize and enhance my project description
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          If checked, your request will be submitted immediately after clicking "Next" and AI will create a detailed, professional summary. You'll be able to review what was submitted after processing. If unchecked, you'll review your information before submitting.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeline
                    </label>
                    <input
                      type="text"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      placeholder="e.g., 3 months, 6 weeks, ASAP"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                          validationErrors.start_date
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {validationErrors.start_date && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors.start_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estimated End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Budget ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="5000.00"
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                        validationErrors.budget
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      required
                    />
                    {validationErrors.budget && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.budget}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgency Level (0-10) <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        name="urgency"
                        min="0"
                        max="10"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 - Not Urgent</span>
                        <span className="font-semibold text-gray-700">Current: {formData.urgency}</span>
                        <span>10 - Very Urgent</span>
                      </div>
                    </div>
                    {validationErrors.urgency && (
                      <p className="text-xs text-red-600 mt-1">{validationErrors.urgency}</p>
                    )}
                  </div>
                </form>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <p className="font-medium text-gray-900">{formData.first_name} {formData.last_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium text-gray-900">{formData.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium text-gray-900">{formData.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Role:</span>
                          <p className="font-medium text-gray-900">{getRoleTypeLabel(formData.role_type)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <p className="font-medium text-gray-900">{new Date(formData.start_date).toLocaleDateString()}</p>
                        </div>
                        {formData.end_date && (
                          <div>
                            <span className="text-gray-600">End Date:</span>
                            <p className="font-medium text-gray-900">{new Date(formData.end_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Budget:</span>
                          <p className="font-medium text-gray-900">${parseFloat(formData.budget).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Urgency:</span>
                          <p className="font-medium text-gray-900">{formData.urgency}/10</p>
                        </div>
                      </div>
                      {formData.timeline && (
                        <div>
                          <span className="text-gray-600">Timeline:</span>
                          <p className="font-medium text-gray-900">{formData.timeline}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Project Description:</span>
                        <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">{formData.project_description}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">AI Summarization:</span>
                        <p className="font-medium text-gray-900">{formData.use_ai_summarization ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* CAPTCHA */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Verification <span className="text-red-500">*</span>
                    </label>
                    {captchaQuestion && (
                      <div className="flex items-center gap-3">
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-lg font-semibold">
                          {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                        </div>
                        <input
                          type="number"
                          value={captchaAnswer}
                          onChange={(e) => {
                            setCaptchaAnswer(e.target.value);
                            setCaptchaError('');
                          }}
                          placeholder="Answer"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={generateCaptcha}
                          className="text-xs text-gray-600 hover:text-gray-900 underline"
                        >
                          New question
                        </button>
                      </div>
                    )}
                    {captchaError && (
                      <p className="text-xs text-red-600 mt-2">{captchaError}</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Post-AI Submission Review */}
              {step === 4 && submittedData && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Successfully Submitted!</h3>
                        <p className="text-sm text-gray-600">Your booking request has been submitted and processed with AI.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Submitted Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <p className="font-medium text-gray-900">{submittedData.first_name} {submittedData.last_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium text-gray-900">{submittedData.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium text-gray-900">{submittedData.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Role:</span>
                          <p className="font-medium text-gray-900">{getRoleTypeLabel(submittedData.role_type)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <p className="font-medium text-gray-900">{new Date(submittedData.start_date).toLocaleDateString()}</p>
                        </div>
                        {submittedData.end_date && (
                          <div>
                            <span className="text-gray-600">End Date:</span>
                            <p className="font-medium text-gray-900">{new Date(submittedData.end_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Budget:</span>
                          <p className="font-medium text-gray-900">${parseFloat(submittedData.budget).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Urgency:</span>
                          <p className="font-medium text-gray-900">{submittedData.urgency}/10</p>
                        </div>
                      </div>
                      {submittedData.timeline && (
                        <div>
                          <span className="text-gray-600">Timeline:</span>
                          <p className="font-medium text-gray-900">{submittedData.timeline}</p>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Project Description:</span>
                          {submittedData.ai_summarized_description && (
                            <button
                              type="button"
                              onClick={() => setShowAISummary(!showAISummary)}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              {showAISummary ? 'Hide AI Summary' : 'See AI Summary'}
                            </button>
                          )}
                        </div>
                        {showAISummary && submittedData.ai_summarized_description ? (
                          <div className="space-y-3">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-purple-900">AI-Enhanced Description</span>
                                {!isEditingSummary && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Initialize editing with current AI summary
                                      setEditingAISummary(submittedData.ai_summarized_description);
                                      setIsEditingSummary(true);
                                    }}
                                    className="text-xs text-purple-600 hover:text-purple-700 underline"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                              {isEditingSummary ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingAISummary}
                                    onChange={(e) => setEditingAISummary(e.target.value)}
                                    rows="8"
                                    className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setSavingSummary(true);
                                        try {
                                          const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                                          const response = await fetch(`${API_BASE_URL}/api/clients/${submittedData.client_id}/description`, {
                                            method: 'PATCH',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ description: editingAISummary }),
                                          });
                                          
                                          if (!response.ok) {
                                            throw new Error('Failed to update description');
                                          }
                                          
                                          // Update submittedData with new description
                                          setSubmittedData({
                                            ...submittedData,
                                            ai_summarized_description: editingAISummary
                                          });
                                          setIsEditingSummary(false);
                                          setError('');
                                        } catch (err) {
                                          setError('Failed to save changes: ' + err.message);
                                        } finally {
                                          setSavingSummary(false);
                                        }
                                      }}
                                      disabled={savingSummary}
                                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                      {savingSummary ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingAISummary(submittedData.ai_summarized_description);
                                        setIsEditingSummary(false);
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{submittedData.ai_summarized_description}</p>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              <p><strong>Original:</strong> {submittedData.original_description}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="font-medium text-gray-900 mt-1 whitespace-pre-wrap">
                            {submittedData.ai_summarized_description || submittedData.project_description}
                          </p>
                        )}
                      </div>
                      {submittedData.ai_summarized_description && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <span className="text-gray-600">AI Processing:</span>
                          <p className="font-medium text-purple-900 mt-1">✓ Your project description has been processed and enhanced by AI</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Next Steps:</strong> We'll review your information and get back to you soon. Your client profile has been created in our system.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && step !== 4 && !loading && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 0 ? handleClose : handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              {step === 0 ? 'Cancel' : '← Back'}
            </button>
            
            <div className="flex gap-2">
              {step < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : step === 0 ? 'I Agree, Continue' : 'Next →'}
                </button>
              )}
              {step === 3 && (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer for Step 4 (Post-AI Review) */}
        {step === 4 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            {hasUpcomingBooking && upcomingBookings.length > 0 && (
              <div className="text-xs text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                You have {upcomingBookings.length} upcoming booking(s)
              </div>
            )}
            <button
              type="button"
              onClick={handleBookCallClick}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
            >
              {hasUpcomingBooking ? 'Book Another Call' : 'Book a Call'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}

        {/* Footer for Success (Non-AI path) */}
        {success && !submittedData && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBookCallClick}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
            >
              Book a Call
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}

        {/* Calendar Booking Step - Shows after clicking "Book a Call" */}
        {showCalendarBooking && (step === 4 || success) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Book Your Call</h2>
                  <button
                    type="button"
                    onClick={() => setShowCalendarBooking(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {!calendarEventCreated ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 font-semibold mb-2">
                        ⚠️ Important: Please book only ONE appointment
                      </p>
                      <p className="text-sm text-yellow-800">
                        After you complete your booking, <strong>please close the Google Calendar booking window</strong> to prevent accidentally booking multiple appointments.
                      </p>
                    </div>
                    <p className="text-gray-700">
                      Click the button below to open our Google Calendar booking page. Select your preferred time slot, and we'll automatically add your information to the meeting.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Note:</strong> After booking on Google Calendar, your meeting will include:
                      </p>
                      <ul className="text-sm text-blue-800 mt-2 list-disc list-inside space-y-1">
                        <li>Your project description</li>
                        <li>Your contact information</li>
                        <li>Katia and Darius as attendees</li>
                        <li>Google Meet link for the call</li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={handleBookCallClick}
                      className="block w-full px-6 py-3 text-center text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors font-medium"
                    >
                      Open Google Calendar Booking Page
                    </button>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        <strong>After booking:</strong> Once you've selected your time and confirmed the booking, <strong>close the Google Calendar popup window</strong> and return here. This prevents accidentally booking multiple appointments.
                      </p>
                    </div>
                    {hasUpcomingBooking && upcomingBookings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> You already have {upcomingBookings.length} upcoming booking(s). Please only book additional appointments if necessary.
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCalendarBooking(false)}
                      className="block w-full px-6 py-3 text-center text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-900 font-semibold">✓ Calendar event created successfully!</p>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-yellow-900">Important Information</h3>
                      
                      <div className="space-y-4 text-sm text-yellow-800">
                        <div>
                          <p className="mb-2">
                            <strong>Please set a reminder for this call.</strong> These calls are free, and we value both your time and ours. 
                            We do not want you to miss this appointment as it takes up valuable space on our calendar. 
                            Please make sure to set a reminder so you don't forget.
                          </p>
                        </div>
                        
                        <div>
                          <p>
                            <strong>Meeting attendees:</strong> Please expect <strong>Katia</strong> and <strong>Darius</strong> to be present 
                            to talk through your project idea. We will also have an AI notetaker running during the call for recap purposes.
                          </p>
                        </div>
                        
                        <div>
                          <p>
                            <strong>No-show policy:</strong> If we do not see you show up within the first 5 minutes of the scheduled time, 
                            we will email, text, and call you to check if you're still able to join.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Note:</strong> To close this window, please click the "Done" button below or click the "×" button in the top right corner. 
                        Do not navigate away without closing this window.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <strong>Next steps:</strong> You should receive a calendar invitation via email shortly. 
                        The meeting will include a Google Meet link for the video call.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCalendarBooking(false);
                          setCalendarEventCreated(false);
                        }}
                        className="flex-1 px-6 py-3 text-center text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCallModal;
