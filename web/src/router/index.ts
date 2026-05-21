import { createRouter, createWebHistory } from "vue-router";
import StorefrontView from "../views/StorefrontView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", name: "storefront", component: StorefrontView }],
});

export default router;
