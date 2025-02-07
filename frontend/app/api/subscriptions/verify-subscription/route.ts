import { NextResponse } from 'next/server';
import { API_URL } from '@/app/config/config';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function verifySubscriptionWithRetry(
  paymentId: string,
  subscriptionId: string,
  signature: string,
  token: string,
  retryCount = 0
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/subscriptions/verify-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        payment_id: paymentId,
        subscription_id: subscriptionId,
        signature: signature
      })
    });

    const data = await response.json();

    // If status is 'created' and we haven't exceeded max retries
    if (response.status === 202 && retryCount < MAX_RETRIES) {
      console.log(`Subscription status still pending, retrying in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return verifySubscriptionWithRetry(paymentId, subscriptionId, signature, token, retryCount + 1);
    }

    // If we get a non-202 status but the response isn't ok
    if (!response.ok) {
      throw new Error(data.detail || 'Verification failed');
    }

    return data;
  } catch (error) {
    console.error('Error in subscription verification:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentId, subscriptionId, signature } = body;

    if (!paymentId || !subscriptionId || !signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await verifySubscriptionWithRetry(
      paymentId,
      subscriptionId,
      signature,
      token
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Subscription verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: error.status || 500 }
    );
  }
} 