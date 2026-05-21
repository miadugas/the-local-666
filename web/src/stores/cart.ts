import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { Product } from "@grave-goods/shared";

export type CartItem = {
  slug: string;
  title: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
};

const STORAGE_KEY = "grave-goods-cart";

function loadItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        i &&
        typeof i.slug === "string" &&
        typeof i.title === "string" &&
        typeof i.priceCents === "number" &&
        typeof i.imageUrl === "string" &&
        typeof i.quantity === "number",
    );
  } catch {
    return [];
  }
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>(loadItems());
  const isOpen = ref(false);

  const count = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  );
  const subtotalCents = computed(() =>
    items.value.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
  );

  function addItem(product: Product) {
    const existing = items.value.find((i) => i.slug === product.slug);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.value.push({
        slug: product.slug,
        title: product.title,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        quantity: 1,
      });
    }
    isOpen.value = true;
  }

  function removeItem(slug: string) {
    items.value = items.value.filter((i) => i.slug !== slug);
  }

  function setQuantity(slug: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(slug);
      return;
    }
    const item = items.value.find((i) => i.slug === slug);
    if (item) item.quantity = quantity;
  }

  function increment(slug: string) {
    const item = items.value.find((i) => i.slug === slug);
    if (item) item.quantity += 1;
  }

  function decrement(slug: string) {
    const item = items.value.find((i) => i.slug === slug);
    if (!item) return;
    if (item.quantity <= 1) {
      removeItem(slug);
    } else {
      item.quantity -= 1;
    }
  }

  function clear() {
    items.value = [];
  }

  function open() {
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
  }
  function toggle() {
    isOpen.value = !isOpen.value;
  }

  watch(
    items,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      } catch {
        /* ignore storage quota / availability errors */
      }
    },
    { deep: true },
  );

  return {
    items,
    isOpen,
    count,
    subtotalCents,
    addItem,
    removeItem,
    setQuantity,
    increment,
    decrement,
    clear,
    open,
    close,
    toggle,
  };
});
