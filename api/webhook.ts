
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const config = {
    api: {
      bodyParser: false
    }
  }

// --- 1. Check and Validate Service Account Key ---
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

let serviceAccount;
try {
  const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (e: any) {
  console.error('CRITICAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Check if it is a valid Base64 encoded JSON.', e.message);
  throw new Error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY.');
}

const mayarWebhookToken = process.env.MAYAR_WEBHOOK_TOKEN as string;

// --- 2. Robust Firebase Initialization ---
const app = getApps().length === 0 
    ? initializeApp({ credential: cert(serviceAccount) }) 
    : getApp();

const db = getFirestore(app);

// --- 3. Webhook Handler ---
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    // DEBUGGING: Print all incoming headers
    console.log("Incoming Headers:", req.headers);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const signature = req.headers['x-mayar-signature'] as string;
    const timestamp = req.headers['x-mayar-timestamp'] as string;
    
    const rawBody = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        resolve(data);
      });
    });

    if (!signature || !timestamp) {
        console.log("Test webhook without signature");
        return res.status(200).send('Missing Mayar signature headers');
    }

    const signingPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
        .createHmac('sha256', mayarWebhookToken)
        .update(signingPayload)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('Invalid signature'); // More explicit logging
        return res.status(403).send('Invalid signature');
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.success') {
        const userId = event.data.externalId;

        if (!userId) {
            console.warn('Webhook received but missing externalId (userId)', event.data);
            return res.status(200).send('Webhook received, but no userId to process.');
        }

        try {
            const userRef = db.collection('users').doc(userId);
            await userRef.update({ isPro: true });

            console.log(`Successfully upgraded user ${userId} to Pro.`);
            return res.status(200).json({ message: 'User upgraded successfully' });
        } catch (error) {
            console.error(`Error upgrading user ${userId}:`, error);
            return res.status(500).json({ message: 'Error updating user in Firestore.' });
        }
    }

    res.status(200).json({ message: 'Webhook received' });
}
