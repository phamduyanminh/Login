import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

// The tests only ever run against the local Docker MongoDB, never Atlas.
const DB = 'mongodb://localhost:27017/Login';
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];
if (!LOCAL_HOSTS.includes(new URL(DB).hostname)) {
    throw new Error('Refusing to run: tests only run against a local MongoDB.');
}

// Port for the backend the tests start, kept away from the dev server on 3000.
const PORT = 3100;

const envFile = fileURLToPath(new URL('./.env.test', import.meta.url));
if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
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
