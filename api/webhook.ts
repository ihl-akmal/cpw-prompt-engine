
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

// IMPORTANT: In Vercel, use Environment Variables for sensitive data
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
const mayarSecretToken = process.env.MAYAR_SECRET_TOKEN as string;

// Initialize Firebase Admin SDK
let adminApp: App;
if (!adminApp) { // Prevent re-initialization
    adminApp = initializeApp({
        credential: cert(serviceAccount),
    });
}
const db = getFirestore(adminApp);

// --- The Main Handler Function for Vercel ---
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    // 1. Verify Mayar Signature
    const signature = req.headers['x-mayar-signature'] as string;
    const body = req.body;

    if (!signature) {
        console.log("Signature missing");
        return res.status(400).json({ message: 'Signature header is missing.' });
    }

    const calculatedSignature = crypto
        .createHmac('sha256', mayarSecretToken)
        .update(JSON.stringify(body))
        .digest('hex');

    if (calculatedSignature !== signature) {
        console.log("Invalid signature");
        return res.status(401).json({ message: 'Invalid signature.' });
    }

    // 2. Process the Webhook Event
    console.log('Signature verified. Processing event:', body.event);

    try {
        if (body.event === 'payment.success') {
            const { externalId, email } = body.data;

            if (!externalId) {
                console.log("Webhook received without externalId (user UID)");
                // We can't proceed without the UID, so we acknowledge and stop.
                return res.status(200).json({ message: 'Webhook received, but no user ID found.' });
            }

            const userRef = db.collection('users').doc(externalId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                console.error(`User with UID ${externalId} not found in Firestore.`);
                return res.status(404).json({ message: 'User not found.' });
            }

            // Update the user's status to 'isPro'
            await userRef.update({ isPro: true });

            console.log(`Successfully upgraded user ${externalId} to Pro.`);
            return res.status(200).json({ message: 'User successfully upgraded to Pro.' });
        }

        // Acknowledge other events without taking action
        res.status(200).json({ message: 'Webhook received and acknowledged.' });

    } catch (error) {
        console.error("Error processing webhook:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ message: "Internal Server Error", error: errorMessage });
    }
}
