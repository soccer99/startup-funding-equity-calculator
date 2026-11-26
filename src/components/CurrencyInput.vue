<script setup lang="ts">
import { ref, watch } from 'vue'

// Whole-dollar input. Shows commas. Accepts shorthand: "500k", "2.5m", "1b".
const props = defineProps<{
  modelValue: number
  min?: number
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const format = (value: number) => (value ? value.toLocaleString('en-US') : '')

function parse(text: string): number {
  const match = text.replace(/[,$\s]/g, '').match(/^(\d*\.?\d*)([kmb]?)/i)
  const multiplier = { k: 1e3, m: 1e6, b: 1e9 }[match?.[2]?.toLowerCase() ?? ''] ?? 1
  return Math.max(props.min ?? 0, Math.round((parseFloat(match?.[1] ?? '') || 0) * multiplier))
}

const displayValue = ref(format(props.modelValue))

watch(() => props.modelValue, (value) => {
  if (parse(displayValue.value) !== value) displayValue.value = format(value)
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parse(target.value)
  emit('update:modelValue', value)

  // Leave the text alone while a decimal is being typed ("2.5" before the "m").
  if (/\.\d*$/.test(target.value)) {
    displayValue.value = target.value
    return
  }

  // Keep the cursor the same distance from the end, so new commas do not move it.
  const fromEnd = target.value.length - (target.selectionStart ?? target.value.length)
  displayValue.value = format(value)
  target.value = displayValue.value // also removes letters that Vue would not patch out
  const position = Math.max(0, displayValue.value.length - fromEnd)
  target.setSelectionRange(position, position)
}

function onBlur(event: Event) {
  displayValue.value = format(props.modelValue)
  ;(event.target as HTMLInputElement).value = displayValue.value
}
</script>

<template>
  <input
    type="text"
    inputmode="decimal"
    autocomplete="off"
    :value="displayValue"
    :placeholder="placeholder ?? '0'"
    @input="onInput"
    @blur="onBlur"
    @keydown.enter="($event.target as HTMLInputElement).blur()"
  />
</template>
