<script setup lang="ts">
import { ref } from 'vue'
import type { ExitPayout, ExitType, ExitOptions } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/format'
import InfoTooltip from './InfoTooltip.vue'
import CurrencyInput from './CurrencyInput.vue'

const props = defineProps<{
  exitType: ExitType
  exitValuation: number
  exitOptions: ExitOptions
  effectiveExitProceeds: {
    gross: number
    transactionCosts: number
    escrowAmount: number
    managementCarveout: number
    underwriterFees: number
    net: number
  }
  payouts: ExitPayout[]
}>()

const emit = defineEmits<{
  'update:exitType': [value: ExitType]
  'update:exitValuation': [value: number]
}>()

const showAdvanced = ref(false)

function hasModifiedOptions(): boolean {
  if (props.exitType === 'acquisition') {
    const opts = props.exitOptions.acquisition
    return opts.escrowPercent > 0 ||
      opts.managementCarveout > 0 ||
      opts.transactionCostsPercent > 0 ||
      opts.dealStructure !== 'cash'
  } else {
    const opts = props.exitOptions.ipo
    return opts.underwriterFeesPercent > 0 ||
      opts.lockupDays !== 180
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'founder': return 'bg-emerald-500'
    case 'investor': return 'bg-sky-500'
    case 'option_pool': return 'bg-amber-500'
    default: return 'bg-slate-500'
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'founder': return 'Common'
    case 'investor': return 'Preferred'
    case 'option_pool': return 'Pool'
    default: return ''
  }
}

function getReturnMultiple(payout: ExitPayout): string | null {
  if (payout.type !== 'investor' || !payout.investedAmount || payout.investedAmount === 0) {
    return null
  }
  const multiple = payout.payout / payout.investedAmount
  return `${multiple.toFixed(2)}x`
}
</script>

