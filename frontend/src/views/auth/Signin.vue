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
            error.value = data.error;
            return;
        }

        router.push('/home')
    } catch (err) {
        console.log('Caught an error: ', err);
        error.value = 'Cannot reach the server. Try again later!';
    }
}
</script>

<template>
    <div class="page">
        <form class="card" @submit.prevent="signin">
            <h1>Sign In</h1>

            <div class="field">
                <label for="signin-email">Email</label>
                <input
                    id="signin-email"
                    type="email"
                    v-model="inputEmail"
                    autocomplete="email"
                    required
                />
            </div>

            <div class="field">
                <label for="signin-password">Password</label>
                <input
                    id="signin-password"
                    type="password"
                    v-model="inputPassword"
                    autocomplete="current-password"
                    required
                />
            </div>

            <p v-if="error" class="error">{{ error }}</p>

            <button type="submit">Sign in</button>

            <p class="footer">
                Don't have an account?
                <RouterLink to="/signup">Sign up</RouterLink>
            </p>
        </form>
    </div>
</template>

<style scoped src="./auth.css"></style>
