<script setup>
import { useRouter  } from 'vue-router';

const router = useRouter();

async function signout() {
    await fetch('/users/signout', {method: POST});
    router.push('/signin');
}

</script>

<template>
    <header class="home-header">
        <h1>Home</h1>
        <button @click="signout">Sign out</button>
    </header>
</template>

<style scoped>
    .home-header {
        display: flex;
        flex-direction: row;
        gap: 20px;
    }
</style>
