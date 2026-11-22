<script setup>
import { ref, computed, onMounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import { useAuth } from '@/workers/auth.js';

const { user } = useAuth();
const isAdmin = computed(() => user.value?.role === 'admin');

const employees = ref([]);
const loading = ref(true);
const error = ref('');

const collapsed = ref({}); // { [department]: true }

// Inline edit state (admin only). One row is edited at a time.
const editingId = ref(null);
const draft = ref({});
const saving = ref(false);
const editError = ref('');
const savedId = ref(null);

const salaryFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
});

const departments = computed(() => {
    const groups = new Map();
    for (const e of employees.value) {
        if (!groups.has(e.department)) groups.set(e.department, []);
        groups.get(e.department).push(e);
    }
    return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, list]) => ({
            name,
            employees: list.sort((a, b) => a.employeeId.localeCompare(b.employeeId))
        }));
});

const departmentNames = computed(() => departments.value.map((d) => d.name));

// Number of columns, for the department header row.
const columnCount = computed(() => 3 + (isAdmin.value ? 2 : 0));

function toggle(name) {
    collapsed.value = { ...collapsed.value, [name]: !collapsed.value[name] };
}

async function loadEmployees() {
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch('/employees');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            error.value = data.error || 'Could not load employees.';
            return;
        }
        employees.value = data.employees;
    } catch (err) {
        console.log('Caught an error: ', err);
        error.value = 'Could not reach the server.';
    } finally {
        loading.value = false;
    }
}

function startEdit(e) {
    editingId.value = e._id;
    editError.value = '';
    savedId.value = null;
    draft.value = {
        firstName: e.firstName,
        lastName: e.lastName,
        department: e.department,
        jobTitle: e.jobTitle,
        salary: e.salary
    };
}

function cancelEdit() {
    editingId.value = null;
    editError.value = '';
}

