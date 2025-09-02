import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [health, setHealth] = useState<string>('');

  useEffect(() => {
    axios.get('/api/health')
      .then(response => setHealth(response.data.status))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">
          CroMetrics Internal Tool
        </h1>
        <p className="mt-4 text-gray-600">
          API Status: {health || 'Checking...'}
        </p>
      </div>
    </div>
  );
}

export default App;