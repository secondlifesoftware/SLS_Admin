import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Budget() {
  const navigate = useNavigate();
  const [monthlyIncome, setMonthlyIncome] = useState(8500);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Housing', allocated: 2500, percentage: 29.4 },
    { id: 2, name: 'Food & Groceries', allocated: 800, percentage: 9.4 },
    { id: 3, name: 'Transportation', allocated: 600, percentage: 7.1 },
    { id: 4, name: 'Utilities', allocated: 350, percentage: 4.1 },
    { id: 5, name: 'Entertainment', allocated: 300, percentage: 3.5 },
    { id: 6, name: 'Healthcare', allocated: 400, percentage: 4.7 },
    { id: 7, name: 'Savings', allocated: 1500, percentage: 17.6 },
    { id: 8, name: 'Debt Payments', allocated: 2000, percentage: 23.5 },
    { id: 9, name: 'Personal Care', allocated: 200, percentage: 2.4 },
    { id: 10, name: 'Other', allocated: 250, percentage: 2.9 },
  ]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const remaining = monthlyIncome - totalAllocated;

  const handleIncomeChange = (value) => {
    const income = parseFloat(value) || 0;
    setMonthlyIncome(income);
    // Recalculate percentages
    updatePercentages(income);
  };

  const handleAllocationChange = (categoryId, value) => {
    const amount = parseFloat(value) || 0;
    setCategories(cats => 
      cats.map(cat => {
        if (cat.id === categoryId) {
          const newAllocated = Math.min(amount, monthlyIncome);
          const newPercentage = monthlyIncome > 0 ? (newAllocated / monthlyIncome) * 100 : 0;
          return { ...cat, allocated: newAllocated, percentage: newPercentage };
        }
        return cat;
      })
    );
  };

  const handlePercentageChange = (categoryId, value) => {
    const percentage = parseFloat(value) || 0;
    setCategories(cats => 
      cats.map(cat => {
        if (cat.id === categoryId) {
          const allocated = (monthlyIncome * percentage) / 100;
          return { ...cat, allocated, percentage: Math.min(percentage, 100) };
        }
        return cat;
      })
    );
  };

  const updatePercentages = (income) => {
    if (income > 0) {
      setCategories(cats => 
        cats.map(cat => ({
          ...cat,
          percentage: (cat.allocated / income) * 100
        }))
      );
    } else {
      setCategories(cats => 
        cats.map(cat => ({ ...cat, percentage: 0 }))
      );
    }
  };

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newId = Math.max(...categories.map(c => c.id), 0) + 1;
      setCategories([...categories, {
        id: newId,
        name: newCategoryName.trim(),
        allocated: 0,
        percentage: 0
      }]);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const deleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(cats => cats.filter(cat => cat.id !== categoryId));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Budget Planner</h1>
            <p className="text-gray-400 mt-1">Manage your monthly income and expenses</p>
          </div>
          <button
            onClick={() => navigate('/admin/ideas/clearpath')}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span>
            Back to ClearPath
          </button>
        </div>
      </div>

      {/* Monthly Income Input */}
      <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 shadow-lg mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Monthly Income
        </label>
        <div className="flex items-center gap-4">
          <span className="text-2xl">💰</span>
          <input
            type="number"
            value={monthlyIncome || ''}
            onChange={(e) => handleIncomeChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-2xl font-bold text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Total Allocated</p>
          <p className="text-3xl font-bold text-white">
            ${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Remaining</p>
          <p className={`text-3xl font-bold ${remaining >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
            ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#1f1f1f] border border-cyan-500/30 rounded-xl p-6 shadow-lg">
          <p className="text-gray-400 text-sm mb-1">Allocation %</p>
          <p className="text-3xl font-bold text-white">
            {monthlyIncome > 0 ? ((totalAllocated / monthlyIncome) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-[#1f1f1f] border border-gray-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Budget Categories</h2>
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-all text-sm"
          >
            + Add Category
          </button>
        </div>

        {showAddCategory && (
          <div className="mb-4 p-4 bg-[#1a1a1a] border border-cyan-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-all"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {categories.map(category => (
            <div key={category.id} className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                {category.id > 10 && (
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={category.allocated || ''}
                    onChange={(e) => handleAllocationChange(category.id, e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Percentage (%)</label>
                  <input
                    type="number"
                    value={category.percentage.toFixed(1) || ''}
                    onChange={(e) => handlePercentageChange(category.id, e.target.value)}
                    placeholder="0.0"
                    step="0.1"
                    max="100"
                    className="w-full bg-[#252525] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              {category.allocated > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(category.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Budget;

