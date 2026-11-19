import { createRouter, createWebHistory } from "vue-router";
import { loadUser } from "@/workers/auth.js";
import Signin from "@/views/auth/Signin.vue";
import Signup from "@/views/auth/Signup.vue";
import Home from "@/views/home/Home.vue";
import Settings from "@/views/settings/Settings.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', redirect: '/signup'},
        {path: '/signup', component: Signup},
        {path: '/signin', component: Signin},
        {path: '/home', component: Home, meta: {requiresAuth: true}},
        {path: '/settings', component: Settings, meta: {requiresAuth: true, requiresAdmin: true}}
    ]
});

router.beforeEach(async (to) => {
    if (to.meta.requiresAuth) {
        const user = await loadUser();
        if (!user) return 'signin';
        if (to.meta.requiresAdmin && user.role !== 'admin') return '/home';
    }
});

export default router;