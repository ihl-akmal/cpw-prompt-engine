
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAYAR_SECRET_TOKEN = process.env.MAYAR_SECRET_TOKEN;
// --- FIX: Using the correct endpoint from the user's cURL example ---
const MAYAR_API_URL = 'https://api.mayar.id/hl/v1/invoice/create';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!MAYAR_SECRET_TOKEN) {
    console.error("MAYAR_SECRET_TOKEN is not set in environment variables.");
    return res.status(500).json({ message: 'Server configuration error: Payment API secret is missing.' });
  }

  const { name, email, userId } = req.body;
  if (!name || !email || !userId) {
    return res.status(400).json({ message: 'Missing required fields: name, email, userId' });
  }

  // --- FIX: Using the flat payload structure from cURL, and ADDING externalId for the webhook ---
  const payload = {
    name: name,
    email: email,
    amount: 50000,
    description: "Poral - Upgrade to Pro Account",
    redirectUrl: `${process.env.VERCEL_URL || 'http://localhost:3000'}?payment=success`,
    externalId: userId // This is CRITICAL for the webhook to identify the user
  };

  try {
    const apiResponse = await fetch(MAYAR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAYAR_SECRET_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error('Mayar API Error Body:', errorBody); // Log the full error from Mayar
      let errorMessage = `API request failed with status ${apiResponse.status}`;
       try {
        const errorJson = JSON.parse(errorBody);
        // Join error messages if they are in an array
        if (Array.isArray(errorJson.message)) {
            errorMessage = errorJson.message.join(', ');
        } else {
            errorMessage = errorJson.message || errorMessage;
        }
      } catch (e) {
        if (errorBody.length > 0 && errorBody.length < 200) {
          errorMessage = errorBody;
        }
      }
      return res.status(apiResponse.status).json({ message: `Mayar API Error: ${errorMessage}` });
    }

    const data = await apiResponse.json();

    // The response for invoice creation might be different. Let's check for `invoiceUrl` or `linkUrl`.
    const paymentUrl = data.invoiceUrl || data.linkUrl;

    if (paymentUrl) { 
      return res.status(200).json({ linkUrl: paymentUrl });
    } else {
      console.error("Payment URL not found in successful API response from Mayar", data);
      return res.status(500).json({ message: 'Payment URL not found in API response.' });
    }

  } catch (error: any) {
    console.error('Internal server error during fetch:', error);
    return res.status(500).json({ message: `An internal server error occurred: ${error.message}` });
  }
}
