'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';

export default function APIBilling() {
  const [userId, setUserId] = useState<string | null>(null);
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [restaurantName, setRestaurantName] = useState('YOUR RESTAURANT');
  const [gstPercentage, setGstPercentage] = useState(0);
  
  const [apiOrders, setApiOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState('UPI'); // Online orders usually UPI/Card
  const [invoiceNo, setInvoiceNo] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch settings & pending orders
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          // Fetch Settings
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
            if (data.restaurantName) setRestaurantName(data.restaurantName);
            if (data.gstPercentage !== undefined) setGstPercentage(data.gstPercentage);
          }
          // Fetch API Orders
          fetchApiOrders(user.uid);
        } catch (error) {
          console.error(error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchApiOrders = async (uid: string) => {
    const q = query(collection(db, 'api_orders'), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by timestamp
    orders.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setApiOrders(orders);
  };

  const handleSimulateOrder = async () => {
    if (!userId) return;
    const fakeOrder = {
      userId,
      customerName: 'Aman Singh (Online)',
      customerPhone: '9876543210',
      items: [
        { id: 2, name: 'Pizza', price: 300, qty: 2 },
        { id: 4, name: 'Cold Drink', price: 50, qty: 2 }
      ],
      totalAmount: 700,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, 'api_orders'), fakeOrder);
    fetchApiOrders(userId);
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setInvoiceNo(Math.floor(100000 + Math.random() * 900000).toString());
  };

  const handlePrint = async () => {
    if (!selectedOrder || !userId) return;
    setSaving(true);
    
    try {
      const subTotal = selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0);
      const gstAmount = parseFloat(((subTotal * gstPercentage) / 100).toFixed(2));
      const total = parseFloat((subTotal + gstAmount).toFixed(2));

      // 1. Save to standard bills history
      await addDoc(collection(db, 'bills'), {
        userId,
        invoiceNo: `${invoicePrefix}-${invoiceNo}`,
        customerName: selectedOrder.customerName,
        customerPhone: selectedOrder.customerPhone || '',
        paymentMode,
        items: selectedOrder.items,
        subTotal,
        gstPercentage,
        gstAmount,
        total,
        date: new Date().toISOString()
      });
      
      // 2. Remove from pending API orders
      await deleteDoc(doc(db, 'api_orders', selectedOrder.id));
      
      // 3. Print
      window.print();
      
      // 4. Reset
      setSelectedOrder(null);
      fetchApiOrders(userId);
    } catch (error) {
      alert('Error generating API bill');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Loading API Orders...</div>;

  return (
    <div className="max-w-6xl flex gap-8">
      
      {/* Left Column: API Orders List */}
      <div className="flex-1 hide-on-print">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Incoming API Orders</h1>
          <button onClick={handleSimulateOrder} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm shadow">
            Simulate Website Order
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6 min-h-[400px]">
          {apiOrders.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p>No new orders from your website.</p>
              <p className="text-sm mt-2">Click "Simulate Website Order" to see how it works.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => handleSelectOrder(order)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-black hover:border-gray-500'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">{order.customerName}</span>
                    <span className="text-green-400 font-bold">₹{order.totalAmount}</span>
                  </div>
                  <div className="text-sm text-gray-400 flex justify-between">
                    <span>{order.items.length} items</span>
                    <span>{new Date(order.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Pre-filled Preview & Print */}
      {selectedOrder && (
        <div className="w-96 hide-on-print flex flex-col gap-4">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-widest mb-4">Confirm & Generate</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Payment Mode (Website)</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full px-3 py-2 border border-gray-700 bg-black rounded-md text-white">
                <option value="UPI">UPI (Pre-paid)</option>
                <option value="Card">Card (Pre-paid)</option>
                <option value="Cash">Cash on Delivery</option>
              </select>
            </div>
            
            <button onClick={handlePrint} disabled={saving} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black px-6 py-4 rounded-md font-bold uppercase tracking-wider transition-colors shadow">
              {saving ? 'Processing...' : 'Approve & Print Bill'}
            </button>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Area */}
      {selectedOrder && (
        <div className="w-80 bg-white border border-gray-300 p-4 shadow-lg printable-receipt font-mono text-sm mx-auto h-fit text-black hidden-until-print">
          <div className="text-center font-bold text-xl mb-3 uppercase">{restaurantName}</div>
          <div className="border-b border-dashed border-gray-400 mb-2"></div>
          <div className="mb-1 uppercase"><strong>Customer:</strong> {selectedOrder.customerName}</div>
          {selectedOrder.customerPhone && <div className="mb-1"><strong>Phone:</strong> {selectedOrder.customerPhone}</div>}
          <div className="mb-1"><strong>Invoice No:</strong> {invoicePrefix}-{invoiceNo}</div>
          <div className="mb-1"><strong>Order Type:</strong> API / Website</div>
          <div className="mb-2">
            <strong>Date:</strong> <span suppressHydrationWarning>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="mb-2"><strong>Payment:</strong> {paymentMode}</div>
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
              {selectedOrder.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-center">{item.qty}</td>
                  <td className="py-1 text-right">₹{item.price * item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="border-b border-dashed border-gray-400 mt-2 mb-2"></div>
          
          <div className="flex justify-between text-sm mb-1">
            <span>Subtotal:</span>
            <span>₹{selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)}</span>
          </div>
          {gstPercentage > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span>GST ({gstPercentage}%):</span>
              <span>₹{parseFloat(((selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * gstPercentage) / 100).toFixed(2))}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-lg border-t border-dashed border-gray-400 pt-2">
            <span>TOTAL:</span>
            <span>₹{parseFloat((selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * (1 + gstPercentage / 100)).toFixed(2))}</span>
          </div>
          <div className="border-b border-dashed border-gray-400 mt-2 mb-4"></div>
          <div className="text-center mt-2 text-xs font-bold">Thank you for ordering online!</div>
          <div className="text-center mt-4 text-[10px] text-gray-500 uppercase tracking-widest">Bill Generated by Kalvix Nexus POS</div>
        </div>
      )}

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
