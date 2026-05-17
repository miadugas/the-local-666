<script setup lang="ts">
defineProps<{ kicker: string; title: string }>();
</script>

<template>
  <div
    class="border-b-[4px] border-plum-900 pb-[14px] mb-9 flex justify-between items-end"
  >
    <div>
      <div
        class="font-mono text-[11px] tracking-[0.28em] uppercase text-ember-500 font-bold mb-[6px]"
      >
        {{ kicker }}
      </div>
      <h2
        class="font-display font-black text-[64px] tracking-tight leading-[0.95] m-0 text-plum-900"
      >
        {{ title }}
      </h2>
    </div>
    <slot name="right" />
  </div>
</template>
