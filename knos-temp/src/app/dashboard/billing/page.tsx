'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';

export default function ManualBilling() {
  const [userId, setUserId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [selectedItems, setSelectedItems] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);
  const [menuItems, setMenuItems] = useState<{ id: number; name: string; price: number }[]>([]);
  
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [restaurantName, setRestaurantName] = useState('YOUR RESTAURANT');
  const [gstPercentage, setGstPercentage] = useState(0);
  
  const [qrOrders, setQrOrders] = useState<any[]>([]);
  
  // Auto-generate a random 6-digit invoice number on client side
  const [invoiceNo, setInvoiceNo] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchQrOrders = async (uid: string) => {
    try {
      const { query, collection, where, getDocs } = require('firebase/firestore');
      const q = query(collection(db, 'qr_orders'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      orders.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setQrOrders(orders);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
    let intervalId: NodeJS.Timeout;
    
    // Fetch logged in owner's settings and menu
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          // Fetch user settings
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
            if (data.restaurantName) setRestaurantName(data.restaurantName);
            if (data.gstPercentage !== undefined) setGstPercentage(data.gstPercentage);
          }
          
          // Fetch user menu
          const menuDoc = await getDoc(doc(db, 'menus', user.uid));
          if (menuDoc.exists() && menuDoc.data().items) {
            setMenuItems(menuDoc.data().items);
          }

          fetchQrOrders(user.uid);
          intervalId = setInterval(() => {
            fetchQrOrders(user.uid);
          }, 5000);
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      }
    });
    
    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
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

  const subTotal = selectedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const gstAmount = parseFloat(((subTotal * gstPercentage) / 100).toFixed(2));
  const total = Math.round(subTotal + gstAmount);

  const handlePrint = async () => {
    if (selectedItems.length === 0) return alert('Add items to bill first');
    if (!customerName) return alert('Enter customer name');
    
    setSaving(true);
    try {
      await addDoc(collection(db, 'bills'), {
        userId,
        invoiceNo: `${invoicePrefix}-${invoiceNo}`,
        customerName,
        customerPhone,
        paymentMode,
        items: selectedItems,
        subTotal,
        gstPercentage,
        gstAmount,
        total,
        source: 'Manual',
        date: new Date().toISOString()
      });
      
      window.print();
      
      // Reset after print
      setCustomerName('');
      setCustomerPhone('');
      setSelectedItems([]);
      setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
    } catch (error) {
      alert('Error generating bill');
    }
    setSaving(false);
  };

  const handleApproveQrOrder = async (order: any) => {
    try {
      const { deleteDoc } = require('firebase/firestore');
      
      const orderSubTotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
      const orderGstAmount = (orderSubTotal * gstPercentage) / 100;
      const orderTotal = orderSubTotal + orderGstAmount;

      await addDoc(collection(db, 'bills'), {
        userId,
        invoiceNo: `${invoicePrefix}-${invoiceNo}`,
        customerName: order.customerName,
        customerPhone: order.customerPhone || '',
        paymentMode: order.paymentMode,
        items: order.items,
        subTotal: orderSubTotal,
        gstPercentage,
        gstAmount: orderGstAmount,
        total: orderTotal,
        source: 'QR Table ' + order.tableNo,
        date: new Date().toISOString()
      });

      await deleteDoc(doc(db, 'qr_orders', order.id));
      
      // We don't auto print here unless they want to, but we can set the receipt info and print.
      // To do this simply, we could just alert for now, or populate the cart and print.
      alert(`Order from Table ${order.tableNo} Approved and Saved to History!`);
      setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
      if (userId) fetchQrOrders(userId);

    } catch (error) {
      console.error(error);
      alert('Failed to approve QR order');
    }
  };

  return (
    <div className="max-w-6xl flex gap-8">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6 text-white hide-on-print">Generate Manual Bill</h1>
        
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 hide-on-print mb-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4">Customer & Bill Details</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Name</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="block w-full px-3 py-2 border border-gray-700 bg-black rounded-md text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" placeholder="e.g. Rahul" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Phone (Optional)</label>
              <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="block w-full px-3 py-2 border border-gray-700 bg-black rounded-md text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Invoice No.</label>
              <div className="flex shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-700 bg-gray-800 text-yellow-500 text-sm font-bold">
                  {invoicePrefix}-
                </span>
                <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="flex-1 block w-full px-3 py-2 border border-gray-700 bg-black rounded-none rounded-r-md text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" placeholder="102938" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="block w-full px-3 py-2 border border-gray-700 bg-black rounded-md text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 hide-on-print flex gap-6">
          {/* Menu Selection */}
          <div className="flex-1 border-r border-gray-800 pr-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4">Select Items</h2>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
              {menuItems.length === 0 ? (
                <div className="col-span-2 text-sm text-gray-500">No items found. Upload a menu first.</div>
              ) : (
                menuItems.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleAddItem(item)}
                    className="p-3 border border-gray-800 rounded text-left hover:bg-yellow-500/10 hover:border-yellow-500 transition-colors bg-black text-white group"
                  >
                    <div className="font-bold text-white group-hover:text-yellow-500 transition-colors">{item.name}</div>
                    <div className="text-sm text-gray-400">₹{item.price}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cart / Selected Items */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-4">Current Bill</h2>
            {selectedItems.length === 0 ? (
              <div className="text-gray-500 text-sm">No items selected yet.</div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                    <div>
                      <span className="font-bold text-white">{item.name}</span> <span className="text-yellow-500 font-bold ml-2">x{item.qty}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300">₹{item.price * item.qty}</span>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 font-bold bg-red-500/10 w-6 h-6 rounded flex items-center justify-center transition-colors">×</button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                    <span>Subtotal</span>
                    <span>₹{subTotal}</span>
                  </div>
                  {gstPercentage > 0 && (
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                      <span>GST ({gstPercentage}%)</span>
                      <span>₹{gstAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-black text-lg pt-2 text-white border-t border-gray-800">
                    <span className="uppercase tracking-widest text-sm text-gray-400">Total Amount</span>
                    <span className="text-yellow-500 text-2xl">₹{total}</span>
                  </div>
                </div>
                <button onClick={handlePrint} disabled={saving} className="mt-6 w-full bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-6 py-4 rounded-md font-black uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-105 transition-all">
                  {saving ? 'Processing...' : 'Save & Print Bill'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thermal Receipt Print Area */}
      <div className="bg-white printable-receipt font-mono text-black hidden-until-print" style={{ width: '80mm', padding: '5mm', margin: '0 auto' }}>
        
        <div className="text-center font-bold text-2xl mb-1 uppercase tracking-widest">{restaurantName}</div>
        <div className="text-center text-xs mb-3">TAX INVOICE</div>
        
        <div className="border-b-2 border-dashed border-black mb-3"></div>
        
        <div className="text-xs space-y-1 mb-3">
          <div className="flex justify-between">
            <span className="font-bold">Date:</span>
            <span suppressHydrationWarning>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Invoice:</span>
            <span>{invoicePrefix}-{invoiceNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Customer:</span>
            <span className="uppercase">{customerName || 'Walk-in'}</span>
          </div>
          {customerPhone && (
            <div className="flex justify-between">
              <span className="font-bold">Phone:</span>
              <span>{customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-bold">Payment:</span>
            <span className="uppercase">{paymentMode}</span>
          </div>
        </div>
        
        <div className="border-b-2 border-dashed border-black mb-2"></div>
        
        {/* Table Header */}
        <div className="flex text-xs font-bold mb-2 pb-1 border-b border-black">
          <div className="flex-[3]">ITEM</div>
          <div className="flex-1 text-center">QTY</div>
          <div className="flex-[1.5] text-right">AMT</div>
        </div>
        
        {/* Items */}
        <div className="text-xs space-y-2 mb-3">
          {selectedItems.map((item: any) => (
            <div key={item.id} className="flex items-start">
              <div className="flex-[3] pr-2 leading-tight uppercase">{item.name}</div>
              <div className="flex-1 text-center">{item.qty}</div>
              <div className="flex-[1.5] text-right">₹{item.price * item.qty}</div>
            </div>
          ))}
        </div>
        
        <div className="border-b-2 border-dashed border-black mb-2"></div>
        
        {/* Totals */}
        <div className="text-sm space-y-1 mb-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subTotal}</span>
          </div>
          {gstPercentage > 0 && (
            <div className="flex justify-between">
              <span>GST ({gstPercentage}%)</span>
              <span>₹{gstAmount}</span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between font-black text-xl border-t-2 border-black pt-2 mb-4">
          <span>TOTAL</span>
          <span>₹{total}</span>
        </div>
        
        <div className="text-center mt-6 text-xs font-bold uppercase tracking-widest">
          Thank You For Visiting!
        </div>
        <div className="text-center mt-2 text-[9px] text-gray-500 uppercase tracking-widest">
          Powered by Kalvix Nexus POS
        </div>
      </div>

      <style jsx global>{`
        .hidden-until-print {
          display: none;
        }
        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          .printable-receipt, .printable-receipt * { visibility: visible; display: block !important; }
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
