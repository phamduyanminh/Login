<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router';

const inputEmail = ref('');
const inputPassword = ref('');
const error = ref('');
const router = useRouter();

async function signin() {
    error.value = '';

    try {
        const res = await fetch('/users/signin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: inputEmail.value,
                password: inputPassword.value
            })
        });

        const data = await res.json()
        if (!res.ok) {
            error.value = data.error
            return
        }

        router.push('/home')
    } catch (err) {
        console.log('Caught an error: ', err);
        error.value = 'Cannot reach the server. Try again later!';
    }
}
</script>

<template>
    <h1>Sign In</h1>
    <form class="SigninForm" @submit.prevent="signin">
        <label>
            Email: 
            <input
                type="email"
                v-model="inputEmail"
                required
            />
        </label>
        <label>
            Password: 
            <input
                type="password"
                v-model="inputPassword"
                required
            />
        </label>
        <button type="submit">Sign in</button>
        <p v-if="error">{{error}}</p>
        <p>
            Don't have an account
            <RouterLink to="/signup">Sign-up here</RouterLink>
        </p>
    </form>
</template>

<style scoped>
    .SigninForm {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .SigninForm label {
        display: flex;
        flex-direction: row;
        gap: 10px;
    }
</style>