import { Router } from 'express';
import User from '../models/user.model.js';
import ValidCreateUserInput from '../utils/validCreateUserInput.js';

const router = Router();
const validator = new ValidCreateUserInput();

// POST create account
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

// POST login
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

        return res.status(200).json({
            message: "Login successful",
            user: {email: user.email}
        });
    } catch (error) {
        return res.status(500).json({ error: "Could not sign in!" });
    }
});

export default router;

