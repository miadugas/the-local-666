import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { AdminUser } from "@grave-goods/shared";

export const useAdminStore = defineStore("admin", () => {
  const user = ref<AdminUser | null>(null);
  const isAuthenticated = computed(() => user.value !== null);

  async function fetchMe(): Promise<void> {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        user.value = null;
        return;
      }
      const data = (await res.json()) as { user: AdminUser };
      user.value = data.user;
    } catch {
      user.value = null;
    }
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    const res = await fetch("/api/admin/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { user: AdminUser };
    user.value = data.user;
    return true;
  }

  async function signOut(): Promise<void> {
    await fetch("/api/admin/sign-out", { method: "POST" });
    user.value = null;
  }

  return { user, isAuthenticated, fetchMe, signIn, signOut };
});
