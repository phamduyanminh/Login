<script setup>
import { RouterLink } from 'vue-router';

const router = RouterLink();

async function signout() {
    await fetch('/users/signout', {method: POST});
    router.push('/signin')
}

</script>

<template>
    <header class="home-header">
        <h1>Home</h1>
        <p>
            <RouterLink to="/signin">Sign out</RouterLink>
        </p>
    </header>
</template>

<style scoped>
    .home-header {
        display: flex;
        flex-direction: row;
        gap: 20px;
    }
</style>
