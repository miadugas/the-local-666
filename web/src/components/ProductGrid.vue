<script setup lang="ts">
import { PRODUCTS, type Product } from "../data/products";
import StickerCard from "./StickerCard.vue";

function handleAddToCart(_product: Product) {
  // No-op until Pinia cart store lands (later step).
}
</script>

<template>
  <section class="bg-bone-100 pt-[70px] pb-[90px]">
    <div class="max-w-[1240px] mx-auto px-8">
      <!-- Section rule: tabloid newspaper header -->
      <div
        class="border-b-[4px] border-plum-900 pb-[14px] mb-9 flex justify-between items-end"
      >
        <div>
          <div
            class="font-mono text-[11px] tracking-[0.28em] uppercase text-blood-500 font-bold mb-[6px]"
          >
            Section A · Fresh from the riso
          </div>
          <h2
            class="font-display font-black text-[64px] tracking-tight leading-[0.95] m-0 text-plum-900"
          >
            The April drop
          </h2>
        </div>
        <!-- Right column: category chips, deferred -->
      </div>

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
