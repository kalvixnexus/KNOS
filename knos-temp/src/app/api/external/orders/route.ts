import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid API key format. Use: Bearer YOUR_API_KEY' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // 1. Verify API Key and find the Restaurant Owner (userId)
    const keysQuery = query(collection(db, 'api_keys'), where('key', '==', apiKey));
    const keysSnapshot = await getDocs(keysQuery);
    
    if (keysSnapshot.empty) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key.' }, { status: 403 });
    }
    
    const ownerUserId = keysSnapshot.docs[0].data().userId;
    
    // 2. Parse external order details
    const body = await request.json();
    
    // 3. Save order to the owner's incoming api_orders list
    const orderRef = await addDoc(collection(db, 'api_orders'), {
      userId: ownerUserId,
      apiKeyUsed: apiKey,
      customerName: body.customerName || 'Online Customer',
      customerPhone: body.customerPhone || '',
      items: body.items || [],
      totalAmount: body.totalAmount || 0,
      paymentMode: body.paymentMode || 'Online',
      status: 'received',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      orderId: orderRef.id, 
      message: 'Order successfully sent to Kalvix Nexus POS. Waiting for restaurant approval.' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
