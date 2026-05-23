<script setup lang="ts">
// Shared chrome + layout for static content pages (shipping, privacy, about,
// 404). Carries Header/Footer/CartDrawer so the cart works site-wide, since
// App.vue is just <RouterView /> and each view mounts its own chrome.
import Header from "./Header.vue";
import Footer from "./Footer.vue";
import CartDrawer from "./CartDrawer.vue";
import { useCartStore } from "../stores/cart";

defineProps<{ title: string; eyebrow?: string }>();

const cart = useCartStore();
</script>

<template>
  <Header />
  <main class="content">
    <div class="content-head">
      <span v-if="eyebrow" class="eyebrow tape">{{ eyebrow }}</span>
      <h1 class="content-title">{{ title }}</h1>
    </div>
    <div class="content-body prose">
      <slot />
    </div>
  </main>
  <Footer />
  <CartDrawer v-if="cart.isOpen" />
</template>

<style scoped>
.content {
  background: var(--color-pitch);
  color: var(--color-bone);
  padding: clamp(2.5rem, 7vw, 4.5rem) clamp(1rem, 4vw, 2.25rem);
  min-height: 60vh;
}
.content-head {
  max-width: 70ch;
  margin: 0 auto 2rem;
}
.eyebrow {
  --tape-color: var(--color-acid-blue);
  --tape-rotate: var(--rotate-stencil);
  --tape-mask: url(/torn-tape-1.svg);
  margin-bottom: 1.25rem;
}
.content-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3.25rem);
  line-height: 0.95;
  color: var(--color-bone);
  margin: 0;
}
.content-body {
  max-width: 70ch;
  margin: 0 auto;
}
/* Slotted prose — readable body regardless of which view fills the slot. */
.content-body :slotted(p) {
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.65;
  margin: 0 0 1.15rem;
}
.content-body :slotted(p:last-child) {
  margin-bottom: 0;
}
.content-body :slotted(a) {
  color: var(--color-acid-blue);
}
</style>
