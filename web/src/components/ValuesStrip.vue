<script setup lang="ts">
// Four mutual-aid / process promises on a dark plum band.
// Candle-gold icons = highlight/holy semantic, fits "value statement".
</script>

<template>
  <section
    class="relative overflow-hidden bg-plum-900 text-bone-100 py-[42px] border-y-[4px] border-plum-900"
  >
    <!-- Photocopy-bleed light noise overlay (screen blend on dark = bone-bright dust) -->
    <div
      aria-hidden="true"
      class="absolute inset-0 pointer-events-none mix-blend-screen opacity-[0.06]"
      style="
        background-image: url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;);
      "
    ></div>

    <div class="relative max-w-[1240px] mx-auto px-8 grid grid-cols-4 gap-0">
      <!-- Mutual aid -->
      <div class="px-7">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="text-ember-300 block mb-[10px]"
        >
          <path d="M11 14h2a2 2 0 1 0 0-4h-3.5L5 14.5" />
          <path d="M5 14.5 8.5 18l5.5-2 5-3" />
          <path d="m20 8-3 3-3-3 1.5-1.5a2.121 2.121 0 0 1 3 3z" />
        </svg>
        <div
          class="font-display font-extrabold text-[18px] tracking-tight mb-1 text-bone-100"
        >
          Mutual aid
        </div>
        <div class="font-body text-[13px] text-bone-300 leading-[1.5]">
          50% of profits → bail funds, queer care, tenant orgs.
        </div>
      </div>

      <!-- Riso, Denver -->
      <div class="px-7 border-l border-plum-700">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="text-ember-300 block mb-[10px]"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path
            d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
          />
          <rect width="12" height="8" x="6" y="14" />
        </svg>
        <div
          class="font-display font-extrabold text-[18px] tracking-tight mb-1 text-bone-100"
        >
          Riso, Denver
        </div>
        <div class="font-body text-[13px] text-bone-300 leading-[1.5]">
          Two people. Two-color overlap. Mile-high basement.
        </div>
      </div>

      <!-- Free over $40 -->
      <div class="px-7 border-l border-plum-700">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="text-ember-300 block mb-[10px]"
        >
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path
            d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
          />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </svg>
        <div
          class="font-display font-extrabold text-[18px] tracking-tight mb-1 text-bone-100"
        >
          Free over $40
        </div>
        <div class="font-body text-[13px] text-bone-300 leading-[1.5]">
          Or find us at flea markets most weekends.
        </div>
      </div>

      <!-- Replace if it peels -->
      <div class="px-7 border-l border-plum-700">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="text-ember-300 block mb-[10px]"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        <div
          class="font-display font-extrabold text-[18px] tracking-tight mb-1 text-bone-100"
        >
          Replace if it peels
        </div>
        <div class="font-body text-[13px] text-bone-300 leading-[1.5]">
          We'll send another. No questions.
        </div>
      </div>
    </div>
  </section>
</template>
