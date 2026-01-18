<script setup lang="ts">
import { ref } from 'vue'
import type { Founder } from '@/types'
import { formatPercentage } from '@/utils/format'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps<{
  founders: Founder[]
  initialOptionPool: number
  totalPercentage: number
  totalInitialPercentage: number
  isValid: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [id: number]
  reorder: [fromIndex: number, toIndex: number]
  'update:initialOptionPool': [value: number]
}>()

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number) {
  draggedIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDrop(index: number) {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    emit('reorder', draggedIndex.value, index)
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <section class="mb-10">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-lg font-medium text-white">
        Founders & Initial Equity<InfoTooltip termKey="founder" />
      </h2>
      <div class="text-sm" :class="isValid ? 'text-slate-400' : 'text-red-400'">
        Total: {{ formatPercentage(totalInitialPercentage) }}
        <span v-if="!isValid">(must equal 100%)</span>
      </div>
    </div>

    <div class="border border-slate-800 rounded overflow-hidden">
      <!-- Founders -->
      <div
        v-for="(founder, index) in founders"
        :key="founder.id"
        draggable="true"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @dragleave="onDragLeave"
        @drop="onDrop(index)"
        @dragend="onDragEnd"
        class="flex items-center gap-4 px-4 py-3 transition-colors"
        :class="[
          index > 0 ? 'border-t border-slate-800' : '',
          draggedIndex === index ? 'opacity-50' : '',
          dragOverIndex === index && draggedIndex !== index ? 'bg-slate-800/50' : ''
        ]"
      >
        <div class="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
        <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
        <input
          v-model="founder.name"
          type="text"
          placeholder="Founder name"
          class="flex-1 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 hover:border-slate-600"
        />
        <input
          v-model.number="founder.percentage"
          type="number"
          min="0"
          max="100"
          step="0.1"
          class="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-right text-sm focus:outline-none focus:border-slate-600"
        />
        <span class="text-slate-500 text-sm">%</span>
        <button
          @click="emit('remove', founder.id)"
          class="text-slate-600 hover:text-red-400 transition-colors ml-2"
          :disabled="founders.length <= 1"
          :class="{ 'opacity-30 cursor-not-allowed hover:text-slate-600': founders.length <= 1 }"
          aria-label="Remove founder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Option Pool -->
      <div class="flex items-center gap-4 px-4 py-3 border-t border-slate-800 bg-slate-900/30">
        <div class="w-4"></div>
        <div class="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></div>
        <span class="flex-1 text-slate-300">
          Option Pool<InfoTooltip termKey="preMoneyOptionPool" />
          <span class="text-xs text-slate-600 ml-2">Pre-money</span>
        </span>
        <input
          :value="initialOptionPool"
          @input="emit('update:initialOptionPool', Number(($event.target as HTMLInputElement).value))"
          type="number"
          min="0"
          max="30"
          step="1"
          class="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-right text-sm focus:outline-none focus:border-slate-600"
        />
        <span class="text-slate-500 text-sm">%</span>
        <div class="w-4 ml-2"></div>
      </div>
    </div>

    <button
      @click="emit('add')"
      class="mt-3 text-sm text-slate-500 hover:text-white transition-colors"
    >
      + Add founder
    </button>
  </section>
</template>
