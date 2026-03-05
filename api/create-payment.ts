
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAYAR_SECRET_TOKEN = process.env.MAYAR_SECRET_TOKEN;
// --- FIX: Change to the correct endpoint for Single Payment Request ---
const MAYAR_API_URL = 'https://api.mayar.id/hl/v1/payment/create';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!MAYAR_SECRET_TOKEN) {
    console.error("MAYAR_SECRET_TOKEN is not set.");
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  const { name, email, userId } = req.body;
  if (!name || !email || !userId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

  // --- FIX: Adjust payload to match the Single Payment Request format ---
  const payload = {
    name: name,
    email: email,
    mobile: "081234567890", // This can be a placeholder if not collected
    amount: 50000,         // Use 'amount' for single payment
    description: "Poral - Upgrade to Pro Account",
    redirectUrl: `${baseUrl}?payment=success`,
    externalId: userId       // This is crucial for linking the payment back to the user
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

    const responseBodyText = await apiResponse.text();

    if (!apiResponse.ok) {
      console.error('Mayar API Error Body:', responseBodyText);
      return res.status(apiResponse.status).json({ message: `Mayar API Error: ${responseBodyText}` });
    }
    
    const data = JSON.parse(responseBodyText);

    // This response handling logic is likely the same and should work
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      const paymentInfo = data.data;

      const paymentUrl = paymentInfo.link;

      if (paymentUrl) {
        return res.status(200).json({ linkUrl: paymentUrl });
      } else {
        console.error("The 'link' field was not found inside the 'data' object from Mayar", paymentInfo);
        return res.status(500).json({ message: 'Payment URL field not found in Mayar response data.' });
      }
    } else {
      console.error("Unexpected response structure from Mayar. Expected 'data' to be an object.", data);
      return res.status(500).json({ message: 'Unexpected API response structure from Mayar.' });
    }

  } catch (error: any) {
    console.error('Internal server error during fetch:', error);
    return res.status(500).json({ message: `An internal server error occurred: ${error.message}` });
  }
}
