<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router';

const inputEmail = ref('');
const inputPassword = ref('');
const error = ref('');
const router = useRouter();

async function signup() {
    error.value = '';

    const res = await fetch('/users/signup', {
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

    router.push('/signin')
}
</script>

<template>
    <h1>Sign Up</h1>
    <form class="SignupForm">
        <label>
            Email:
            <input
                :type="email"
                v-model="inputEmail"
            />
        </label>
        <label>
            Password:
            <input
                :type="password"
                v-model="inputPassword"
            />
        </label>
        <button type="submit">Sign up</button>
        <p v-if="error">{{error}}</p>
        <p>
            Already have an account
            <RouterLink to="/signin">Sign-in here</RouterLink>
        </p>
    </form>
</template>

<style scoped>
.SignupForm {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
}

.SignupForm label {
    display: flex;
    flex-direction: row;
    gap: 10px;
}
</style>