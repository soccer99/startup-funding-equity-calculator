<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const props = defineProps<{
  modelValue: string
  suggestions: string[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const searchTerm = ref('')

const filteredSuggestions = computed(() => {
  if (!searchTerm.value) return props.suggestions
  const search = searchTerm.value.toLowerCase()
  return props.suggestions.filter(s => s.toLowerCase().includes(search))
})

function selectValue(value: string) {
  emit('update:modelValue', value)
  open.value = false
  searchTerm.value = ''
}

function onOpenChange(isOpen: boolean) {
  open.value = isOpen
  if (!isOpen) {
    // If closing and there's a search term that's not in suggestions, use it as the value
    if (searchTerm.value && !props.suggestions.includes(searchTerm.value)) {
      emit('update:modelValue', searchTerm.value)
    }
    searchTerm.value = ''
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && searchTerm.value) {
    // If no suggestions match exactly, use the typed value
    const exactMatch = props.suggestions.find(
      s => s.toLowerCase() === searchTerm.value.toLowerCase()
    )
    if (exactMatch) {
      selectValue(exactMatch)
    } else {
      selectValue(searchTerm.value)
    }
    event.preventDefault()
  }
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="flex-1 justify-between bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-800 hover:border-slate-600 hover:text-white"
      >
        <span :class="modelValue ? 'text-white' : 'text-slate-500'">
          {{ modelValue || placeholder || 'Select or type...' }}
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[250px] p-0 bg-slate-800 border-slate-700">
      <Command class="bg-transparent">
        <CommandInput
          v-model="searchTerm"
          :placeholder="placeholder || 'Search or type new...'"
          class="text-white"
          @keydown="onKeydown"
        />
        <CommandList>
          <CommandEmpty v-if="searchTerm" class="py-2 px-3 text-sm text-slate-400">
            Press Enter to add "{{ searchTerm }}"
          </CommandEmpty>
          <CommandEmpty v-else class="py-2 px-3 text-sm text-slate-400">
            Type to search or add new...
          </CommandEmpty>
          <CommandGroup v-if="filteredSuggestions.length > 0" heading="Previous investors" class="text-slate-400">
            <CommandItem
              v-for="suggestion in filteredSuggestions"
              :key="suggestion"
              :value="suggestion"
              class="text-slate-200 hover:bg-slate-700 aria-selected:bg-slate-700"
              @select="selectValue(suggestion)"
            >
              <Check
                :class="cn(
                  'mr-2 h-4 w-4',
                  modelValue === suggestion ? 'opacity-100' : 'opacity-0'
                )"
              />
              {{ suggestion }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
