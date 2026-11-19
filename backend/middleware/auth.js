import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const jwt_secret = process.env.JWT_SECRET;

export function requireAuth (req, res, next) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({error: 'Not Authenticated'});
    try {
        req.user = jwt.verify(token, jwt_secret);
        next();
    } catch {
        return res.status(401).json({error: 'Invalid or expired token'});
    }
}

// Reads the role stored in the database, not the one in the token,
// so a role change takes effect immediately instead of at the next sign-in.
// Sets req.user.role to the current role.
export function loadCurrentRole (req, res, next) {
    requireAuth (req, res, async () => {
        try {
            const currentUser = await User.findById(req.user.userId).select('role');
            if (!currentUser) {
                return res.status(401).json({error: 'Not Authenticated'});
            }
            req.user.role = currentUser.role;
            next();
        } catch (error) {
            console.error('Role check error: ', error);
            return res.status(500).json({error: 'Could not verify permissions!'});
        }
    });
}

export function requireRole (...allowedRoles) {
    return (req, res, next) => {
        loadCurrentRole (req, res, () => {
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({error: 'Forbidden'});
            }
            next();
        });
    };
}
