<script setup lang="ts">
import { computed, ref } from 'vue'
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

const typeColor = { founder: 'bg-emerald-500', investor: 'bg-sky-500', option_pool: 'bg-amber-500', debt: 'bg-slate-400' }

function typeLabel(payout: ExitPayout): string {
  if (payout.type === 'debt') return 'Loan'
  if (payout.unconverted) return payout.instrument === 'safe' ? 'SAFE' : 'Convertible note'
  return { founder: 'Common', investor: 'Preferred', option_pool: 'Options' }[payout.type]
}

const total = computed(() => props.payouts.reduce((sum, p) => sum + p.payout, 0))
const widthOf = (amount: number) => (total.value > 0 ? (amount / total.value) * 100 : 0) + '%'

const modifiedCount = computed(() => {
  const a = props.exitOptions.acquisition
  const i = props.exitOptions.ipo
  return props.exitType === 'acquisition'
    ? [a.escrowPercent > 0, a.managementCarveout > 0, a.transactionCostsPercent > 0, a.dealStructure !== 'cash'].filter(Boolean).length
    : [i.underwriterFeesPercent > 0 && i.offeringAmount > 0, i.lockupDays !== 180].filter(Boolean).length
})

// One plain sentence on how the payout is delivered. These settings do not change the amounts.
const deliveryNote = computed(() => {
  if (props.exitType === 'ipo') {
    return `Holders keep shares, not cash. Insiders cannot sell for ${props.exitOptions.ipo.lockupDays} days after the IPO.`
  }
  const { dealStructure, stockPercentage } = props.exitOptions.acquisition
  if (dealStructure === 'cash') return 'Paid in cash at closing.'
  if (dealStructure === 'stock') return "Paid in the buyer's stock. Its value can change before you can sell."
  return `Paid ${100 - stockPercentage}% in cash and ${stockPercentage}% in the buyer's stock.`
})

function returnMultiple(payout: ExitPayout): number | null {
  return payout.type === 'investor' && payout.investedAmount ? payout.payout / payout.investedAmount : null
}

function termsLabel(payout: ExitPayout): string {
  if (payout.type !== 'investor' || props.exitType === 'ipo' || payout.unconverted) return ''
  const pref = payout.liquidationPreference ? `${payout.liquidationPreference}x preference` : 'no preference'
  return ` · ${pref}${payout.participating ? ', participating' : ''}`
}

// How the investor's payout was made up.
function detail(payout: ExitPayout): string {
  if (payout.type === 'debt') return 'Principal and interest. Paid before all stock.'
  if (payout.type !== 'investor' || payout.payout <= 0) return ''
  if (props.exitType === 'ipo') return 'Converted to common in the IPO'
  const pref = payout.preferenceAmount || 0
  if (payout.unconverted) return pref > 0 ? 'Paid back in cash' : 'Converted to stock at the sale'
  const rest = payout.payout - pref
  if (pref > 0 && rest > 0.5) return `${formatCurrency(pref)} preference + ${formatCurrency(rest)} share`
  if (pref > 0) return 'Took the preference'
  return payout.liquidationPreference ? 'Converted to common' : 'Paid as common'
}
</script>

