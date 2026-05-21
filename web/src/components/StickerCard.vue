<script setup lang="ts">
import { computed } from "vue";
import type { Product } from "@grave-goods/shared";
import { formatPrice } from "../lib/format";

const props = defineProps<{
  product: Product;
  /**
   * 0-indexed position in the grid. Drives strip color, strip label, and
   * price color in lockstep (all cycle through STRIPS modulo length).
   */
  index: number;
}>();

const emit = defineEmits<{
  "add-to-cart": [product: Product];
  "view-detail": [product: Product];
}>();

// MUST stay a closed token list — `color` values flow into inline style as
// raw CSS. Never derive from product data or user input.
const STRIPS = [
  { color: "var(--color-acid-pink)", label: "Protect" },
  { color: "var(--color-acid-blue)", label: "A.C.A.B." },
  { color: "var(--color-acid-yellow)", label: "Wake up" },
  { color: "var(--color-acid-lime)", label: "Class!" },
] as const;

const strip = computed(() => STRIPS[props.index % STRIPS.length]);
</script>

<template>
  <article
    class="card"
    :class="{ 'is-sold-out': product.isSoldOut }"
    :style="{ '--strip': strip.color }"
  >
    <div class="strip">{{ strip.label }}</div>

    <div class="image-tape">
      <span v-if="product.isSoldOut" class="sold-out-badge">Sold Out</span>
      <img :src="product.imageUrl" :alt="product.title" draggable="false" />
    </div>

    <div class="meta">
      <h3 class="title">
        <!-- The view-detail trigger. The ::before overlay extends this button's
             hit area over the entire card surface, so clicks anywhere on the
             card (except the Add button) open the modal. -->
        <button
          type="button"
          class="title-btn"
          :aria-label="`View details for ${product.title}`"
          @click="emit('view-detail', product)"
        >
          {{ product.title }}
        </button>
      </h3>
      <div class="row">
        <span class="price">{{ formatPrice(product.priceCents) }}</span>
        <button
          v-if="product.isSoldOut"
          type="button"
          class="add add-disabled"
          disabled
        >
          Sold out
        </button>
        <button
          v-else
          type="button"
          class="add"
          @click.stop="emit('add-to-cart', product)"
        >
          Add ↗
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--color-pitch);
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.card:hover {
  transform: translate(-1px, -1px);
}
/* Title button's ::before extends across the whole card so any click on
   the card opens the modal — except the Add button which has z-index: 1. */
.title-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 0;
}

.strip {
  background: var(--strip);
  color: var(--color-ink);
  font-family: var(--font-brand);
  padding: 0.875rem 0.75rem;
  font-size: 1.125rem;
  line-height: 1;
  text-align: center;
  border-bottom: var(--border-bone);
}

.image-tape {
  position: relative;
  background: var(--strip);
  height: 7rem;
  margin: 0.875rem;
  border: var(--border-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
}
.image-tape img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}
.image-tape::before,
.image-tape::after {
  content: "";
  position: absolute;
  background: var(--color-bone);
  height: 0.875rem;
  width: 2.25rem;
  border: 1px solid var(--color-ink);
}
.image-tape::before {
  top: -0.5rem;
  left: 0.625rem;
  transform: rotate(-6deg);
}
.image-tape::after {
  bottom: -0.5rem;
  right: 0.625rem;
  transform: rotate(6deg);
}

.meta {
  padding: 0 0.875rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title {
  /* 3 lines of 0.8125rem * 1.2 line-height — long titles wrap to 3 lines at
     narrow grid widths; this keeps cards aligned vertically across the grid. */
  min-height: calc(0.8125rem * 1.2 * 3);
  margin: 0;
}
.title-btn {
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--fg);
  cursor: pointer;
}

.row {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-family: var(--font-display);
  font-size: 1.375rem;
  color: var(--strip);
  line-height: 1;
}

.add {
  /* z-index keeps Add above the title-btn ::before overlay so it stays
     independently clickable. */
  position: relative;
  z-index: 1;
  background: transparent;
  color: var(--fg);
  border: none;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
  padding: 0.25rem 0;
}
.add:hover {
  color: var(--strip);
}
/* :focus-visible handled globally in global.css */

.image-tape .sold-out-badge {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(var(--rotate-stencil));
  background: var(--color-acid-red);
  color: var(--color-ink);
  border: var(--border-ink);
  font-family: var(--font-zine);
  font-size: 0.8rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  white-space: nowrap;
}
.is-sold-out .image-tape img {
  filter: grayscale(1);
  opacity: 0.45;
}
.add-disabled,
.add-disabled:hover {
  color: color-mix(in oklab, var(--color-bone) 45%, transparent);
  cursor: not-allowed;
}
</style>
