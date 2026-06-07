import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import userRoutes from './routes/user.routes.js';
import resourceRoutes from './routes/resource.routes.js';

export const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    },
}));

app.use(userRoutes);
app.use(resourceRoutes);
