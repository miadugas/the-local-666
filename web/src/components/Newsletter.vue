<script setup lang="ts">
import { ref } from "vue";

const email = ref("");

function handleSubmit() {
  // TODO (phase 6): wire to Resend via POST /api/subscribe.
  // For now the form is a no-op.
}
</script>

<template>
  <section
    class="relative overflow-hidden bg-ember-700 text-bone-50 py-[60px] border-y-[4px] border-plum-900"
  >
    <!-- Riso grain overlay -->
    <div
      aria-hidden="true"
      class="absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.22]"
      style="
        background-image: url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;);
      "
    ></div>

    <div
      class="relative max-w-[1240px] mx-auto px-8 grid grid-cols-2 gap-[60px] items-center"
    >
      <!-- Left: kicker + headline -->
      <div>
        <div
          class="font-mono text-[11px] tracking-[0.28em] uppercase mb-[10px]"
        >
          Subscribe — Section C
        </div>
        <h2
          class="font-display font-black text-[72px] leading-[0.9] tracking-tight m-0"
        >
          One cursed email,<br /><span class="italic">monthly.</span>
        </h2>
      </div>

      <!-- Right: body + form -->
      <div>
        <p class="font-body text-[15px] leading-[1.55] m-0 mb-4 max-w-[44ch]">
          New drops, mutual-aid totals, and the occasional photo of the cat who
          guards the print room. We will never sell your email. We will never DM
          you about manifestation.
        </p>
        <form class="flex gap-[10px]" @submit.prevent="handleSubmit">
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
    </div>
  </section>
</template>

<style scoped>
.email-input {
  flex: 1;
  padding: 14px 16px;
  background: var(--color-bone-50);
  color: var(--color-plum-900);
  border: 3px solid var(--color-plum-900);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 15px;
  box-shadow: 5px 5px 0 var(--color-plum-900);
  outline: none;
}
.email-input::placeholder {
  color: var(--color-plum-600);
}
.email-input:focus {
  outline: 2px solid var(--color-ember-300);
  outline-offset: 2px;
}

.subscribe-btn {
  background: var(--color-bone-50);
  color: var(--color-plum-900);
  font-family: var(--font-poster);
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 14px 22px;
  border: 3px solid var(--color-plum-900);
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 5px 5px 0 var(--color-plum-900);
  transition:
    transform 120ms var(--ease-snap),
    box-shadow 120ms var(--ease-snap);
}
.subscribe-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 var(--color-plum-900);
}
.subscribe-btn:active {
  transform: translate(4px, 4px);
  box-shadow: 1px 1px 0 var(--color-plum-900);
}
</style>
