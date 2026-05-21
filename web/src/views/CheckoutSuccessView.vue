<script setup lang="ts">
import { onMounted } from "vue";
import { useCartStore } from "../stores/cart";

const cart = useCartStore();
onMounted(() => cart.clear());
</script>

<template>
  <main class="result">
    <h1 class="title">Dug up &amp; on its way</h1>
    <p class="body">
      Payment went through. Your goods are being pulled from the crypt — a
      receipt's on its way to your inbox.
    </p>
    <a href="/" class="btn">Back to the shop</a>
  </main>
</template>

<style scoped>
.result {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  background: var(--color-pitch);
  padding: clamp(1.5rem, 6vw, 4rem);
  width: min(640px, 92vw);
  margin: 0 auto;
}
.title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 3rem);
  color: var(--color-bone);
  margin: 0;
}
.body {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-bone);
  margin: 0;
}
.btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.7rem 1.1rem;
  text-decoration: none;
}
</style>
