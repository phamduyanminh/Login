<script setup>
import { ref, onMounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import { useAuth } from '@/workers/auth.js';

const ROLES = ['user', 'admin'];

const { user: currentUser } = useAuth();

const users = ref([]);
const loading = ref(true);
const error = ref('');
// Rows with a role change in flight: { [userId]: true }. One entry per row, so
// finishing one save never clears another row's "Saving…" state.
const saving = ref({});
const rowError = ref({}); // { [userId]: message }
const savedId = ref(null);

function isSelf(u) {
    return currentUser.value?._id === u._id;
}

async function loadUsers() {
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch('/users');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            error.value = data.error || 'Could not load users.';
            return;
        }
        users.value = data.users;
    } catch (err) {
        console.log('Caught an error: ', err);
        error.value = 'Could not reach the server.';
    } finally {
        loading.value = false;
    }
}

async function changeRole(u, event) {
    const newRole = event.target.value;
    const oldRole = u.role;
    if (newRole === oldRole) return;

    saving.value = { ...saving.value, [u._id]: true };
    savedId.value = null;
    rowError.value = { ...rowError.value, [u._id]: '' };
    u.role = newRole;

    try {
        const res = await fetch(`/users/${u._id}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            u.role = oldRole;
            event.target.value = oldRole;
            rowError.value = { ...rowError.value, [u._id]: data.error || 'Could not update the role.' };
            return;
        }
        u.role = data.user.role;
        savedId.value = u._id;
    } catch (err) {
        console.log('Caught an error: ', err);
        u.role = oldRole;
        event.target.value = oldRole;
        rowError.value = { ...rowError.value, [u._id]: 'Could not reach the server.' };
    } finally {
        const { [u._id]: _done, ...stillSaving } = saving.value;
        saving.value = stillSaving;
    }
}

onMounted(loadUsers);
</script>

<template>
    <div class="layout">
        <AppHeader />

        <main class="content">
            <h1>Settings</h1>

            <section class="card">
                <div class="card-header">
                    <h2>Users</h2>
                    <span v-if="!loading && !error" class="count">{{ users.length }} total</span>
                </div>

                <p v-if="loading" class="muted">Loading users…</p>
                <p v-else-if="error" class="error">{{ error }}</p>
                <p v-else-if="users.length === 0" class="muted">No users found.</p>

                <div v-else class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th class="role-col">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in users" :key="u._id">
                                <td class="email">
                                    {{ u.email }}
                                    <span v-if="isSelf(u)" class="badge">You</span>
                                </td>
                                <td class="role-col">
                                    <select
                                        :value="u.role"
                                        :disabled="isSelf(u) || saving[u._id]"
                                        :title="isSelf(u) ? 'You cannot change your own role' : ''"
                                        :aria-label="`Role for ${u.email}`"
                                        @change="changeRole(u, $event)"
                                    >
                                        <option v-for="r in ROLES" :key="r" :value="r">
                                            {{ r === 'admin' ? 'Admin' : 'User' }}
                                        </option>
                                    </select>
                                    <span v-if="saving[u._id]" class="status muted">Saving…</span>
                                    <span v-else-if="savedId === u._id" class="status saved">Saved</span>
                                    <p v-if="rowError[u._id]" class="error row-error">{{ rowError[u._id] }}</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>
</template>

<style scoped>
.layout {
    min-height: 100vh;
    background: #f5f5f5;
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
}

.content {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

h1 {
    margin: 0;
    font-size: 22px;
}

.card {
    padding: 24px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.card-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
}

h2 {
    margin: 0;
    font-size: 18px;
}

.count {
    font-size: 13px;
    color: #666;
}

.table-wrap {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

th,
td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
    vertical-align: middle;
}

th {
    font-size: 13px;
    font-weight: bold;
    color: #666;
    border-bottom: 1px solid #ddd;
}

tbody tr:last-child td {
    border-bottom: none;
}

tbody tr:hover {
    background: #fafafa;
}

.email {
    word-break: break-all;
}

.role-col {
    width: 220px;
}

.badge {
    margin-left: 8px;
    padding: 2px 6px;
    font-size: 12px;
    border-radius: 4px;
    background: #eee;
    color: #555;
    white-space: nowrap;
}

select {
    padding: 6px 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: inherit;
    font-family: inherit;
    cursor: pointer;
}

select:focus {
    outline: none;
    border-color: #555;
}

select:disabled {
    background: #f5f5f5;
    color: #888;
    cursor: not-allowed;
}

.status {
    margin-left: 8px;
    font-size: 13px;
}

.muted {
    margin: 0;
    font-size: 14px;
    color: #666;
}

.saved {
    color: #2e7d32;
}

.error {
    margin: 0;
    font-size: 13px;
    color: #c0392b;
}

.row-error {
    margin-top: 6px;
}
</style>
