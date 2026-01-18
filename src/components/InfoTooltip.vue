<script setup lang="ts">
import { glossary } from '@/data/glossary'

const props = defineProps<{
  termKey: string
}>()

const term = glossary[props.termKey]
</script>

<template>
  <VDropdown
    :triggers="['hover', 'focus']"
    :distance="6"
    :skidding="0"
    placement="top"
    class="inline"
  >
    <button
      class="ml-1 text-slate-500 hover:text-slate-300 transition-colors align-middle"
      aria-label="More information"
    >
      <svg class="w-3.5 h-3.5 inline" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
      </svg>
    </button>

    <template #popper>
      <div class="w-72 p-4 bg-slate-900 border border-slate-700 rounded shadow-lg">
        <div class="text-sm font-medium text-white mb-2">{{ term?.term }}</div>
        <div class="text-sm text-slate-400 leading-relaxed">{{ term?.definition }}</div>
      </div>
    </template>
  </VDropdown>
</template>

<style>
.v-popper--theme-dropdown .v-popper__inner {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.v-popper--theme-dropdown .v-popper__arrow-container {
  display: none;
}
</style>
