<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const STRIP_LINES = [
  "★ April drop is live ★ free shipping over $40 ★ ACAB ★ queer rights ★ free Palestine ★",
  "Half of April profits → Colorado Freedom Fund ★ no zionist neighbours ★ trans rights ★",
  "Riso-printed at 5,280 ft in a Denver basement ★ pack of two queer lesbo's and a cat named Circe ★",
];

const stripIndex = ref(0);
let stripTimer: number | undefined;

onMounted(() => {
  stripTimer = window.setInterval(() => {
    stripIndex.value = (stripIndex.value + 1) % STRIP_LINES.length;
  }, 5000);
});

onUnmounted(() => {
  if (stripTimer) clearInterval(stripTimer);
});

const NAV = [
  { label: "Stickers", href: "#" },
  { label: "Tarot", href: "#" },
  { label: "ACAB", href: "#" },
  { label: "Queer joy", href: "#" },
  { label: "Demons", href: "#", hot: true },
  { label: "Mutual aid", href: "#" },
  { label: "The zine", href: "#" },
];
</script>

<template>
  <header class="sticky top-0 z-50 bg-plum-1000 text-bone-100">
    <!-- Announcement strip — blood-red riso ink + tactical/activist copy, rotating every 5s -->
    <div
      class="tex-grain relative overflow-hidden bg-ember-700 text-bone-50 text-center font-poster text-[13px] uppercase tracking-shout py-2.5 border-b-[3px] border-plum-1000"
    >
      <span :key="stripIndex" class="strip-line relative inline-block">
        {{ STRIP_LINES[stripIndex] }}
      </span>
    </div>

    <!-- Sticky plum nav row -->
    <div class="bg-plum-1000 border-b border-bone-100/15">
      <div
        class="max-w-[1240px] mx-auto px-8 py-4 grid grid-cols-[auto_1fr_auto] items-center gap-8"
      >
        <!-- Off-register wordmark -->
        <a href="/" class="no-underline inline-block">
          <span
            class="relative inline-block font-poster text-[28px] uppercase leading-none tracking-[0.06em]"
          >
            <span
              aria-hidden="true"
              class="absolute top-[2px] left-[3px] text-ember-300 whitespace-nowrap"
            >
              Grave Goods
            </span>
            <span class="relative text-bone-100">Grave Goods</span>
          </span>
        </a>

        <!-- Nav -->
        <nav class="flex justify-center gap-[22px] flex-wrap">
          <a
            v-for="item in NAV"
            :key="item.label"
            :href="item.href"
            class="font-poster text-[13px] uppercase tracking-shout text-bone-100 no-underline relative py-1 border-b-2 border-transparent hover:border-ember-500 transition-[border-color] duration-fast"
          >
            {{ item.label
            }}<sup
              v-if="item.hot"
              class="ml-1 font-marker text-[11px] text-ember-300 align-super lowercase"
              >new</sup
            >
          </a>
        </nav>

        <!-- Right cluster: search · user · cart -->
        <div class="flex items-center gap-2.5">
          <button type="button" aria-label="Search" class="icon-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button type="button" aria-label="Account" class="icon-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Cart"
            class="cart-btn font-poster text-[13px] uppercase tracking-shout inline-flex items-center gap-2 bg-ember-500 text-bone-50 px-4 py-2.5 cursor-pointer"
          >
            Cart
            <span class="opacity-70 ml-1">· $0</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
@keyframes stripSlide {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.strip-line {
  animation: stripSlide 350ms var(--ease-snap);
}

.icon-btn {
  background: transparent;
  border: 1px solid rgb(247 244 239 / 0.22);
  padding: 9px 11px;
  cursor: pointer;
  color: var(--color-bone-100);
  display: inline-flex;
  align-items: center;
  transition:
    background 120ms,
    border-color 120ms;
}
.icon-btn:hover {
  border-color: rgb(247 244 239 / 0.5);
  background: rgb(247 244 239 / 0.08);
}

.cart-btn {
  border: none;
  box-shadow: 4px 4px 0 var(--color-bone-100);
  transition:
    transform 120ms var(--ease-snap),
    box-shadow 120ms var(--ease-snap);
}
.cart-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--color-bone-100);
}
.cart-btn:active {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 var(--color-bone-100);
}
</style>
