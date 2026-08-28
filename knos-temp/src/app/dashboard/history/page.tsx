'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function BillHistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, 'bills'),
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          const fetchedBills = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort manually since we might not have a composite index set up yet in Firestore
          fetchedBills.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setBills(fetchedBills);
        } catch (error) {
          console.error("Error fetching bills:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-white p-8">Loading history...</div>;

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Bill History</h1>
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-black border-b border-gray-800 text-sm uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Invoice No</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Payment Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {bills.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No bills generated yet.</td>
              </tr>
            ) : (
              bills.map(bill => (
                <tr key={bill.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(bill.date).toLocaleDateString()} <br/>
                    <span className="text-xs text-gray-500">{new Date(bill.date).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setSelectedBill(bill)}
                      className="text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-2"
                    >
                      {bill.invoiceNo}
                      {bill.source === 'API' && (
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-widest border border-blue-500/30">API</span>
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{bill.customerName}</div>
                    <div className="text-xs text-gray-500">{bill.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {bill.items?.length || 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">₹{bill.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      bill.paymentMode === 'Cash' ? 'bg-green-500/20 text-green-400' :
                      bill.paymentMode === 'UPI' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {bill.paymentMode || 'Cash'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-yellow-500/30 w-full max-w-lg rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.1)] overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Bill Details</h3>
                <p className="text-sm text-gray-400 font-mono mt-1">{selectedBill.invoiceNo}</p>
              </div>
              <button 
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <div className="text-gray-500 uppercase tracking-wider text-xs mb-1">Customer</div>
                  <div className="font-bold text-white uppercase">{selectedBill.customerName}</div>
                  {selectedBill.customerPhone && <div className="text-gray-400">{selectedBill.customerPhone}</div>}
                </div>
                <div>
                  <div className="text-gray-500 uppercase tracking-wider text-xs mb-1">Date & Time</div>
                  <div className="font-bold text-white">{new Date(selectedBill.date).toLocaleDateString()}</div>
                  <div className="text-gray-400">{new Date(selectedBill.date).toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase tracking-wider text-xs mb-1">Payment Mode</div>
                  <span className={`px-2 py-1 rounded text-xs font-bold inline-block mt-1 ${
                      selectedBill.paymentMode === 'Cash' ? 'bg-green-500/20 text-green-400' :
                      selectedBill.paymentMode === 'UPI' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {selectedBill.paymentMode || 'Cash'}
                  </span>
                </div>
              </div>

              <div className="text-gray-500 uppercase tracking-wider text-xs mb-3 border-b border-gray-800 pb-2">Order Items</div>
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
                {selectedBill.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-white">{item.name}</span> <span className="text-gray-500 ml-2">x{item.qty}</span>
                    </div>
                    <div className="text-gray-300">₹{item.price * item.qty}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4">
                {selectedBill.gstPercentage ? (
                  <>
                    <div className="flex justify-between items-center text-gray-400 text-sm mb-1">
                      <span>Subtotal</span>
                      <span>₹{selectedBill.subTotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400 text-sm mb-3">
                      <span>GST ({selectedBill.gstPercentage}%)</span>
                      <span>₹{selectedBill.gstAmount}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50">
                  <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-yellow-500">₹{selectedBill.total}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-black border-t border-gray-800 flex justify-between items-center">
              <button 
                onClick={() => {
                  // A simple trick to print just the bill details could be 
                  // using window.print() but we need to create a printable receipt.
                  // For now, we will just open a new window with the receipt format or print current screen.
                  // We can add a hidden receipt structure later, or just print current window.
                  window.print();
                }}
                className="px-6 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500 hover:text-black rounded font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Print Bill
              </button>
              <button 
                onClick={() => setSelectedBill(null)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Thermal Receipt for History Print */}
      {selectedBill && (
        <div className="hidden-until-print printable-receipt w-80 bg-white border border-gray-300 p-4 shadow-lg font-mono text-sm text-black">
          <div className="text-center font-bold text-xl mb-3 uppercase">KALVIX NEXUS</div>
          <div className="border-b border-dashed border-gray-400 mb-2"></div>
          <div className="mb-1 uppercase"><strong>Customer:</strong> {selectedBill.customerName}</div>
          {selectedBill.customerPhone && <div className="mb-1"><strong>Phone:</strong> {selectedBill.customerPhone}</div>}
          <div className="mb-1"><strong>Invoice No:</strong> {selectedBill.invoiceNo}</div>
          <div className="mb-1"><strong>Order Type:</strong> {selectedBill.source === 'API' ? 'API / Website' : 'Manual Entry'}</div>
          <div className="mb-2">
            <strong>Date:</strong> {new Date(selectedBill.date).toLocaleDateString()} {new Date(selectedBill.date).toLocaleTimeString()}
          </div>
          <div className="mb-2"><strong>Payment:</strong> {selectedBill.paymentMode}</div>
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
              {selectedBill.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-center">{item.qty}</td>
                  <td className="py-1 text-right">₹{item.price * item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="border-b border-dashed border-gray-400 mt-2 mb-2"></div>
          
          {selectedBill.gstPercentage ? (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal:</span>
                <span>₹{selectedBill.subTotal}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>GST ({selectedBill.gstPercentage}%):</span>
                <span>₹{selectedBill.gstAmount}</span>
              </div>
            </>
          ) : null}

          <div className="flex justify-between font-bold text-lg border-t border-dashed border-gray-400 pt-2">
            <span>TOTAL:</span>
            <span>₹{selectedBill.total}</span>
          </div>
          <div className="border-b border-dashed border-gray-400 mt-2 mb-4"></div>
          <div className="text-center mt-2 text-xs font-bold">Thank you for visiting!</div>
          <div className="text-center mt-4 text-[10px] text-gray-500 uppercase tracking-widest">Bill Generated by Kalvix Nexus POS</div>
        </div>
      )}

      <style jsx global>{`
        .hidden-until-print {
          display: none;
        }
        @media print {
          body * { visibility: hidden; }
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
