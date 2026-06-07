import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { handleApiError, logApiError } from '../utils/errors.js';
import { toSessionUser } from '../utils/user.js';

export async function register(req, res) {
    try {
        const { fName, lName, email, password } = req.body;

        if (!fName || !lName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { fName, lName, email, password: hashedPassword },
        });

        req.session.user = toSessionUser(user);
        res.status(201).json({ message: 'Account created', user: req.session.user });
    } catch (error) {
        handleApiError(res, 'POST /api/users', error, req);
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.user = toSessionUser(user);
        res.json({ message: 'Login successful', user: req.session.user });
    } catch (error) {
        handleApiError(res, 'POST /login', error, req);
    }
}

export function getProfile(req, res) {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({ user: req.session.user });
    } catch (error) {
        handleApiError(res, 'GET /profile', error, req);
    }
}

export function logout(req, res) {
    try {
        req.session.destroy((err) => {
            if (err) {
                logApiError('POST /logout', err, req);
                return res.status(500).json({ message: 'Logout failed' });
            }
            res.json({ message: 'Logout successful' });
        });
    } catch (error) {
        handleApiError(res, 'POST /logout', error, req);
    }
}
