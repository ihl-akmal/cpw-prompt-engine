
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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
 * DIAGNOSTIC VERSION
 * Upgrades a user to Pro, with extensive logging to identify the point of failure.
 */
const upgradeUserToPro = async (userId: string): Promise<boolean> => {
  console.log(`[UPGRADE_START] Initiating upgrade for user ID: ${userId}`);
  
  try {
    const collectionCandidates = ['users', 'Users'];
    for (const collectionName of collectionCandidates) {
      const userRef = db.collection(collectionName).doc(userId);
      
      console.log(`[UPGRADE_INFO] Checking for user in collection: '${collectionName}'...`);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        console.log(`[UPGRADE_INFO] User FOUND in '${collectionName}'. Preparing update.`);

        const updatePayload = {
          isPro: true,
          plan: 'pro',
          usage: {
            brandVoice: { generate: 0, refine: 0, download: 0 },
            promptEngine: { generate: 0, refine: 0 },
          },
          lastUpdate: FieldValue.serverTimestamp(),
        };

        console.log(`[UPGRADE_PREPARE] Payload is ready. Attempting to write to Firestore now... Payload: ${JSON.stringify(updatePayload)}`);

        await userRef.update(updatePayload);

        console.log(`[UPGRADE_SUCCESS] Firestore write operation completed for user ${userId}.`);
        return true;
      } else {
        console.log(`[UPGRADE_INFO] User NOT found in '${collectionName}'.`);
      }
    }

    // This will only be reached if the loop completes without finding the user.
    console.error(`[UPGRADE_FAIL] User document was not found in any candidate collections for ID: ${userId}. Aborting.`);
    return false;

  } catch (error) {
    // This is the most critical log. It will capture any permissions errors.
    console.error(`[UPGRADE_CRITICAL_ERROR] An unrecoverable error occurred during the Firestore operation for user ${userId}.`, error);
    return false;
  }
};


// --- 3. Webhook Handler ---
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    console.log("--- New Webhook Request ---");
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

    if (signature && timestamp) {
        const signingPayload = `${timestamp}.${rawBody}`;
        const expectedSignature = crypto
            .createHmac('sha256', mayarWebhookToken)
            .update(signingPayload)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid signature');
            return res.status(403).send('Invalid signature');
        }
    } else {
        console.log("Webhook received without signature. Continuing for simulation purposes.");
    }

    const event = JSON.parse(rawBody);
    console.log('Mayar event received:', event?.event);

    if (SUPPORTED_SUCCESS_EVENTS.has(event.event)) {
      console.log('Event data received:', JSON.stringify(event.data, null, 2));
      let userId = resolveUserIdFromEvent(event);

      if (!userId) {
        console.warn('Could not resolve userId from externalId/metadata. Attempting email fallback.');
        const email = event?.data?.customerEmail;

        if (email) {
            console.log(`Found customer email: ${email}. Querying Firestore.`);
            try {
                // Simplified query for diagnosis
                const usersQuery = db.collection('users').where('email', '==', email).limit(1);
                let userSnap = await usersQuery.get();

                if (userSnap.empty) {
                    console.log(`No user found in 'users' with email ${email}. Trying 'Users'.`);
                    const upperCaseUsersQuery = db.collection('Users').where('email', '==', email).limit(1);
                    userSnap = await upperCaseUsersQuery.get();
                }

                if (!userSnap.empty) {
                    userId = userSnap.docs[0].id;
                    console.log(`Successfully resolved userId via email fallback: ${userId}`);
                } else {
                    console.error(`No user found in any collection with email: ${email}`);
                }
            } catch(queryError) {
                console.error('Error querying Firestore by email:', queryError);
                userId = undefined;
            }
        } else {
            console.warn('No customerEmail found in event data for fallback.');
        }
      }

      if (!userId) {
          console.warn('Webhook processed, but userId could NOT be resolved by any method.');
          return res.status(400).send('Webhook received, but userId could not be resolved.');
      }

      console.log(`Final resolved user ID for upgrade process: ${userId}`);

      const upgraded = await upgradeUserToPro(userId);

      if (upgraded) {
        return res.status(200).json({ message: 'User upgrade processed successfully.' });
      } else {
        // The detailed error is already logged inside upgradeUserToPro
        return res.status(500).json({ message: 'User upgrade failed. See function logs for details.' });
      }
    }

    res.status(200).json({ message: 'Webhook received, but not a payment success event.' });
}
