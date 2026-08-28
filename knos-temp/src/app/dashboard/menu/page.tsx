'use client';

import { useState, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
          const imageUrl = parts.length > 2 ? parts[2].trim() : '';
          
          if (name && !isNaN(price)) {
            parsedItems.push({ id: idCounter++, name, price, imageUrl });
          }
        }
      }

      if (parsedItems.length === 0) {
        alert('No valid items found in CSV. Format should be: ItemName,Price,ImageUrl(Optional)');
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
    setStagedMenu([...stagedMenu, { id: Date.now(), name: '', price: 0, imageUrl: '' }]);
  };

  const handleImageUpload = async (id: number, file: File) => {
    if (!userId) return;
    try {
      const storageRef = ref(storage, `menu_images/${userId}/${id}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      handleItemChange(id, 'imageUrl', url);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Storage rules might not be set up.');
    }
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
                  <div key={item.id} className="bg-black border border-gray-800 p-4 rounded-lg hover:border-yellow-500/50 transition-colors flex gap-4 items-center">
                    {item.imageUrl ? (
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-900 shrink-0 border border-gray-800">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-gray-900 flex items-center justify-center shrink-0 border border-gray-800 text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-yellow-500 font-bold text-sm">₹{item.price}</div>
                    </div>
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
              <div className="space-y-4">
                <div className="flex gap-4 px-2 pb-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800">
                  <div className="w-12">Img</div>
                  <div className="flex-[2]">Details</div>
                  <div className="flex-1">Image URL or Upload</div>
                  <div className="w-10 text-center">Act</div>
                </div>
                
                {stagedMenu.map(item => (
                  <div key={item.id} className="flex gap-4 items-start group bg-black/50 p-3 rounded-lg border border-gray-800/50">
                    <div className="w-12 h-12 shrink-0 bg-gray-900 rounded overflow-hidden border border-gray-800 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-600">No Img</span>
                      )}
                    </div>
                    
                    <div className="flex-[2] flex flex-col gap-2">
                      <input 
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="Item Name (e.g. Garlic Bread)"
                        className="w-full bg-black border border-gray-800 rounded px-3 py-1.5 text-white text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <input 
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                          placeholder="0"
                          className="w-full bg-black border border-gray-800 rounded pl-7 pr-3 py-1.5 text-white text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                      <input 
                        type="text"
                        value={item.imageUrl || ''}
                        onChange={(e) => handleItemChange(item.id, 'imageUrl', e.target.value)}
                        placeholder="Paste Image URL..."
                        className="w-full bg-black border border-gray-800 rounded px-3 py-1.5 text-white text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                      />
                      <div className="relative w-full">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleImageUpload(item.id, e.target.files[0]);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button type="button" className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors">
                          Or Upload Image
                        </button>
                      </div>
                    </div>

                    <div className="w-10 flex justify-center items-center h-full pt-2">
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
