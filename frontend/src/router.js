import { createRouter, createWebHistory } from "vue-router";
import Signin from "./Signin.vue";
import Signup from "./Signup.vue";
import Home from "./Home.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', redirect: '/signup'},
        {path: '/signup', component: Signup},
        {path: '/signin', component: Signin},
        {path: '/home', component: Home}
    ]
});

export default router;