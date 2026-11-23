// Existing admin in the local Login database. The tests only sign in as it;
// they never create, change or delete it. Its password lives in .env.test.
export const CLEANUP_ADMIN = {
    email: 'mptest@gmail.com',
    password: process.env.ADMIN_PASSWORD,
};

// Accounts the tests create and delete. Test-only password.
export const PLAYWRIGHT_ADMIN = {
    email: 'admin_playwright@gmail.com',
    password: 'Playwright1',
    role: 'admin',
};

export const PLAYWRIGHT_USER = {
    email: 'nonadmin_playwright@gmail.com',
    password: 'Playwright1',
    role: 'user',
};
