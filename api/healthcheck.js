export default function handler(req, res) {
  return res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasMyUid: !!process.env.MY_UID,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasCronSecret: !!process.env.CRON_SECRET,
      hasGirlfriendEmail: !!process.env.GIRLFRIEND_EMAIL,
      hasEmailJsServiceId: !!process.env.VITE_EMAILJS_SERVICE_ID,
    }
  });
}
