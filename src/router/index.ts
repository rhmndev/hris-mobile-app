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
            },
            {
                path: '/leave',
                name: 'leave',
                component: () => import('../views/LeaveView.vue')
            },
            {
                path: '/leave/create',
                name: 'leave-create',
                component: () => import('../views/LeaveCreateView.vue')
            },
            {
                path: '/payslip',
                name: 'payslip',
                component: () => import('../views/PaySlipView.vue')
            }
            
    ],
});

// Navigation Guard
// router.beforeEach((to, from, next) => {
//     // Add your authentication logic here

//     next(); 
// });

// Navigation Guard
router.beforeEach((to, _from, next) => {
    const isAuthenticated = !!localStorage.getItem('auth_token'); // Cek apakah token ada

    // Daftar halaman yang BOLEH diakses tanpa login
    const publicPages = ['/login', '/'];
    const authRequired = !publicPages.includes(to.path);

    if (authRequired && !isAuthenticated) {
        // Jika butuh login tapi tidak ada token, paksa ke halaman login
        next('/login');
    } else if (to.path === '/login' && isAuthenticated) {
        // Jika sudah login tapi malah mau ke halaman login, lempar ke home
        next('/home');
    } else {
        // Jika aman, lanjutkan navigasi
        next();
    }
});

export default router;