<script setup lang="ts">
import { ref } from "vue";

const email = ref("");

function handleSubmit() {
  // TODO (phase 6): wire to Resend via POST /api/subscribe.
}
</script>

<template>
  <section class="newsletter" aria-label="Newsletter signup">
    <h2 class="head">Join the wake</h2>
    <p class="lede">
      Restocks, new drops, occasional manifestos. No spam, no algorithm.
    </p>
    <form class="form" @submit.prevent="handleSubmit">
      <input
        v-model="email"
        type="email"
        required
        placeholder="your@email.com"
        aria-label="Email address"
        class="email-input"
      />
      <button type="submit" class="subscribe-btn">Sign me up</button>
    </form>
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
  outline: 3px solid var(--color-acid-blue);
  outline-offset: 2px;
}

.subscribe-btn {
  background: var(--color-ink);
  color: var(--color-acid-yellow);
  border: var(--border-ink);
  padding: 0.8125rem 1.375rem;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.8125rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  box-shadow: var(--shadow-block-ink);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.subscribe-btn:hover {
  transform: translate(-1px, -1px);
}
.subscribe-btn:active {
  transform: translate(2px, 2px);
}
.subscribe-btn:focus-visible {
  outline: 3px solid var(--color-acid-blue);
  outline-offset: 2px;
}

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
