<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  modelValue: number
  min?: number
  step?: number
  placeholder?: string
  class?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const displayValue = ref(formatWithCommas(props.modelValue))

function formatWithCommas(value: number): string {
  if (isNaN(value) || value === 0) return ''
  return value.toLocaleString('en-US')
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

watch(() => props.modelValue, (newVal) => {
  const currentParsed = parseNumber(displayValue.value)
  if (currentParsed !== newVal) {
    displayValue.value = formatWithCommas(newVal)
  }
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  const cursorPosition = target.selectionStart || 0
  const oldLength = target.value.length

  // Parse the raw number
  const rawValue = parseNumber(target.value)
  emit('update:modelValue', rawValue)

  // Format with commas
  const formatted = formatWithCommas(rawValue)
  displayValue.value = formatted

  // Adjust cursor position for added/removed commas
  const newLength = formatted.length
  const diff = newLength - oldLength
  requestAnimationFrame(() => {
    target.setSelectionRange(cursorPosition + diff, cursorPosition + diff)
  })
}

function onBlur() {
  displayValue.value = formatWithCommas(props.modelValue)
}

const inputClass = computed(() => props.class || '')
</script>

<template>
  <input
    type="text"
    inputmode="numeric"
    :value="displayValue"
    @input="onInput"
    @blur="onBlur"
    :placeholder="placeholder"
    :class="inputClass"
  />
</template>
