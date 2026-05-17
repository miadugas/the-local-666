<script setup lang="ts">
import { PRODUCTS, type Product } from "../data/products";
import StickerCard from "./StickerCard.vue";
import SectionRule from "./SectionRule.vue";

function handleAddToCart(_product: Product) {
  // No-op until Pinia cart store lands (later step).
}
</script>

<template>
  <section class="bg-bone-100 pt-[70px] pb-[90px]">
    <div class="max-w-[1240px] mx-auto px-8">
      <SectionRule
        kicker="Section A · Fresh from the riso"
        title="The April drop"
      />

      <!-- 4-col grid of sticker cards -->
      <div class="grid grid-cols-4 gap-x-6 gap-y-8">
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
