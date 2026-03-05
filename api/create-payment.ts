
import type { VercelRequest, VercelResponse } from '@vercel/node';

// IMPORTANT: Use the same secret token you use for webhooks
const MAYAR_SECRET_TOKEN = process.env.MAYAR_SECRET_TOKEN;
const MAYAR_API_URL = 'https://api.mayar.id/v1/links';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Check for the secret token before doing anything else
  if (!MAYAR_SECRET_TOKEN) {
    console.error("MAYAR_SECRET_TOKEN is not set in environment variables.");
    return res.status(500).json({ message: 'Server configuration error: Payment API secret is missing.' });
  }

  const { name, email, userId } = req.body;
  if (!name || !email || !userId) {
    return res.status(400).json({ message: 'Missing required fields: name, email, userId' });
  }

  const payload = {
    name: name,
    email: email,
    amount: 50000,
    description: "Poral - Upgrade to Pro Account",
    redirectUrl: `${process.env.VERCEL_URL || 'http://localhost:3000'}?payment=success`,
    metadata: {
        userId: userId
    }
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

    // If the response is NOT successful, handle the error properly
    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text(); // Read body as text to prevent JSON parse errors
      console.error('Mayar API Error:', errorBody);
      let errorMessage = `API request failed with status ${apiResponse.status}`;
      try {
        // Try to parse for a more specific message from Mayar
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        // The error body was not JSON, use the raw text if it's short
        if (errorBody.length > 0 && errorBody.length < 200) {
          errorMessage = errorBody;
        }
      }
      return res.status(apiResponse.status).json({ message: `Mayar API Error: ${errorMessage}` });
    }

    // If the response IS successful, proceed to get the URL
    const data = await apiResponse.json();

    if (data && data.data && data.data.linkUrl) {
      return res.status(200).json({ linkUrl: data.data.linkUrl });
    } else {
      console.error("Payment URL not found in successful API response from Mayar");
      return res.status(500).json({ message: 'Payment URL not found in API response.' });
    }

  } catch (error: any) {
    console.error('Internal server error during fetch:', error);
    return res.status(500).json({ message: `An internal server error occurred: ${error.message}` });
  }
}
