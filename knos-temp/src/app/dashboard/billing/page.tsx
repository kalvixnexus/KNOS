'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Dummy menu items for demonstration
const dummyMenu = [
  { id: 1, name: 'Burger', price: 150 },
  { id: 2, name: 'Pizza', price: 300 },
  { id: 3, name: 'Pasta', price: 200 },
  { id: 4, name: 'Cold Drink', price: 50 },
  { id: 5, name: 'Coffee', price: 100 },
];

export default function ManualBilling() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);
  
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [restaurantName, setRestaurantName] = useState('YOUR RESTAURANT');
  
  // Auto-generate a random 6-digit invoice number on client side
  const [invoiceNo, setInvoiceNo] = useState('');

  useEffect(() => {
    setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
    
    // Fetch logged in owner's settings
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
            if (data.restaurantName) setRestaurantName(data.restaurantName);
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddItem = (item: any) => {
    const existing = selectedItems.find(i => i.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { ...item, qty: 1 }]);
    }
  };

  const handleRemoveItem = (id: number) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const total = selectedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handlePrint = () => {
    window.print();
    // Here you would also save this bill to Firebase Firestore
    alert('Bill generated and printed!');
  };

  return (
    <div className="max-w-6xl flex gap-8">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6 hide-on-print">Generate Manual Bill</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hide-on-print mb-6">
          <h2 className="text-lg font-semibold mb-4">Customer & Bill Details</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="e.g. Rahul" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
              <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice No. ({invoicePrefix}-XXXXXX)</label>
              <div className="flex mt-1 shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">
                  {invoicePrefix}-
                </span>
                <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md" placeholder="102938" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hide-on-print flex gap-6">
          {/* Menu Selection */}
          <div className="flex-1 border-r pr-6">
            <h2 className="text-lg font-semibold mb-4">Select Items</h2>
            <div className="grid grid-cols-2 gap-3">
              {dummyMenu.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => handleAddItem(item)}
                  className="p-3 border rounded text-left hover:bg-yellow-50 hover:border-yellow-500 transition-colors"
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">₹{item.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart / Selected Items */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-4">Current Bill</h2>
            {selectedItems.length === 0 ? (
              <div className="text-gray-500 text-sm">No items selected yet.</div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <span className="font-medium">{item.name}</span> <span className="text-gray-500">x{item.qty}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>₹{item.price * item.qty}</span>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center font-bold text-lg pt-4">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>
                <button onClick={handlePrint} className="mt-4 w-full bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-md font-bold uppercase tracking-wider transition-colors shadow">
                  Generate & Print Bill
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thermal Receipt Print Area */}
      <div className="w-80 bg-white border border-gray-300 p-4 shadow-lg printable-receipt font-mono text-sm mx-auto h-fit text-black">
        <div className="text-center font-bold text-xl mb-3 uppercase">{restaurantName}</div>
        <div className="border-b border-dashed border-gray-400 mb-2"></div>
        <div className="mb-1 uppercase"><strong>Customer:</strong> {customerName || 'Walk-in'}</div>
        {customerPhone && <div className="mb-1"><strong>Phone:</strong> {customerPhone}</div>}
        <div className="mb-1"><strong>Invoice No:</strong> {invoicePrefix}-{invoiceNo}</div>
        <div className="mb-2">
          <strong>Date:</strong> <span suppressHydrationWarning>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="border-b border-dashed border-gray-400 mb-2"></div>
        
        <table className="w-full text-left mb-2">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="pb-1 font-normal">Item</th>
              <th className="pb-1 font-normal text-center">Qty</th>
              <th className="pb-1 font-normal text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.map(item => (
              <tr key={item.id}>
                <td className="py-1">{item.name}</td>
                <td className="py-1 text-center">{item.qty}</td>
                <td className="py-1 text-right">₹{item.price * item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-b border-dashed border-gray-400 mt-2 mb-2"></div>
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL:</span>
          <span>₹{total}</span>
        </div>
        <div className="border-b border-dashed border-gray-400 mt-2 mb-4"></div>
        <div className="text-center mt-2 text-xs font-bold">Thank you for visiting!</div>
        <div className="text-center mt-4 text-[10px] text-gray-500 uppercase tracking-widest">Bill Generated by Kalvix Nexus POS</div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          .printable-receipt, .printable-receipt * { visibility: visible; }
          .printable-receipt { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
            padding: 5mm; 
            border: none; 
            box-shadow: none; 
          }
        }
      `}</style>
    </div>
  );
}
