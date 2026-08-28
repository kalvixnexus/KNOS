import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // In a real app, query the ApiKeys collection to find the restaurant
    // For MVP, we just assume the API key is valid and save the order
    
    const body = await request.json();
    
    const orderRef = await addDoc(collection(db, 'orders'), {
      apiKeyUsed: apiKey,
      customerName: body.customerName,
      items: body.items,
      totalAmount: body.totalAmount,
      status: 'received',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, orderId: orderRef.id, message: 'Order received and bill generated in history.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
