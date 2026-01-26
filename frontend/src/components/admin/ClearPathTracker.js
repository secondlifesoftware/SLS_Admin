import React, { useState, useEffect } from 'react';
import { debtTrackerAPI } from '../../services/api';

function ClearPathTracker() {
  const [summary, setSummary] = useState(null);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [celebrations, setCelebrations] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [highlightedAccount, setHighlightedAccount] = useState(null);
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());
  const [monthlyPaymentModal, setMonthlyPaymentModal] = useState(null); // { owner, selectedMonth, selectedTypes }
  const [visibleTypes, setVisibleTypes] = useState({
    credit_cards: true,
    personal_loans: true,
    car_loans: true,
    mortgages: true,
    student_loans: true,
    tax_debt: true,
    business_debt: true,
    medical: true,
    rent: true,
    other: true
  });

  const [newAccount, setNewAccount] = useState({
    owner: '',
    customOwner: '',
    name: '',
    account_type: 'credit_card',
    institution_name: '',
    original_balance: '',
    current_balance: '',
    interest_rate: '',
    minimum_payment: '',
    payment_terms: '',
    payment_link: '',
    monthly_payment: '',
    due_date: ''
  });

  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_type: 'manual',
    notes: ''
  });


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, accountsData] = await Promise.all([
        debtTrackerAPI.getSummary(),
        debtTrackerAPI.getAccounts()
      ]);
      setSummary(summaryData);
      setAllAccounts(accountsData);
    } catch (err) {
      console.error('Error fetching debt data:', err);
      setError(`Failed to load debt data: ${err.message}. Make sure the backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  // Categorize accounts by type
  const categorizeAccount = (account) => {
    const name = account.name.toLowerCase();
    const type = account.account_type.toLowerCase();
    
    if (type === 'credit_card' || name.includes('card') || name.includes('visa') || name.includes('mastercard') || name.includes('amex') || name.includes('american express')) {
      return 'credit_cards';
    }
    if (type === 'mortgage' || name.includes('mortgage') || name.includes('home loan')) {
      return 'mortgages';
    }
    if (name.includes('student') || name.includes('education') || name.includes('federal student')) {
      return 'student_loans';
    }
    if (name.includes('car') || name.includes('auto') || name.includes('vehicle')) {
      return 'car_loans';
    }
    if (type === 'tax' || name.includes('tax') || name.includes('irs')) {
      return 'tax_debt';
    }
    if (type === 'business' || name.includes('business') || name.includes('sba')) {
      return 'business_debt';
    }
    if (name.includes('medical') || name.includes('hospital')) {
      return 'medical';
    }
    if (type === 'rent' || name.includes('rent') || name.includes('rental') || name.includes('apartment')) {
      return 'rent';
    }
    if (type === 'loan') {
      return 'personal_loans';
    }
    return 'other';
  };

  // Get accounts for current filters
  const getFilteredAccounts = () => {
    let accounts = allAccounts;
    
    // Filter by owner
    if (selectedOwner !== 'all') {
      accounts = accounts.filter(acc => acc.owner === selectedOwner);
    }
    
    // Filter by visible types
    accounts = accounts.filter(acc => {
      const categoryType = categorizeAccount(acc);
      return visibleTypes[categoryType] !== false;
    });
    
    return accounts;
  };

  const accounts = getFilteredAccounts();

  // Calculate summary for selected debt types
  const getSelectedTypesSummary = () => {
    const selectedAccounts = allAccounts.filter(acc => {
      const categoryType = categorizeAccount(acc);
      return visibleTypes[categoryType] !== false;
    });
    
    const total = selectedAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const originalTotal = selectedAccounts.reduce((sum, acc) => sum + (acc.original_balance || acc.current_balance || 0), 0);
    const paidOff = originalTotal - total;
    const progress = originalTotal > 0 ? ((paidOff / originalTotal) * 100).toFixed(1) : 0;
    
    return {
      total,
      count: selectedAccounts.length,
      originalTotal,
      paidOff,
      progress
    };
  };

  // Calculate monthly minimum payments per owner based on selected debt types
  const getMonthlyMinimumPayments = (owner = null, selectedMonth = null, selectedTypes = null) => {
    let accounts = allAccounts.filter(acc => {
      if (acc.is_paid_off) return false;
      
      // Filter by owner if specified
      if (owner && acc.owner !== owner) return false;
      
      // Filter by debt types if specified
      if (selectedTypes) {
        const categoryType = categorizeAccount(acc);
        if (!selectedTypes[categoryType]) return false;
      } else {
        // Use visibleTypes if no specific types selected
        const categoryType = categorizeAccount(acc);
        if (visibleTypes[categoryType] === false) return false;
      }
      
      // Filter by month if specified (check if payment is due in that month)
      if (selectedMonth) {
        if (!acc.due_date) return false;
        const dueDate = new Date(acc.due_date);
        const selectedDate = new Date(selectedMonth);
        // Check if due date is in the selected month
        if (dueDate.getMonth() !== selectedDate.getMonth() || 
            dueDate.getFullYear() !== selectedDate.getFullYear()) {
          return false;
        }
      }
      
      return true;
    });
    
    if (owner) {
      // Return single amount for specific owner
      return accounts.reduce((sum, acc) => {
        const payment = acc.minimum_payment || acc.monthly_payment || 0;
        return sum + payment;
      }, 0);
    }
    
    // Return object with amounts by owner
    const paymentsByOwner = {};
    accounts.forEach(acc => {
      const accOwner = acc.owner;
      if (!paymentsByOwner[accOwner]) {
        paymentsByOwner[accOwner] = 0;
      }
      const payment = acc.minimum_payment || acc.monthly_payment || 0;
      paymentsByOwner[accOwner] += payment;
    });
    
    return paymentsByOwner;
  };

  // Get available months from account due dates
  const getAvailableMonths = () => {
    const months = new Set();
    allAccounts.forEach(acc => {
      if (acc.due_date && !acc.is_paid_off) {
        const dueDate = new Date(acc.due_date);
        const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    return Array.from(months).sort();
  };

  // Check if due date is within 7 days
  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Get accounts with payments due within 7 days
  const getDueSoonAccounts = () => {
    return allAccounts.filter(acc => {
      if (acc.is_paid_off || !acc.due_date) return false;
      if (dismissedNotifications.has(acc.id)) return false;
      return isDueSoon(acc.due_date);
    });
  };

  // Dismiss a notification
  const handleDismissNotification = (accountId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDismissedNotifications(prev => new Set([...prev, accountId]));
  };

  // Handle notification click - navigate to account
  const handleNotificationClick = (account) => {
    // Ensure the debt type is visible
    const categoryType = categorizeAccount(account);
    if (!visibleTypes[categoryType]) {
      setVisibleTypes({...visibleTypes, [categoryType]: true});
    }
    
    // Set owner filter if needed
    if (selectedOwner !== 'all' && selectedOwner !== account.owner) {
      setSelectedOwner('all');
    }
    
    // Highlight the account
    setHighlightedAccount(account.id);
    
    // Scroll to the account after a brief delay to allow state updates
    setTimeout(() => {
      const element = document.getElementById(`account-${account.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Remove highlight after 3 seconds
        setTimeout(() => setHighlightedAccount(null), 3000);
      }
    }, 100);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const ownerName = newAccount.owner === 'custom' ? newAccount.customOwner : newAccount.owner;
      
      if (!ownerName) {
        alert('Please select or enter an owner name');
        return;
      }

      const accountData = {
        ...newAccount,
        owner: ownerName,
        original_balance: parseFloat(newAccount.original_balance),
        current_balance: parseFloat(newAccount.current_balance),
        interest_rate: newAccount.interest_rate ? parseFloat(newAccount.interest_rate) : null,
        minimum_payment: newAccount.minimum_payment ? parseFloat(newAccount.minimum_payment) : null,
        monthly_payment: newAccount.monthly_payment ? parseFloat(newAccount.monthly_payment) : null,
        due_date: newAccount.due_date || null
      };
      delete accountData.customOwner;
      
      await debtTrackerAPI.createAccount(accountData);
      setShowAddModal(false);
      setNewAccount({
        owner: '',
        customOwner: '',
        name: '',
        account_type: 'credit_card',
        institution_name: '',
        original_balance: '',
        current_balance: '',
        interest_rate: '',
        minimum_payment: '',
        payment_terms: '',
        payment_link: '',
        monthly_payment: '',
        due_date: ''
      });
      fetchData();
    } catch (err) {
      alert('Error adding account: ' + err.message);
    }
  };

  const handlePayment = async (accountId, paymentType = null, amount = null) => {
    try {
      // Save current scroll position
      const scrollPosition = window.scrollY;
      
      const payment = {
        payment_amount: amount || parseFloat(paymentData.payment_amount),
        payment_type: paymentType || paymentData.payment_type,
        notes: paymentData.notes || null,
        payment_date: new Date().toISOString()
      };

      await debtTrackerAPI.createPayment(accountId, payment);
      
      const account = allAccounts.find(a => a.id === accountId);
      const newBalance = account.current_balance - payment.payment_amount;
      
      if (newBalance <= 0) {
        triggerCelebration(account.name);
      }

      setShowPaymentModal(null);
      setPaymentData({ payment_amount: '', payment_type: 'manual', notes: '' });
      await fetchData();
      
      // If account is now paid off or no longer due soon, remove from dismissed notifications
      // (so it can reappear if needed in the future)
      const updatedAccount = allAccounts.find(a => a.id === accountId);
      if (updatedAccount && (updatedAccount.is_paid_off || !isDueSoon(updatedAccount.due_date))) {
        setDismissedNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(accountId);
          return newSet;
        });
      }
      
      // Restore scroll position after data refresh
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    }
  };

  const handleMinimumPayment = async (accountId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const account = allAccounts.find(a => a.id === accountId);
    const amount = account.minimum_payment || account.suggested_minimum_payment;
    if (amount) {
      await handlePayment(accountId, 'minimum', amount);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await debtTrackerAPI.deleteAccount(accountId);
        fetchData();
      } catch (err) {
        alert('Error deleting account: ' + err.message);
      }
    }
  };

  const handleAIEstimate = async (accountId) => {
    try {
      setLoadingAI(true);
      await debtTrackerAPI.aiEstimateMinimumPayment(accountId);
      fetchData();
    } catch (err) {
      alert('Error getting AI estimate: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAISuggestions = async () => {
    try {
      setLoadingAI(true);
      const suggestions = await debtTrackerAPI.aiSuggestPaymentStrategy();
      setAiSuggestions(suggestions);
    } catch (err) {
      alert('Error getting AI suggestions: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const triggerCelebration = (accountName) => {
    const celebration = {
      id: Date.now(),
      message: `🎉 ${accountName} is paid off!`,
      type: 'success'
    };
    setCelebrations([...celebrations, celebration]);
    setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== celebration.id));
    }, 5000);
  };

  // Get unique owners for filter tabs
  const defaultOwners = ['Darius', 'Katia'];
  const allOwners = new Set(allAccounts.map(acc => acc.owner));
  const defaultOwnersInAccounts = defaultOwners.filter(owner => allOwners.has(owner));
  const otherOwners = Array.from(allOwners).filter(owner => !defaultOwners.includes(owner));
  const uniqueOwners = ['all', ...defaultOwnersInAccounts, ...otherOwners];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
        <p className="text-gray-400 mt-4">Loading debt tracker...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 max-w-2xl mx-auto">
          <p className="text-red-400 text-lg font-semibold mb-2">Error Loading Data</p>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary && allAccounts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6 max-w-2xl mx-auto">
          <p className="text-gray-300 text-lg mb-4">No debt accounts found</p>
          <p className="text-gray-400 mb-6">Get started by adding your first debt account</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all"
          >
            + Add Debt Account
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = summary?.total_original_debt > 0
    ? ((summary.total_paid_off / summary.total_original_debt) * 100).toFixed(1)
    : 0;

  const selectedTypesSummary = getSelectedTypesSummary();
  const monthlyPayments = getMonthlyMinimumPayments();
  const dueSoonAccounts = getDueSoonAccounts();

  // Large library of positive messages
  const totalDebtMessages = [
    "You've got this! 💪",
    "Every step counts! ✨",
    "Progress is progress! 🎯",
    "You're on the right track! 🚀",
    "Keep moving forward! ⭐",
    "Small steps, big wins! 🌟",
    "You're making it happen! 💫",
    "Stay focused! 🔥",
    "One day at a time! 📅",
    "You're stronger than you think! 💪",
    "Every payment is progress! 💰",
    "You're building your future! 🏗️",
    "Consistency is key! 🔑",
    "You're doing great! 👍",
    "Keep pushing forward! 🚶",
    "Your future self will thank you! 🙏",
    "Progress over perfection! ✨",
    "You're winning! 🏆",
    "Stay the course! 🧭",
    "You're capable of amazing things! 🌈",
    "Every dollar counts! 💵",
    "You're taking control! 🎮",
    "Small wins lead to big victories! 🎯",
    "You're on a journey to freedom! 🗽",
    "Keep your eyes on the prize! 👁️",
    "You're making smart choices! 🧠",
    "Financial freedom is coming! 🕊️",
    "You're building momentum! ⚡",
    "Stay positive and keep going! 😊",
    "You're creating your success story! 📖",
    "Every effort matters! 💪",
    "You're moving in the right direction! ➡️",
    "Keep up the amazing work! 🌟",
    "You're unstoppable! 🚀",
    "Progress feels good! 😌",
    "You're transforming your life! 🦋",
    "Stay committed! 🤝",
    "You're doing better than you think! 💭",
    "Keep climbing! 🧗",
    "You're on fire! 🔥",
    "Every milestone matters! 🎯",
    "You're creating positive change! 🌱",
    "Stay motivated! 🎵",
    "You're proving you can do it! ✅",
    "Keep believing in yourself! 💫",
    "You're making a difference! 🌍",
    "Stay determined! 🎯",
    "You're stronger than debt! 💪",
    "Keep going, you've got this! 🚶",
    "You're writing your success story! ✍️",
    "Stay focused on your goals! 🎯"
  ];

  const paidOffMessages = [
    "Amazing progress! 🎉",
    "You're crushing it! 💪",
    "Keep it up! ✨",
    "So proud of you! 🌟",
    "Incredible work! 🚀",
    "You're unstoppable! ⭐",
    "Fantastic achievement! 💫",
    "Way to go! 🔥",
    "Outstanding effort! 👏",
    "You're a rockstar! 🌟",
    "Phenomenal progress! 🎊",
    "You're doing amazing! 💯",
    "Keep up the momentum! ⚡",
    "You're winning! 🏆",
    "So impressive! 😍",
    "You're on fire! 🔥",
    "Incredible dedication! 💎",
    "You're making history! 📜",
    "Outstanding commitment! 🎖️",
    "You're a champion! 🥇",
    "Fantastic discipline! 🎯",
    "You're inspiring! ✨",
    "Keep celebrating! 🎉",
    "You're unstoppable! 🚀",
    "Amazing determination! 💪",
    "You're a superstar! ⭐",
    "Phenomenal results! 📈",
    "You're doing it! ✅",
    "Keep shining! 💫",
    "You're a winner! 🏅",
    "Outstanding progress! 📊",
    "You're incredible! 🌈",
    "Keep up the great work! 👊",
    "You're making waves! 🌊",
    "Fantastic job! 🎯",
    "You're a legend! 👑",
    "Amazing consistency! 🔄",
    "You're on top! 🏔️",
    "Keep pushing forward! 🚶",
    "You're a force! 💨",
    "Outstanding achievement! 🎖️",
    "You're remarkable! 🌟",
    "Keep being awesome! 😎",
    "You're a hero! 🦸",
    "Amazing transformation! 🦋",
    "You're making it happen! 💫",
    "Keep up the excellence! ⭐",
    "You're a warrior! ⚔️",
    "Outstanding resilience! 💎",
    "You're a success story! 📖"
  ];

  // Get random messages (using a simple hash based on current date to change daily)
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const totalDebtMessage = totalDebtMessages[dayOfYear % totalDebtMessages.length];
  const paidOffMessage = paidOffMessages[dayOfYear % paidOffMessages.length];

  return (
    <div className="space-y-8">
      {/* Payment Due Notifications */}
      {dueSoonAccounts.length > 0 && (
        <div className="space-y-2">
          {dueSoonAccounts.map(account => {
            const dueDate = new Date(account.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return (
              <div
                key={account.id}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 transition-all duration-200 shadow-lg hover:shadow-red-500/20 relative group"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(account)}
                  >
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-gray-800 font-semibold">
                        {account.name} - {account.owner}
                      </p>
                      <p className="text-red-300 text-sm">
                        Payment due in {diffDays === 0 ? 'today' : `${diffDays} day${diffDays > 1 ? 's' : ''}`}
                        {account.minimum_payment && ` • $${account.minimum_payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} minimum`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div 
                      className="text-right cursor-pointer"
                      onClick={() => handleNotificationClick(account)}
                    >
                      <p className="text-gray-800 font-bold">${account.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-red-300 text-xs">Due: {dueDate.toLocaleDateString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDismissNotification(account.id, e)}
                      className="text-gray-600 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-500/30 flex-shrink-0"
                      title="Dismiss notification"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Celebration Notifications */}
      {celebrations.map(celeb => (
        <div
          key={celeb.id}
          className="fixed top-20 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-bounce border-2 border-cyan-500/50"
          style={{
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)'
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">🎉</span>
            <span className="text-lg font-bold">{celeb.message}</span>
          </div>
        </div>
      ))}

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300">
          <p className="text-gray-400 text-sm mb-1">Total Debt</p>
          <p className="text-3xl font-bold text-gray-800 mb-2">${(summary?.total_debt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-cyan-400 font-medium">{totalDebtMessage}</p>
        </div>
        {summary?.debt_by_owner && Object.entries(summary.debt_by_owner).slice(0, 2).map(([owner, debt]) => {
          const monthlyPayment = monthlyPayments[owner] || 0;
          const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
          return (
            <div key={owner} className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300">
              <p className="text-gray-400 text-sm mb-1">{owner}'s Debt</p>
              <p className="text-3xl font-bold text-gray-800 mb-4">${(debt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              {monthlyPayment > 0 && (
                <div 
                  onClick={() => setMonthlyPaymentModal({
                    owner,
                    selectedMonth: new Date().toISOString().slice(0, 7), // Current month in YYYY-MM format
                    selectedTypes: {...visibleTypes}
                  })}
                  className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 mt-3 cursor-pointer hover:bg-purple-100 hover:border-purple-300 transition-all"
                >
                  <p className="text-xs text-gray-400 mb-1">{owner} - {currentMonth}</p>
                  <p className="text-xl font-bold text-cyan-400">${monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
          );
        })}
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300">
          <p className="text-gray-400 text-sm mb-1">Paid Off</p>
          <p className="text-3xl font-bold text-cyan-400 mb-2">${(summary?.total_paid_off || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-cyan-400 font-medium">{paidOffMessage}</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Overall Progress to Debt-Free</span>
          <span className="text-sm font-semibold text-cyan-400">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>${(summary?.total_paid_off || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid</span>
          <span>${(summary?.total_debt || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining</span>
        </div>
      </div>

      {/* Type Visibility Toggles */}
      <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Show/Hide Debt Types</h3>
          <button
            onClick={() => {
              const allVisible = Object.values(visibleTypes).every(v => v);
              setVisibleTypes(Object.fromEntries(
                Object.keys(visibleTypes).map(key => [key, !allVisible])
              ));
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-sm font-semibold"
          >
            {Object.values(visibleTypes).every(v => v) ? 'Hide All' : 'Show All'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
          {[
            { key: 'credit_cards', label: '💳 Credit Cards' },
            { key: 'personal_loans', label: '📋 Personal Loans' },
            { key: 'car_loans', label: '🚗 Car Loans' },
            { key: 'mortgages', label: '🏠 Mortgages' },
            { key: 'student_loans', label: '🎓 Student Loans' },
            { key: 'tax_debt', label: '📊 Tax Debt' },
            { key: 'business_debt', label: '💼 Business' },
            { key: 'medical', label: '🏥 Medical' },
            { key: 'rent', label: '🏘️ Rent' },
            { key: 'other', label: '📦 Other' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setVisibleTypes({...visibleTypes, [key]: !visibleTypes[key]})}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${
                visibleTypes[key]
                  ? 'bg-white text-purple-600 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                  : 'bg-gray-100 text-gray-500 border-2 border-gray-300 opacity-75 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Progress Bar for Selected Types */}
        {selectedTypesSummary.originalTotal > 0 && (
          <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Selected Debt Types Progress</span>
              <span className="text-sm font-semibold text-cyan-400">{selectedTypesSummary.progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${selectedTypesSummary.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>${selectedTypesSummary.paidOff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid</span>
              <span>${selectedTypesSummary.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{selectedTypesSummary.count} accounts selected</p>
          </div>
        )}
      </div>

      {/* Monthly Payment Modal */}
      {monthlyPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">{monthlyPaymentModal.owner}'s Monthly Payment</h3>
              <button
                onClick={() => setMonthlyPaymentModal(null)}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Month Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Month</label>
              <input
                type="month"
                value={monthlyPaymentModal.selectedMonth}
                onChange={(e) => setMonthlyPaymentModal({...monthlyPaymentModal, selectedMonth: e.target.value})}
                className="w-full bg-purple-50 border-2 border-purple-200 rounded-lg px-4 py-2 text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Debt Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Select Debt Types to Include</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'credit_cards', label: '💳 Credit Cards' },
                  { key: 'personal_loans', label: '📋 Personal Loans' },
                  { key: 'car_loans', label: '🚗 Car Loans' },
                  { key: 'mortgages', label: '🏠 Mortgages' },
                  { key: 'student_loans', label: '🎓 Student Loans' },
                  { key: 'tax_debt', label: '📊 Tax Debt' },
                  { key: 'business_debt', label: '💼 Business' },
                  { key: 'medical', label: '🏥 Medical' },
                  { key: 'rent', label: '🏘️ Rent' },
                  { key: 'other', label: '📦 Other' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monthlyPaymentModal.selectedTypes[key] || false}
                      onChange={(e) => setMonthlyPaymentModal({
                        ...monthlyPaymentModal,
                        selectedTypes: {...monthlyPaymentModal.selectedTypes, [key]: e.target.checked}
                      })}
                      className="w-4 h-4 text-purple-600 bg-white border-purple-200 rounded focus:ring-cyan-500"
                    />
                    <span className="text-gray-300 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Calculated Amount */}
            <div className="bg-white border-2 border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">
                Total Minimum Payment for {new Date(monthlyPaymentModal.selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-3xl font-bold text-cyan-400">
                ${getMonthlyMinimumPayments(
                  monthlyPaymentModal.owner,
                  monthlyPaymentModal.selectedMonth + '-01',
                  monthlyPaymentModal.selectedTypes
                ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setMonthlyPaymentModal(null)}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 justify-end">
        <button
          onClick={handleAISuggestions}
          disabled={loadingAI}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-cyan-500/30 rounded-xl font-semibold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-cyan-500/20"
        >
          {loadingAI ? '🤖 AI Thinking...' : '🤖 Get AI Payment Strategy'}
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30"
        >
          + Add Debt Account
        </button>
      </div>

      {/* AI Suggestions Panel */}
      {aiSuggestions && (
        <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🤖</span>
            <span>AI Payment Strategy</span>
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-cyan-400 mb-2">Priority Order:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-300">
                {aiSuggestions.priority_order?.map((account, idx) => (
                  <li key={idx} className="hover:text-cyan-400 transition-colors">{account}</li>
                ))}
              </ol>
            </div>
            {aiSuggestions.reasoning && (
              <div>
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">Reasoning:</h4>
                <p className="text-gray-300">{aiSuggestions.reasoning}</p>
              </div>
            )}
            {aiSuggestions.tips && (
              <div>
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">Tips:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  {aiSuggestions.tips.map((tip, idx) => (
                    <li key={idx} className="hover:text-cyan-400 transition-colors">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => setAiSuggestions(null)}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all"
          >
            Close
          </button>
        </div>
      )}

      {/* Owner Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-700 flex-wrap">
        {uniqueOwners.map(owner => (
          <button
            key={owner}
            onClick={() => setSelectedOwner(owner)}
            className={`px-4 py-2 font-semibold transition-all ${
              selectedOwner === owner
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {owner === 'all' ? 'All Debt' : `${owner}'s Debt`}
          </button>
        ))}
      </div>

      {/* Debt Accounts List */}
      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-purple-200 rounded-xl">
          <p className="text-gray-400 text-lg">No accounts found for this category</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting filters or switch to a different tab</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {accounts.map(account => {
            const categoryType = categorizeAccount(account);
            const categoryIcons = {
              credit_cards: '💳',
              personal_loans: '📋',
              car_loans: '🚗',
              mortgages: '🏠',
              student_loans: '🎓',
              tax_debt: '📊',
              business_debt: '💼',
              medical: '🏥',
              rent: '🏘️',
              other: '📦'
            };
            
            return (
              <div
                id={`account-${account.id}`}
                key={account.id}
                className={`bg-white border-2 border-purple-200 rounded-xl p-6 transition-all duration-300 shadow-lg ${
                  highlightedAccount === account.id
                    ? 'border-red-500/50 bg-red-500/10 shadow-red-500/30 ring-2 ring-red-500/50'
                    : account.is_paid_off
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-700 hover:border-cyan-500/50 hover:shadow-cyan-500/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-2xl">{categoryIcons[categoryType] || '💰'}</span>
                      <h3 className="text-xl font-bold text-white">{account.name}</h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300">
                        {account.owner}
                      </span>
                      {account.is_paid_off && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300">
                          ✓ Paid Off
                        </span>
                      )}
                      {/* Payment Suggestions in Header */}
                      {!account.is_paid_off && (
                        <div className="flex items-center gap-2 ml-4">
                          {account.minimum_payment && (
                            <button
                              type="button"
                              onClick={(e) => handleMinimumPayment(account.id, e)}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-xs font-semibold shadow-md hover:shadow-cyan-500/20 whitespace-nowrap"
                            >
                              Pay Min (${account.minimum_payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </button>
                          )}
                          {account.suggested_minimum_payment && account.suggested_minimum_payment !== account.minimum_payment && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePayment(account.id, 'custom', account.suggested_minimum_payment);
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-xs font-semibold shadow-md hover:shadow-cyan-500/20 whitespace-nowrap"
                            >
                              Pay AI (${account.suggested_minimum_payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </button>
                          )}
                          <button
                            onClick={() => setShowPaymentModal(account.id)}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-xs font-semibold shadow-md hover:shadow-cyan-500/20 whitespace-nowrap"
                          >
                            Custom Payment
                          </button>
                          {!account.minimum_payment && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAIEstimate(account.id);
                              }}
                              disabled={loadingAI}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-xs font-semibold disabled:opacity-50 shadow-md hover:shadow-cyan-500/20 whitespace-nowrap"
                            >
                              {loadingAI ? '🤖...' : '🤖 Estimate'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{account.institution_name} • {account.account_type}</p>
                  </div>
                  <div className="text-right ml-8">
                    <p className="text-2xl font-bold text-white">${account.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-500">of ${account.original_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Account Progress */}
                {!account.is_paid_off && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${((account.original_balance - account.current_balance) / account.original_balance) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {(((account.original_balance - account.current_balance) / account.original_balance) * 100).toFixed(1)}% paid off
                    </p>
                  </div>
                )}

                {/* Account Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  {account.interest_rate && (
                    <div>
                      <p className="text-gray-400">Interest Rate</p>
                      <p className="text-gray-800 font-semibold">{account.interest_rate}% APR</p>
                    </div>
                  )}
                  {account.minimum_payment && (
                    <div>
                      <p className="text-gray-400">Min Payment</p>
                      <p className="text-gray-800 font-semibold">${account.minimum_payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {account.suggested_minimum_payment && (
                    <div>
                      <p className="text-gray-400">AI Suggested</p>
                      <p className="text-cyan-400 font-semibold">${account.suggested_minimum_payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  {account.due_date && (
                    <div>
                      <p className="text-gray-400">Due Date</p>
                      <p className={`font-semibold ${isDueSoon(account.due_date) ? 'text-red-400' : 'text-white'}`}>
                        {new Date(account.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>


                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setEditFormData({
                        name: account.name,
                        current_balance: account.current_balance,
                        interest_rate: account.interest_rate,
                        minimum_payment: account.minimum_payment,
                        monthly_payment: account.monthly_payment,
                        due_date: account.due_date,
                        payment_terms: account.payment_terms,
                        payment_link: account.payment_link
                      });
                      setShowEditModal(account);
                    }}
                    className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 font-bold transition-all text-sm font-semibold shadow-md"
                  >
                    Edit
                  </button>
                  {account.plaid_account_id && (
                    <button
                      onClick={async () => {
                        try {
                          await debtTrackerAPI.syncAccount(account.id);
                          fetchData();
                        } catch (err) {
                          alert('Error syncing: ' + err.message);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-sm font-semibold shadow-md hover:shadow-cyan-500/20"
                    >
                      🔄 Sync from Bank
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="px-4 py-2 bg-white text-red-600 border-2 border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 font-bold transition-all text-sm font-semibold shadow-md"
                  >
                    Delete
                  </button>
                  {account.payment_link && (
                    <a
                      href={account.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all text-sm font-semibold shadow-md hover:shadow-cyan-500/20"
                    >
                      🔗 Payment Link
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Debt Account</h2>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Owner</label>
                <select
                  value={newAccount.owner}
                  onChange={(e) => setNewAccount({...newAccount, owner: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Owner</option>
                  <option value="Darius">Darius</option>
                  <option value="Katia">Katia</option>
                  <option value="custom">Custom Name...</option>
                </select>
                {newAccount.owner === 'custom' && (
                  <input
                    type="text"
                    value={newAccount.customOwner || ''}
                    onChange={(e) => setNewAccount({...newAccount, customOwner: e.target.value})}
                    placeholder="Enter custom owner name"
                    className="w-full mt-2 px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Account Type</label>
                  <select
                    value={newAccount.account_type}
                    onChange={(e) => setNewAccount({...newAccount, account_type: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="credit_card">💳 Credit Card</option>
                    <option value="loan">📋 Personal Loan</option>
                    <option value="mortgage">🏠 Mortgage</option>
                    <option value="student_loan">🎓 Student Loan</option>
                    <option value="tax">📊 Tax Debt</option>
                    <option value="business">💼 Business Debt</option>
                    <option value="medical">🏥 Medical Debt</option>
                    <option value="line_of_credit">📦 Line of Credit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bank/Institution</label>
                <input
                  type="text"
                  value={newAccount.institution_name}
                  onChange={(e) => setNewAccount({...newAccount, institution_name: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Original Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccount.original_balance}
                    onChange={(e) => setNewAccount({...newAccount, original_balance: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccount.current_balance}
                    onChange={(e) => setNewAccount({...newAccount, current_balance: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccount.interest_rate}
                    onChange={(e) => setNewAccount({...newAccount, interest_rate: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Minimum Payment</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccount.minimum_payment}
                    onChange={(e) => setNewAccount({...newAccount, minimum_payment: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Payment</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccount.monthly_payment}
                    onChange={(e) => setNewAccount({...newAccount, monthly_payment: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newAccount.due_date}
                    onChange={(e) => setNewAccount({...newAccount, due_date: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Terms</label>
                <textarea
                  value={newAccount.payment_terms}
                  onChange={(e) => setNewAccount({...newAccount, payment_terms: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Link (URL)</label>
                <input
                  type="url"
                  value={newAccount.payment_link}
                  onChange={(e) => setNewAccount({...newAccount, payment_link: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all transform hover:scale-105"
                >
                  Add Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Record Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.payment_amount}
                  onChange={(e) => setPaymentData({...paymentData, payment_amount: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handlePayment(showPaymentModal)}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all transform hover:scale-105"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(null);
                    setPaymentData({ payment_amount: '', payment_type: 'manual', notes: '' });
                  }}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border-2 border-purple-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Debt Account</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await debtTrackerAPI.updateAccount(showEditModal.id, {
                  name: editFormData.name,
                  current_balance: parseFloat(editFormData.current_balance),
                  interest_rate: editFormData.interest_rate ? parseFloat(editFormData.interest_rate) : null,
                  minimum_payment: editFormData.minimum_payment ? parseFloat(editFormData.minimum_payment) : null,
                  payment_terms: editFormData.payment_terms || null,
                  payment_link: editFormData.payment_link || null,
                  monthly_payment: editFormData.monthly_payment ? parseFloat(editFormData.monthly_payment) : null,
                  due_date: editFormData.due_date || null
                });
                setShowEditModal(null);
                fetchData();
              } catch (err) {
                alert('Error updating account: ' + err.message);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.current_balance}
                    onChange={(e) => setEditFormData({...editFormData, current_balance: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.interest_rate || ''}
                    onChange={(e) => setEditFormData({...editFormData, interest_rate: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Minimum Payment</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.minimum_payment || ''}
                    onChange={(e) => setEditFormData({...editFormData, minimum_payment: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Payment</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.monthly_payment || ''}
                    onChange={(e) => setEditFormData({...editFormData, monthly_payment: e.target.value})}
                    className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editFormData.due_date ? new Date(editFormData.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditFormData({...editFormData, due_date: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Terms</label>
                <textarea
                  value={editFormData.payment_terms || ''}
                  onChange={(e) => setEditFormData({...editFormData, payment_terms: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Link (URL)</label>
                <input
                  type="url"
                  value={editFormData.payment_link || ''}
                  onChange={(e) => setEditFormData({...editFormData, payment_link: e.target.value})}
                  className="w-full px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all transform hover:scale-105"
                >
                  Update Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClearPathTracker;
