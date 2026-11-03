import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import ValidCreateUserInput from '../utils/validCreateUserInput.js';

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

function requireAuth (req, res, next) {
    const token = req.cookie?.token;
    if (!token) return res.status(401).json({error: 'Not Authenticated'});
    try {
        req.user = jwt.verify(token, jwt_secret);
        next();
    } catch {
        return res.status(401).json({error: 'Invalid or expired token'});
    }
}

// POST sign up
router.post("/signup", async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const emailValid = validator.validUsernameInput(email);
    const passwordValid = validator.validPasswordInput(password);
    if (!emailValid || !passwordValid) {
        return res.status(400).json({error: 'Invalid input for email or password!'});
    }

    try {
        const existingEmail = await User.findOne({email});
        if (existingEmail) {
            return res.status(409).json({error: 'Email is already existed!'})
        }
    
        const user = new User({email, password});
        await user.save();
        return res.status(201).json({
            _id: user._id,
            email: user.email
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
            {userId: user._id, email: user.email},
            jwt_secret,
            {expiredIn: '1d'}
        );
        res.cookie('token', token, cookieOptions);

        return res.status(200).json({
            message: "Login successful",
            user: {email: user.email}
        });
    } catch (error) {
        return res.status(500).json({ error: "Could not sign in!" });
    }
});

// GET current user
router.get("/me", requireAuth, (req, res) => {
    res.json({user: {email: req.user.email}});
});

// POST sign out - Clearing cookies
router.post("/signout", (req, res) => {
    res.clearCookies('token', cookieOptions);
    res.status(200).json({message: "Signed out"});
});


export default router;

