<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router';

const error = ref('');
const router = useRouter();
const inputEmail = ref('');
const inputPassword = ref('');
const confirmPassword = ref('');
const selectedRole = ref('');
const roles = ref([
  { text: 'Admin', value: 'admin' },
  { text: 'User', value: 'user' }
])

const passwordRules = computed(() => [
  { text: 'At least 6 characters', met: inputPassword.value.length >= 6 },
  { text: 'One lowercase letter', met: /[a-z]/.test(inputPassword.value) },
  { text: 'One uppercase letter', met: /[A-Z]/.test(inputPassword.value) },
  { text: 'One number', met: /\d/.test(inputPassword.value) }
]);
const passwordsMatch = computed(() => inputPassword.value === confirmPassword.value);

async function signup() {
    error.value = '';

    if (!passwordsMatch.value) {
        error.value = 'Passwords do not match.';
        return;
    }

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
    <div class="page">
        <form class="card" @submit.prevent="signup">
            <h1>Sign Up</h1>

            <div class="field">
                <label for="signup-email">Email</label>
                <input
                    id="signup-email"
                    type="email"
                    v-model="inputEmail"
                    autocomplete="email"
                    required
                />
            </div>

            <div class="field">
                <label for="signup-password">Password</label>
                <input
                    id="signup-password"
                    type="password"
                    v-model="inputPassword"
                    autocomplete="new-password"
                    aria-describedby="signup-password-rules"
                    required
                />
                <ul id="signup-password-rules" class="rules">
                    <li
                        v-for="rule in passwordRules"
                        :key="rule.text"
                        :class="{ match: rule.met }"
                    >
                        {{ rule.met ? '✓' : '•' }} {{ rule.text }}
                    </li>
                </ul>
            </div>

            <div class="field">
                <label for="signup-confirm-password">Re-enter password</label>
                <input
                    id="signup-confirm-password"
                    type="password"
                    v-model="confirmPassword"
                    autocomplete="new-password"
                    required
                />
                <p
                    v-if="confirmPassword"
                    :class="passwordsMatch ? 'match' : 'mismatch'"
                    aria-live="polite"
                >
                    {{ passwordsMatch ? 'Password matched' : 'Password not matched' }}
                </p>
            </div>

            <div class="field">
                <label for="signup-role">Role</label>
                <select id="signup-role" v-model="selectedRole" required>
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

            <p v-if="error" class="error">{{ error }}</p>

            <button type="submit">Sign up</button>

            <p class="footer">
                Already have an account?
                <RouterLink to="/signin">Sign in</RouterLink>
            </p>
        </form>
    </div>
</template>

<style scoped src="./auth.css"></style>