<template>
  <section class="mb-10">
    <h2 class="text-lg font-medium text-white mb-4">
      Exit Scenario<InfoTooltip termKey="exit" />
    </h2>

    <div class="border border-slate-800 rounded">
      <!-- Exit Type and Valuation -->
      <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label class="block text-xs text-slate-500 uppercase tracking-wide mb-2">Type</label>
          <div class="flex border border-slate-700 rounded overflow-hidden">
            <button
              @click="emit('update:exitType', 'acquisition')"
              class="flex-1 px-4 py-2 text-sm transition-colors"
              :class="exitType === 'acquisition' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'"
            >
              Acquisition
            </button>
            <button
              @click="emit('update:exitType', 'ipo')"
              class="flex-1 px-4 py-2 text-sm transition-colors"
              :class="exitType === 'ipo' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'"
            >
              IPO
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-500 uppercase tracking-wide mb-2">Valuation</label>
          <div class="flex items-center">
            <span class="text-slate-500 mr-2">$</span>
            <CurrencyInput
              :modelValue="exitValuation"
              @update:modelValue="emit('update:exitValuation', $event)"
              :min="0"
              :step="1000000"
              class="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>
      </div>

      <!-- Advanced Toggle -->
      <div class="px-4 pb-4">
        <button
          @click="showAdvanced = !showAdvanced"
          class="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3 transition-transform"
            :class="{ 'rotate-90': showAdvanced }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          Advanced terms
          <span v-if="hasModifiedOptions()" class="text-amber-500">(modified)</span>
        </button>

        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="showAdvanced" class="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded">
            <!-- Acquisition Options -->
            <div v-if="exitType === 'acquisition'" class="space-y-5">
              <div>
                <label class="block text-xs text-slate-500 mb-2">
                  Deal Structure<InfoTooltip termKey="dealStructure" />
                </label>
                <div class="flex gap-1">
                  <button
                    v-for="structure in ['cash', 'stock', 'mixed'] as const"
                    :key="structure"
                    @click="exitOptions.acquisition.dealStructure = structure"
                    class="px-3 py-1 rounded text-xs capitalize transition-colors"
                    :class="exitOptions.acquisition.dealStructure === structure
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                  >
                    {{ structure }}
                  </button>
                </div>
                <div v-if="exitOptions.acquisition.dealStructure === 'mixed'" class="mt-3">
                  <input
                    type="range"
                    v-model.number="exitOptions.acquisition.stockPercentage"
                    min="0"
                    max="100"
                    class="w-full"
                  />
                  <div class="flex justify-between text-xs text-slate-600 mt-1">
                    <span>{{ 100 - exitOptions.acquisition.stockPercentage }}% cash</span>
                    <span>{{ exitOptions.acquisition.stockPercentage }}% stock</span>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs text-slate-500 mb-2">
                  Escrow<InfoTooltip termKey="escrow" />
                </label>
                <div class="flex gap-1">
                  <button
                    v-for="pct in [0, 10, 15, 20]"
                    :key="pct"
                    @click="exitOptions.acquisition.escrowPercent = pct"
                    class="px-3 py-1 rounded text-xs transition-colors"
                    :class="exitOptions.acquisition.escrowPercent === pct
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                  >
                    {{ pct }}%
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs text-slate-500 mb-2">
                  Transaction Costs<InfoTooltip termKey="transactionCosts" />
                </label>
                <div class="flex gap-1">
                  <button
                    v-for="pct in [0, 1, 2, 3]"
                    :key="pct"
                    @click="exitOptions.acquisition.transactionCostsPercent = pct"
                    class="px-3 py-1 rounded text-xs transition-colors"
                    :class="exitOptions.acquisition.transactionCostsPercent === pct
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                  >
                    {{ pct }}%
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs text-slate-500 mb-2">
                  Management Carve-out<InfoTooltip termKey="managementCarveout" />
                </label>
                <div class="flex items-center">
                  <span class="text-slate-500 mr-2">$</span>
                  <CurrencyInput
                    v-model="exitOptions.acquisition.managementCarveout"
                    :min="0"
                    :step="100000"
                    class="w-40 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>
            </div>

            <!-- IPO Options -->
            <div v-else class="space-y-5">
              <div>
                <label class="block text-xs text-slate-500 mb-2">
                  Underwriter Fees<InfoTooltip termKey="underwriterFees" />
                </label>
                <div class="flex gap-1">
                  <button
                    v-for="pct in [0, 5, 6, 7]"
                    :key="pct"
                    @click="exitOptions.ipo.underwriterFeesPercent = pct"
                    class="px-3 py-1 rounded text-xs transition-colors"
                    :class="exitOptions.ipo.underwriterFeesPercent === pct
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                  >
                    {{ pct }}%
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs text-slate-500 mb-2">
                  Lockup Period<InfoTooltip termKey="lockupPeriod" />
                </label>
                <div class="flex gap-1">
                  <button
                    v-for="days in [90, 180, 365]"
                    :key="days"
                    @click="exitOptions.ipo.lockupDays = days"
                    class="px-3 py-1 rounded text-xs transition-colors"
                    :class="exitOptions.ipo.lockupDays === days
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                  >
                    {{ days }}d
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Proceeds Summary -->
      <div v-if="effectiveExitProceeds.net !== effectiveExitProceeds.gross" class="px-4 pb-4">
        <div class="p-3 bg-slate-900/50 border border-slate-800 rounded text-sm space-y-1">
          <div class="flex justify-between text-slate-500">
            <span>Gross</span>
            <span>{{ formatCurrency(effectiveExitProceeds.gross) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.transactionCosts > 0" class="flex justify-between text-slate-500">
            <span>Transaction costs</span>
            <span class="text-red-400">-{{ formatCurrency(effectiveExitProceeds.transactionCosts) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.escrowAmount > 0" class="flex justify-between text-slate-500">
            <span>Escrow</span>
            <span class="text-amber-400">-{{ formatCurrency(effectiveExitProceeds.escrowAmount) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.managementCarveout > 0" class="flex justify-between text-slate-500">
            <span>Carve-out</span>
            <span class="text-red-400">-{{ formatCurrency(effectiveExitProceeds.managementCarveout) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.underwriterFees > 0" class="flex justify-between text-slate-500">
            <span>Underwriter</span>
            <span class="text-red-400">-{{ formatCurrency(effectiveExitProceeds.underwriterFees) }}</span>
          </div>
          <div class="flex justify-between pt-1 border-t border-slate-700">
            <span class="text-slate-400">Net proceeds</span>
            <span class="text-white">{{ formatCurrency(effectiveExitProceeds.net) }}</span>
          </div>
        </div>
      </div>

      <!-- Payouts -->
      <div class="border-t border-slate-800">
        <div class="px-4 py-3 bg-slate-900/50 flex justify-between items-center">
          <span class="text-xs text-slate-500 uppercase tracking-wide">Distribution</span>
          <span class="text-sm text-slate-400">
            Total: {{ formatCurrency(payouts.reduce((sum, p) => sum + p.payout, 0)) }}
          </span>
        </div>
        <div>
          <div
            v-for="payout in payouts"
            :key="payout.name"
            class="px-4 py-3 border-t border-slate-800 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-1.5 rounded-full" :class="getTypeColor(payout.type)"></span>
              <div>
                <span class="text-slate-200">{{ payout.name }}</span>
                <span class="text-xs text-slate-600 ml-2">{{ getTypeLabel(payout.type) }}</span>
                <div class="text-xs text-slate-600 mt-0.5">
                  {{ formatPercentage(payout.percentage) }}
                  <template v-if="payout.type === 'investor' && payout.liquidationPreference">
                    · {{ payout.liquidationPreference }}x pref
                    <span v-if="payout.participating" class="text-amber-500">· participating</span>
                  </template>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono text-lg text-white">{{ formatCurrency(payout.payout) }}</div>
              <div v-if="payout.type === 'investor' && getReturnMultiple(payout)" class="text-xs text-emerald-400">
                {{ getReturnMultiple(payout) }} return
              </div>
              <div v-if="payout.type === 'investor' && payout.preferenceAmount" class="text-xs text-slate-600">
                <template v-if="payout.preferenceAmount > 0 && payout.participationAmount">
                  {{ formatCurrency(payout.preferenceAmount) }} pref + {{ formatCurrency(payout.participationAmount) }} participation
                </template>
                <template v-else-if="payout.preferenceAmount > 0">
                  {{ formatCurrency(payout.preferenceAmount) }} preference
                </template>
                <template v-else>
                  Converted to common
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
