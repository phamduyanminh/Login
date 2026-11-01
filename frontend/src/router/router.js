import { createRouter, createWebHistory } from "vue-router";
import Signin from "./views/auth/Signin.vue/index.js";
import Signup from "./views/auth/Signup.vue/index.js";
import Home from "./views/views/Home.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', redirect: '/signup'},
        {path: '/signup', component: Signup},
        {path: '/signin', component: Signin},
        {path: '/home', component: Home}, 
        {path: '/home', component: Home, meta: {requiresAuth: true}}
    ]
});

router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
        return '/signin';
    }
});

export default router;