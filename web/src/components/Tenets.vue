<script setup lang="ts">
const TENETS = [
  {
    setup: "No gods. No masters.",
    payoff: "No minimum orders.",
    color: "var(--color-acid-pink)",
    tilt: "-0.6deg",
  },
  {
    setup: "A quarter of profits",
    payoff: "fund the fight.",
    color: "var(--color-acid-blue)",
    tilt: "0.45deg",
  },
  {
    setup: "Not merch.",
    payoff: "Visible dissent.",
    color: "var(--color-acid-lime)",
    tilt: "-0.35deg",
  },
] as const;
</script>

<template>
  <section class="tenets">
    <article
      v-for="tenet in TENETS"
      :key="tenet.setup"
      class="tenet"
      :style="{ '--tcolor': tenet.color, '--tilt': tenet.tilt }"
    >
      <p class="text">
        <span class="line">{{ tenet.setup }}</span>
        <span class="line payoff">{{ tenet.payoff }}</span>
      </p>
    </article>
  </section>
</template>

<style scoped>
.tenets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
}

.tenet {
  padding: 2.25rem 2rem;
  border-right: var(--border-bone);
  text-align: left;
}
.tenet:last-child {
  border-right: none;
}

/* Two-ink zine print: setup line in bone, payoff line spot-colored in the
   tenet's acid. The twist is the accent — no numerals, no markers. */
.text {
  font-family: var(--font-zine);
  font-size: 1.25rem;
  line-height: 1.5;
  letter-spacing: 0.05em;
  color: var(--fg);
  text-transform: uppercase;
  margin: 0;
  transform: rotate(var(--tilt, 0deg));
}

.line {
  display: block;
}

.payoff {
  color: var(--tcolor);
}

@media (max-width: 640px) {
  .tenets {
    grid-template-columns: 1fr;
  }
  .tenet {
    border-right: none;
    border-bottom: var(--border-bone);
  }
  .tenet:last-child {
    border-bottom: none;
  }
}
</style>
