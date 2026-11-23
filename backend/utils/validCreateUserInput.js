import UserRole from "../models/userRole.js";

class validCreateUserInput {
    static VALLID_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    static VALID_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    // Each check requires a string: the body is client JSON, and a regex test would
    // otherwise coerce arrays and numbers (["Abc123"] passes as "Abc123").
    validUsernameInput (email) {
        if (typeof email !== 'string' || !email) {
            console.error('Username is required');
            return false;
        }
        
        if (!validCreateUserInput.VALLID_EMAIL_PATTERN.test(email)) {
            console.error('Invalid email pattern');
            return false;
        }
        return true;
    }

    validPasswordInput (password) {
        if (typeof password !== 'string' || !password) {
            console.error('Password is required');
            return false;
        }
        
        if (!validCreateUserInput.VALID_PASSWORD_PATTERN.test(password)) {
            console.error('Invalid password pattern');
            return false;
        }
        return true;
    }

    validRoleInput (role) {
        if (typeof role !== 'string' || !role) {
            console.error('User role is required');
            return false;
        }

        if (!UserRole.isValid(role)) {
            console.error('Invalid user role!');
            return false;
        }
        return true;
    }
}

export default validCreateUserInput;