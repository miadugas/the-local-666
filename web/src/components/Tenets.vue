<script setup lang="ts">
const TENETS = [
  {
    num: "01",
    text: "Bulk printed.\nHand shipped.",
    color: "var(--color-acid-pink)",
  },
  {
    num: "02",
    text: "Profits stay\nleftist.",
    color: "var(--color-acid-blue)",
  },
  {
    num: "03",
    text: "Stickers,\nnot merch.",
    color: "var(--color-acid-lime)",
  },
] as const;
</script>

<template>
  <section class="tenets">
    <article
      v-for="tenet in TENETS"
      :key="tenet.num"
      class="tenet"
      :style="{ '--tcolor': tenet.color }"
    >
      <span class="num">{{ tenet.num }}</span>
      <p class="text">{{ tenet.text }}</p>
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
  text-align: center;
}
.tenet:last-child {
  border-right: none;
}

.num {
  display: block;
  font-family: var(--font-display);
  font-size: 3rem;
  line-height: 1;
  color: var(--tcolor);
  margin-bottom: 0.5rem;
}

.text {
  font-family: var(--font-zine);
  font-size: 0.8125rem;
  line-height: 1.4;
  letter-spacing: 0.06em;
  color: var(--fg);
  text-transform: uppercase;
  white-space: pre-line; /* honor \n in the data */
  margin: 0;
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
