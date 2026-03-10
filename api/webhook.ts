
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const config = {
    api: {
      bodyParser: false
    }
  }

// --- 1. Service Account Initialization ---
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

// --- 2. Firebase App Initialization ---
const app = getApps().length === 0 
    ? initializeApp({ credential: cert(serviceAccount) }) 
    : getApp();

const db = getFirestore(app);

// --- 3. Constants and Helpers ---
const SUPPORTED_SUCCESS_EVENTS = new Set([
  'payment.success',
  'payment.paid',
  'payment.completed',
  'payment.received'
]);

const resolveUserIdFromEvent = (event: any): string | undefined => {
  return event?.data?.externalId
    || event?.data?.external_id
    || event?.data?.metadata?.userId
    || event?.data?.metadata?.uid;
};

/**
 * Upgrades a user to Pro, resetting their usage limits.
 */
const upgradeUserToPro = async (userId: string): Promise<boolean> => {
  try {
    const collectionCandidates = ['users', 'Users'];
    for (const collectionName of collectionCandidates) {
      const userRef = db.collection(collectionName).doc(userId);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        const updatePayload = {
          isPro: true,
          plan: 'pro',
          usage: {
            brandVoice: { generate: 0, refine: 0, download: 0 },
            promptEngine: { generate: 0, refine: 0 },
          },
          lastUpdate: FieldValue.serverTimestamp(),
        };

        await userRef.update(updatePayload);
        // This log is safe and useful
        console.log(`Successfully upgraded user ${userId} to Pro and reset usage.`);
        return true;
      }
    }

    // This error is critical for debugging if a user is not found
    console.error(`User upgrade failed: Document was not found in any candidate collection for ID: ${userId}.`);
    return false;

  } catch (error) {
    // This error is critical for any Firestore permission/connection issues
    console.error(`CRITICAL: A Firestore error occurred while upgrading user ${userId}.`, error);
    return false;
  }
};

// --- 4. Main Webhook Handler ---
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const rawBody = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => { resolve(data); });
    });

    // Signature validation
    const signature = req.headers['x-mayar-signature'] as string;
    if (signature) {
        const timestamp = req.headers['x-mayar-timestamp'] as string;
        const signingPayload = `${timestamp}.${rawBody}`;
        const expectedSignature = crypto
            .createHmac('sha256', mayarWebhookToken)
            .update(signingPayload)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature.');
            return res.status(403).send('Invalid signature');
        }
    }

    const event = JSON.parse(rawBody);

    if (SUPPORTED_SUCCESS_EVENTS.has(event.event)) {
      // This log is safe and high-level
      console.log(`Processing successful payment event '${event.event}'.`);
      let userId = resolveUserIdFromEvent(event);

      if (!userId) {
        const email = event?.data?.customerEmail;
        if (email) {
            try {
                for (const collectionName of ['users', 'Users']){
                    const usersQuery = db.collection(collectionName).where('email', '==', email).limit(1);
                    const userSnap = await usersQuery.get();
                    if (!userSnap.empty) {
                        userId = userSnap.docs[0].id;
                        // This log is safe
                        console.log(`Resolved userId via email fallback.`);
                        break;
                    }
                }
            } catch(queryError) {
                console.error(`Error querying Firestore by email.`, queryError);
            }
        }
      }

      if (!userId) {
          console.error('Webhook failed: Could not resolve user ID from event data.');
          return res.status(400).send('Webhook received, but user ID could not be resolved.');
      }

      const upgraded = await upgradeUserToPro(userId);

      if (upgraded) {
        return res.status(200).json({ message: 'User upgrade successful.' });
      } else {
        return res.status(500).json({ message: 'User upgrade failed in Firestore. See function logs for details.' });
      }
    }

    return res.status(200).json({ message: 'Webhook received, but not a relevant event.' });
}
