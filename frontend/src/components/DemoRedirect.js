import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DemoRedirect() {
  const navigate = useNavigate();
  const demoUrl = process.env.REACT_APP_DEMO_URL || 'http://localhost:5173';

  useEffect(() => {
    // Redirect to the demo application
    window.location.href = demoUrl;
  }, [demoUrl]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to demo application...</p>
        <p className="text-sm text-gray-500 mt-2">
          If you are not redirected, <a href={demoUrl} className="text-blue-600 hover:underline">click here</a>
        </p>
      </div>
    </div>
  );
}

export default DemoRedirect;

