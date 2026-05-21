<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAdminStore } from "../stores/admin";

const admin = useAdminStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref(false);
const submitting = ref(false);

async function onSubmit() {
  error.value = false;
  submitting.value = true;
  const ok = await admin.signIn(email.value, password.value);
  submitting.value = false;
  if (ok) {
    router.push({ name: "admin" });
  } else {
    error.value = true;
  }
}
</script>

<template>
  <main class="login">
    <form class="card" @submit.prevent="onSubmit">
      <h1 class="title">Admin</h1>
      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" required autocomplete="username" />
      </label>
      <label class="field">
        <span>Password</span>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
        />
      </label>
      <p v-if="error" class="err">Invalid email or password.</p>
      <button type="submit" class="btn" :disabled="submitting">
        {{ submitting ? "Signing in…" : "Sign in" }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-pitch);
  padding: 1.5rem;
}
.card {
  width: min(380px, 100%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-pitch);
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  box-shadow: var(--shadow-block-pink);
  padding: 1.75rem;
}
.title {
  font-family: var(--font-brand);
  font-size: 2rem;
  color: var(--color-bone);
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-bone);
}
.field input {
  font-family: var(--font-body);
  font-size: 1rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-bone);
  color: var(--color-ink);
  border: var(--border-ink);
  border-radius: var(--radius-tight);
}
.err {
  color: var(--color-acid-red);
  font-family: var(--font-zine);
  font-size: 0.8rem;
  margin: 0;
}
.btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.7rem 1rem;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.btn:hover {
  transform: translate(-1px, -1px);
}
.btn:active {
  transform: translate(2px, 2px);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
