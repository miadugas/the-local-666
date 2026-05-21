<script setup lang="ts">
import { ref } from "vue";

defineProps<{ currentUrl: string | null }>();
const emit = defineEmits<{
  uploaded: [payload: { secureUrl: string; publicId: string }];
}>();

type Status = "idle" | "uploading" | "error" | "unconfigured";
const status = ref<Status>("idle");
const errorMsg = ref("");

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  status.value = "uploading";
  errorMsg.value = "";

  const signRes = await fetch("/api/admin/uploads/sign", { method: "POST" });
  if (signRes.status === 503) {
    status.value = "unconfigured";
    return;
  }
  if (!signRes.ok) {
    status.value = "error";
    errorMsg.value = "Could not get an upload signature.";
    return;
  }
  const { cloudName, apiKey, timestamp, folder, signature } =
    await signRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  try {
    const up = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form },
    );
    if (!up.ok) {
      status.value = "error";
      errorMsg.value = "Upload failed.";
      return;
    }
    const data = await up.json();
    emit("uploaded", { secureUrl: data.secure_url, publicId: data.public_id });
    status.value = "idle";
  } catch {
    status.value = "error";
    errorMsg.value = "Upload failed.";
  }
}
</script>

<template>
  <div class="uploader">
    <img v-if="currentUrl" :src="currentUrl" alt="" class="preview" />
    <input type="file" accept="image/*" @change="onFileChange" />
    <p v-if="status === 'uploading'" class="note">Uploading…</p>
    <p v-if="status === 'unconfigured'" class="warn">
      Image uploads aren't configured — set the Cloudinary env vars.
    </p>
    <p v-if="status === 'error'" class="warn">{{ errorMsg }}</p>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.preview {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border: var(--border-ink);
  background: var(--color-bone);
}
.note {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: var(--color-bone);
  margin: 0;
}
.warn {
  font-family: var(--font-zine);
  font-size: 0.75rem;
  color: var(--color-acid-red);
  margin: 0;
}
</style>
