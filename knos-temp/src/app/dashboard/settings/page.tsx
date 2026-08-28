'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    restaurantName: '',
    invoicePrefix: 'INV'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setSettings({
              restaurantName: data.restaurantName || '',
              invoicePrefix: data.invoicePrefix || 'INV'
            });
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        restaurantName: settings.restaurantName,
        invoicePrefix: settings.invoicePrefix.toUpperCase()
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings', error);
      alert('Failed to save settings.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Loading Settings...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Restaurant Settings</h1>
      
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-lg">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Restaurant Name (Shows on Bill)</label>
            <input 
              type="text" 
              value={settings.restaurantName} 
              onChange={(e) => setSettings({...settings, restaurantName: e.target.value})} 
              className="w-full px-4 py-3 border border-gray-700 bg-black rounded-md text-white focus:ring-yellow-500 focus:border-yellow-500" 
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Prefix (e.g., INV, BILL, TXN)</label>
            <input 
              type="text" 
              value={settings.invoicePrefix} 
              onChange={(e) => setSettings({...settings, invoicePrefix: e.target.value.toUpperCase()})} 
              className="w-full px-4 py-3 border border-gray-700 bg-black rounded-md text-white focus:ring-yellow-500 focus:border-yellow-500 uppercase" 
              maxLength={10}
              required
            />
            <p className="text-gray-500 text-xs mt-2">This prefix will be added before all your bill numbers (Example: {settings.invoicePrefix || 'INV'}-102938).</p>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black font-bold rounded shadow transition-colors uppercase tracking-widest text-sm"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
