require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const admin = require('firebase-admin');

// --- FIREBASE ADMIN INITIALIZATION ---
// This uses your secret key to give the server admin access
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore(); // Get a reference to the Firestore database

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3001;

// --- SENDGRID SETUP ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// --- API ENDPOINTS ---

// Get or Create User Profile in Firestore
app.post('/api/user', async (req, res) => {
    const { firebaseUid, email } = req.body;
    if (!firebaseUid || !email) {
        return res.status(400).json({ message: 'Firebase UID and email are required.' });
    }
    try {
        const userRef = db.collection('users').doc(firebaseUid);
        const doc = await userRef.get();

        if (doc.exists) {
            // User exists, return their data
            res.json(doc.data());
        } else {
            // New user, create a profile with default values
            const newUserProfile = {
                firebaseUid: firebaseUid,
                email: email,
                name: email.split('@')[0],
                points: 0,
                streak: 0,
                bio: 'Eager to learn and conquer new challenges!',
                upcomingClasses: [{ id: 1, title: 'Welcome Class!', time: 'Now' }],
                homework: [],
                testScores: [],
            };
            await userRef.set(newUserProfile);
            console.log("New user created in Firestore:", newUserProfile);
            res.status(201).json(newUserProfile);
        }
    } catch (error) {
        console.error("Error finding or creating user:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update User Profile in Firestore
app.put('/api/user/:uid', async (req, res) => {
    try {
        const userRef = db.collection('users').doc(req.params.uid);
        await userRef.update(req.body); // Update user with the data sent from the frontend
        const updatedDoc = await userRef.get();
        res.json(updatedDoc.data());
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a user's notes from Firestore
app.get('/api/notes/:uid', async (req, res) => {
    try {
        const notesSnapshot = await db.collection('notes').where('firebaseUid', '==', req.params.uid).get();
        const notes = [];
        notesSnapshot.forEach(doc => {
            notes.push({ id: doc.id, ...doc.data() });
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Save a new note to Firestore
app.post('/api/notes', async (req, res) => {
  try {
    const { subject, chapter, content, firebaseUid } = req.body;
    const newNote = { subject, chapter, content, firebaseUid };
    const docRef = await db.collection('notes').add(newNote);
    res.status(201).json({ id: docRef.id, ...newNote });
    console.log('A new note was saved to Firestore!');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send Welcome Email
app.post('/api/send-verification-email', async (req, res) => {
  const { recipientEmail } = req.body;
  const msg = {
    to: recipientEmail,
    from: 'your-verified-sender@example.com', // IMPORTANT: Use your verified sender email
    subject: 'Welcome to EduPortal!',
    html: `<h1>Welcome to EduPortal!</h1><p>Your account has been created successfully.</p>`,
  };
  try {
    await sgMail.send(msg);
    res.status(200).send({ message: 'Email sent successfully!' });
  } catch (error) {
    res.status(500).send({ message: 'Failed to send email.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

