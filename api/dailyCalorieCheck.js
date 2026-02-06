import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import emailjs from '@emailjs/nodejs';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// Your specific UID and settings from environment variables
const SATVIK_UID = process.env.MY_UID;
const CALORIE_THRESHOLD = parseInt(process.env.CALORIE_THRESHOLD) || 1800;

export default async function handler(req, res) {
  // Verify this is a legitimate cron job request
  // Vercel cron sends CRON_SECRET via x-vercel-cron-signature or we check Authorization header for manual triggers
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
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    console.log(`Checking calories for ${yesterdayStr}`);

    // Query Firestore for your logs from yesterday
    const logsSnapshot = await db
      .collection('logs')
      .where('uid', '==', SATVIK_UID)
      .where('dateString', '==', yesterdayStr)
      .get();

    if (logsSnapshot.empty) {
      console.log('No logs found for yesterday');
      return res.status(200).json({ message: 'No logs for yesterday', date: yesterdayStr });
    }

    // Calculate total calories
    let totalCalories = 0;
    logsSnapshot.forEach((doc) => {
      totalCalories += doc.data().calories || 0;
    });

    console.log(`Total calories for ${yesterdayStr}: ${totalCalories}`);

    // Check if exceeded threshold
    if (totalCalories <= CALORIE_THRESHOLD) {
      console.log('Within limit, no email needed');
      return res.status(200).json({ 
        message: 'Within calorie limit', 
        totalCalories, 
        threshold: CALORIE_THRESHOLD 
      });
    }

    // Check if alert was already sent for yesterday
    const alertDoc = await db.collection('alerts').doc(SATVIK_UID).get();
    if (alertDoc.exists && alertDoc.data().lastAlertDate === yesterdayStr) {
      console.log('Alert already sent for this date');
      return res.status(200).json({ message: 'Alert already sent', date: yesterdayStr });
    }

    // Send email via EmailJS
    const templateParams = {
      to_email: process.env.GIRLFRIEND_EMAIL,
      cc_email: process.env.MY_EMAIL,
      girlfriend_name: process.env.GIRLFRIEND_NAME,
      total_calories: totalCalories,
      calorie_threshold: CALORIE_THRESHOLD,
      calories_over: totalCalories - CALORIE_THRESHOLD,
    };

    await emailjs.send(
      process.env.VITE_EMAILJS_SERVICE_ID,
      process.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY,
      }
    );

    // Record that alert was sent
    await db.collection('alerts').doc(SATVIK_UID).set({
      lastAlertDate: yesterdayStr,
      lastAlertTime: new Date(),
      totalCalories: totalCalories,
    });

    console.log('Alert sent successfully!');
    return res.status(200).json({ 
      message: 'Alert sent!', 
      totalCalories, 
      threshold: CALORIE_THRESHOLD,
      date: yesterdayStr
    });

  } catch (error) {
    console.error('Error in daily calorie check:', error);
    return res.status(500).json({ error: error.message });
  }
}
