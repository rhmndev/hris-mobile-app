import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
            {
            path: '/',
            name: 'splash',
            component: () => import('../views/SplashView.vue'),
            },
            {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
            },
            {
                path: '/home',
                name: 'home',
                component: () => import('../views/HomeView.vue'),
            },
            {
                path: '/report',
                name: 'report',
                component: () => import('../views/ReportView.vue'),
            },
            {
                path: '/attendance',
                name: 'attendance',
                component: () => import('../views/AttendanceView.vue'),
            },
            {
                path: '/profile',
                name: 'profile',
                component: () => import('../views/ProfileView.vue'),
            }
            
    ],
});

// Navigation Guard
// router.beforeEach((to, from, next) => {
//     // Add your authentication logic here

//     next(); 
// });

export default router;