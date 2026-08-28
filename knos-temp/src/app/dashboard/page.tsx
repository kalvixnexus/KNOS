'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export default function Dashboard() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        fetchKeys(user.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchKeys = async (uid: string) => {
    try {
      const q = query(collection(db, 'api_keys'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const keys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApiKeys(keys);
    } catch (error) {
      console.error("Error fetching keys:", error);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setGenerating(true);
    
    // Generate a secure looking unique key
    const uniquePart = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const generatedKey = `knos_live_${uniquePart.toUpperCase()}`;
    
    const keyName = newKeyName.trim() || `API Key ${apiKeys.length + 1}`;

    try {
      const newKeyData = {
        userId,
        name: keyName,
        key: generatedKey,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'api_keys'), newKeyData);
      setApiKeys([...apiKeys, { id: docRef.id, ...newKeyData }]);
      setNewKeyName('');
    } catch (error) {
      console.error('Error saving key', error);
      alert('Failed to generate key');
    }
    setGenerating(false);
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API Key? Any website using it will lose access immediately.')) return;
    
    try {
      await deleteDoc(doc(db, 'api_keys', id));
      setApiKeys(apiKeys.filter((k) => k.id !== id));
    } catch (error) {
      alert('Error revoking key');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading Dashboard...</div>;

  return (
    <div className="max-w-4xl font-sans">
      
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white uppercase tracking-widest">API Dashboard</h1>
        <p className="text-gray-400 mt-2 text-sm">Manage your API keys and connect your restaurant website to Kalvix Nexus POS.</p>
      </header>

      {/* Generate Key Section */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-white uppercase tracking-widest">Generate New API Key</h2>
        <form onSubmit={handleGenerateKey} className="flex gap-4 items-start sm:items-center flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Key Name (e.g. Main Website)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-black border border-gray-800 rounded-md px-4 py-3 text-white focus:outline-none focus:border-yellow-500 w-full"
          />
          <button
            type="submit"
            disabled={generating}
            className="bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-6 py-3 rounded-md font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all whitespace-nowrap w-full sm:w-auto"
          >
            {generating ? 'Generating...' : 'Generate Auto Key'}
          </button>
        </form>
      </div>

      {/* API Keys List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden mb-10">
        <div className="p-6 border-b border-gray-800 bg-black">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Your API Keys</h2>
          <p className="text-xs text-gray-500 mt-1">Do not share your API keys in publicly accessible areas.</p>
        </div>
        
        {apiKeys.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No API keys generated yet. Create one above to connect your website.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-300">
              <thead className="bg-gray-900 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Key Name</th>
                  <th className="px-6 py-4 font-bold">API Key</th>
                  <th className="px-6 py-4 font-bold">Created</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-black/50">
                {apiKeys.map((keyObj) => (
                  <tr key={keyObj.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{keyObj.name}</td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded inline-block border border-yellow-500/20">
                        {keyObj.key}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(keyObj.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteKey(keyObj.id)}
                        className="text-red-500 hover:text-red-400 font-bold uppercase text-xs bg-red-500/10 px-3 py-1 rounded transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Developer Instructions */}
      <div className="p-6 bg-gray-900 border border-yellow-500/30 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.05)]">
        <h3 className="font-bold text-lg mb-2 text-yellow-500 uppercase tracking-widest">Developer Instructions</h3>
        <p className="text-sm text-gray-400 mb-4">Send orders from your public website to this POS automatically using your unique API Key.</p>
        <div className="bg-black border border-gray-800 p-4 rounded-md font-mono text-xs text-gray-300 overflow-x-auto">
          <code>
            <span className="text-blue-400">POST</span> /api/external/orders<br/><br/>
            Headers: {'{\n'}
            {'  '}"Authorization": "Bearer <span className="text-yellow-500">YOUR_API_KEY</span>",<br/>
            {'  '}"Content-Type": "application/json"<br/>
            {'}\n'}<br/>
            Body: {'{\n'}
            {'  '}"customerName": "Rahul Sharma",<br/>
            {'  '}"totalAmount": 700,<br/>
            {'  '}"items": [...]<br/>
            {'}'}
          </code>
        </div>
      </div>

    </div>
  );
}
