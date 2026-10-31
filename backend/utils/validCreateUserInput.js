class validCreateUserInput {
    static VALLID_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    static VALID_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    validUsernameInput (email) {
        if (!email) {
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
        if (!password) {
            console.error('Password is required');
            return false;
        }
        
        if (!validCreateUserInput.VALID_PASSWORD_PATTERN.test(password)) {
            console.error('Invalid password pattern');
            return false;
        }
        return true;
    }
}

export default validCreateUserInput;