'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';

export default function DineInOrdersPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [restaurantName, setRestaurantName] = useState('YOUR RESTAURANT');
  const [gstPercentage, setGstPercentage] = useState(0);
  
  const [qrOrders, setQrOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch settings & pending orders
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.invoicePrefix) setInvoicePrefix(data.invoicePrefix);
            if (data.restaurantName) setRestaurantName(data.restaurantName);
            if (data.gstPercentage !== undefined) setGstPercentage(data.gstPercentage);
          }
          
          fetchQrOrders(user.uid);

          // Auto refresh every 5 seconds
          intervalId = setInterval(() => {
            fetchQrOrders(user.uid);
          }, 5000);
        } catch (error) {
          console.error(error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    
    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const fetchQrOrders = async (uid: string) => {
    try {
      const q = query(collection(db, 'qr_orders'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      orders.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setQrOrders(orders);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      const gstAmount = (subTotal * gstPercentage) / 100;
      const total = subTotal + gstAmount;

      await addDoc(collection(db, 'bills'), {
        userId,
        invoiceNo: `${invoicePrefix}-${invoiceNo}`,
        customerName: selectedOrder.customerName,
        customerPhone: selectedOrder.customerPhone || '',
        paymentMode: selectedOrder.paymentMode,
        items: selectedOrder.items,
        subTotal,
        gstPercentage,
        gstAmount,
        total,
        source: 'QR Table ' + selectedOrder.tableNo,
        date: new Date().toISOString()
      });
      
      await deleteDoc(doc(db, 'qr_orders', selectedOrder.id));
      
      window.print();
      
      setSelectedOrder(null);
      fetchQrOrders(userId);
    } catch (error) {
      alert('Error generating QR bill');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Loading QR Orders...</div>;

  return (
    <div className="max-w-6xl flex gap-8">
      {/* Left Column */}
      <div className="flex-1 hide-on-print">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white uppercase tracking-widest">Dine-In Orders (QR)</h1>
          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold uppercase tracking-widest text-sm animate-pulse">
            {qrOrders.length} Pending
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6 min-h-[400px]">
          {qrOrders.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p>No active orders from any tables.</p>
              <p className="text-sm mt-2">Waiting for customers to scan QR...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qrOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => handleSelectOrder(order)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-black hover:border-gray-500'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-yellow-500 text-black font-black px-2 py-0.5 rounded text-xs uppercase tracking-widest">
                        Table {order.tableNo}
                      </span>
                      <span className="font-bold text-white">{order.customerName}</span>
                    </div>
                    <span className="text-yellow-500 font-bold">₹{order.totalAmount}</span>
                  </div>
                  <div className="text-sm text-gray-400 flex justify-between">
                    <span>{order.items.length} items • {order.paymentMode}</span>
                    <span>{new Date(order.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      {selectedOrder && (
        <div className="w-96 hide-on-print flex flex-col gap-4">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            <h2 className="text-lg font-bold text-yellow-500 uppercase tracking-widest mb-4">Table {selectedOrder.tableNo} Order</h2>
            
            <div className="mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Customer:</span>
                <span className="text-white font-bold">{selectedOrder.customerName}</span>
              </div>
              {selectedOrder.customerPhone && (
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white font-bold">{selectedOrder.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between mb-1 mt-2 border-t border-gray-800 pt-2">
                <span className="text-gray-400">Payment:</span>
                <span className="text-yellow-500 font-bold uppercase">{selectedOrder.paymentMode}</span>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 mb-4">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name} <span className="text-gray-500 ml-1">x{item.qty}</span></span>
                    <span className="text-white">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 mb-6">
              <div className="flex justify-between text-sm mb-1 text-gray-400">
                <span>Subtotal:</span>
                <span>₹{selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)}</span>
              </div>
              {gstPercentage > 0 && (
                <div className="flex justify-between text-sm mb-2 text-gray-400">
                  <span>GST ({gstPercentage}%):</span>
                  <span>₹{parseFloat(((selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * gstPercentage) / 100).toFixed(2))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-700">
                <span className="text-yellow-500">TOTAL:</span>
                <span className="text-yellow-500">₹{parseFloat((selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * (1 + gstPercentage / 100)).toFixed(2))}</span>
              </div>
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
          <div className="text-center mb-2">
            <span className="border border-black px-2 py-1 font-bold text-lg">TABLE {selectedOrder.tableNo}</span>
          </div>
          <div className="mb-1 uppercase"><strong>Customer:</strong> {selectedOrder.customerName}</div>
          {selectedOrder.customerPhone && <div className="mb-1"><strong>Phone:</strong> {selectedOrder.customerPhone}</div>}
          <div className="mb-1"><strong>Invoice No:</strong> {invoicePrefix}-{invoiceNo}</div>
          <div className="mb-2">
            <strong>Date:</strong> <span suppressHydrationWarning>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="mb-2 uppercase"><strong>Payment:</strong> {selectedOrder.paymentMode}</div>
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
          <div className="text-center mt-2 text-xs font-bold">Thank you for dining with us!</div>
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
