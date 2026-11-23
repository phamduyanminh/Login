import { test, expect } from '@playwright/test';
import { signIn, signUp, deleteUsersIfPresent } from '../../utils/api/api.js';
import { CLEANUP_ADMIN, PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER } from '../../utils/api/test-users.js';

test.describe.configure({ mode: 'serial' });

const TEST_ACCOUNTS = [PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER];

test.describe('POST /users/signup', () => {
    let cleanupAdmin;

    test.beforeAll(async ({ playwright }) => {
        cleanupAdmin = await signIn(playwright, CLEANUP_ADMIN);
        await deleteUsersIfPresent(cleanupAdmin, TEST_ACCOUNTS);
    });

    test.afterEach(async () => {
        await deleteUsersIfPresent(cleanupAdmin, TEST_ACCOUNTS);
    });

    test.afterAll(async () => {
        if (!cleanupAdmin) return;
        await cleanupAdmin.dispose();
    });

    test('creates a regular user', async ({ request }) => {
        const res = await signUp(request, PLAYWRIGHT_USER);
        expect(res.status()).toBe(201);

        const body = await res.json();
        expect(body).toEqual({
            _id: expect.any(String),
            email: PLAYWRIGHT_USER.email,
            role: 'user',
        });
    });

    test('creates an admin', async ({ request }) => {
        const res = await signUp(request, PLAYWRIGHT_ADMIN);
        expect(res.status()).toBe(201);
        expect((await res.json()).role).toBe('admin');
    });

    test('stores the email trimmed and lowercased', async ({ request }) => {
        const res = await signUp(request, { ...PLAYWRIGHT_USER, email: '  NONADMIN_Playwright@GMAIL.com ' });
        expect(res.status()).toBe(201);
        expect((await res.json()).email).toBe(PLAYWRIGHT_USER.email);
    });

    test('never returns the password', async ({ request }) => {
        const res = await signUp(request, PLAYWRIGHT_USER);
        expect(res.status()).toBe(201);
        expect(await res.json()).not.toHaveProperty('password');
    });

    test('rejects an email that is already used', async ({ request }) => {
        expect((await signUp(request, PLAYWRIGHT_USER)).status()).toBe(201);

        const again = await signUp(request, PLAYWRIGHT_USER);
        expect(again.status()).toBe(409);
        expect(await again.json()).toEqual({ error: 'Email is already existed!' });
    });

    test('creates one account when the same email signs up at the same time', async ({ request }) => {
        // All requests can pass the "email already used" check before any insert,
        // so the unique index decides. The losers must get 409, not 500.
        const responses = await Promise.all(
            Array.from({ length: 5 }, () => signUp(request, PLAYWRIGHT_USER))
        );
        const statuses = responses.map((res) => res.status()).sort();
        expect(statuses).toEqual([201, 409, 409, 409, 409]);
    });

    test('rejects an invalid email', async ({ request }) => {
        for (const email of ['', 'not-an-email', 'missing@domain']) {
            const res = await signUp(request, { ...PLAYWRIGHT_USER, email });
            expect(res.status(), `email "${email}"`).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid input for email or password!' });
        }
    });

    test('rejects a weak password', async ({ request }) => {
        // Needs 6+ characters with a lowercase letter, an uppercase letter and a digit.
        for (const password of ['', 'Ab1', 'alllower1', 'ALLUPPER1', 'NoDigits']) {
            const res = await signUp(request, { ...PLAYWRIGHT_USER, password });
            expect(res.status(), `password "${password}"`).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid input for email or password!' });
        }
    });

    test('rejects a missing or unknown role', async ({ request }) => {
        for (const role of [undefined, 'superuser']) {
            const res = await signUp(request, { ...PLAYWRIGHT_USER, role });
            expect(res.status(), `role ${role}`).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid role!' });
        }
    });
});
