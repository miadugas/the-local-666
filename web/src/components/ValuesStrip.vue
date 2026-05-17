<script setup lang="ts">
const VALUES = [
  {
    title: "Mutual aid",
    body: "50% of profits → bail funds, queer care, tenant orgs.",
    icon: "hand-heart",
  },
  {
    title: "Two people · Denver",
    body: "Hand-printed in a mile-high basement. Pack of two queer lesbo’s and a cat named Circe.",
    icon: "printer",
  },
  {
    title: "Free over $40",
    body: "Or find us at flea markets most weekends.",
    icon: "truck",
  },
  {
    title: "Replace if it peels",
    body: "We’ll send another. No questions asked.",
    icon: "refresh",
  },
] as const;
</script>

<template>
  <section class="values">
    <div class="values-inner">
      <article v-for="item in VALUES" :key="item.title" class="value-card">
        <span class="icon" aria-hidden="true">
          <svg
            v-if="item.icon === 'hand-heart'"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M11 14h2a2 2 0 1 0 0-4h-3.5L5 14.5" />
            <path d="M5 14.5 8.5 18l5.5-2 5-3" />
            <path d="m20 8-3 3-3-3 1.5-1.5a2.121 2.121 0 0 1 3 3z" />
          </svg>
          <svg
            v-else-if="item.icon === 'printer'"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path
              d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
            />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          <svg
            v-else-if="item.icon === 'truck'"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
            />
            <path d="M15 18H9" />
            <path
              d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
            />
            <circle cx="17" cy="18" r="2" />
            <circle cx="7" cy="18" r="2" />
          </svg>
          <svg
            v-else
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.body }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.values {
  padding: clamp(2rem, 5vw, 3.5rem) 0;
}
.values-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.value-card {
  padding: 1.1rem 1.2rem 1.2rem;
  background: var(--panel);
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft-sm);
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9999px;
  background: rgba(255, 78, 43, 0.12);
  color: var(--accent-soft);
  margin-bottom: 0.7rem;
}

.value-card h3 {
  margin: 0 0 0.35rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.02rem;
  letter-spacing: 0.02em;
  color: var(--fg);
}

.value-card p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--fg-muted);
}
</style>
