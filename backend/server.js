import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';

// Initialize Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(cors({
    origin: "*", // 🔥 for testing (later restrict)
    credentials: true
}));
app.use(express.json());
app.use(helmet()); 

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'up', engine: 'Gemini Flash' }));

// Logging Initialization
console.log('--- Startup: AI Validator Backend ---');
console.log(`Port: ${PORT}`);
console.log('Google API Key Loaded:', process.env.GOOGLE_API_KEY ? 'YES ✓' : 'NO ✗');
console.log('--------------------------------------');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Root
app.get('/', (req, res) => res.send('API is live. 🚀'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server pulse detected on http://0.0.0.0:${PORT}`);
});