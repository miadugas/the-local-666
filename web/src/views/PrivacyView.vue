<script setup lang="ts">
import ContentPage from "../components/ContentPage.vue";
</script>

<template>
  <ContentPage title="Privacy" eyebrow="What we keep, what we don't">
    <p>
      Short version: we collect the bare minimum to send you stickers, and we
      don't sell anything about you to anyone. Ever.
    </p>

    <h2>What we collect</h2>
    <p>
      Your <strong>email</strong> — to send your order confirmation and receipt,
      plus the newsletter if you opted in. Your
      <strong>shipping address</strong> — to mail your order. That's the whole
      list.
    </p>

    <h2>Payments</h2>
    <p>
      Card payments run through <strong>Stripe</strong>. We never see or store
      your card number — Stripe handles all of it. We just get a "paid" signal
      and the list of what you ordered.
    </p>

    <h2>Email</h2>
    <p>
      Order emails go out through <strong>Resend</strong>. The newsletter is
      opt-in with one-click unsubscribe — no dark patterns, no "are you sure you
      want to leave" guilt trips.
    </p>

    <h2>The rest</h2>
    <p>
      No ad trackers, no data brokers, no selling your info. Want your data
      gone, or have a question?
      <a href="mailto:hello@thelocal666.com">Email us</a> and we'll sort it out.
    </p>
  </ContentPage>
</template>
