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
      const gstAmount = parseFloat(((subTotal * gstPercentage) / 100).toFixed(2));
      const total = Math.round(subTotal + gstAmount);

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
                <span className="text-yellow-500">₹{Math.round(selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * (1 + gstPercentage / 100))}</span>
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
        <div className="bg-white printable-receipt font-mono text-black hidden-until-print" style={{ width: '80mm', padding: '5mm', margin: '0 auto' }}>
          
          <div className="text-center font-bold text-2xl mb-1 uppercase tracking-widest">{restaurantName}</div>
          <div className="text-center text-xs mb-3">TAX INVOICE</div>
          
          <div className="border-b-2 border-dashed border-black mb-3"></div>
          
          <div className="text-center mb-3">
            <div className="inline-block border-2 border-black px-4 py-1 font-black text-xl tracking-widest">
              TABLE {selectedOrder.tableNo}
            </div>
          </div>
          
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
              <span className="uppercase">{selectedOrder.customerName}</span>
            </div>
            {selectedOrder.customerPhone && (
              <div className="flex justify-between">
                <span className="font-bold">Phone:</span>
                <span>{selectedOrder.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-bold">Payment:</span>
              <span className="uppercase">{selectedOrder.paymentMode}</span>
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
            {selectedOrder.items.map((item: any) => (
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
              <span>₹{selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0)}</span>
            </div>
            {gstPercentage > 0 && (
              <div className="flex justify-between">
                <span>GST ({gstPercentage}%)</span>
                <span>₹{parseFloat(((selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * gstPercentage) / 100).toFixed(2))}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between font-black text-xl border-t-2 border-black pt-2 mb-4">
            <span>TOTAL</span>
            <span>₹{Math.round(selectedOrder.items.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) * (1 + gstPercentage / 100))}</span>
          </div>
          
          <div className="text-center mt-6 text-xs font-bold uppercase tracking-widest">
            Thank You For Dining With Us!
          </div>
          <div className="text-center mt-2 text-[9px] text-gray-500 uppercase tracking-widest">
            Powered by Kalvix Nexus POS
          </div>
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
