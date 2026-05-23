import { createRouter, createWebHistory } from "vue-router";
import StorefrontView from "../views/StorefrontView.vue";
import { useAdminStore } from "../stores/admin";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 80 };
    return { top: 0 };
  },
  routes: [
    { path: "/", name: "storefront", component: StorefrontView },
    {
      path: "/checkout/success",
      name: "checkout-success",
      component: () => import("../views/CheckoutSuccessView.vue"),
    },
    {
      path: "/checkout/cancel",
      name: "checkout-cancel",
      component: () => import("../views/CheckoutCancelView.vue"),
    },
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
    {
      path: "/shipping",
      name: "shipping",
      component: () => import("../views/ShippingView.vue"),
    },
    {
      path: "/privacy",
      name: "privacy",
      component: () => import("../views/PrivacyView.vue"),
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
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
