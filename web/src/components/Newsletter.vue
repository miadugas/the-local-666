<script setup lang="ts">
import { ref } from "vue";

const email = ref("");

function handleSubmit() {
  // TODO (phase 6): wire to Resend via POST /api/subscribe.
  // For now the form is a no-op.
}
</script>

<template>
  <section class="newsletter">
    <div class="newsletter-inner">
      <div class="copy">
        <p class="eyebrow">One cursed email, monthly</p>
        <h2>Join the haunt list.</h2>
        <p class="lede">
          New drops, mutual-aid totals, and the occasional photo of the cat who
          guards the print room. We will never sell your email. We will never DM
          you about manifestation.
        </p>
      </div>

      <form class="form" @submit.prevent="handleSubmit">
        <input
          v-model="email"
          type="email"
          required
          placeholder="where do we send the haunting?"
          aria-label="Email address"
          class="email-input"
        />
        <button type="submit" class="subscribe-btn">Subscribe</button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.newsletter {
  padding: clamp(2.5rem, 6vw, 5rem) 0;
}
.newsletter-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
  padding: clamp(1.8rem, 4vw, 3rem);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: center;
  backdrop-filter: blur(8px);
}

.eyebrow {
  margin: 0 0 0.55rem;
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-soft);
  font-weight: 600;
}

.copy h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.8rem, 3.5vw, 2.4rem);
  letter-spacing: 0.02em;
  color: var(--fg);
}

.lede {
  margin: 1rem 0 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--fg-muted);
  max-width: 44ch;
}

.form {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.email-input {
  flex: 1;
  min-width: 0;
  padding: 0.75rem 1rem;
  background: rgba(239, 231, 218, 0.08);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 9999px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  outline: none;
  transition:
    border-color 160ms,
    background 160ms;
}
.email-input::placeholder {
  color: var(--fg-faint);
}
.email-input:focus {
  border-color: var(--accent);
  background: rgba(239, 231, 218, 0.12);
}

.subscribe-btn {
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  color: #fff9f1;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.75rem 1.4rem;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: var(--shadow-glow-ember);
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);
}
.subscribe-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    var(--shadow-glow-ember),
    0 22px 44px rgba(255, 95, 50, 0.28);
}
.subscribe-btn:active {
  transform: translateY(0);
}

@media (max-width: 800px) {
  .newsletter-inner {
    grid-template-columns: 1fr;
  }
}
</style>
