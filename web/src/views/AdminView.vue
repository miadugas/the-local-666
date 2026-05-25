<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { validateSalePrice } from "@grave-goods/shared";
import type { AdminProduct, StripColor } from "@grave-goods/shared";
import { useAdminStore } from "../stores/admin";
import { formatPrice } from "../lib/format";
import { renderMarkdown } from "../lib/markdown";
import ImageUploader from "../components/ImageUploader.vue";

const admin = useAdminStore();
const router = useRouter();

const products = ref<AdminProduct[]>([]);
const loadError = ref(false);

type FormModel = {
  id: number | null;
  title: string;
  slug: string;
  spec: string;
  priceDollars: string;
  accentHex: string;
  description: string;
  isSoldOut: boolean;
  displayOrder: number;
  imageUrl: string;
  imagePublicId: string | null;
  saleEnabled: boolean;
  salePriceDollars: string;
  saleLabel: string;
  saleEndsAt: string;
  stripLabel: string;
  stripColor: StripColor;
  stock: string; // "" = unlimited
};

const editing = ref<FormModel | null>(null);
const saving = ref(false);
const formError = ref("");

const descriptionPreview = computed(() =>
  editing.value ? renderMarkdown(editing.value.description) : "",
);

// Live margin preview — mirrors the server's validateSalePrice so the admin
// sees the same verdict (and the same block) before saving.
const salePreview = computed(() => {
  const f = editing.value;
  if (!f || !f.saleEnabled) return null;
  if (!f.salePriceDollars.trim()) {
    return { state: "error" as const, message: "Enter a sale price." };
  }
  const cents = Math.round(Number(f.salePriceDollars) * 100);
  if (!Number.isInteger(cents)) {
    return { state: "error" as const, message: "Sale price must be a number." };
  }
  const priceCents = Math.round(Number(f.priceDollars) * 100);
  if (Number.isInteger(priceCents) && cents >= priceCents) {
    return {
      state: "error" as const,
      message: "Sale must be below the regular price.",
    };
  }
  const result = validateSalePrice(cents);
  if (!result.ok) return { state: "error" as const, message: result.reason };
  return {
    state: result.level === "warn" ? ("warn" as const) : ("safe" as const),
    message: `Nets ${formatPrice(result.netCents)}/order · ~${result.marginPct}% margin${
      result.level === "warn" ? " — thin" : ""
    }`,
  };
});

function blankForm(): FormModel {
  return {
    id: null,
    title: "",
    slug: "",
    spec: '3" die-cut vinyl',
    priceDollars: "4",
    accentHex: "#ff2d8a",
    description: "",
    isSoldOut: false,
    displayOrder: products.value.length,
    imageUrl: "",
    imagePublicId: null,
    saleEnabled: false,
    salePriceDollars: "",
    saleLabel: "",
    saleEndsAt: "",
    stripLabel: "",
    stripColor: "pink",
    stock: "",
  };
}

async function load() {
  loadError.value = false;
  const res = await fetch("/api/admin/products");
  if (!res.ok) {
    loadError.value = true;
    return;
  }
  products.value = (await res.json()) as AdminProduct[];
}

function startCreate() {
  formError.value = "";
  editing.value = blankForm();
}

function startEdit(p: AdminProduct) {
  formError.value = "";
  editing.value = {
    id: p.id,
    title: p.title,
    slug: p.slug,
    spec: p.spec,
    priceDollars: (p.priceCents / 100).toString(),
    accentHex: p.accentHex,
    description: p.description ?? "",
    isSoldOut: p.isSoldOut,
    displayOrder: p.displayOrder,
    imageUrl: p.imageUrl,
    imagePublicId: p.imagePublicId,
    saleEnabled: p.salePriceCents != null,
    salePriceDollars:
      p.salePriceCents != null ? (p.salePriceCents / 100).toString() : "",
    saleLabel: p.saleLabel ?? "",
    saleEndsAt: p.saleEndsAt ? p.saleEndsAt.slice(0, 10) : "",
    stripLabel: p.stripLabel ?? "",
    stripColor: p.stripColor ?? "pink",
    stock: p.stock?.toString() ?? "",
  };
}

function cancel() {
  editing.value = null;
}

function onUploaded(payload: { secureUrl: string; publicId: string }) {
  if (!editing.value) return;
  editing.value.imageUrl = payload.secureUrl;
  editing.value.imagePublicId = payload.publicId;
}

