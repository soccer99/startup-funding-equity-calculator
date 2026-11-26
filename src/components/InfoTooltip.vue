<script setup lang="ts">
import { glossary } from '@/data/glossary'

const props = defineProps<{
  termKey: string
}>()

const term = glossary[props.termKey]
</script>

<template>
  <!-- Opens on click too, so it works on touch screens. -->
  <VDropdown :triggers="['click', 'hover', 'focus']" :distance="6" placement="top" class="inline-flex align-middle">
    <button
      type="button"
      class="ml-1.5 size-6 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      :aria-label="`What is ${term?.term ?? 'this'}?`"
    >
      <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
      </svg>
    </button>

    <template #popper>
      <div class="card w-72 max-w-[calc(100vw-2rem)] p-4 font-sans normal-case tracking-normal text-left">
        <div class="text-sm font-semibold text-white mb-2">{{ term?.term }}</div>
        <div class="text-sm font-normal text-slate-300 leading-relaxed">{{ term?.definition }}</div>
      </div>
    </template>
  </VDropdown>
</template>
