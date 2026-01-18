<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EquityBreakdown, Stakeholder } from '@/types'
import { formatPercentage } from '@/utils/format'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps<{
  breakdown: EquityBreakdown
}>()

type SortMode = 'percentage' | 'type'
const sortMode = ref<SortMode>('percentage')

function getRoundOrder(roundName: string | undefined): number {
  if (!roundName) return 999
  const rounds = roundName.split(', ')
  const firstRound = rounds[0]
  const index = props.breakdown.rounds.findIndex(r => r.name === firstRound)
  return index === -1 ? 999 : index
}

const sortedStakeholders = computed<Stakeholder[]>(() => {
  const stakeholders = [...props.breakdown.stakeholders]

  if (sortMode.value === 'percentage') {
    return stakeholders.sort((a, b) => b.percentage - a.percentage)
  } else {
    return stakeholders.sort((a, b) => {
      const typeOrder = { founder: 0, option_pool: 1, investor: 2 }
      const aTypeOrder = typeOrder[a.type] ?? 3
      const bTypeOrder = typeOrder[b.type] ?? 3

      if (aTypeOrder !== bTypeOrder) {
        return aTypeOrder - bTypeOrder
      }

      if (a.type === 'founder' && b.type === 'founder') {
        return b.percentage - a.percentage
      }

      if (a.type === 'investor' && b.type === 'investor') {
        const aRoundOrder = getRoundOrder(a.roundName)
        const bRoundOrder = getRoundOrder(b.roundName)
        if (aRoundOrder !== bRoundOrder) {
          return aRoundOrder - bRoundOrder
        }
        return b.percentage - a.percentage
      }

      return 0
    })
  }
})

function getTypeColor(type: string): string {
  switch (type) {
    case 'founder': return 'bg-emerald-500'
    case 'investor': return 'bg-sky-500'
    case 'option_pool': return 'bg-amber-500'
    default: return 'bg-slate-500'
  }
}
</script>

<template>
  <section class="mb-10">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-lg font-medium text-white">
        Cap Table<InfoTooltip termKey="capTable" />
      </h2>
      <div class="flex items-center gap-4">
        <div class="flex gap-4 text-xs text-slate-500">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            Founders
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
            Investors
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
            Pool
          </span>
        </div>
        <div class="flex text-xs border border-slate-700 rounded overflow-hidden">
          <button
            @click="sortMode = 'percentage'"
            class="px-2 py-1 transition-colors"
            :class="sortMode === 'percentage' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'"
          >
            By %
          </button>
          <button
            @click="sortMode = 'type'"
            class="px-2 py-1 transition-colors"
            :class="sortMode === 'type' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'"
          >
            By type
          </button>
        </div>
      </div>
    </div>

    <div class="border border-slate-800 rounded overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-slate-900/50">
            <th class="text-left py-2 px-4 text-xs text-slate-500 uppercase tracking-wide font-medium">
              Stakeholder
            </th>
            <th
              v-for="round in breakdown.rounds"
              :key="round.name"
              class="text-right py-2 px-4 text-xs text-slate-500 uppercase tracking-wide font-medium min-w-[80px]"
            >
              {{ round.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="stakeholder in sortedStakeholders"
            :key="stakeholder.name"
            class="border-t border-slate-800"
          >
            <td class="py-2.5 px-4">
              <span class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full" :class="getTypeColor(stakeholder.type)"></span>
                <span class="text-slate-200">{{ stakeholder.name }}</span>
                <span v-if="stakeholder.roundName" class="text-xs text-slate-600">
                  {{ stakeholder.roundName }}
                </span>
              </span>
            </td>
            <td
              v-for="round in breakdown.rounds"
              :key="round.name"
              class="text-right py-2.5 px-4 font-mono"
            >
              <span
                :class="round.stakeholders.find(s => s.name === stakeholder.name)?.percentage
                  ? 'text-slate-200'
                  : 'text-slate-700'"
              >
                {{ formatPercentage(round.stakeholders.find(s => s.name === stakeholder.name)?.percentage || 0) }}
              </span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-slate-700 bg-slate-900/30">
            <td class="py-2.5 px-4 text-slate-400 font-medium">Total</td>
            <td
              v-for="round in breakdown.rounds"
              :key="round.name"
              class="text-right py-2.5 px-4 font-mono text-slate-200"
            >
              {{ formatPercentage(round.stakeholders.reduce((sum, s) => sum + s.percentage, 0)) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>