async function save() {
  if (!editing.value) return;
  const f = editing.value;
  const priceCents = Math.round(Number(f.priceDollars) * 100);
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    formError.value = "Price must be a non-negative number.";
    return;
  }
  if (!f.title.trim()) {
    formError.value = "Title is required.";
    return;
  }
  if (!f.imageUrl.trim()) {
    formError.value = "An image is required.";
    return;
  }
  if (f.saleEnabled && salePreview.value?.state === "error") {
    formError.value = salePreview.value.message;
    return;
  }

  const stockTrimmed = f.stock.trim();
  let stock: number | null = null;
  if (stockTrimmed !== "") {
    const n = Number(stockTrimmed);
    if (!Number.isInteger(n) || n < 0) {
      formError.value =
        "Stock must be a whole number ≥ 0, or blank for unlimited.";
      return;
    }
    stock = n;
  }

  const saleCents = f.saleEnabled
    ? Math.round(Number(f.salePriceDollars) * 100)
    : null;
  const body = {
    title: f.title,
    slug: f.slug || undefined,
    spec: f.spec,
    priceCents,
    accentHex: f.accentHex,
    description: f.description ? f.description : null,
    isSoldOut: f.isSoldOut,
    displayOrder: f.displayOrder,
    imageUrl: f.imageUrl,
    imagePublicId: f.imagePublicId,
    salePriceCents: saleCents,
    saleLabel: f.saleEnabled && f.saleLabel.trim() ? f.saleLabel.trim() : null,
    saleEndsAt:
      f.saleEnabled && f.saleEndsAt
        ? new Date(f.saleEndsAt).toISOString()
        : null,
    stripLabel: f.stripLabel.trim() ? f.stripLabel.trim() : null,
    stripColor: f.stripColor,
    stock,
  };

  saving.value = true;
  formError.value = "";
  const res = await fetch(
    f.id === null ? "/api/admin/products" : `/api/admin/products/${f.id}`,
    {
      method: f.id === null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  saving.value = false;
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "Save failed." }));
    formError.value = data.message ?? "Save failed.";
    return;
  }
  editing.value = null;
  await load();
}

async function remove(p: AdminProduct) {
  if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
  const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
  if (res.ok) await load();
}

async function signOut() {
  await admin.signOut();
  router.push({ name: "admin-login" });
}

// Inventory list-row status. Shows effective sold-out (manual flag OR a tracked
// count at zero) plus the remaining count, and disambiguates a manual sold-out
// that still has positive stock so the row never reads as a contradiction.
function rowStatus(p: AdminProduct): string {
  const tracked = p.stock !== null;
  if (p.isSoldOut) {
    return tracked && p.stock! > 0
      ? `SOLD OUT (manual) · ${p.stock} left`
      : "SOLD OUT";
  }
  if (tracked && p.stock! <= 0) return "SOLD OUT (out of stock)";
  return tracked ? `${p.stock} left` : "∞";
}

onMounted(load);
</script>

<template>
  <main class="admin">
    <header class="bar">
      <h1 class="brand">the local 666 admin</h1>
      <div class="bar-actions">
        <button class="ghost" @click="startCreate">+ New product</button>
        <button class="ghost" @click="signOut">Sign out</button>
      </div>
    </header>

    <p v-if="loadError" class="warn">Couldn't load products.</p>

    <div class="workspace" :class="{ split: editing }">
      <ul class="list">
        <li v-for="p in products" :key="p.id" class="row">
          <img :src="p.imageUrl" alt="" class="thumb" />
          <div class="row-meta">
            <strong>{{ p.title }}</strong>
            <span class="muted">
              {{ p.slug }} · ${{ (p.priceCents / 100).toFixed(2) }} ·
              {{ rowStatus(p) }}
            </span>
          </div>
          <div class="row-actions">
            <button class="ghost" @click="startEdit(p)">Edit</button>
            <button class="ghost danger" @click="remove(p)">Delete</button>
          </div>
        </li>
      </ul>

      <div v-if="editing" class="editor">
        <h2 class="editor-title">
          {{ editing.id === null ? "New product" : "Edit product" }}
        </h2>
        <label class="field"
          ><span>Title</span><input v-model="editing.title"
        /></label>
        <label class="field"
          ><span>Slug (blank = from title)</span><input v-model="editing.slug"
        /></label>
        <label class="field"
          ><span>Spec</span><input v-model="editing.spec"
        /></label>
        <label class="field"
          ><span>Price (USD)</span
          ><input v-model="editing.priceDollars" inputmode="decimal"
        /></label>
        <label class="field"
          ><span>Accent hex</span><input v-model="editing.accentHex"
        /></label>
        <label class="field"
          ><span>Strip label (blank = positional fallback)</span
          ><input
            v-model="editing.stripLabel"
            maxlength="30"
            placeholder="Protect"
        /></label>
        <label class="field">
          <span>Strip color</span>
          <select v-model="editing.stripColor">
            <option value="pink">Pink</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
            <option value="lime">Lime</option>
          </select>
        </label>
        <label class="field"
          ><span>Display order</span
          ><input v-model.number="editing.displayOrder" type="number"
        /></label>
        <div class="field">
          <span>
            Description
            <em class="md-hint"
              >markdown: **bold**, _italic_, [link](url), - list</em
            >
          </span>
          <textarea
            v-model="editing.description"
            rows="7"
            class="md-input"
          ></textarea>
          <div v-if="editing.description.trim()" class="md-preview">
            <span class="md-preview-label">Preview</span>
            <!-- eslint-disable-next-line vue/no-v-html — sanitized in renderMarkdown -->
            <div class="prose" v-html="descriptionPreview"></div>
          </div>
        </div>
        <label class="check"
          ><input v-model="editing.isSoldOut" type="checkbox" /> Sold out</label
        >
        <label class="field"
          ><span>Stock (blank = unlimited)</span
          ><input v-model="editing.stock" inputmode="numeric" placeholder="∞"
        /></label>
        <div class="field sale-box">
          <label class="check">
            <input v-model="editing.saleEnabled" type="checkbox" /> Put this
            product on sale
          </label>
          <template v-if="editing.saleEnabled">
            <label class="field">
              <span
                >Sale price (USD)
                <em class="md-hint"
                  >regular ${{ editing.priceDollars }}</em
                ></span
              >
              <input v-model="editing.salePriceDollars" inputmode="decimal" />
            </label>
            <p
              v-if="salePreview"
              class="sale-preview"
              :class="salePreview.state"
            >
              {{ salePreview.message }}
            </p>
            <label class="field">
              <span>Sale badge label</span>
              <input
                v-model="editing.saleLabel"
                maxlength="50"
                placeholder="Clearance"
              />
            </label>
            <label class="field">
              <span>Sale ends (optional)</span>
              <input v-model="editing.saleEndsAt" type="date" />
            </label>
          </template>
        </div>
        <div class="field">
          <span>Image</span>
          <ImageUploader
            :current-url="editing.imageUrl || null"
            @uploaded="onUploaded"
          />
        </div>
        <p v-if="formError" class="warn">{{ formError }}</p>
        <div class="editor-actions">
          <button
            class="btn"
            :disabled="
              saving || (editing.saleEnabled && salePreview?.state === 'error')
            "
            @click="save"
          >
            {{ saving ? "Saving…" : "Save" }}
          </button>
          <button class="ghost" @click="cancel">Cancel</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.admin {
  min-height: 100vh;
  background: var(--color-pitch);
  color: var(--color-bone);
  padding: 1.5rem;
  width: min(1180px, 94vw);
  margin: 0 auto;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: var(--border-bone);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}
