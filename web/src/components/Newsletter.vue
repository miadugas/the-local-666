<script setup lang="ts">
import { ref } from "vue";

const email = ref("");
const status = ref<"idle" | "loading" | "done" | "error">("idle");
const errorMsg = ref("");

async function handleSubmit() {
  if (status.value === "loading") return;
  status.value = "loading";
  errorMsg.value = "";
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      status.value = "error";
      errorMsg.value = data.message ?? "Couldn't sign you up — try again.";
      return;
    }
    status.value = "done";
    email.value = "";
  } catch {
    status.value = "error";
    errorMsg.value = "Couldn't sign you up — try again.";
  }
}
</script>

<template>
  <section class="newsletter" aria-label="Newsletter signup">
    <h2 class="head">Join the local</h2>
    <p class="lede">
      Drops, restocks, the occasional call to arms. No spam, no salvation, no
      algorithm.
    </p>
    <p v-if="status === 'done'" class="confirm" role="status">
      You're on the list. Welcome to the local.
    </p>
    <form v-else class="form" @submit.prevent="handleSubmit">
      <input
        v-model="email"
        type="email"
        required
        :disabled="status === 'loading'"
        placeholder="you@email.com"
        aria-label="Email address"
        class="email-input"
      />
      <button
        type="submit"
        class="subscribe-btn"
        :disabled="status === 'loading'"
      >
        {{ status === "loading" ? "ADDING…" : "I'M IN" }}
      </button>
    </form>
    <p v-if="status === 'error'" class="error" role="alert">{{ errorMsg }}</p>
  </section>
</template>

<style scoped>
.newsletter {
  padding: clamp(3rem, 7vw, 4.5rem) clamp(1rem, 4vw, 2.25rem);
  background: var(--color-acid-pink);
  border-bottom: var(--border-bone);
  text-align: center;
}

.head {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.625rem);
  line-height: 0.95;
  color: var(--color-ink);
  margin: 0 0 0.75rem;
}

.lede {
  color: var(--color-ink);
  font-weight: 500;
  font-size: 0.95rem;
  margin: 0 0 1.5rem;
}

.form {
  display: inline-flex;
  gap: 0.625rem;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 100%;
}

.email-input {
  background: var(--color-bone);
  border: var(--border-ink);
  /* 44px min for touch — meets iOS tap-target guideline */
  min-height: 44px;
  padding: 0.8125rem 1.125rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--color-ink);
  box-shadow: var(--shadow-block-ink);
  width: min(17.5rem, 100%);
  outline: none;
}
.email-input::placeholder {
  color: rgba(5, 5, 5, 0.55);
}
.email-input:focus-visible {
  background: #fff;
  /* outline handled globally; bg lift signals "field active" on top */
}
/* Invalid email — only after the user types something. acid-red is the
   reserved warning semantic per CLAUDE.md. */
.email-input:invalid:not(:placeholder-shown) {
  border-color: var(--color-acid-red);
  box-shadow:
    var(--shadow-block-ink),
    inset 0 0 0 2px var(--color-acid-red);
}
.email-input:invalid:not(:placeholder-shown) + .subscribe-btn {
  cursor: not-allowed;
}

.subscribe-btn {
  background: var(--color-ink);
  color: var(--color-acid-yellow);
  border: var(--border-ink);
  /* 44px min for touch — meets iOS tap-target guideline */
  min-height: 44px;
  padding: 0.8125rem 1.375rem;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  /* Bone offset (not ink): the button is black, so an ink shadow merges into
     it and reads as a blob. Bone gives a crisp hard-offset against the pink. */
  box-shadow: var(--shadow-block-bone);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.subscribe-btn:hover {
  transform: translate(-1px, -1px);
}
.subscribe-btn:active {
  transform: translate(2px, 2px);
}
.subscribe-btn:disabled,
.email-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.confirm {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-ink);
  margin: 0;
}
.error {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-ink);
  margin: 0.75rem 0 0;
}
/* :focus-visible handled globally */

@media (max-width: 640px) {
  .form {
    flex-direction: column;
    align-items: stretch;
  }
  .email-input {
    width: auto;
  }
}
</style>
