import { createRouter, createWebHistory } from "vue-router";
import StorefrontView from "../views/StorefrontView.vue";
import { useAdminStore } from "../stores/admin";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "storefront", component: StorefrontView },
    {
      path: "/admin/login",
      name: "admin-login",
      component: () => import("../views/AdminLoginView.vue"),
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;
  const admin = useAdminStore();
  if (!admin.isAuthenticated) await admin.fetchMe();
  return admin.isAuthenticated ? true : { name: "admin-login" };
});

export default router;
