import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Register user (farmer or buyer)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, location, phone } = req.body;

    if (!name || !email || !password || !role || !location) {
      return res.status(400).json({ error: 'Please provide all required fields (name, email, password, role, location).' });
    }

    // Email format validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (!['farmer', 'buyer'].includes(role.toLowerCase())) {
      return res.status(400).json({ error: 'Role must be either "farmer" or "buyer".' });
    }

    // Check existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role, location, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      role.toLowerCase(),
      location.trim(),
      phone ? phone.trim() : null
    );

    const user = {
      id: result.lastInsertRowid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role.toLowerCase(),
      location: location.trim(),
      phone: phone ? phone.trim() : null
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully!',
      user,
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const dbUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!dbUser) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, dbUser.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      location: dbUser.location,
      phone: dbUser.phone
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      user,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to authenticate user.' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  const dbUser = db.prepare('SELECT id, name, email, role, location, phone, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!dbUser) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user: dbUser });
});

export default router;
