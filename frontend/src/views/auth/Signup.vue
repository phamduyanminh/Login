<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router';

const error = ref('');
const router = useRouter();
const inputEmail = ref('');
const inputPassword = ref('');
const selectedRole = ref('');
const roles = ref([
  { text: 'Admin', value: 'admin' },
  { text: 'User', value: 'user' }
])

async function signup() {
    error.value = '';

    try {
        const res = await fetch('/users/signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: inputEmail.value,
                password: inputPassword.value,
                role: selectedRole.value
            })
        });

        const data = await res.json()
        if (!res.ok) {
            error.value = data.error
            return
        }

        router.push('/signin')
    } catch (err) {
        console.log('Caught an error: ', err);
        error.value = 'Cannot reach the server. Try again later!';
    }
}
</script>

<template>
    <h1>Sign Up</h1>
    <form class="SignupForm" @submit.prevent="signup">
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
        <div>
            <label> Select role: </label>
            <select v-model="selectedRole" required>
                <option disabled value="">Please select a role</option>
                <option 
                    v-for="role in roles" 
                    :key="role.value" 
                    :value="role.value"
                >
                    {{ role.text }}
                </option>
            </select>
        </div>
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