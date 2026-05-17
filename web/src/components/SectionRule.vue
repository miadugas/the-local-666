<script setup lang="ts">
defineProps<{ kicker: string; title: string }>();
</script>

<template>
  <header class="section-rule">
    <div>
      <p class="kicker">{{ kicker }}</p>
      <h2 class="title">{{ title }}</h2>
    </div>
    <slot name="right" />
  </header>
</template>

<style scoped>
.section-rule {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 1rem;
  margin-bottom: 1.75rem;
  border-bottom: 1px solid var(--border);
}

.kicker {
  margin: 0 0 0.45rem;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-soft);
  font-weight: 600;
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.8rem, 4.5vw, 2.8rem);
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--fg);
}
</style>
