import { ref } from "vue";
import type { Product } from "@grave-goods/shared";

export function useProducts() {
  const products = ref<Product[]>([]);
  const loading = ref(true);
  const error = ref(false);

  async function load() {
    loading.value = true;
    error.value = false;
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      products.value = (await res.json()) as Product[];
    } catch {
      error.value = true;
    } finally {
      loading.value = false;
    }
  }

  void load();
  return { products, loading, error, reload: load };
}