.brand {
  font-family: var(--font-brand);
  font-size: 1.75rem;
  margin: 0;
}
.bar-actions {
  display: flex;
  gap: 0.5rem;
}
.workspace {
  display: grid;
  gap: 1.25rem;
}
/* Two columns only while editing: inventory left, editor right. */
.workspace.split {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  padding: 0.5rem 0.75rem;
}
.thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: var(--color-bone);
  border: var(--border-ink);
}
.row-meta {
  display: flex;
  flex-direction: column;
}
.muted {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: color-mix(in oklab, var(--color-bone) 65%, transparent);
}
.row-actions {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}
.editor {
  border: var(--border-bone);
  border-radius: var(--radius-tight);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
/* Editor tracks the list as you scroll the inventory column. */
.workspace.split .editor {
  position: sticky;
  top: 1.5rem;
}
@media (max-width: 760px) {
  .workspace.split {
    grid-template-columns: 1fr;
  }
  .workspace.split .editor {
    position: static;
  }
}
.editor-title {
  font-family: var(--font-display);
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
.field input,
.field textarea,
.field select {
  font-family: var(--font-body);
  font-size: 1rem;
  padding: 0.5rem 0.65rem;
  background: var(--color-bone);
  color: var(--color-ink);
  border: var(--border-ink);
  border-radius: var(--radius-tight);
}
.md-input {
  resize: vertical;
  min-height: 6rem;
  line-height: 1.5;
}
/* Lowercase mono hint inside the uppercase field label. */
.md-hint {
  font-style: normal;
  text-transform: none;
  letter-spacing: 0;
  color: color-mix(in oklab, var(--color-bone) 55%, transparent);
}
.md-preview {
  border: var(--border-ink);
  border-radius: var(--radius-tight);
  background: color-mix(in oklab, var(--color-bone) 8%, transparent);
  padding: 0.65rem 0.8rem;
}
.md-preview-label {
  display: block;
  font-family: var(--font-zine);
  font-size: 0.6rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-bone) 55%, transparent);
  margin-bottom: 0.4rem;
}
/* The rendered preview itself reads as body copy, not the uppercase label. */
.md-preview .prose {
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.5;
  text-transform: none;
  letter-spacing: 0;
  color: var(--color-bone);
}
.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
}
.sale-box {
  gap: 0.75rem;
  border: var(--border-ink);
  border-radius: var(--radius-tight);
  padding: 0.875rem;
  background: color-mix(in oklab, var(--color-bone) 6%, transparent);
}
.sale-preview {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  letter-spacing: var(--tracking-wide);
  margin: 0;
}
.sale-preview.safe {
  color: var(--color-acid-lime);
}
.sale-preview.warn {
  color: var(--color-acid-yellow);
}
.sale-preview.error {
  color: var(--color-acid-red);
}
.editor-actions {
  display: flex;
  gap: 0.5rem;
}
.btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  box-shadow: var(--shadow-block-bone);
  font-family: var(--font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: 0.6rem 1.1rem;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ghost {
  background: transparent;
  color: var(--color-bone);
  border: var(--border-ink);
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}
.ghost.danger {
  color: var(--color-acid-red);
}
.warn {
  color: var(--color-acid-red);
  font-family: var(--font-zine);
  font-size: 0.8rem;
}
</style>
