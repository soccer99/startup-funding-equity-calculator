<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
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

// Reorder with the grip handle. Pointer events work the same for mouse, pen and touch
// (HTML drag and drop does not start on most phones). Only the handle starts a drag,
// so click-and-drag inside the inputs still selects text.
// While a row is dragged, the list shows the new order at once, and that row stays dim.
const draggedId = ref<number | null>(null)
const list = ref<HTMLElement | null>(null)
let startIndex = -1

const indexOf = (id: number | null) => props.founders.findIndex(f => f.id === id)

function moveTo(index: number) {
  const from = indexOf(draggedId.value)
  if (from !== -1 && index >= 0 && index < props.founders.length && from !== index) emit('reorder', from, index)
}

function onPointerDown(event: PointerEvent, id: number) {
  if (event.button !== 0) return
  event.preventDefault() // no text selection while dragging
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) // keep the moves when the finger leaves the handle
  draggedId.value = id
  startIndex = indexOf(id)
}

function onPointerMove(event: PointerEvent) {
  if (draggedId.value === null || !list.value) return
  // Look at the middle of the list, so a finger that moves sideways still finds a row.
  const box = list.value.getBoundingClientRect()
  const row = document.elementFromPoint(box.left + box.width / 2, event.clientY)?.closest<HTMLElement>('[data-founder-index]')
  if (row) moveTo(Number(row.dataset.founderIndex))
}

function endDrag(cancel = false) {
  if (cancel) moveTo(startIndex) // the browser took the gesture, or Escape: put the row back
  draggedId.value = null
}

// Keyboard: arrow keys on the handle move the row one place.
async function moveWithKey(id: number, direction: number) {
  draggedId.value = id
  moveTo(indexOf(id) + direction)
  draggedId.value = null
  await nextTick() // the row moved in the page, so give the focus back to its handle
  list.value?.querySelector<HTMLElement>(`[data-handle="${id}"]`)?.focus()
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

    <div ref="list" class="card overflow-hidden">
      <div
        v-for="(founder, index) in founders"
        :key="founder.id"
        :data-founder-index="index"
        class="card-row flex items-center gap-2 sm:gap-4 transition-colors"
        :class="[
          index > 0 ? 'border-t border-slate-800' : '',
          draggedId === founder.id ? 'opacity-40 bg-slate-800' : ''
        ]"
      >
        <button
          type="button"
          class="drag-handle"
          :data-handle="founder.id"
          :aria-label="`Move ${founder.name || `founder ${index + 1}`}. Drag, or use the up and down arrow keys.`"
          title="Drag to reorder"
          @pointerdown="onPointerDown($event, founder.id)"
          @pointermove="onPointerMove"
          @pointerup="endDrag()"
          @pointercancel="endDrag(true)"
          @keydown.up.prevent="moveWithKey(founder.id, -1)"
          @keydown.down.prevent="moveWithKey(founder.id, 1)"
          @keydown.esc="endDrag(true)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>
        <div class="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
        <input
          v-model="founder.name"
          type="text"
          autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done" @keydown.enter="($event.target as HTMLInputElement).blur()"
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
      <div class="card-row flex items-center gap-2 sm:gap-4 border-t border-slate-800 bg-slate-950/40">
        <div class="w-6 flex-shrink-0"></div>
        <div class="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
        <span class="flex-1 min-w-0 text-slate-300">
          Option pool<InfoTooltip termKey="preMoneyOptionPool" />
          <span class="hidden sm:inline text-xs text-slate-400 ml-1">at founding</span>
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
