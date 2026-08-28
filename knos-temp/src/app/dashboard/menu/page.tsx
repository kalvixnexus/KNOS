'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function MenuUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [currentMenu, setCurrentMenu] = useState<any[]>([]);
  const [stagedMenu, setStagedMenu] = useState<any[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const menuDoc = await getDoc(doc(db, 'menus', user.uid));
          if (menuDoc.exists() && menuDoc.data().items) {
            setCurrentMenu(menuDoc.data().items);
          }
        } catch (error) {
          console.error('Error fetching menu', error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userId) return alert('Please select a file first.');

    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      const parsedItems = [];
      let idCounter = Date.now();
      
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const price = parseFloat(parts[1].trim());
          if (name && !isNaN(price)) {
            parsedItems.push({ id: idCounter++, name, price });
          }
        }
      }

      if (parsedItems.length === 0) {
        alert('No valid items found in CSV. Format should be: ItemName,Price');
        return;
      }

      setStagedMenu(parsedItems);
      setIsEditing(true); // Open edit mode with new CSV data
      setFile(null);
      
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error(error);
      alert('Error parsing CSV file');
    }
  };

  const startEditing = () => {
    setStagedMenu([...currentMenu]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setStagedMenu([]);
  };

  const handleItemChange = (id: number, field: string, value: string | number) => {
    setStagedMenu(stagedMenu.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: number) => {
    setStagedMenu(stagedMenu.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    setStagedMenu([...stagedMenu, { id: Date.now(), name: '', price: 0 }]);
  };

  const handlePublish = async () => {
    if (!userId) return;
    
    const validItems = stagedMenu.filter(i => i.name.trim() !== '' && i.price > 0);
    if (validItems.length === 0) {
      return alert('Cannot publish an empty or invalid menu.');
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'menus', userId), {
        items: validItems,
        updatedAt: new Date().toISOString()
      });
      setCurrentMenu(validItems);
      setIsEditing(false);
      alert('Menu Published Successfully!');
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish menu.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Loading Menu...</div>;

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-white">Menu Management</h1>
      
      {/* CSV Upload Section */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-2 text-white uppercase tracking-widest">Import from CSV</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Uploading a CSV will open the editor so you can review before publishing.
          <a href="/sample-menu.csv" download className="text-yellow-500 ml-2 hover:underline font-bold">Download Sample CSV</a>
        </p>

        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input 
            id="csv-upload"
            type="file" 
            accept=".csv" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-bold file:uppercase file:tracking-widest
              file:bg-gray-800 file:text-white
              hover:file:bg-gray-700 cursor-pointer"
          />
          <button 
            type="submit" 
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-6 py-2 rounded-md font-bold uppercase tracking-widest text-sm transition-colors shadow"
          >
            Extract & Review
          </button>
        </form>
      </div>

      {/* Menu Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">
              {isEditing ? 'Menu Editor' : 'Live Menu'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isEditing ? 'Make changes below, then hit Publish to make them live.' : 'This is the menu currently live on your POS and website.'}
            </p>
          </div>
          
          <div>
            {!isEditing ? (
              <button 
                onClick={startEditing}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-6 py-2 rounded-md font-bold uppercase tracking-widest text-sm transition-colors shadow"
              >
                Edit Menu
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={cancelEditing}
                  disabled={saving}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-bold uppercase tracking-widest text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePublish}
                  disabled={saving}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-6 py-2 rounded-md font-black uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isEditing ? (
            /* VIEW MODE */
            currentMenu.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No menu items found. Please upload a CSV or edit the menu.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentMenu.map(item => (
                  <div key={item.id} className="bg-black border border-gray-800 p-4 rounded-lg flex justify-between items-center hover:border-yellow-500/50 transition-colors">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-yellow-500 font-bold">₹{item.price}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* EDIT MODE */
            stagedMenu.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No items to edit. Add an item below.
                <div className="mt-4">
                  <button onClick={handleAddItem} className="text-yellow-500 hover:text-yellow-400 font-bold uppercase text-sm">+ Add Item</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-4 px-2 pb-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
                  <div className="flex-[2]">Item Name</div>
                  <div className="flex-1">Price (₹)</div>
                  <div className="w-10 text-center">Action</div>
                </div>
                
                {stagedMenu.map(item => (
                  <div key={item.id} className="flex gap-4 items-center group">
                    <div className="flex-[2]">
                      <input 
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="e.g. Garlic Bread"
                        className="w-full bg-black border border-gray-800 rounded px-4 py-2 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <input 
                        type="number"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                        placeholder="0"
                        className="w-full bg-black border border-gray-800 rounded pl-8 pr-4 py-2 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                      />
                    </div>
                    <div className="w-10 flex justify-center">
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-8 h-8 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                        title="Remove Item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-6 pt-6 border-t border-gray-800">
                  <button 
                    onClick={handleAddItem}
                    className="text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2"
                  >
                    <span className="text-xl leading-none">+</span> Add New Item
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
