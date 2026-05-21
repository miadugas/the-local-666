<script setup lang="ts">
import { ref } from "vue";
import { PRODUCTS, type Product } from "../data/products";
import StickerCard from "./StickerCard.vue";
import StickerModal from "./StickerModal.vue";

const selectedProduct = ref<Product | null>(null);

function handleAddToCart(_product: Product) {
  // No-op until Pinia cart store lands (later slice).
}

function handleViewDetail(product: Product) {
  selectedProduct.value = product;
}

function handleClose() {
  selectedProduct.value = null;
}
</script>

<template>
  <section id="shop" class="shop">
    <div class="shop-inner">
      <header class="head">
        <div>
          <span class="eyebrow">★ Fresh out of the ground</span>
          <h2 class="title">In the catalog</h2>
        </div>
        <!-- Decorative until /catalog ships — swap to <router-link> then. -->
        <span class="head-link" aria-hidden="true">
          all {{ PRODUCTS.length }} →
        </span>
      </header>

      <div class="grid">
        <StickerCard
          v-for="(product, i) in PRODUCTS"
          :key="product.id"
          :product="product"
          :index="i"
          @add-to-cart="handleAddToCart"
          @view-detail="handleViewDetail"
        />
      </div>
    </div>

    <StickerModal
      v-if="selectedProduct"
      :product="selectedProduct"
      @close="handleClose"
      @add-to-cart="handleAddToCart"
    />
  </section>
</template>

<style scoped>
.shop {
  padding: clamp(2.5rem, 6vw, 4rem) 0;
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
}
.shop-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2.25rem;
}
.head > div {
  flex: 1 1 auto;
}
.head-link {
  margin-left: auto;
}

.eyebrow {
  display: inline-block;
  background: var(--color-acid-blue);
  color: var(--color-ink);
  padding: 0.3125rem 0.75rem;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  transform: rotate(var(--rotate-strip));
  border: var(--border-ink);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.75rem);
  line-height: 0.9;
  margin: 0.75rem 0 0;
  color: var(--fg);
}

.head-link {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  letter-spacing: var(--tracking-wide);
  color: var(--color-acid-pink);
  text-transform: uppercase;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
