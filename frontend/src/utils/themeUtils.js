/**
 * Theme utility functions for consistent theming across the app
 */

export const getThemeClasses = (theme) => {
  const isLight = theme === 'light';
  
  return {
    // Backgrounds
    bgPrimary: isLight ? 'bg-white' : 'bg-[#0a0a0a]',
    bgSecondary: isLight ? 'bg-gray-50' : 'bg-[#1f1f1f]',
    bgTertiary: isLight ? 'bg-gray-100' : 'bg-[#252525]',
    
    // Text colors
    textPrimary: isLight ? 'text-gray-900' : 'text-white',
    textSecondary: isLight ? 'text-gray-600' : 'text-gray-300',
    textTertiary: isLight ? 'text-gray-500' : 'text-gray-400',
    
    // Borders
    borderPrimary: isLight ? 'border-gray-200' : 'border-cyan-500/30',
    borderSecondary: isLight ? 'border-gray-300' : 'border-gray-800',
    borderHover: isLight ? 'border-cyan-500/40' : 'border-cyan-500/50',
    
    // Inputs
    inputBg: isLight ? 'bg-white border-gray-300' : 'bg-[#252525] border-gray-800',
    inputText: isLight ? 'text-gray-900' : 'text-white',
    inputPlaceholder: isLight ? 'placeholder-gray-400' : 'placeholder-gray-500',
    
    // Cards
    cardBg: isLight ? 'bg-white border-gray-200' : 'bg-[#1f1f1f] border-cyan-500/30',
    cardHover: isLight ? 'hover:border-cyan-500/40' : 'hover:border-cyan-500/50',
    
    // Buttons
    btnPrimary: isLight 
      ? 'bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-400/50' 
      : 'bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-400/50',
    btnSecondary: isLight
      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
      : 'bg-[#252525] text-gray-300 hover:bg-[#2a2a2a] border-gray-800',
  };
};

