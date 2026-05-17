<script setup lang="ts">
// Step-1 proof of life. Validates: @theme tokens generate utilities,
// fonts load, assets resolve, build pipeline is green. No real components yet.
</script>

<template>
  <main class="min-h-screen bg-bone-100 text-plum-900">
    <div class="mx-auto max-w-5xl px-8 py-16">
      <p class="font-mono text-xs uppercase tracking-shout text-ember-500">
        ★ Issue No. 04 · Foundation laid ★
      </p>

      <h1
        class="mt-8 font-poster uppercase leading-tight tracking-tight text-[clamp(3.5rem,12vw,9.75rem)]"
      >
        No gods,<br />just stickers.
      </h1>

      <p class="mt-8 max-w-prose text-lg leading-body text-plum-800">
        Punk, leftist, blessedly profane. Riso-printed for people who'd rather
        be loud than polite.
      </p>

      <div class="mt-16 flex items-end gap-10">
        <img
          src="/stickers/class-consciousness.png"
          alt="Class Consciousness sticker"
          class="w-72 rotate-[-3deg] shadow-peel-lg"
        />
        <div class="pb-2">
          <p class="font-display text-2xl">Class Consciousness</p>
          <p class="font-mono text-sm text-plum-600">3" die-cut vinyl · $4</p>
        </div>
      </div>

      <button
        type="button"
        class="mt-16 inline-flex items-center gap-2 bg-ember-500 text-bone-50 font-poster text-sm uppercase tracking-shout px-6 py-4 cursor-pointer shadow-peel border-[3px] border-plum-900 rounded-sm"
      >
        Browse the drop →
      </button>

      <p class="mt-24 font-mono text-xs uppercase tracking-shout text-plum-600">
        grave-goods-store · scaffold · step 1
      </p>
    </div>
  </main>
</template>
