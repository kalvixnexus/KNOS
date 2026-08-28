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
                <tr key={bill.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(bill.date).toLocaleDateString()} <br/>
                    <span className="text-xs text-gray-500">{new Date(bill.date).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedBill(bill)}
                      className="font-mono text-yellow-500 hover:text-yellow-400 hover:underline transition-colors font-bold"
                    >
                      {bill.invoiceNo}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {bill.customerName}
                    {bill.customerPhone && <div className="text-xs text-gray-500">{bill.customerPhone}</div>}
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

              <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
                <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">Total Amount</span>
                <span className="text-2xl font-black text-yellow-500">₹{selectedBill.total}</span>
              </div>
            </div>
            
            <div className="p-4 bg-black border-t border-gray-800 flex justify-end">
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
    </div>
  );
}
