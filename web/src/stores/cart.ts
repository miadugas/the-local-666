import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { calculateCart, getBundleNudge } from "@grave-goods/shared";
import type { Product } from "@grave-goods/shared";

export type CartItem = {
  slug: string;
  title: string;
  priceCents: number;
  salePriceCents: number | null;
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
    return parsed
      .filter(
        (i) =>
          i &&
          typeof i.slug === "string" &&
          typeof i.title === "string" &&
          typeof i.priceCents === "number" &&
          typeof i.imageUrl === "string" &&
          typeof i.quantity === "number",
      )
      .map(
        (i): CartItem => ({
          slug: i.slug,
          title: i.title,
          priceCents: i.priceCents,
          // Older carts predate sale support — default to no sale.
          salePriceCents:
            typeof i.salePriceCents === "number" ? i.salePriceCents : null,
          imageUrl: i.imageUrl,
          quantity: i.quantity,
        }),
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

  // Bundle pricing — uses the same locked engine the backend charges with, so
  // the displayed total always matches what Stripe will charge. Server stays
  // authoritative; this is display only.
  const cartTotal = computed(() =>
    calculateCart(
      items.value.map((i) => ({
        productId: i.slug,
        qty: i.quantity,
        salePriceCents: i.salePriceCents ?? undefined,
      })),
    ),
  );
  // What the line items add up to before the bundle discount (sale-aware).
  const rowsSubtotalCents = computed(() =>
    items.value.reduce(
      (sum, i) => sum + (i.salePriceCents ?? i.priceCents) * i.quantity,
      0,
    ),
  );
  const bundleSubtotalCents = computed(
    () => cartTotal.value.bundleSubtotalCents,
  );
  const bundleDiscountCents = computed(
    () => rowsSubtotalCents.value - bundleSubtotalCents.value,
  );
  const nudge = computed(() =>
    getBundleNudge(cartTotal.value.regularItemCount),
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
        salePriceCents: product.salePriceCents,
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
    rowsSubtotalCents,
    bundleSubtotalCents,
    bundleDiscountCents,
    nudge,
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
