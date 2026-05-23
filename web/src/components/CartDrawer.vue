<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useCartStore } from "../stores/cart";
import { formatPrice } from "../lib/format";

const cart = useCartStore();
const checkoutError = ref("");
const closeBtn = ref<HTMLButtonElement | null>(null);

let previouslyFocused: HTMLElement | null = null;
let prevBodyOverflow = "";

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    cart.close();
  }
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) cart.close();
}

async function onCheckout() {
  checkoutError.value = "";
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
      }),
    });
    if (res.status === 503) {
      checkoutError.value = "Checkout isn't wired up yet.";
      return;
    }
    if (!res.ok) {
      const data = await res
        .json()
        .catch(() => ({ message: "Checkout failed." }));
      checkoutError.value = data.message ?? "Checkout failed.";
      return;
    }
    const { url } = (await res.json()) as { url: string };
    window.location.href = url;
  } catch {
    checkoutError.value = "Checkout failed. Try again.";
  }
}

onMounted(() => {
  previouslyFocused = document.activeElement as HTMLElement | null;
  document.addEventListener("keydown", onKeydown);
  prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => closeBtn.value?.focus());
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = prevBodyOverflow;
  if (previouslyFocused && document.body.contains(previouslyFocused)) {
    previouslyFocused.focus();
  }
});
</script>

<template>
  <div class="backdrop" @click="onBackdropClick">
    <aside class="panel" role="dialog" aria-modal="true" aria-label="Cart">
      <header class="head">
        <h2 class="title">Cart</h2>
        <button
          ref="closeBtn"
          type="button"
          class="close"
          aria-label="Close cart"
          @click="cart.close()"
        >
          ✕
        </button>
      </header>

      <p v-if="cart.items.length === 0" class="empty">
        Your cart's clearer than a cop's conscience. Go dig something up.
      </p>

      <ul v-else class="lines">
        <li v-for="item in cart.items" :key="item.slug" class="line">
          <img :src="item.imageUrl" alt="" class="thumb" />
          <div class="line-meta">
            <strong class="line-title">{{ item.title }}</strong>
            <span class="line-price">
              <template v-if="item.salePriceCents != null">
                <s class="line-was">{{ formatPrice(item.priceCents) }}</s>
                <span class="line-sale">{{
                  formatPrice(item.salePriceCents)
                }}</span>
              </template>
              <template v-else>{{ formatPrice(item.priceCents) }}</template>
            </span>
          </div>
          <div class="qty">
            <button
              type="button"
              class="step"
              aria-label="Decrease quantity"
              @click="cart.decrement(item.slug)"
            >
              −
            </button>
            <span class="qty-n">{{ item.quantity }}</span>
            <button
              type="button"
              class="step"
              aria-label="Increase quantity"
              @click="cart.increment(item.slug)"
            >
              +
            </button>
          </div>
          <button
            type="button"
            class="remove"
            aria-label="Remove from cart"
            @click="cart.removeItem(item.slug)"
          >
            ✕
          </button>
        </li>
      </ul>

      <footer v-if="cart.items.length > 0" class="foot">
        <p v-if="cart.nudge" class="nudge">{{ cart.nudge }}</p>
        <div class="totals">
          <div class="trow">
            <span>Subtotal</span>
            <span>{{ formatPrice(cart.rowsSubtotalCents) }}</span>
          </div>
          <div v-if="cart.bundleDiscountCents > 0" class="trow discount">
            <span>Bundle discount</span>
            <span>−{{ formatPrice(cart.bundleDiscountCents) }}</span>
          </div>
          <div class="trow total">
            <span>Total</span>
            <span>{{ formatPrice(cart.bundleSubtotalCents) }}</span>
          </div>
        </div>
        <button type="button" class="checkout" @click="onCheckout">
          Checkout
        </button>
        <p v-if="checkoutError" class="note">{{ checkoutError }}</p>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: flex-end;
}
.panel {
  width: min(420px, 100%);
  height: 100%;
  background: var(--color-pitch);
  border-left: var(--border-bone);
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  overflow-y: auto;
  animation: drawer-slide var(--duration-base, 200ms) var(--ease-snap);
}
@keyframes drawer-slide {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .panel {
    animation: none;
  }
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border-bone);
  padding-bottom: 0.875rem;
  margin-bottom: 1rem;
}
.title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  color: var(--color-bone);
  margin: 0;
}
.close {
  min-width: 44px;
  min-height: 44px;
  font-family: var(--font-display);
  font-size: 1.4rem;
  background: transparent;
  color: var(--color-bone);
  border: none;
  cursor: pointer;
}
.empty {
  font-family: var(--font-zine);
  font-size: 0.9rem;
  color: var(--color-bone);
  letter-spacing: var(--tracking-wide);
}
.lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}
.line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: var(--border-ink);
  border-color: color-mix(in oklab, var(--color-bone) 35%, transparent);
  border-radius: var(--radius-tight);
  padding: 0.5rem;
}
.thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: var(--color-bone);
  border: var(--border-ink);
}
.line-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.line-title {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--color-bone);
}
.line-price {
  font-family: var(--font-display);
  color: var(--color-acid-pink);
  font-size: 1rem;
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
}
.line-was {
  font-size: 0.8rem;
  color: color-mix(in oklab, var(--color-bone) 45%, transparent);
  text-decoration: line-through;
}
.line-sale {
  color: var(--color-acid-red);
}
.qty {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.step {
  min-width: 28px;
  min-height: 28px;
  background: var(--color-bone);
  color: var(--color-ink);
  border: var(--border-ink);
  font-family: var(--font-display);
  cursor: pointer;
}
.qty-n {
  min-width: 1.25rem;
  text-align: center;
  font-family: var(--font-body);
  color: var(--color-bone);
}
.remove {
  background: transparent;
  color: var(--color-acid-red);
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
}
.foot {
  border-top: var(--border-bone);
  margin-top: 1rem;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.nudge {
  font-family: var(--font-zine);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  text-align: center;
  background: var(--color-acid-yellow);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  padding: 0.5rem 0.7rem;
  margin: 0;
  transform: rotate(var(--rotate-strip));
}
.totals {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.trow {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--color-bone);
}
.trow.discount {
  color: var(--color-acid-lime);
}
.trow.total {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 1.25rem;
  border-top: var(--border-bone);
  padding-top: 0.5rem;
}
.trow.total span:last-child {
  color: var(--color-acid-pink);
}
.checkout {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.checkout:hover {
  transform: translate(-1px, -1px);
}
.checkout:active {
  transform: translate(2px, 2px);
}
.note {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: var(--color-acid-red);
  margin: 0;
}
</style>
