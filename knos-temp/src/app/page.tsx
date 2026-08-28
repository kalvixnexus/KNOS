'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [apiKeys, setApiKeys] = useState<{ id: number; key: string; name: string; createdAt: string }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');

  // Mock function to generate a new key
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const generatedKey = 'knos_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const newKey = {
      id: Date.now(),
      name: newKeyName,
      key: generatedKey,
      createdAt: new Date().toLocaleDateString(),
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
  };

  const deleteKey = (id: number) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold">API Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your API keys and access.</p>
        </header>

        {/* Generate Key Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate New API Key</h2>
          <form onSubmit={handleGenerateKey} className="flex gap-4">
            <input
              type="text"
              placeholder="Key Name (e.g., My Website)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Generate Key
            </button>
          </form>
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your API Keys</h2>
            <p className="text-sm text-gray-500 mt-1">Do not share your API keys in publicly accessible areas.</p>
          </div>
          
          {apiKeys.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No API keys generated yet. Create one above.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                  <th className="px-6 py-3 font-medium text-gray-600">Name</th>
                  <th className="px-6 py-3 font-medium text-gray-600">API Key</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Created</th>
                  <th className="px-6 py-3 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((keyObj) => (
                  <tr key={keyObj.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{keyObj.name}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                      {keyObj.key}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{keyObj.createdAt}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteKey(keyObj.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Developer Instructions */}
        <div className="mt-10 p-6 bg-blue-50 text-blue-900 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-lg mb-2">How to use your API</h3>
          <p className="text-sm mb-4">Other websites can access your data by making a GET request to your API endpoint with the API key in the Authorization header.</p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
            <code>
              fetch('http://localhost:3000/api/data', {'{\n'}
              {'  '}headers: {'{\n'}
              {'    '}'Authorization': 'Bearer YOUR_API_KEY'\n
              {'  '}{'}\n'}
              {'}'})
            </code>
          </div>
        </div>

      </div>
    </div>
  );
}