<template>
  <section class="section">
    <h2 class="section-title mb-5">
      <span class="step">4</span>Exit Scenario<InfoTooltip termKey="exit" />
    </h2>

    <div class="card overflow-hidden">
      <!-- Exit type and value -->
      <div class="card-pad grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div role="group" aria-labelledby="exit-type-label">
          <div id="exit-type-label" class="label mb-2">Exit type</div>
          <div class="flex border border-slate-700 rounded-md overflow-hidden">
            <button
              v-for="type in (['acquisition', 'ipo'] as const)"
              :key="type"
              type="button"
              @click="emit('update:exitType', type)"
              :aria-pressed="exitType === type"
              class="flex-1 px-4 py-2 text-sm transition-colors"
              :class="exitType === type ? 'bg-slate-200 text-slate-950 font-medium' : 'bg-slate-950 text-slate-400 hover:text-slate-100'"
            >
              {{ type === 'ipo' ? 'IPO' : 'Acquisition' }}
            </button>
          </div>
        </div>
        <div>
          <label for="exit-value" class="label block mb-2">
            {{ exitType === 'ipo' ? 'Company value at IPO' : 'Sale price' }}
          </label>
          <div class="flex items-center">
            <span class="text-slate-400 mr-2">$</span>
            <CurrencyInput
              id="exit-value"
              :modelValue="exitValuation"
              @update:modelValue="emit('update:exitValuation', $event)"
              class="field w-full px-3 py-2 num"
            />
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2.5" role="group" aria-label="Quick values">
            <button
              v-for="value in [10e6, 50e6, 100e6, 500e6, 1e9]"
              :key="value"
              type="button"
              @click="emit('update:exitValuation', value)"
              :aria-pressed="exitValuation === value"
              class="chip !px-2"
            >
              {{ formatCurrency(value) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Advanced -->
      <div class="card-x pb-5">
        <button
          type="button"
          @click="showAdvanced = !showAdvanced"
          :aria-expanded="showAdvanced"
          class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3 transition-transform"
            :class="{ 'rotate-90': showAdvanced }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          Deal costs and terms
          <span v-if="modifiedCount" class="text-slate-100">({{ modifiedCount }} set)</span>
        </button>

        <div v-if="showAdvanced" class="card-inset mt-3 p-4">
          <!-- Acquisition options -->
          <div v-if="exitType === 'acquisition'" class="space-y-5">
            <div role="group" aria-labelledby="deal-structure-label">
              <div class="flex items-center mb-2">
                <span id="deal-structure-label" class="text-xs text-slate-400">How the price is paid</span>
                <InfoTooltip termKey="dealStructure" />
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="structure in (['cash', 'stock', 'mixed'] as const)"
                  :key="structure"
                  type="button"
                  @click="exitOptions.acquisition.dealStructure = structure"
                  :aria-pressed="exitOptions.acquisition.dealStructure === structure"
                  class="chip capitalize"
                >
                  {{ structure }}
                </button>
              </div>
              <div v-if="exitOptions.acquisition.dealStructure === 'mixed'" class="mt-3 max-w-sm">
                <div class="flex justify-between text-xs text-slate-300 mb-1">
                  <span>{{ 100 - exitOptions.acquisition.stockPercentage }}% cash</span>
                  <span>{{ exitOptions.acquisition.stockPercentage }}% stock</span>
                </div>
                <input
                  type="range"
                  v-model.number="exitOptions.acquisition.stockPercentage"
                  min="0"
                  max="100"
                  step="5"
                  aria-label="Share of the price paid in stock, percent"
                  class="w-full accent-slate-200"
                />
              </div>
            </div>

            <div role="group" aria-labelledby="escrow-label">
              <div class="flex items-center mb-2">
                <span id="escrow-label" class="text-xs text-slate-400">Escrow (held back, paid later)</span>
                <InfoTooltip termKey="escrow" />
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="pct in [0, 5, 10, 15, 20]"
                  :key="pct"
                  type="button"
                  @click="exitOptions.acquisition.escrowPercent = pct"
                  :aria-pressed="exitOptions.acquisition.escrowPercent === pct"
                  class="chip"
                >
                  {{ pct }}%
                </button>
              </div>
            </div>

            <div role="group" aria-labelledby="costs-label">
              <div class="flex items-center mb-2">
                <span id="costs-label" class="text-xs text-slate-400">Transaction costs</span>
                <InfoTooltip termKey="transactionCosts" />
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="pct in [0, 1, 2, 3, 5]"
                  :key="pct"
                  type="button"
                  @click="exitOptions.acquisition.transactionCostsPercent = pct"
                  :aria-pressed="exitOptions.acquisition.transactionCostsPercent === pct"
                  class="chip"
                >
                  {{ pct }}%
                </button>
              </div>
            </div>

            <div>
              <div class="flex items-center mb-2">
                <label for="carveout" class="text-xs text-slate-400">Management carve-out</label>
                <InfoTooltip termKey="managementCarveout" />
              </div>
              <div class="flex items-center">
                <span class="text-slate-400 mr-2">$</span>
                <CurrencyInput
                  id="carveout"
                  v-model="exitOptions.acquisition.managementCarveout"
                  class="field w-40 px-3 py-1.5 text-base sm:text-sm num"
                />
              </div>
            </div>
          </div>

          <!-- IPO options -->
          <div v-else class="space-y-5">
            <div>
              <div class="flex items-center mb-2">
                <label for="ipo-raise" class="text-xs text-slate-400">Money raised in the IPO</label>
                <InfoTooltip termKey="underwriterFees" />
              </div>
              <div class="flex items-center">
                <span class="text-slate-400 mr-2">$</span>
                <CurrencyInput
                  id="ipo-raise"
                  v-model="exitOptions.ipo.offeringAmount"
                  class="field w-40 px-3 py-1.5 text-base sm:text-sm num"
                />
              </div>
              <p class="text-xs text-slate-400 mt-1.5">Underwriter fees are a percent of this amount, not of the company value.</p>
            </div>

            <div role="group" aria-labelledby="fees-label">
              <div id="fees-label" class="text-xs text-slate-400 mb-2">Underwriter fees</div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="pct in [0, 4, 5, 6, 7]"
                  :key="pct"
                  type="button"
                  @click="exitOptions.ipo.underwriterFeesPercent = pct"
                  :aria-pressed="exitOptions.ipo.underwriterFeesPercent === pct"
                  class="chip"
                >
                  {{ pct }}%
                </button>
              </div>
            </div>

            <div role="group" aria-labelledby="lockup-label">
              <div class="flex items-center mb-2">
                <span id="lockup-label" class="text-xs text-slate-400">Lockup period</span>
                <InfoTooltip termKey="lockupPeriod" />
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="days in [90, 180, 365]"
                  :key="days"
                  type="button"
                  @click="exitOptions.ipo.lockupDays = days"
                  :aria-pressed="exitOptions.ipo.lockupDays === days"
                  class="chip"
                >
                  {{ days }} days
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- From price to proceeds -->
      <div v-if="effectiveExitProceeds.net !== effectiveExitProceeds.gross" class="card-x pb-5">
        <div class="card-inset px-4 py-3 text-sm space-y-1.5">
          <div class="flex justify-between text-slate-400">
            <span>{{ exitType === 'ipo' ? 'Company value' : 'Sale price' }}</span>
            <span class="num text-slate-200">{{ formatCurrency(effectiveExitProceeds.gross) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.transactionCosts > 0" class="flex justify-between text-slate-400">
            <span>Transaction costs</span>
            <span class="num text-red-400">−{{ formatCurrency(effectiveExitProceeds.transactionCosts) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.escrowAmount > 0" class="flex justify-between text-slate-400">
            <span>Escrow (held back, paid later)</span>
            <span class="num text-red-400">−{{ formatCurrency(effectiveExitProceeds.escrowAmount) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.managementCarveout > 0" class="flex justify-between text-slate-400">
            <span>Management carve-out</span>
            <span class="num text-red-400">−{{ formatCurrency(effectiveExitProceeds.managementCarveout) }}</span>
          </div>
          <div v-if="effectiveExitProceeds.underwriterFees > 0" class="flex justify-between text-slate-400">
            <span>Underwriter fees</span>
            <span class="num text-red-400">−{{ formatCurrency(effectiveExitProceeds.underwriterFees) }}</span>
          </div>
          <div class="flex justify-between pt-2 mt-2 border-t border-slate-700">
            <span class="text-slate-300">{{ exitType === 'ipo' ? 'Value to holders' : 'Paid to holders at closing' }}</span>
            <span class="num text-white font-semibold">{{ formatCurrency(effectiveExitProceeds.net) }}</span>
          </div>
        </div>
      </div>

      <!-- Who gets what: the result, so it has the largest type in the card -->
      <div class="border-t border-slate-800">
        <div class="card-row bg-slate-950/40 flex flex-wrap justify-between items-baseline gap-x-4 gap-y-1">
          <span class="label">Who gets what</span>
          <span class="text-sm text-slate-400">Total: <span class="num text-slate-100">{{ formatCurrency(total) }}</span></span>
        </div>
        <p class="card-row text-xs text-slate-400">
          <template v-if="exitType === 'ipo'">In an IPO, preferred stock converts to common. Liquidation preferences do not apply. </template>{{ deliveryNote }}
        </p>
        <div
          v-for="payout in payouts"
          :key="payout.key"
          class="card-x py-4 border-t border-slate-800"
        >
          <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div class="flex items-start gap-3 min-w-0">
              <span class="w-2 h-2 mt-2 rounded-full flex-shrink-0" :class="typeColor[payout.type]"></span>
              <div class="min-w-0">
                <span class="text-slate-100">{{ payout.name || 'Unnamed' }}</span>
                <span class="text-xs text-slate-400 ml-2">{{ typeLabel(payout) }}</span>
                <div v-if="payout.type !== 'debt'" class="text-xs text-slate-400 mt-0.5">
                  <span class="num">{{ formatPercentage(payout.percentage) }}</span>{{ termsLabel(payout) }}
                </div>
              </div>
            </div>
            <div class="text-right ml-auto">
              <div class="font-serif text-2xl text-white tabular-nums">{{ formatCurrency(payout.payout) }}</div>
              <div
                v-if="returnMultiple(payout) !== null"
                class="text-xs"
                :class="returnMultiple(payout)! >= 1 ? 'text-emerald-400' : 'text-red-400'"
              >
                {{ returnMultiple(payout)!.toFixed(2) }}x of {{ formatCurrency(payout.investedAmount || 0) }} invested
              </div>
              <div v-if="detail(payout)" class="text-xs text-slate-400">{{ detail(payout) }}</div>
            </div>
          </div>
          <!-- Share of the total. Bright = preference, dim = share of the rest. -->
          <div class="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
            <div :class="typeColor[payout.type]" :style="{ width: widthOf(payout.preferenceAmount || 0) }"></div>
            <div
              :class="[typeColor[payout.type], payout.type === 'investor' ? 'opacity-50' : '']"
              :style="{ width: widthOf(payout.payout - (payout.preferenceAmount || 0)) }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Estimate only. Not modeled: taxes, seniority between rounds, participation caps, dividends, warrants.
      All preferred stock is treated as equal in rank.
    </p>
  </section>
</template>
