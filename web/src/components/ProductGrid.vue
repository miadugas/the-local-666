<script setup lang="ts">
import { ref } from "vue";
import type { Product } from "@grave-goods/shared";
import { PRICES } from "@grave-goods/shared";
import { useProducts } from "../composables/useProducts";
import { useCartStore } from "../stores/cart";
import StickerCard from "./StickerCard.vue";
import StickerModal from "./StickerModal.vue";

const { products, loading, error, reload } = useProducts();
const cart = useCartStore();
const selectedProduct = ref<Product | null>(null);

// Bundle figures come straight from the pricing module so the banner can
// never drift from what the cart actually charges.
const threePackDollars = PRICES.THREE_PACK_CENTS / 100;
const fivePackDollars = PRICES.FIVE_PACK_CENTS / 100;

function handleAddToCart(product: Product) {
  cart.addItem(product);
  selectedProduct.value = null;
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
          <span class="eyebrow tape">★ Fresh out of the ground</span>
          <h2 class="title">In the catalog</h2>
        </div>
        <!-- Decorative until /catalog ships — swap to <router-link> then. -->
        <span class="head-link" aria-hidden="true">
          all {{ products.length }} →
        </span>
      </header>

      <aside class="bundle-banner" aria-label="Bundle pricing">
        <p class="bundle-prices">
          <span class="clause">Any 3 → ${{ threePackDollars }}</span>
          <span class="bundle-sep" aria-hidden="true">·</span>
          <span class="clause">Any 5 → ${{ fivePackDollars }}</span>
        </p>
        <p class="bundle-tag">Grab the set. Arm your friends.</p>
      </aside>

      <p v-if="loading" class="state">Digging up the goods…</p>

      <div v-else-if="error" class="state state-error">
        <p>The crypt door's stuck — couldn't load the goods.</p>
        <button type="button" class="retry" @click="reload">Retry</button>
      </div>

      <div v-else class="grid">
        <StickerCard
          v-for="(product, i) in products"
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
  --tape-color: var(--color-acid-blue);
  --tape-rotate: var(--rotate-strip);
  --tape-mask: url(/torn-tape-4.svg);
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

.bundle-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  background: var(--color-acid-yellow);
  color: var(--color-ink);
  border: var(--border-ink);
  border-radius: var(--radius-tight);
  box-shadow: var(--shadow-block-bone);
  padding: clamp(0.875rem, 2.5vw, 1.25rem) clamp(1.125rem, 3.5vw, 1.75rem);
  margin-bottom: 2.25rem;
}
.bundle-prices {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 3.2vw, 1.9rem);
  line-height: 0.95;
  letter-spacing: 0.01em;
  margin: 0;
}
.bundle-sep {
  opacity: 0.45;
  margin: 0 0.35rem;
}
.bundle-tag {
  font-family: var(--font-zine);
  font-size: clamp(0.8rem, 1.8vw, 0.95rem);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  margin: 0;
}
.bundle-prices .clause {
  white-space: nowrap;
}
@media (max-width: 640px) {
  .bundle-banner {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.65rem;
  }
  .bundle-prices .clause {
    display: block;
  }
  .bundle-sep {
    display: none;
  }
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

.state {
  font-family: var(--font-zine);
  font-size: 0.95rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-bone);
  padding: 2rem 0;
}
.state-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}
.retry {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.retry:hover {
  transform: translate(-1px, -1px);
}
.retry:active {
  transform: translate(2px, 2px);
}
</style>
