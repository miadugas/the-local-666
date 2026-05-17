<script setup lang="ts">
import { PRODUCTS, type Product } from "../data/products";
import StickerCard from "./StickerCard.vue";
import SectionRule from "./SectionRule.vue";

function handleAddToCart(_product: Product) {
  // No-op until Pinia cart store lands (later slice).
}
</script>

<template>
  <section id="shop" class="shop">
    <div class="shop-inner">
      <SectionRule kicker="Stickers" title="Shop the drop" />

      <div class="grid">
        <StickerCard
          v-for="product in PRODUCTS"
          :key="product.id"
          :product="product"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.shop {
  padding: clamp(2rem, 6vw, 4rem) 0;
}
.shop-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
</style>
