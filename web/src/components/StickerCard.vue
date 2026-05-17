<script setup lang="ts">
import type { Product } from "../data/products";

defineProps<{ product: Product }>();
const emit = defineEmits<{ "add-to-cart": [product: Product] }>();
</script>

<template>
  <article
    class="card group bg-bone-50 border-[3px] border-plum-900 rounded-sm cursor-pointer relative flex flex-col"
  >
    <!-- Image panel: tinted radial gradient over warm paper + riso grain -->
    <div
      class="tex-grain aspect-square overflow-hidden border-b-[3px] border-plum-900 flex items-center justify-center p-[18px] relative"
      :style="{
        background: `radial-gradient(circle at 50% 50%, ${product.ring}33 0%, ${product.ring}10 60%, transparent 100%), #f4ecd8`,
      }"
    >
      <img
        :src="`/stickers/${product.id}.png`"
        :alt="product.title"
        draggable="false"
        class="max-w-[92%] max-h-[92%] object-contain block sticker-img"
      />
    </div>

    <!-- Body: title, spec, divider, price + Add to cart -->
    <div class="p-[12px_14px_14px]">
      <h3
        class="font-display font-extrabold text-[22px] leading-[1.05] tracking-tight text-plum-900 mb-[2px] mt-0"
      >
        {{ product.title }}
      </h3>
      <div class="font-mono text-[11px] text-plum-600 tracking-wide">
        {{ product.spec }}
      </div>

      <div
        class="flex justify-between items-center mt-3 pt-[10px] border-t-2 border-plum-900"
      >
        <div class="flex items-baseline gap-2">
          <span class="font-display font-black text-[24px] text-plum-900">
            ${{ product.price }}
          </span>
        </div>
        <button
          type="button"
          class="cart-add-btn"
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
  box-shadow: 5px 5px 0 var(--color-plum-900);
  transition:
    transform 160ms var(--ease-snap),
    box-shadow 160ms var(--ease-snap);
}
.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 var(--color-plum-900);
}

.sticker-img {
  filter: drop-shadow(2px 3px 0 rgba(21, 11, 28, 0.18));
}

.cart-add-btn {
  background: var(--color-ember-500);
  color: var(--color-bone-50);
  font-family: var(--font-poster);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 7px 14px;
  border: 2px solid var(--color-plum-900);
  border-radius: 2px;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--color-plum-900);
  transition:
    transform 120ms var(--ease-snap),
    box-shadow 120ms var(--ease-snap);
}
.cart-add-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--color-plum-900);
}
.cart-add-btn:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 var(--color-plum-900);
}
</style>