async function saveEdit(e) {
    const body = {
        firstName: draft.value.firstName?.trim(),
        lastName: draft.value.lastName?.trim(),
        department: draft.value.department,
        jobTitle: draft.value.jobTitle?.trim(),
        salary: Number(draft.value.salary)
    };

    if (!body.firstName || !body.lastName || !body.jobTitle) {
        editError.value = 'Name and job title are required.';
        return;
    }
    if (draft.value.salary === '' || !Number.isFinite(body.salary) || body.salary < 0) {
        editError.value = 'Salary must be a number of 0 or more.';
        return;
    }

    saving.value = true;
    editError.value = '';
    try {
        const res = await fetch(`/employees/${e._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            editError.value = data.error || 'Could not save the changes.';
            return;
        }
        Object.assign(e, data.employee);
        editingId.value = null;
        savedId.value = e._id;
        // Keep the employee visible if they moved to a collapsed department.
        collapsed.value = { ...collapsed.value, [e.department]: false };
    } catch (err) {
        console.log('Caught an error: ', err);
        editError.value = 'Could not reach the server.';
    } finally {
        saving.value = false;
    }
}

onMounted(loadEmployees);
</script>

<template>
    <div class="layout">
        <AppHeader />

        <main class="content">
            <h1>Home</h1>

            <section class="card">
                <div class="card-header">
                    <h2>Employees</h2>
                    <span v-if="!loading && !error" class="count">{{ employees.length }} total</span>
                </div>

                <p v-if="loading" class="muted">Loading employees…</p>
                <p v-else-if="error" class="error">{{ error }}</p>
                <p v-else-if="employees.length === 0" class="muted">No employees found.</p>

                <div v-else class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th class="id-col">ID</th>
                                <th>Name</th>
                                <th>Job title</th>
                                <th v-if="isAdmin" class="salary-col">Salary</th>
                                <th v-if="isAdmin" class="actions-col"><span class="visually-hidden">Actions</span></th>
                            </tr>
                        </thead>

                        <tbody v-for="dept in departments" :key="dept.name">
                            <tr class="dept-row">
                                <td :colspan="columnCount">
                                    <button
                                        type="button"
                                        class="dept-toggle"
                                        :aria-expanded="!collapsed[dept.name]"
                                        @click="toggle(dept.name)"
                                    >
                                        <svg
                                            class="chevron"
                                            :class="{ open: !collapsed[dept.name] }"
                                            viewBox="0 0 16 16"
                                            width="14"
                                            height="14"
                                            aria-hidden="true"
                                        >
                                            <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                        <span class="dept-name">{{ dept.name }}</span>
                                        <span class="dept-count">{{ dept.employees.length }}</span>
                                    </button>
                                </td>
                            </tr>

                            <template v-if="!collapsed[dept.name]">
                                <template v-for="e in dept.employees" :key="e._id">
                                    <!-- Edit mode (admin) -->
                                    <tr v-if="isAdmin && editingId === e._id" class="editing">
                                        <td class="id-col">{{ e.employeeId }}</td>
                                        <td>
                                            <div class="name-inputs">
                                                <input v-model="draft.firstName" type="text" maxlength="100" aria-label="First name" placeholder="First name" />
                                                <input v-model="draft.lastName" type="text" maxlength="100" aria-label="Last name" placeholder="Last name" />
                                            </div>
                                        </td>
                                        <td>
                                            <div class="stack">
                                                <input v-model="draft.jobTitle" type="text" maxlength="100" aria-label="Job title" placeholder="Job title" />
                                                <select v-model="draft.department" aria-label="Department">
                                                    <option v-for="name in departmentNames" :key="name" :value="name">{{ name }}</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td class="salary-col">
                                            <input v-model="draft.salary" type="number" min="0" step="1000" aria-label="Salary" class="salary-input" @keyup.enter="saveEdit(e)" />
                                        </td>
                                        <td class="actions-col">
                                            <div class="edit-actions">
                                                <button type="button" class="btn" :disabled="saving" @click="saveEdit(e)">
                                                    {{ saving ? 'Saving…' : 'Save' }}
                                                </button>
                                                <button type="button" class="btn secondary" :disabled="saving" @click="cancelEdit">Cancel</button>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- View mode -->
                                    <tr v-else>
                                        <td class="id-col">{{ e.employeeId }}</td>
                                        <td>{{ e.firstName }} {{ e.lastName }}</td>
                                        <td>{{ e.jobTitle }}</td>
                                        <td v-if="isAdmin" class="salary-col">{{ salaryFormat.format(e.salary) }}</td>
                                        <td v-if="isAdmin" class="actions-col">
                                            <span v-if="savedId === e._id" class="status saved">Saved</span>
                                            <button
                                                type="button"
                                                class="icon-btn"
                                                :disabled="saving"
                                                :title="`Edit ${e.firstName} ${e.lastName}`"
                                                :aria-label="`Edit ${e.firstName} ${e.lastName}`"
                                                @click="startEdit(e)"
                                            >
                                                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                                                    <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>

                                    <tr v-if="isAdmin && editingId === e._id && editError" class="editing">
                                        <td :colspan="columnCount"><p class="error">{{ editError }}</p></td>
                                    </tr>
                                </template>
                            </template>
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

tbody tr:not(.dept-row):not(.editing):hover {
    background: #fafafa;
}

.id-col {
    width: 70px;
    color: #666;
    white-space: nowrap;
}

.salary-col {
    width: 120px;
    text-align: right;
    white-space: nowrap;
}

.actions-col {
    width: 150px;
    text-align: right;
    white-space: nowrap;
}

/* Department header rows */
.dept-row td {
    padding: 0;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
}

tbody + tbody .dept-row td {
    border-top: 1px solid #ddd;
}

.dept-toggle {
    width: 100%;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: none;
    color: inherit;
    font-family: inherit;
    font-size: 14px;
    font-weight: bold;
    text-align: left;
    cursor: pointer;
}

.dept-toggle:hover {
    background: #eee;
}

.dept-toggle:focus-visible {
    outline: 2px solid #555;
    outline-offset: -2px;
}

.chevron {
    flex-shrink: 0;
    color: #666;
    transition: transform 0.15s ease;
}

.chevron.open {
    transform: rotate(90deg);
}

.dept-count {
    padding: 2px 6px;
    font-size: 12px;
    font-weight: normal;
    border-radius: 4px;
    background: #e4e4e4;
    color: #555;
}

/* Edit mode */
.editing {
    background: #fafafa;
}

.editing td {
    vertical-align: top;
}

.name-inputs,
.stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

input,
select {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 6px 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: inherit;
    font-family: inherit;
}

input:focus,
select:focus {
    outline: none;
    border-color: #555;
}

.salary-input {
    text-align: right;
}

.edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
}

.btn {
    padding: 6px 10px;
    font-size: 14px;
    border: 1px solid #333;
    border-radius: 4px;
    background: #333;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
}

.btn:hover {
    background: #111;
}

.btn.secondary {
    background: #fff;
    color: #333;
    border-color: #ccc;
}

.btn.secondary:hover {
    background: #f0f0f0;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.icon-btn {
    padding: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 4px;
    background: none;
    color: #555;
    cursor: pointer;
    vertical-align: middle;
}

.icon-btn:hover {
    border-color: #ccc;
    background: #f0f0f0;
    color: #111;
}

.icon-btn:focus-visible {
    outline: 2px solid #555;
    outline-offset: 1px;
}

.icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.status {
    margin-right: 8px;
    font-size: 13px;
}

.saved {
    color: #2e7d32;
}

.muted {
    margin: 0;
    font-size: 14px;
    color: #666;
}

.error {
    margin: 0;
    font-size: 13px;
    color: #c0392b;
}

.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}
</style>
