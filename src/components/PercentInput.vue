<script setup lang="ts">
import { ref, watch } from 'vue'

// Number input that always emits a number (an empty field is 0) and keeps to min/max.
// It is a text field with a decimal keypad, not type="number": that type has spinner arrows,
// changes value on scroll, and gives the wrong keypad on some phones.
const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
}>(), { min: 0, max: 100, step: 1 })

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

// Some phone keypads give "," for the decimal point.
const parse = (text: string) => parseFloat(text.replace(',', '.'))
const clamp = (value: number) => Math.min(props.max, Math.max(props.min, value || 0))
const text = ref(String(props.modelValue ?? 0))

watch(() => props.modelValue, (value) => {
  if (clamp(parse(text.value)) !== value) text.value = String(value)
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  // Digits and one decimal mark only.
  text.value = target.value.replace(/[^\d.,]/g, '')
  target.value = text.value
  emit('update:modelValue', clamp(parse(text.value)))
}

function onBlur() {
  // Show the value in use, for example "150" becomes "100" and "" becomes "0".
  text.value = String(clamp(parse(text.value)))
}

// Arrow keys step the value, as in a number field.
function stepBy(direction: number) {
  const next = clamp(Math.round((clamp(parse(text.value)) + direction * props.step) * 100) / 100)
  text.value = String(next)
  emit('update:modelValue', next)
}
</script>

<template>
  <input
    type="text"
    inputmode="decimal"
    enterkeyhint="done"
    autocomplete="off"
    :value="text"
    @input="onInput"
    @blur="onBlur"
    @focus="($event.target as HTMLInputElement).select()"
    @keydown.enter="($event.target as HTMLInputElement).blur()"
    @keydown.up.prevent="stepBy(1)"
    @keydown.down.prevent="stepBy(-1)"
  />
</template>
