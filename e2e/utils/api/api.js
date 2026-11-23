import { expect } from '@playwright/test';

export const BASE_URL = 'http://localhost:3100';

// Signs in and returns a request context that holds that user's login cookie.
// Each user gets their own context so cookies never mix.
export async function signIn(playwright, user) {
    const context = await playwright.request.newContext({ baseURL: BASE_URL });
    const res = await context.post('/users/signin', {
        data: { email: user.email, password: user.password },
    });
    expect(res.status(), `sign in as ${user.email}`).toBe(200);
    return context;
}

export function signUp(request, user) {
    return request.post('/users/signup', {
        data: { email: user.email, password: user.password, role: user.role },
    });
}

export function deleteUser(context, email) {
    return context.delete('/users', { data: { email } });
}

// Deletes the given accounts if they exist, so leftovers from a failed run
// never cause "email already exists". A 404 just means it's already clean.
export async function deleteUsersIfPresent(adminContext, users) {
    for (const user of users) {
        const res = await deleteUser(adminContext, user.email);
        expect([200, 404], `clean up ${user.email}`).toContain(res.status());
    }
}
