import { test, expect } from '@playwright/test';
import { signIn } from '../../utils/api/api.js';
import { CLEANUP_ADMIN, PLAYWRIGHT_USER } from '../../utils/api/test-users.js';

// Bodies a real client never sends, but anyone can. Each must get a JSON 4xx,
// never a 500 or an HTML error page with a stack trace.

// A valid ObjectId that matches no document, so nothing is changed even if a
// check is missing (the route would then answer 404 instead of 400).
const UNKNOWN_ID = '000000000000000000000000';

async function expectJsonError(res, status, error) {
    expect(res.status()).toBe(status);
    expect(res.headers()['content-type']).toContain('application/json');
    expect(await res.json()).toEqual({ error });
}

test.describe('malformed request bodies', () => {
    test('sign-up and sign-in without a body', async ({ request }) => {
        for (const path of ['/users/signup', '/users/signin']) {
            const res = await request.post(path);
            await test.step(path, () => expectJsonError(res, 400, 'Invalid input for email or password!'));
        }
    });

    test('sign-up and sign-in with non-string email or password', async ({ request }) => {
        const bodies = [
            { email: 123, password: PLAYWRIGHT_USER.password, role: 'user' },
            { email: [PLAYWRIGHT_USER.email], password: PLAYWRIGHT_USER.password, role: 'user' },
            // An array used to pass the password check, because the regex test coerces it to a string.
            { email: PLAYWRIGHT_USER.email, password: [PLAYWRIGHT_USER.password], role: 'user' },
            { email: PLAYWRIGHT_USER.email, password: 123456, role: 'user' },
        ];
        for (const path of ['/users/signup', '/users/signin']) {
            for (const data of bodies) {
                const res = await request.post(path, { data });
                await test.step(`${path} ${JSON.stringify(data)}`, () =>
                    expectJsonError(res, 400, 'Invalid input for email or password!'));
            }
        }
    });

    test('invalid JSON', async ({ request }) => {
        const res = await request.post('/users/signin', {
            headers: { 'Content-Type': 'application/json' },
            data: '{"email": ',
        });
        await expectJsonError(res, 400, 'Request body must be valid JSON!');
    });

    test.describe('admin routes', () => {
        let admin;

        test.beforeAll(async ({ playwright }) => {
            admin = await signIn(playwright, CLEANUP_ADMIN);
        });

        test.afterAll(async () => {
            await admin?.dispose();
        });

        test('role change without a body', async () => {
            const res = await admin.patch(`/users/${UNKNOWN_ID}/role`);
            await expectJsonError(res, 400, 'Invalid role!');
        });

        test('role change with a non-string role', async () => {
            const res = await admin.patch(`/users/${UNKNOWN_ID}/role`, { data: { role: ['admin'] } });
            await expectJsonError(res, 400, 'Invalid role!');
        });

        test('employee update without a body', async () => {
            const res = await admin.patch(`/employees/${UNKNOWN_ID}`);
            await expectJsonError(res, 400, 'Name, department and job title are required!');
        });
    });
});
