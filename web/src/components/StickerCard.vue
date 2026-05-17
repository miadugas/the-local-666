<script setup lang="ts">
import type { Product } from "../data/products";

defineProps<{ product: Product }>();
const emit = defineEmits<{ "add-to-cart": [product: Product] }>();
</script>

<template>
  <article class="card">
    <div class="art">
      <img
        :src="`/stickers/${product.id}.png`"
        :alt="product.title"
        draggable="false"
      />
    </div>
    <div class="meta">
      <p class="type">3" die-cut vinyl</p>
      <h3>{{ product.title }}</h3>
      <p class="desc">{{ product.spec }}</p>
      <div class="row">
        <span class="price">${{ product.price }}</span>
        <button
          type="button"
          class="add-btn"
          @click.stop="emit('add-to-cart', product)"
        >
          Add to cart
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform 220ms var(--ease-out),
    box-shadow 220ms var(--ease-out),
    border-color 220ms var(--ease-out);
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow:
    var(--shadow-soft),
    0 0 0 1px rgba(255, 95, 50, 0.18);
}

.art {
  aspect-ratio: 1 / 1;
  background:
    radial-gradient(
      circle at 50% 40%,
      rgba(255, 141, 89, 0.08),
      transparent 70%
    ),
    var(--bg-raised);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
}
.art img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.55));
}

.meta {
  padding: 1rem 1.1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}

.type {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-soft);
  font-weight: 600;
}

.meta h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: var(--fg);
}

.desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--fg-muted);
}

.row {
  margin-top: auto;
  padding-top: 0.6rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.price {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--fg);
  letter-spacing: 0.02em;
}

.add-btn {
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  color: #fff9f1;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.55rem 0.9rem;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 95, 50, 0.22);
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);
}
.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(255, 95, 50, 0.3);
}
.add-btn:active {
  transform: translateY(0);
}
</style>
