import { Router } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import UserRole from '../models/userRole.js';
import ValidCreateUserInput from '../utils/validCreateUserInput.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const validator = new ValidCreateUserInput();
const jwt_secret = process.env.JWT_SECRET;


const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax', // CSRF protection
    secure: false,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
}

// POST sign up
router.post("/signup", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role;

    const emailValid = validator.validUsernameInput(email);
    const passwordValid = validator.validPasswordInput(password);
    const roleValid = validator.validRoleInput(role);
    if (!emailValid || !passwordValid) {
        return res.status(400).json({error: 'Invalid input for email or password!'});
    }

    if (!roleValid) {
        return res.status(400).json({error: 'Invalid role!'});
    }

    try {
        const existingEmail = await User.findOne({email});
        if (existingEmail) {
            return res.status(409).json({error: 'Email is already existed!'});
        }
    
        const user = new User({email, password, role});
        await user.save();
        return res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        return res.status(500).json({error: 'Could not sign up the account!'})
    }
});

// POST sign in 
router.post("/signin", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const emailValid = validator.validUsernameInput(email);
    const passwordValid = validator.validPasswordInput(password);
    if (!emailValid || !passwordValid) {
        return res.status(400).json({error: 'Invalid input for email or password!'});
    }

    try {
        const user = await User.findOne({email});
        if (!user){
            return res.status(401).json({ error: "Incorrect email!" });
        }

        const pwMatches = user.password == password;
        if (!pwMatches){
            return res.status(401).json({ error: "Incorrect password!" });
        }

        const token = jwt.sign(
            {userId: user._id, email: user.email, role: user.role},
            jwt_secret,
            {expiresIn: '1d'}
        );
        res.cookie('token', token, cookieOptions);

        return res.status(200).json({
            message: "Login successful",
            user: {email: user.email}
        });
    } catch (error) {
        console.error('Sign-in error: ', error);
        return res.status(500).json({ error: "Could not sign in!" });
    }
});

// GET current user (role read from the database so role changes show up right away)
router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('email role');
        if (!user) {
            return res.status(401).json({error: 'Not Authenticated'});
        }
        return res.json({user: {_id: user._id, email: user.email, role: user.role}});
    } catch (error) {
        console.error('Get current user error: ', error);
        return res.status(500).json({error: 'Could not load the current user!'});
    }
});

// GET all users (admin only)
router.get("/", requireRole(UserRole.ADMIN), async (req, res) => {
    try {
        const users = await User.find({}, 'email role').sort({email: 1});
        return res.json({users});
    } catch (error) {
        console.error('List users error: ', error);
        return res.status(500).json({error: 'Could not load users!'});
    }
});

// PATCH a user's role (admin only)
router.patch("/:id/role", requireRole(UserRole.ADMIN), async (req, res) => {
    const {id} = req.params;
    const role = req.body.role;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({error: 'Invalid user id!'});
    }

    if (!validator.validRoleInput(role)) {
        return res.status(400).json({error: 'Invalid role!'});
    }

    // An admin cannot change their own role, so there is always at least one admin left.
    if (id === String(req.user.userId)) {
        return res.status(400).json({error: 'You cannot change your own role!'});
    }

    try {
        const user = await User.findByIdAndUpdate(
            id,
            {role},
            {returnDocument: 'after', runValidators: true, projection: 'email role'}
        );
        if (!user) {
            return res.status(404).json({error: 'User not found!'});
        }
        return res.json({user});
    } catch (error) {
        console.error('Update role error: ', error);
        return res.status(500).json({error: 'Could not update the role!'});
    }
});

// POST sign out - Clearing cookies
router.post("/signout", (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.status(200).json({message: "Signed out"});
});


export default router;

