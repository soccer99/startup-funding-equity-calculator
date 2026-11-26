<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Founder } from '@/types'
import { formatPercentage } from '@/utils/format'
import InfoTooltip from './InfoTooltip.vue'
import PercentInput from './PercentInput.vue'

const props = defineProps<{
  founders: Founder[]
  initialOptionPool: number
  totalInitialPercentage: number
  isValid: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [id: number]
  reorder: [fromIndex: number, toIndex: number]
  splitEqually: []
  'update:initialOptionPool': [value: number]
}>()

// A row can be dragged only while its grip handle is held.
// This keeps click-and-drag inside the inputs free for text selection.
const grabbedId = ref<number | null>(null)
// While a row is dragged, the list shows the new order at once (a live preview).
// The dragged row stays dim until the drop.
const draggedId = ref<number | null>(null)
let startIndex = -1

const indexOf = (id: number | null) => props.founders.findIndex(f => f.id === id)

function onDragStart(event: DragEvent, id: number) {
  draggedId.value = id
  startIndex = indexOf(id)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', '') // Firefox needs data to start a drag
  }
}

function onDragOver(index: number) {
  const from = indexOf(draggedId.value)
  if (from !== -1 && from !== index) emit('reorder', from, index)
}

function onDragEnd(event: DragEvent) {
  // Released outside the list or cancelled with Escape: put the row back.
  const from = indexOf(draggedId.value)
  if (event.dataTransfer?.dropEffect === 'none' && from !== -1 && from !== startIndex) {
    emit('reorder', from, startIndex)
  }
  grabbedId.value = null
  draggedId.value = null
}

const totalMessage = computed(() => {
  const difference = props.totalInitialPercentage - 100
  return `${formatPercentage(Math.abs(difference))} ${difference > 0 ? 'over' : 'left to assign'}`
})
</script>

<template>
  <section class="section">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-5">
      <h2 class="section-title">
        <span class="step">1</span>Founders & Initial Equity<InfoTooltip termKey="founder" />
      </h2>
      <div class="text-sm" :class="isValid ? 'text-slate-400' : 'text-red-400'" role="status">
        Total: <span class="num">{{ formatPercentage(totalInitialPercentage) }}</span>
        <span v-if="!isValid">({{ totalMessage }})</span>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div
        v-for="(founder, index) in founders"
        :key="founder.id"
        :draggable="grabbedId === founder.id"
        @dragstart="onDragStart($event, founder.id)"
        @dragover.prevent="onDragOver(index)"
        @drop.prevent
        @dragend="onDragEnd"
        class="card-row flex items-center gap-2.5 sm:gap-4 transition-colors"
        :class="[
          index > 0 ? 'border-t border-slate-800' : '',
          draggedId === founder.id ? 'opacity-40 bg-slate-800' : ''
        ]"
      >
        <div
          class="hidden sm:block cursor-grab active:cursor-grabbing text-slate-400 hover:text-white"
          title="Drag to reorder"
          @mousedown="grabbedId = founder.id"
          @mouseup="grabbedId = null"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
        <div class="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
        <input
          v-model="founder.name"
          type="text"
          autocomplete="off"
          placeholder="Founder name"
          :aria-label="`Founder ${index + 1} name`"
          class="field flex-1 min-w-0 px-2 py-1.5"
        />
        <PercentInput
          v-model="founder.percentage"
          :step="0.1"
          :aria-label="`${founder.name || `Founder ${index + 1}`} ownership percent`"
          class="w-16 sm:w-20 field px-2 py-1.5 text-right text-base sm:text-sm num"
        />
        <span class="text-slate-400 text-sm">%</span>
        <button
          type="button"
          @click="emit('remove', founder.id)"
          class="icon-btn -mr-2"
          :disabled="founders.length <= 1"
          :title="founders.length <= 1 ? 'A company needs one founder' : undefined"
          :aria-label="`Remove ${founder.name || `founder ${index + 1}`}`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Option Pool -->
      <div class="card-row flex items-center gap-2.5 sm:gap-4 border-t border-slate-800 bg-slate-950/40">
        <div class="hidden sm:block w-4"></div>
        <div class="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
        <span class="flex-1 min-w-0 text-slate-300">
          Option pool<InfoTooltip termKey="preMoneyOptionPool" />
          <span class="text-xs text-slate-400 ml-1">at founding</span>
        </span>
        <PercentInput
          :modelValue="initialOptionPool"
          @update:modelValue="emit('update:initialOptionPool', $event)"
          :max="50"
          aria-label="Option pool at founding, percent"
          class="w-16 sm:w-20 field px-2 py-1.5 text-right text-base sm:text-sm num"
        />
        <span class="text-slate-400 text-sm">%</span>
        <div class="w-6"></div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        @click="emit('add')"
        class="btn"
      >
        + Add founder
      </button>
      <button
        v-if="founders.length > 1"
        type="button"
        @click="emit('splitEqually')"
        class="btn-quiet"
      >
        Split equally
      </button>
    </div>
  </section>
</template>
