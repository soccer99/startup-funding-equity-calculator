<script setup lang="ts">
import { ref, watch } from 'vue'

// Number input that always emits a number (an empty field is 0) and keeps to min/max.
const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
}>(), { min: 0, max: 100, step: 1 })

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const clamp = (value: number) => Math.min(props.max, Math.max(props.min, value || 0))
const text = ref(String(props.modelValue ?? 0))

watch(() => props.modelValue, (value) => {
  if (clamp(parseFloat(text.value)) !== value) text.value = String(value)
})

function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value
  emit('update:modelValue', clamp(parseFloat(text.value)))
}

function onBlur() {
  // Show the value in use, for example "150" becomes "100" and "" becomes "0".
  text.value = String(clamp(parseFloat(text.value)))
}
</script>

<template>
  <input
    type="number"
    inputmode="decimal"
    :min="min"
    :max="max"
    :step="step"
    :value="text"
    @input="onInput"
    @blur="onBlur"
  />
</template>
