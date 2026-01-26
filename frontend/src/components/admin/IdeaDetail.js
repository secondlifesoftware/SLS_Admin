import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ClearPathTracker from './ClearPathTracker';

function IdeaDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [totalDebt, setTotalDebt] = useState(() => {
    const saved = localStorage.getItem('clearpath_total_debt');
    return saved ? parseFloat(saved) : 50000;
  });
  const [currentDebt, setCurrentDebt] = useState(() => {
    const saved = localStorage.getItem('clearpath_current_debt');
    return saved ? parseFloat(saved) : 45000;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');

  const ideasData = {
    'prompt-wars': {
      name: 'Prompt Wars',
      description: 'A competitive platform for AI prompt engineering and battles',
      fullDescription: 'Prompt Wars is an innovative platform where developers and AI enthusiasts can compete in prompt engineering challenges. Users can create, share, and battle prompts to see which ones produce the best results. The platform features leaderboards, tournaments, and a community-driven approach to improving AI interactions.',
      status: 'in-progress',
      icon: '⚔️',
      color: 'from-purple-500 to-pink-600',
      features: [
        'Competitive prompt battles',
        'Leaderboards and rankings',
        'Community challenges',
        'Prompt sharing and collaboration',
        'Real-time results comparison'
      ],
      techStack: ['React', 'Node.js', 'OpenAI API', 'MongoDB'],
      progress: 65
    },
    'my-ever-afters': {
      name: 'MyEverAfters',
      description: 'A platform for creating and managing your perfect endings',
      fullDescription: 'MyEverAfters is a unique platform that helps users create, visualize, and track their personal goals and "perfect endings" in life. Whether it\'s career milestones, personal achievements, or life events, users can map out their journey and celebrate their successes along the way.',
      status: 'in-progress',
      icon: '✨',
      color: 'from-blue-500 to-cyan-600',
      features: [
        'Goal visualization',
        'Milestone tracking',
        'Timeline creation',
        'Achievement celebrations',
        'Progress analytics'
      ],
      techStack: ['React', 'Firebase', 'D3.js', 'Tailwind CSS'],
      progress: 45
    },
    'aibuild-me': {
      name: 'AiBuild.me',
      description: 'AI-powered development platform for rapid prototyping',
      fullDescription: 'AiBuild.me is a revolutionary platform that leverages AI to help developers rapidly prototype and build applications. With natural language descriptions, the platform generates code, sets up project structures, and provides intelligent suggestions to accelerate development workflows.',
      status: 'in-progress',
      icon: '🤖',
      color: 'from-green-500 to-emerald-600',
      features: [
        'AI-powered code generation',
        'Natural language to code',
        'Rapid prototyping',
        'Intelligent suggestions',
        'Multi-language support'
      ],
      techStack: ['Python', 'OpenAI', 'FastAPI', 'React', 'Docker'],
      progress: 80
    },
    'aiguard': {
      name: 'AIGuard',
      description: 'Deploy sandbox to AI responses to ensure operations within bounds',
      fullDescription: 'AIGuard is a security-focused platform that provides sandboxing capabilities for AI-generated code and responses. It ensures that AI outputs operate within defined boundaries, preventing malicious code execution and validating AI responses before deployment. Perfect for production AI applications that need safety guarantees.',
      status: 'coming-soon',
      icon: '🛡️',
      color: 'from-orange-500 to-red-600',
      features: [
        'Code sandboxing',
        'Boundary validation',
        'Security scanning',
        'Automated testing',
        'Deployment safety checks'
      ],
      techStack: ['Docker', 'Kubernetes', 'Python', 'React'],
      progress: 0
    },
    'meshchat': {
      name: 'MeshChat',
      description: 'Text locally without WiFi or cell service via mesh networking',
      fullDescription: 'MeshChat enables communication through peer-to-peer mesh networking, allowing users to send messages even when traditional internet connectivity is unavailable. Perfect for events, remote areas, or emergency situations where standard communication methods fail.',
      status: 'coming-soon',
      icon: '📡',
      color: 'from-indigo-500 to-purple-600',
      features: [
        'Mesh networking',
        'Offline messaging',
        'Peer-to-peer communication',
        'End-to-end encryption',
        'WhatsApp-like interface'
      ],
      techStack: ['WebRTC', 'React Native', 'Node.js', 'WebSocket'],
      progress: 0
    },
    'brandsync': {
      name: 'BrandSync',
      description: 'Track and manage brand deals and partnerships',
      fullDescription: 'BrandSync is a comprehensive platform for managing brand partnerships, collaborations, and deals. Track communication, deadlines, deliverables, and payments all in one place. Designed for influencers, creators, and businesses managing multiple brand relationships.',
      status: 'coming-soon',
      icon: '🤝',
      color: 'from-yellow-500 to-orange-600',
      features: [
        'Deal tracking',
        'Partnership management',
        'Payment tracking',
        'Communication logs',
        'Analytics and reporting'
      ],
      techStack: ['React', 'PostgreSQL', 'Stripe API', 'Node.js'],
      progress: 0
    },
    'codemobile': {
      name: 'CodeMobile',
      description: 'Remote plugin to code from your phone',
      fullDescription: 'CodeMobile brings full development capabilities to your mobile device. Write, edit, and deploy code directly from your phone with a powerful mobile IDE. Perfect for quick fixes, code reviews, or coding on the go when you don\'t have access to a computer.',
      status: 'coming-soon',
      icon: '📱',
      color: 'from-teal-500 to-blue-600',
      features: [
        'Mobile IDE',
        'Code editing',
        'Git integration',
        'Terminal access',
        'Multi-language support'
      ],
      techStack: ['React Native', 'Monaco Editor', 'Node.js', 'Git'],
      progress: 0
    },
    'clearpath': {
      name: 'ClearPath',
      description: 'Track and monitor debt as we pay it off',
      fullDescription: 'ClearPath is a debt tracking system to monitor and manage debt payments. Keep track of total debt, payments made, remaining balance, and progress toward becoming debt-free. ClearPath provides a clear visual path to financial freedom.',
      status: 'in-progress',
      icon: '💰',
      color: 'from-red-500 to-orange-600',
      features: [
        'Real-time debt tracking',
        'Payment history',
        'Progress visualization',
        'Debt breakdown',
        'Payment reminders'
      ],
      techStack: ['React', 'LocalStorage', 'Chart.js'],
      progress: 0,
      isDebtTracker: true
    }
  };

  const idea = ideasData[id];

  useEffect(() => {
    if (idea?.isDebtTracker) {
      localStorage.setItem('clearpath_total_debt', totalDebt.toString());
      localStorage.setItem('clearpath_current_debt', currentDebt.toString());
    }
  }, [totalDebt, currentDebt, idea]);

  const amountPaid = totalDebt - currentDebt;
  const progressPercentage = totalDebt > 0 ? ((amountPaid / totalDebt) * 100).toFixed(1) : 0;
  const remainingPercentage = (100 - parseFloat(progressPercentage)).toFixed(1);

  const handleUpdateDebt = () => {
    const newAmount = parseFloat(editAmount);
    if (!isNaN(newAmount) && newAmount >= 0) {
      const difference = currentDebt - newAmount;
      setCurrentDebt(newAmount);
      if (newAmount > totalDebt) {
        setTotalDebt(newAmount);
      }
      setEditAmount('');
      setIsEditing(false);
    }
  };

  const handleAddPayment = (amount) => {
    const newDebt = Math.max(0, currentDebt - amount);
    setCurrentDebt(newDebt);
  };

  if (!idea) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Idea Not Found</h1>
          <button
            onClick={() => navigate('/admin/ideas')}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-xl hover:shadow-purple-500/30"
          >
            Back to Ideas
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    if (status === 'in-progress') {
      return (
        <span className="px-4 py-2 text-sm font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
          🚀 In Progress
        </span>
      );
    }
    return (
      <span className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500/20 text-purple-600 border border-purple-300/30">
        ⏳ Coming Soon
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/ideas')}
        className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <span className="mr-2">←</span>
        Back to Ideas
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${idea.color} flex items-center justify-center text-4xl`}>
              {idea.icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{idea.name}</h1>
              <p className="text-gray-400 text-lg">{idea.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/budget')}
              className="px-6 py-3 bg-white text-purple-600 border border-purple-300/30 rounded-xl font-semibold hover:bg-purple-50 hover:border-purple-300/50 transition-all shadow-lg hover:shadow-purple-500/20"
            >
              💰 Budget
            </button>
            <button
              onClick={() => navigate('/admin/subscriptions')}
              className="px-6 py-3 bg-white text-purple-600 border border-purple-300/30 rounded-xl font-semibold hover:bg-purple-50 hover:border-purple-300/50 transition-all shadow-lg hover:shadow-purple-500/20"
            >
              📱 Subscriptions
            </button>
          </div>
        </div>
      </div>

      {/* ClearPath Debt Tracker */}
      {idea.isDebtTracker && (
        <ClearPathTracker />
      )}

      {/* Old Debt Tracker (keeping for reference, can be removed) */}
      {false && idea.isDebtTracker && (
        <div className="mb-8">
          <div className="bg-gradient-to-br from-red-500/20 to-orange-600/20 border-2 border-red-500/40 rounded-2xl p-8 relative overflow-hidden">
            {/* Decorative Pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
            }}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Debt Tracker</h2>
                  <p className="text-gray-300 text-sm">Current Status</p>
                </div>
                <div className="text-5xl">💰</div>
              </div>

              {/* Debt Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Total Debt</p>
                  <p className="text-2xl font-bold text-white">${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-red-400">${currentDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Paid Off</p>
                  <p className="text-2xl font-bold text-green-400">${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Progress to Debt-Free</span>
                  <span className="text-sm font-semibold text-green-400">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>${amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid</span>
                  <span>${currentDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500/20 text-purple-600 border border-purple-300/30 rounded-lg hover:bg-gradient-to-r from-purple-500 to-pink-500/30 transition-all duration-200 text-sm font-semibold"
                    >
                      ✏️ Update Debt
                    </button>
                    <button
                      onClick={() => handleAddPayment(100)}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200 text-sm font-semibold"
                    >
                      +$100 Payment
                    </button>
                    <button
                      onClick={() => handleAddPayment(500)}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200 text-sm font-semibold"
                    >
                      +$500 Payment
                    </button>
                    <button
                      onClick={() => handleAddPayment(1000)}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all duration-200 text-sm font-semibold"
                    >
                      +$1,000 Payment
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="Enter new debt amount"
                      className="flex-1 px-4 py-2 bg-purple-50 border-2 border-purple-200 rounded-lg text-gray-800 font-semibold placeholder-gray-400 focus:outline-none focus:border-purple-300/50"
                    />
                    <button
                      onClick={handleUpdateDebt}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 text-sm font-semibold"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditAmount('');
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar (if in progress and not debt tracker) */}
      {idea.status === 'in-progress' && idea.progress > 0 && !idea.isDebtTracker && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Progress</span>
            <span className="text-sm font-semibold text-purple-600">{idea.progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${idea.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Coming Soon Badge (if applicable) */}
      {idea.status === 'coming-soon' && (
        <div className="bg-white border border-purple-300/30 rounded-xl p-6 shadow-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-white font-semibold mb-1">Coming Soon</p>
            <p className="text-gray-400 text-sm">This idea is in the planning phase</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default IdeaDetail;

