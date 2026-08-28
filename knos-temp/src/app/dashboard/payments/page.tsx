'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function PaymentHistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(collection(db, 'bills'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const fetchedBills = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setBills(fetchedBills);
        } catch (error) {
          console.error("Error fetching bills:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-white p-8">Loading payments...</div>;

  const totalRevenue = bills.reduce((acc, bill) => acc + (bill.total || 0), 0);
  const totalCash = bills.filter(b => b.paymentMode === 'Cash').reduce((acc, bill) => acc + (bill.total || 0), 0);
  const totalUPI = bills.filter(b => b.paymentMode === 'UPI').reduce((acc, bill) => acc + (bill.total || 0), 0);
  const totalCard = bills.filter(b => b.paymentMode === 'Card').reduce((acc, bill) => acc + (bill.total || 0), 0);

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Payment Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg border-t-4 border-t-yellow-500">
          <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Revenue</div>
          <div className="text-4xl font-bold text-white">₹{totalRevenue}</div>
          <div className="text-gray-500 text-xs mt-2">{bills.length} Total Orders</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
          <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Cash Collected</div>
          <div className="text-3xl font-bold text-green-400">₹{totalCash}</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
          <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">UPI Payments</div>
          <div className="text-3xl font-bold text-blue-400">₹{totalUPI}</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
          <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Card Payments</div>
          <div className="text-3xl font-bold text-purple-400">₹{totalCard}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 text-white">Recent Transactions</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-black border-b border-gray-800 text-sm uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Payment Mode</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {bills.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No transactions yet.</td>
              </tr>
            ) : (
              bills.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(bill => (
                <tr key={bill.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    {new Date(bill.date).toLocaleDateString()} {new Date(bill.date).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">{bill.customerName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      bill.paymentMode === 'Cash' ? 'bg-green-500/20 text-green-400' :
                      bill.paymentMode === 'UPI' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {bill.paymentMode || 'Cash'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-right">₹{bill.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
