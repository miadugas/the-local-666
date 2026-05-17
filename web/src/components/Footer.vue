<script setup lang="ts">
const LINK_GROUPS = [
  {
    heading: "Shop",
    links: [
      "All stickers",
      "Tarot & saints",
      "ACAB",
      "Queer joy",
      "Lil demons",
      "Gift cards",
    ],
  },
  {
    heading: "About",
    links: [
      "Our story",
      "Mutual aid log",
      "Press",
      "Wholesale",
      "Flea market dates",
    ],
  },
  {
    heading: "Help",
    links: [
      "Shipping",
      "Returns",
      "Lost in the post",
      "Contact a human",
      "FAQ",
    ],
  },
];
</script>

<template>
  <footer class="bg-plum-1000 text-bone-100">
    <div class="max-w-[1240px] mx-auto px-8 pt-[60px] pb-[30px]">
      <!-- Colophon band -->
      <div
        class="flex justify-between items-baseline pb-[22px] border-b-2 border-plum-700 font-mono text-[11px] tracking-[0.24em] uppercase"
      >
        <span>The colophon</span>
        <span
          class="font-blackletter text-[36px] tracking-normal normal-case text-bone-100"
        >
          Grave Goods
        </span>
        <span>End of issue 12</span>
      </div>

      <!-- Main grid -->
      <div class="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mt-8">
        <!-- Brand column -->
        <div>
          <img
            src="/brand/logo.png"
            alt="Grave Goods"
            class="w-14 h-14 block select-none"
            style="filter: invert(1) brightness(1.05)"
            draggable="false"
          />
          <p
            class="font-body text-[13px] text-bone-300 max-w-[32ch] mt-[14px] leading-[1.6]"
          >
            est. for the haunted. Riso-printed in Denver on stolen Cheyenne,
            Arapaho, and Ute land. Pronouns negotiable.
          </p>
        </div>

        <!-- Link groups -->
        <div v-for="group in LINK_GROUPS" :key="group.heading">
          <div
            class="font-body font-extrabold text-[12px] tracking-[0.18em] uppercase text-bone-100 mb-3"
          >
            {{ group.heading }}
          </div>
          <ul class="list-none p-0 m-0 flex flex-col gap-2">
            <li v-for="link in group.links" :key="link">
              <a
                href="#"
                class="font-body text-[14px] text-bone-100 no-underline hover:text-ember-300 transition-colors"
              >
                {{ link }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom rail -->
      <div
        class="mt-10 pt-[18px] border-t border-plum-700 flex justify-between font-mono text-[11px] text-bone-400 tracking-[0.08em]"
      >
        <div>© Grave Goods — a worker-owned grave</div>
        <div>★ no gods, no masters, no minimum order ★</div>
      </div>
    </div>
  </footer>
</template>
