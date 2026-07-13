const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const { getUploadRoot, getUploadUrlPrefix } = require('./utils/uploadPaths');

dotenv.config({ path: path.join(__dirname, '.env') });

const passport = require('./config/passport');

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const guestOrderRoutes = require('./routes/guestOrderRoutes');
const subscriberRoutes = require('./routes/subscriberRoute');

// Import error handlers
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = (process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// ========== MIDDLEWARE ==========
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for Passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'a-default-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files for uploaded images
app.use(getUploadUrlPrefix(), express.static(getUploadRoot()));

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Server is running', success: true });
});

// ========== API ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/guest-orders', guestOrderRoutes);
app.use('/api/subscribers', subscriberRoutes);

// ── PROMO CODE ROUTES ──
const promocodeRoutes = require('./routes/promocodeRoutes');
app.use('/api/promocodes', promocodeRoutes);

// ========== ERROR HANDLING MIDDLEWARE ==========
app.use(notFound);
app.use(errorHandler);

module.exports = app;