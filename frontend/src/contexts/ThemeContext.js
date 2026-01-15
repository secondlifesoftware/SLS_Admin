import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { profileAPI } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set initial theme class and data attribute
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Load theme preference from user profile
    const loadTheme = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          try {
            const profile = await profileAPI.getByFirebaseUID(user.uid);
            if (profile.theme_preference) {
              setTheme(profile.theme_preference);
              document.documentElement.classList.remove('light', 'dark');
              document.documentElement.classList.add(profile.theme_preference);
              document.documentElement.setAttribute('data-theme', profile.theme_preference);
            }
          } catch (err) {
            // Profile not found or error, use default dark
            console.log('Could not load theme preference:', err);
            setTheme('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } else {
          setTheme('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch (err) {
        console.error('Error loading theme:', err);
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async (newTheme) => {
    // Use functional update to ensure we have the latest theme value
    setTheme((currentTheme) => {
      const themeToSet = newTheme || (currentTheme === 'dark' ? 'light' : 'dark');
      
      // Update HTML class and data attribute immediately
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(themeToSet);
      document.documentElement.setAttribute('data-theme', themeToSet);
      
      // Save to user profile asynchronously
      (async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            try {
              const profile = await profileAPI.getByFirebaseUID(user.uid);
              await profileAPI.update(profile.id, { theme_preference: themeToSet });
            } catch (err) {
              // Try to create profile if it doesn't exist
              try {
                await profileAPI.create({
                  firebase_uid: user.uid,
                  email: user.email,
                  theme_preference: themeToSet,
                });
              } catch (createErr) {
                console.error('Error saving theme preference:', createErr);
              }
            }
          }
        } catch (err) {
          console.error('Error saving theme preference:', err);
        }
      })();
      
      return themeToSet;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

