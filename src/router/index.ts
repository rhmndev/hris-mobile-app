import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
            {
            path: '/',
            name: 'splash',
            component: () => import('../views/LoginView.vue'),
            },
            {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
            },

            
    ],
});

// Navigation Guard
router.beforeEach((to, from, next) => {
    // Add your authentication logic here

    next(); 
});

export default router;