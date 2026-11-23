import { test, expect } from '@playwright/test';
import { isLocalMongoUrl } from '../../utils/db-guard.js';

test.describe('local-database guard', () => {
    test('accepts MongoDB on this machine', () => {
        for (const url of [
            'mongodb://localhost:27017/Login',
            'mongodb://127.0.0.1:27017/Login',
            'mongodb://[::1]:27017/Login',
            'mongodb://LOCALHOST/Login',
            'mongodb://user:secret@localhost:27017/Login?authSource=admin',
            'mongodb://localhost:27017,127.0.0.1:27018/Login?replicaSet=rs0',
        ]) {
            expect(isLocalMongoUrl(url), url).toBe(true);
        }
    });

    test('refuses Atlas and any other server', () => {
        for (const url of [
            'mongodb+srv://user:secret@cluster0.abcde.mongodb.net/Login',
            'mongodb://cluster0-shard-00-00.abcde.mongodb.net:27017/Login',
            'mongodb://192.168.1.20:27017/Login',
            'mongodb://localhost.example.com:27017/Login',
            'mongodb://localhost@db.example.com:27017/Login',
            'mongodb://localhost:27017,db.example.com:27017/Login',
            'http://localhost:27017/Login',
            'mongodb:///Login',
            '',
            undefined,
        ]) {
            expect(isLocalMongoUrl(url), String(url)).toBe(false);
        }
    });
});
