<script setup lang="ts">
import Header from "../components/Header.vue";
import Hero from "../components/Hero.vue";
import ProductGrid from "../components/ProductGrid.vue";
import Tenets from "../components/Tenets.vue";
import Manifesto from "../components/Manifesto.vue";
import Newsletter from "../components/Newsletter.vue";
import Footer from "../components/Footer.vue";
import CartDrawer from "../components/CartDrawer.vue";
import { useCartStore } from "../stores/cart";

const cart = useCartStore();
</script>

<template>
  <Header />
  <Hero />
  <ProductGrid />
  <Tenets />
  <Manifesto />
  <Newsletter />
  <Footer />
  <CartDrawer v-if="cart.isOpen" />
</template>
