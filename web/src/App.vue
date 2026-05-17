<script setup lang="ts">
import Header from "./components/Header.vue";
import Hero from "./components/Hero.vue";
import ProductGrid from "./components/ProductGrid.vue";
import ValuesStrip from "./components/ValuesStrip.vue";
import Manifesto from "./components/Manifesto.vue";
import Newsletter from "./components/Newsletter.vue";
import Footer from "./components/Footer.vue";
</script>

<template>
  <div class="grain-overlay" aria-hidden="true"></div>
  <Header />
  <Hero />
  <ProductGrid />
  <ValuesStrip />
  <Manifesto />
  <Newsletter />
  <Footer />
</template>
