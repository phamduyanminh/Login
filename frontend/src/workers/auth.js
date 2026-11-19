import { ref } from 'vue';

// Shared state: the current user once loaded, or null.
const user = ref(null);

// Components read this.
export function useAuth() {
    return { user };
}

// Fetch the signed-in user and remember the result.
// Returns the user object, or null when not signed in.
export async function loadUser() {
    try {
        const res = await fetch('/users/me');
        if (!res.ok) {
            user.value = null;
            return null;
        }
        const data = await res.json();
        user.value = data.user; // { _id, email, role }
        return data.user;
    } catch {
        user.value = null;
        return null;
    }
}

// Forget the current user (used on sign-out).
export function clearUser() {
    user.value = null;
}

