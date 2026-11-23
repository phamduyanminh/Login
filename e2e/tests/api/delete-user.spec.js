import { test, expect } from '@playwright/test';
import { signIn, signUp, deleteUser, deleteUsersIfPresent } from '../../utils/api/api.js';
import { CLEANUP_ADMIN, PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER } from '../../utils/api/test-users.js';

test.describe.configure({ mode: 'serial' });

const TEST_ACCOUNTS = [PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER];

test.describe('DELETE /users', () => {
    let cleanupAdmin;

    test.beforeAll(async ({ playwright }) => {
        cleanupAdmin = await signIn(playwright, CLEANUP_ADMIN);
        await deleteUsersIfPresent(cleanupAdmin, TEST_ACCOUNTS);
    });

    test.afterAll(async () => {
        if (!cleanupAdmin) return;
        await deleteUsersIfPresent(cleanupAdmin, TEST_ACCOUNTS);
        await cleanupAdmin.dispose();
    });

    test('admin deletes the two Playwright accounts', async ({ playwright, request }) => {
        for (const user of [PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER]) {
            const res = await signUp(request, user);
            expect(res.status(), `sign up ${user.email}`).toBe(201);
        }

        // A regular user cannot delete anyone.
        const regularUser = await signIn(playwright, PLAYWRIGHT_USER);
        const forbidden = await deleteUser(regularUser, PLAYWRIGHT_ADMIN.email);
        expect(forbidden.status()).toBe(403);
        expect(await forbidden.json()).toEqual({ error: 'Forbidden' });
        await regularUser.dispose();

        // The cleanup admin deletes both accounts.
        for (const user of [PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER]) {
            const res = await deleteUser(cleanupAdmin, user.email);
            expect(res.status(), `delete ${user.email}`).toBe(200);
            expect(await res.json()).toEqual({ message: 'User deleted', user: { email: user.email } });
        }

        // Both accounts are gone.
        for (const user of [PLAYWRIGHT_ADMIN, PLAYWRIGHT_USER]) {
            const res = await request.post('/users/signin', {
                data: { email: user.email, password: user.password },
            });
            expect(res.status(), `sign in as deleted ${user.email}`).toBe(401);
            expect(await res.json()).toEqual({ error: 'Incorrect email!' });
        }

        // The cleanup admin is untouched.
        const stillThere = await signIn(playwright, CLEANUP_ADMIN);
        await stillThere.dispose();
    });

    test('normalises email case and whitespace', async ({ request }) => {
        expect((await signUp(request, PLAYWRIGHT_USER)).status()).toBe(201);

        const res = await deleteUser(cleanupAdmin, '  NONADMIN_Playwright@GMAIL.com ');
        expect(res.status()).toBe(200);
        expect((await res.json()).user.email).toBe(PLAYWRIGHT_USER.email);
    });

    test('rejects a missing or malformed email', async () => {
        for (const data of [{}, { email: 123 }]) {
            const res = await cleanupAdmin.delete('/users', { data });
            expect(res.status(), JSON.stringify(data)).toBe(400);
            expect(await res.json()).toEqual({ error: 'Invalid email!' });
        }
    });

    test('returns 404 for an unknown email', async () => {
        const res = await deleteUser(cleanupAdmin, 'nobody_playwright@gmail.com');
        expect(res.status()).toBe(404);
        expect(await res.json()).toEqual({ error: 'User not found!' });
    });

    // Uses a throwaway admin, never mptest, so a broken guard can only delete a test account.
    test('admin cannot delete their own account', async ({ playwright, request }) => {
        expect((await signUp(request, PLAYWRIGHT_ADMIN)).status()).toBe(201);
        const admin = await signIn(playwright, PLAYWRIGHT_ADMIN);

        const res = await deleteUser(admin, PLAYWRIGHT_ADMIN.email);
        expect(res.status()).toBe(400);
        expect(await res.json()).toEqual({ error: 'You cannot delete your own account!' });
        await admin.dispose();

        // The account is still there.
        const stillThere = await signIn(playwright, PLAYWRIGHT_ADMIN);
        await stillThere.dispose();
    });

    test('rejects an unauthenticated delete', async ({ request }) => {
        const res = await deleteUser(request, PLAYWRIGHT_USER.email);
        expect(res.status()).toBe(401);
    });
});
