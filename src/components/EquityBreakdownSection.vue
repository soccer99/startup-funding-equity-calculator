<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EquityBreakdown, RoundSnapshot, Stakeholder } from '@/types'
import { formatPercentage } from '@/utils/format'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps<{
  breakdown: EquityBreakdown
}>()

type SortMode = 'percentage' | 'type'
const sortMode = ref<SortMode>('type')

const typeOrder = { founder: 0, option_pool: 1, investor: 2 }
const typeLabel = { founder: 'Founder', option_pool: 'Option pool', investor: 'Investor' }
const typeColor = { founder: 'bg-emerald-500', option_pool: 'bg-amber-500', investor: 'bg-sky-500' }

// In "By type" order the investors stay in the order they joined, which is the order in the list.
const sortedStakeholders = computed<Stakeholder[]>(() =>
  [...props.breakdown.stakeholders].sort((a, b) =>
    sortMode.value === 'percentage'
      ? b.percentage - a.percentage
      : typeOrder[a.type] - typeOrder[b.type]
  )
)

const percentIn = (round: RoundSnapshot, key: string) => round.stakeholders.find(s => s.key === key)?.percentage || 0
const isLast = (index: number) => index === props.breakdown.rounds.length - 1
</script>

<template>
  <section class="section">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
      <h2 class="section-title">
        <span class="step">3</span>Cap Table<InfoTooltip termKey="capTable" />
      </h2>
      <div class="flex text-xs border border-slate-700 rounded-md overflow-hidden" role="group" aria-label="Sort order">
        <button
          v-for="mode in (['type', 'percentage'] as const)"
          :key="mode"
          type="button"
          @click="sortMode = mode"
          :aria-pressed="sortMode === mode"
          class="px-2.5 py-1 transition-colors"
          :class="sortMode === mode ? 'bg-slate-200 text-slate-950 font-medium' : 'text-slate-400 hover:text-slate-100'"
        >
          {{ mode === 'type' ? 'By type' : 'By %' }}
        </button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <!-- Ownership now: the picture first, the numbers below it -->
      <div class="card-pad border-b border-slate-800">
        <div class="flex items-baseline justify-between gap-3 mb-3">
          <span class="label">Ownership now</span>
          <div class="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs text-slate-400">
            <span v-for="(label, type) in typeLabel" :key="type" class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :class="typeColor[type]"></span>{{ label }}s
            </span>
          </div>
        </div>
        <div class="flex h-3 w-full gap-px overflow-hidden rounded-full bg-slate-800" role="img" aria-label="Current ownership split">
          <div
            v-for="s in sortedStakeholders"
            :key="s.key"
            :class="typeColor[s.type]"
            :style="{ width: s.percentage + '%' }"
            :title="`${s.name}: ${formatPercentage(s.percentage)}`"
          ></div>
        </div>
      </div>

      <div class="overflow-x-auto" tabindex="0" role="region" aria-label="Cap table by round">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th scope="col" class="sticky left-0 bg-slate-900 text-left py-2.5 card-x label">Stakeholder</th>
              <th
                v-for="(round, index) in breakdown.rounds"
                :key="index"
                scope="col"
                class="text-right py-2.5 card-x label min-w-[88px] whitespace-nowrap"
                :class="{ '!text-white': isLast(index) }"
              >
                {{ round.name || `Round ${index}` }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="stakeholder in sortedStakeholders"
              :key="stakeholder.key"
              class="group border-t border-slate-800 hover:bg-slate-800/40"
            >
              <th scope="row" class="sticky left-0 bg-slate-900 group-hover:bg-slate-800 py-3 card-x text-left font-normal">
                <span class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full flex-shrink-0" :class="typeColor[stakeholder.type]"></span>
                  <span class="sr-only">{{ typeLabel[stakeholder.type] }}:</span>
                  <span class="text-slate-100 whitespace-nowrap">{{ stakeholder.name || 'Unnamed' }}</span>
                  <span v-if="stakeholder.roundName" class="hidden sm:inline text-xs text-slate-400 whitespace-nowrap">
                    {{ stakeholder.roundName }}
                  </span>
                </span>
              </th>
              <td
                v-for="(round, index) in breakdown.rounds"
                :key="index"
                class="text-right py-3 card-x num"
                :class="isLast(index) ? 'text-white font-semibold' : 'text-slate-400'"
              >
                {{ percentIn(round, stakeholder.key) ? formatPercentage(percentIn(round, stakeholder.key)) : '—' }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-slate-700">
              <th scope="row" class="sticky left-0 bg-slate-900 py-3 card-x text-left text-slate-300 font-medium">Total</th>
              <td
                v-for="(round, index) in breakdown.rounds"
                :key="index"
                class="text-right py-3 card-x num"
                :class="isLast(index) ? 'text-white font-semibold' : 'text-slate-400'"
              >
                {{ formatPercentage(round.stakeholders.reduce((sum, s) => sum + s.percentage, 0)) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <p v-if="breakdown.outstanding?.length" class="mt-4 text-xs text-slate-400">
      "If converted" counts SAFEs and notes that have no priced round yet as stock, at their valuation cap.
      One with no cap shows no share until there is a price.
    </p>
  </section>
</template>
