
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const config = {
    api: {
      bodyParser: false
    }
  }

// --- FIX: Decode the service account key from Base64 ---
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}
const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
const serviceAccount = JSON.parse(serviceAccountJson);

const mayarWebhookToken = process.env.MAYAR_WEBHOOK_TOKEN as string;

// Initialize Firebase Admin SDK
let adminApp: App;
// Check if the app is already initialized to prevent errors
// Use a global variable to store the initialized app to avoid re-initialization
const globalWithApp = global as typeof global & { adminApp?: App };
if (!globalWithApp.adminApp) {
    globalWithApp.adminApp = initializeApp({
        credential: cert(serviceAccount),
    });
}
adminApp = globalWithApp.adminApp;
const db = getFirestore(adminApp);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const signature = req.headers['x-mayar-signature'] as string;
    const timestamp = req.headers['x-mayar-timestamp'] as string;
    
    // Convert the request body to a raw string
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

    // Verify the webhook signature
    const signingPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
        .createHmac('sha256', mayarWebhookToken)
        .update(signingPayload)
        .digest('hex');

    // DEBUG LOG
console.log("signature:", signature);
console.log("expected:", expectedSignature);

        if (signature !== expectedSignature) {
        return res.status(403).send('Invalid signature');
    }

    // Process the webhook
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
            console.error('Error upgrading user:', error);
            return res.status(500).json({ message: 'Error updating user in Firestore.' });
        }
    }

    res.status(200).json({ message: 'Webhook received' });
}
