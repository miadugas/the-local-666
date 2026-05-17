<script setup lang="ts">
import SectionRule from "./SectionRule.vue";
</script>

<template>
  <section class="relative bg-bone-200 py-[70px]">
    <div class="max-w-[1240px] mx-auto px-8">
      <SectionRule
        kicker="Section B · A statement"
        title="No gods. No masters. No minimum order."
      />

      <div class="grid grid-cols-2 gap-14 mt-1">
        <!-- Left: italic Bodoni pull-quote with blood-red rule -->
        <p
          class="font-display italic text-[26px] leading-[1.4] text-plum-900 m-0 border-l-[4px] border-blood-500 pl-[22px]"
        >
          We're a two-person operation in Denver. We print stickers, we send
          half the profits to bail funds, and we're never going to ask you to
          manifest abundance.
        </p>

        <!-- Right: body copy + CTAs -->
        <div>
          <p class="font-body text-[15px] leading-[1.65] m-0 text-plum-900">
            The shop is named after the objects buried with the dead — small
            useful things meant for the next world. Ours are smaller, more
            useful, and for this one. Queer rights · ACAB · free Palestine · sex
            worker solidarity.
          </p>

          <div class="flex gap-3 mt-[22px] items-center">
            <a href="#" class="btn-outline">Read our mutual-aid log</a>
            <a href="#" class="btn-ghost">Press &amp; wholesale</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.btn-outline {
  display: inline-block;
  font-family: var(--font-poster);
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-plum-900);
  background: transparent;
  border: 2px solid var(--color-plum-900);
  padding: 11px 18px;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 120ms,
    color 120ms;
}
.btn-outline:hover {
  background: var(--color-plum-900);
  color: var(--color-bone-100);
}

.btn-ghost {
  font-family: var(--font-poster);
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-plum-900);
  background: transparent;
  border: none;
  padding: 11px 6px;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  cursor: pointer;
  transition: color 120ms;
}
.btn-ghost:hover {
  color: var(--color-ember-500);
}
</style>
