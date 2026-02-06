// Using fetch-based approach instead of firebase-admin SDK
// This avoids issues with the large firebase-admin package in serverless

const SATVIK_UID = process.env.MY_UID;
const CALORIE_THRESHOLD = parseInt(process.env.CALORIE_THRESHOLD) || 1800;

async function getFirebaseToken() {
  const jwt = await createJWT();
  const response = await fetch(
    `https://oauth2.googleapis.com/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    }
  );
  const data = await response.json();
  return data.access_token;
}

async function createJWT() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: process.env.FIREBASE_CLIENT_EMAIL,
    sub: process.env.FIREBASE_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  };

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  // Import crypto for signing
  const crypto = await import('crypto');
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, 'base64url');
  
  return `${signatureInput}.${signature}`;
}

async function queryFirestore(accessToken, uid, dateString) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'logs' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'uid' },
                    op: 'EQUAL',
                    value: { stringValue: uid },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'dateString' },
                    op: 'EQUAL',
                    value: { stringValue: dateString },
                  },
                },
              ],
            },
          },
        },
      }),
    }
  );
  return response.json();
}

async function getAlertDoc(accessToken, uid) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/alerts/${uid}`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );
  if (response.status === 404) return null;
  return response.json();
}

async function setAlertDoc(accessToken, uid, data) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/alerts/${uid}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          lastAlertDate: { stringValue: data.lastAlertDate },
          lastAlertTime: { timestampValue: new Date().toISOString() },
          totalCalories: { integerValue: data.totalCalories.toString() },
        },
      }),
    }
  );
}

async function sendEmailJS(templateParams) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: process.env.VITE_EMAILJS_SERVICE_ID,
      template_id: process.env.VITE_EMAILJS_TEMPLATE_ID,
      user_id: process.env.VITE_EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
    }),
  });
  return response.ok;
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isManualTrigger = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isManualTrigger) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get Firebase access token
    const accessToken = await getFirebaseToken();

    // Query logs
    const logsResult = await queryFirestore(accessToken, SATVIK_UID, yesterdayStr);

    if (!logsResult || logsResult.length === 0 || !logsResult[0].document) {
      return res.status(200).json({ message: 'No logs for yesterday', date: yesterdayStr });
    }

    // Calculate total calories
    let totalCalories = 0;
    for (const result of logsResult) {
      if (result.document?.fields?.calories?.integerValue) {
        totalCalories += parseInt(result.document.fields.calories.integerValue);
      }
    }

    // Check if within limit
    if (totalCalories <= CALORIE_THRESHOLD) {
      return res.status(200).json({
        message: 'Within calorie limit',
        totalCalories,
        threshold: CALORIE_THRESHOLD,
      });
    }

    // Check if alert already sent
    const alertDoc = await getAlertDoc(accessToken, SATVIK_UID);
    if (alertDoc?.fields?.lastAlertDate?.stringValue === yesterdayStr) {
      return res.status(200).json({ message: 'Alert already sent', date: yesterdayStr });
    }

    // Send email
    const emailSent = await sendEmailJS({
      to_email: process.env.GIRLFRIEND_EMAIL,
      cc_email: process.env.MY_EMAIL,
      girlfriend_name: process.env.GIRLFRIEND_NAME,
      total_calories: totalCalories,
      calorie_threshold: CALORIE_THRESHOLD,
      calories_over: totalCalories - CALORIE_THRESHOLD,
    });

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Record alert
    await setAlertDoc(accessToken, SATVIK_UID, {
      lastAlertDate: yesterdayStr,
      totalCalories,
    });

    return res.status(200).json({
      message: 'Alert sent!',
      totalCalories,
      threshold: CALORIE_THRESHOLD,
      date: yesterdayStr,
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
