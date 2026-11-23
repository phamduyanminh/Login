import { test, expect } from '@playwright/test';
import { BASE_URL, signIn, signUp, deleteUsersIfPresent } from '../../utils/api/api.js';
import { CLEANUP_ADMIN, PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER } from '../../utils/api/test-users.js';

test.describe.configure({ mode: 'serial' });

const TEST_ACCOUNTS = [PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER];

async function tokenCookie(context) {
    const { cookies } = await context.storageState();
    return cookies.find((c) => c.name === 'token');
}

test.describe('POST /users/signin', () => {
    let cleanupAdmin;

    // Create the two accounts once; every test signs in as them.
    test.beforeAll(async ({ playwright }) => {
        cleanupAdmin = await signIn(playwright, CLEANUP_ADMIN);
        await deleteUsersIfPresent(cleanupAdmin, TEST_ACCOUNTS);

        const request = await playwright.request.newContext({ baseURL: BASE_URL });
        for (const user of TEST_ACCOUNTS) {
            expect((await signUp(request, user)).status(), `sign up ${user.email}`).toBe(201);
        }
        await request.dispose();
    });

    test.afterAll(async () => {
        if (!cleanupAdmin) return;
        await deleteUsersIfPresent(cleanupAdmin, TEST_ACCOUNTS);
        await cleanupAdmin.dispose();
    });

    test('signs in a new user and sets the login cookie', async ({ playwright }) => {
        const context = await playwright.request.newContext({ baseURL: BASE_URL });

        const res = await context.post('/users/signin', {
            data: { email: PLAYWRIGHT_USER.email, password: PLAYWRIGHT_USER.password },
        });
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual({
            message: 'Login successful',
            user: { email: PLAYWRIGHT_USER.email },
        });

        const cookie = await tokenCookie(context);
        expect(cookie, 'token cookie').toBeDefined();
        expect(cookie.httpOnly).toBe(true);
        expect(cookie.sameSite).toBe('Lax');

        await context.dispose();
    });

    test('the cookie identifies the signed-in user', async ({ playwright }) => {
        for (const user of TEST_ACCOUNTS) {
            const context = await signIn(playwright, user);

            const me = await context.get('/users/me');
            expect(me.status()).toBe(200);
            expect(await me.json()).toEqual({
                user: { _id: expect.any(String), email: user.email, role: user.role },
            });

            await context.dispose();
        }
    });

    test('accepts the email in any case and with spaces', async ({ request }) => {
        const res = await request.post('/users/signin', {
            data: { email: '  NONADMIN_Playwright@GMAIL.com ', password: PLAYWRIGHT_USER.password },
        });
        expect(res.status()).toBe(200);
    });

    test('rejects a wrong password without setting a cookie', async ({ playwright }) => {
        const context = await playwright.request.newContext({ baseURL: BASE_URL });

        const res = await context.post('/users/signin', {
            data: { email: PLAYWRIGHT_USER.email, password: 'WrongPass1' },
        });
        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Incorrect password!' });
        expect(await tokenCookie(context)).toBeUndefined();

        await context.dispose();
    });

    test('rejects an email that has no account', async ({ request }) => {
        const res = await request.post('/users/signin', {
            data: { email: 'nobody_playwright@gmail.com', password: PLAYWRIGHT_USER.password },
        });
        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Incorrect email!' });
    });

    test('rejects a missing email or password', async ({ request }) => {
        for (const data of [{}, { email: PLAYWRIGHT_USER.email }, { password: PLAYWRIGHT_USER.password }]) {
            const res = await request.post('/users/signin', { data });
            expect(res.status(), JSON.stringify(data)).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid input for email or password!' });
        }
    });

    test('without signing in, /users/me says not authenticated', async ({ request }) => {
        const res = await request.get('/users/me');
        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Not Authenticated' });
    });
});
