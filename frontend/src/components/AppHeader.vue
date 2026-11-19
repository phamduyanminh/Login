<script setup>
import { useAuth, clearUser } from '@/workers/auth.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const { user } = useAuth();

async function signout() {
    try {
        await fetch('/users/signout', { method: 'POST' });
    } catch (err) {
        console.log('Caught an error: ', err);
    } finally {
        clearUser();
        router.push('/signin');
    }
}
</script>

<template>
    <header class="app-header">
        <nav class="nav">
            <RouterLink to="/home" class="brand">Home</RouterLink>

            <div class="links">
                <RouterLink v-if="user?.role === 'admin'" to="/settings" class="link">Settings</RouterLink>
                <button type="button" @click="signout">Sign out</button>
            </div>
        </nav>
    </header>
</template>

<style scoped>
.app-header {
    background: #fff;
    border-bottom: 1px solid #ddd;
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
}

.nav {
    max-width: 960px;
    margin: 0 auto;
    padding: 12px 16px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.brand {
    font-size: 18px;
    font-weight: bold;
    color: #222;
    text-decoration: none;
}

.links {
    display: flex;
    align-items: center;
    gap: 16px;
}

.link {
    font-size: 14px;
    color: #333;
    text-decoration: none;
}

.link:hover,
.brand:hover {
    text-decoration: underline;
}

.link.router-link-active {
    font-weight: bold;
}

button {
    padding: 8px 12px;
    font-size: 14px;
    border: none;
    border-radius: 4px;
    background: #333;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
}

button:hover {
    background: #111;
}
</style>
