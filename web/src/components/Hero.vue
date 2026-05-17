<script setup lang="ts">
// Riso-edition hero: dark plum surface, off-register "NO GODS, JUST STICKERS."
// in Anton SC, halftone tentacle riso sample card on the right.
</script>

<template>
  <section
    class="relative overflow-hidden bg-plum-1000 text-bone-100 pt-[60px] pb-[90px] border-b-[4px] border-plum-900"
  >
    <!-- Full-section riso halftone backdrop (bone overlay + blood bottom-left patch) -->
    <svg
      class="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="hero-ht-blood"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2.5" cy="2.5" r="1.3" fill="rgb(193 33 39 / 0.35)" />
        </pattern>
        <pattern
          id="hero-ht-bone"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.0" fill="rgb(247 244 239 / 0.12)" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#hero-ht-bone)" />
      <rect x="0" y="40%" width="62%" height="60%" fill="url(#hero-ht-blood)" />
    </svg>

    <div
      class="relative max-w-[1240px] mx-auto px-8 grid grid-cols-[1.5fr_1fr] gap-14 items-start"
    >
      <!-- LEFT — issue meta · ransom headline · lede · CTAs -->
      <div>
        <div
          class="font-poster text-[13px] tracking-[0.3em] uppercase text-blood-500 mb-[18px]"
        >
          ★ Issue No. 04 · Two-color riso ★
        </div>

        <h1
          class="relative m-0 font-poster uppercase leading-[0.88] tracking-tight text-[clamp(3.5rem,12vw,9.75rem)]"
        >
          <!-- Off-register back layer (blood-red, offset) -->
          <span
            aria-hidden="true"
            class="absolute left-[6px] top-[5px] text-blood-500 opacity-95"
            >No gods,<br />just<br />stickers.</span
          >
          <!-- Front layer (bone-50) -->
          <span class="relative text-bone-50"
            >No gods,<br />just<br />stickers.</span
          >
        </h1>

        <p
          class="font-body text-base leading-[1.65] text-bone-300 mt-9 mb-0 max-w-[52ch]"
        >
          Riso-printed in two passes on 100lb French Speckletone. Small-batch
          stickers and buttons.
          <b class="text-bone-50">For people who'd rather be loud than polite</b
          >.
        </p>

        <div class="mt-[26px] flex gap-[14px] flex-wrap">
          <button type="button" class="cta-primary">Browse the drop →</button>
          <button type="button" class="cta-secondary">Read the zine</button>
        </div>
      </div>

      <!-- RIGHT — rotated riso print-sample card -->
      <div
        class="relative self-start mt-[18px] p-5 bg-plum-1000 border-2 border-bone-100"
        style="
          transform: rotate(-1.6deg);
          box-shadow: 8px 8px 0 var(--color-blood-500);
        "
      >
        <div
          class="font-mono text-[11px] tracking-shout text-blood-500 uppercase mb-[14px]"
        >
          ★ Print sample · 2-pass riso
        </div>

        <svg
          viewBox="0 0 360 360"
          class="block w-full h-auto"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="card-ht"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="2" fill="#c12127" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="360" height="360" fill="#0c0610" />
          <!-- Halftone tentacle blob + off-register bone overlay -->
          <g transform="translate(180 200)">
            <path
              d="M -120 80 C -140 0, -100 -80, -40 -100 C 0 -120, 40 -80, 60 -40 C 100 -60, 120 -10, 100 40 C 80 80, 0 100, -80 110 Z"
              fill="url(#card-ht)"
            />
            <path
              d="M -100 60 C -100 20, -60 -40, 0 -50 C 60 -60, 80 -20, 70 30 C 50 80, -10 90, -100 60 Z"
              fill="#f7f4ef"
              opacity="0.18"
              transform="translate(6 -4)"
            />
          </g>
          <!-- Off-register VISIBLE -->
          <text
            x="180"
            y="62"
            text-anchor="middle"
            fill="#c12127"
            opacity="0.85"
            font-family="var(--font-poster)"
            font-size="44"
            letter-spacing="0.04em"
            transform="translate(5 4)"
          >
            VISIBLE
          </text>
          <text
            x="180"
            y="62"
            text-anchor="middle"
            fill="#f7f4ef"
            font-family="var(--font-poster)"
            font-size="44"
            letter-spacing="0.04em"
          >
            VISIBLE
          </text>
          <!-- Off-register DISSENT -->
          <text
            x="180"
            y="326"
            text-anchor="middle"
            fill="#c12127"
            opacity="0.85"
            font-family="var(--font-poster)"
            font-size="58"
            letter-spacing="0.04em"
            transform="translate(5 4)"
          >
            DISSENT
          </text>
          <text
            x="180"
            y="326"
            text-anchor="middle"
            fill="#f7f4ef"
            font-family="var(--font-poster)"
            font-size="58"
            letter-spacing="0.04em"
          >
            DISSENT
          </text>
        </svg>

        <div
          class="font-mono text-[11px] text-bone-300 mt-[14px] leading-[1.55] tracking-[0.04em]"
        >
          No.&nbsp;04 / 100<br />
          printed on 100lb French Speckletone<br />
          · two passes, slight misregister ·
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-primary {
  background: var(--color-ember-500);
  color: var(--color-bone-50);
  border: none;
  padding: 16px 28px;
  font-family: var(--font-poster);
  font-size: 14px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 5px 5px 0 var(--color-bone-50);
  transition:
    transform 120ms var(--ease-snap),
    box-shadow 120ms var(--ease-snap);
}
.cta-primary:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 var(--color-bone-50);
}
.cta-primary:active {
  transform: translate(4px, 4px);
  box-shadow: 1px 1px 0 var(--color-bone-50);
}

.cta-secondary {
  background: transparent;
  color: var(--color-bone-100);
  border: 2px solid var(--color-bone-100);
  padding: 16px 26px;
  font-family: var(--font-poster);
  font-size: 14px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background 120ms,
    color 120ms;
}
.cta-secondary:hover {
  background: var(--color-bone-100);
  color: var(--color-plum-1000);
}
</style>
