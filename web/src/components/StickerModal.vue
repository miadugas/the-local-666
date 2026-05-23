<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { Product } from "@grave-goods/shared";
import { formatPrice } from "../lib/format";
import { renderMarkdown } from "../lib/markdown";

const props = defineProps<{ product: Product }>();
const emit = defineEmits<{
  close: [];
  "add-to-cart": [product: Product];
}>();

const FALLBACK_DESCRIPTION =
  "No description yet — it's a sticker. Slap it on something.";

const descriptionHtml = computed(() =>
  renderMarkdown(props.product.description ?? FALLBACK_DESCRIPTION),
);

const onSale = computed(
  () => props.product.salePriceCents != null && !props.product.isSoldOut,
);

const closeBtn = ref<HTMLButtonElement | null>(null);
const addBtn = ref<HTMLButtonElement | null>(null);

// Remember the element that opened the modal so we can restore focus on close.
let previouslyFocused: HTMLElement | null = null;
// Capture the previous inline overflow so we don't clobber a future drawer
// or toast lib that may have set it.
let prevBodyOverflow = "";

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    emit("close");
    return;
  }
  if (event.key === "Tab") {
    // Trap focus inside the modal: cycle between closeBtn and addBtn.
    const focusables = [closeBtn.value, addBtn.value].filter(
      (el): el is HTMLButtonElement => el !== null && !el.disabled,
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

function onBackdropClick(event: MouseEvent) {
  // Only close when the click target IS the backdrop, not bubbled from panel.
  if (event.target === event.currentTarget) {
    emit("close");
  }
}

onMounted(() => {
  previouslyFocused = document.activeElement as HTMLElement | null;
  document.addEventListener("keydown", onKeydown);
  // Body scroll lock — capture prev value first.
  prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  // Move focus to the close X after Vue paints the panel.
  requestAnimationFrame(() => closeBtn.value?.focus());
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = prevBodyOverflow;
  // Only restore focus if the previously-focused element is still in the DOM.
  if (previouslyFocused && document.body.contains(previouslyFocused)) {
    previouslyFocused.focus();
  }
});
</script>

<template>
  <div class="backdrop" @click="onBackdropClick">
    <div
      class="panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      :style="{ '--accent': product.accentHex }"
    >
      <button
        ref="closeBtn"
        type="button"
        class="close"
        aria-label="Close"
        @click="emit('close')"
      >
        ✕
      </button>

      <div class="image-tape">
        <div class="disc">
          <img :src="product.imageUrl" :alt="product.title" draggable="false" />
        </div>
      </div>

      <div class="meta">
        <h2 id="modal-title" class="title">{{ product.title }}</h2>
        <p class="spec">{{ product.spec }}</p>
        <p v-if="onSale" class="sale-tag">{{ product.saleLabel ?? "Sale" }}</p>
        <!-- eslint-disable-next-line vue/no-v-html — sanitized in renderMarkdown -->
        <div class="description prose" v-html="descriptionHtml"></div>
        <div class="buy">
          <span class="price">
            <template v-if="onSale">
              <s class="price-was">{{ formatPrice(product.priceCents) }}</s>
              <span class="price-now">{{
                formatPrice(product.salePriceCents!)
              }}</span>
            </template>
            <template v-else>{{ formatPrice(product.priceCents) }}</template>
          </span>
          <button
            v-if="product.isSoldOut"
            ref="addBtn"
            type="button"
            class="add add-disabled"
            disabled
          >
            Sold out
          </button>
          <button
            v-else
            ref="addBtn"
            type="button"
            class="add"
            @click="emit('add-to-cart', product)"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.5rem, 2vw, 1rem);
}

.panel {
  position: relative;
  background: var(--color-pitch);
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  box-shadow: var(--shadow-block-pink);
  width: min(880px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(1.5rem, 3vw, 2rem);
  padding: clamp(1.25rem, 3vw, 2rem);
}

.close {
  position: absolute;
  top: 0.875rem;
  right: 0.875rem;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.5rem;
  background: transparent;
  color: var(--color-bone);
  border: none;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
  z-index: 1;
}
.close:hover {
  color: var(--accent);
  transform: translate(-1px, -1px);
}
.close:active {
  transform: translate(2px, 2px);
}

/* Outer box stays square + holds the tape corners (no overflow clip). The
   inner .disc is the round sticker that clips the art. Mirrors StickerCard. */
.image-tape {
  position: relative;
  aspect-ratio: 1 / 1;
  align-self: start;
}
.disc {
  position: absolute;
  inset: 0;
  background: var(--accent);
  border: var(--border-ink);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.disc img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}
.image-tape::before,
.image-tape::after {
  content: "";
  position: absolute;
  z-index: 1;
  background: var(--color-bone);
  height: 0.875rem;
  width: 3rem;
  border: 1px solid var(--color-ink);
}
.image-tape::before {
  top: -0.4rem;
  left: 50%;
  transform: translateX(-65%) rotate(-6deg);
}
.image-tape::after {
  bottom: -0.4rem;
  left: 50%;
  transform: translateX(-35%) rotate(6deg);
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3.5vw, 2.25rem);
  line-height: 0.95;
  color: var(--color-bone);
}

.spec {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-bone) 70%, transparent);
  margin: 0;
}
.sale-tag {
  align-self: flex-start;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  background: var(--color-acid-red);
  color: var(--color-ink);
  border: var(--border-ink);
  padding: 0.2rem 0.55rem;
  margin: 0;
  transform: rotate(var(--rotate-stencil));
}

.description {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-bone);
  margin: 0;
}

.buy {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

.price {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--accent);
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
}
.price-was {
  font-size: 1.1rem;
  color: color-mix(in oklab, var(--color-bone) 45%, transparent);
  text-decoration: line-through;
}
.price-now {
  color: var(--color-acid-red);
}

.add {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  min-height: 44px;
  padding: 0.75rem 1.375rem;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  box-shadow: var(--shadow-block-bone);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.add:hover {
  transform: translate(-1px, -1px);
}
.add:active {
  transform: translate(2px, 2px);
}
.add.add-disabled {
  background: var(--color-acid-red);
  color: var(--color-ink);
  opacity: 0.55;
  box-shadow: none;
  cursor: not-allowed;
}
.add.add-disabled:hover {
  transform: none;
}

@media (max-width: 640px) {
  .panel {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .image-tape {
    width: 100%;
    max-width: 260px;
    margin: 0 auto;
  }
  .buy {
    flex-direction: column;
    align-items: stretch;
  }
  .add {
    width: 100%;
  }
}
</style>
