import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { isLocalMongoUrl } from './utils/db-guard.js';

// Port for the backend the tests start, kept away from the dev server on 3000.
const PORT = 3100;

const envFile = fileURLToPath(new URL('./.env.test', import.meta.url));
if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
}

// The database the test backend connects to. E2E_DB (from the shell or .env.test)
// can point it elsewhere, but only at a MongoDB on this machine, never Atlas.
// The backend's own .env cannot override it: dotenv never replaces a variable
// that is already set, and Playwright sets DB for the backend below.
const DB = process.env.E2E_DB || 'mongodb://localhost:27017/Login';
if (!isLocalMongoUrl(DB)) {
    throw new Error('Refusing to run: E2E_DB must be a mongodb:// URL on localhost, 127.0.0.1 or [::1].');
}

if (!process.env.ADMIN_PASSWORD) {
    throw new Error('Missing ADMIN_PASSWORD: copy .env.test.example to .env.test and fill it in.');
}

export default defineConfig({
    testDir: './tests',
    workers: 1,
    fullyParallel: false,
    reporter: [['list'], ['html', { open: 'never' }]],
    // One project per kind of test. A "frontend" project (browser tests in
    // tests/frontend, against the Vite app) goes here later.
    projects: [
        {
            name: 'api',
            testDir: './tests/api',
            use: { baseURL: `http://localhost:${PORT}` },
        },
        {
            // Checks of the test setup itself, such as the local-database guard.
            name: 'config',
            testDir: './tests/config',
        },
    ],
    webServer: {
        command: 'node index.js',
        cwd: fileURLToPath(new URL('../backend', import.meta.url)),
        // /users/me answers 401 without a cookie, which Playwright counts as "ready".
        url: `http://localhost:${PORT}/users/me`,
        reuseExistingServer: false,
        env: {
            DB,
            PORT: String(PORT),
            JWT_SECRET: 'playwright-test-secret',
        },
        stdout: 'pipe',
    },
});
