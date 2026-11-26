<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEquityCalculator } from '@/composables/useEquityCalculator'
import { formatCurrency, formatPercentage } from '@/utils/format'
import EducationalIntro from '@/components/EducationalIntro.vue'
import FoundersSection from '@/components/FoundersSection.vue'
import FundingRoundsSection from '@/components/FundingRoundsSection.vue'
import EquityBreakdownSection from '@/components/EquityBreakdownSection.vue'
import ExitScenarioSection from '@/components/ExitScenarioSection.vue'

const {
  founders,
  initialOptionPool,
  fundingRounds,
  instruments,
  exitType,
  exitValuation,
  exitOptions,
  effectiveExitProceeds,
  totalInitialPercentage,
  isFounderPercentageValid,
  equityBreakdown,
  exitPayouts,
  addFounder,
  removeFounder,
  reorderFounders,
  splitFoundersEqually,
  addInstrument,
  removeInstrument,
  addFundingRound,
  removeFundingRound,
  undoRemoveRound,
  removedRound,
  addInvestor,
  removeInvestor,
  reset,
} = useEquityCalculator()

// The four numbers a founder looks for first.
const summary = computed(() => {
  const founderShare = equityBreakdown.value.stakeholders
    .filter(s => s.type === 'founder')
    .reduce((sum, s) => sum + s.percentage, 0)
  const founderPayout = exitPayouts.value.filter(p => p.type === 'founder').reduce((sum, p) => sum + p.payout, 0)
  // The last priced round. An "If converted" column for open SAFEs has no valuation.
  const lastRound = equityBreakdown.value.rounds.filter(r => r.postMoneyValuation > 0).pop()
  return [
    { label: 'Founders own', value: formatPercentage(founderShare), note: `after ${fundingRounds.value.length || 'no'} round${fundingRounds.value.length === 1 ? '' : 's'}${equityBreakdown.value.outstanding?.length ? ', SAFEs and notes counted at their cap' : ''}`, main: true },
    { label: 'Founders get at exit', value: formatCurrency(founderPayout), note: `of a ${formatCurrency(exitValuation.value)} ${exitType.value === 'ipo' ? 'IPO' : 'sale'}`, main: true },
    { label: 'Total raised', value: formatCurrency(equityBreakdown.value.totalInvested), note: '', main: false },
    { label: 'Last post-money', value: lastRound?.postMoneyValuation ? formatCurrency(lastRound.postMoneyValuation) : 'n/a', note: '', main: false },
  ]
})

// Reset deletes all data, so it needs a second click.
const confirmingReset = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

function onResetClick() {
  clearTimeout(resetTimer)
  if (confirmingReset.value) {
    reset()
    confirmingReset.value = false
  } else {
    confirmingReset.value = true
    resetTimer = setTimeout(() => (confirmingReset.value = false), 4000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header class="mb-10">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-serif text-3xl sm:text-4xl tracking-tight text-white mb-3">
              Startup Equity Calculator
            </h1>
            <p class="text-slate-300 max-w-2xl">
              See how each funding round changes who owns the company, and who gets what at exit.
            </p>
          </div>
          <button
            type="button"
            @click="onResetClick"
            class="flex-shrink-0"
            :class="confirmingReset ? 'btn !border-red-400 !text-red-400' : 'btn-quiet'"
          >
            {{ confirmingReset ? 'Delete all data?' : 'Reset' }}
          </button>
        </div>
      </header>

      <!-- The answer first. The two founder numbers are the focal point of the page. -->
      <dl class="card grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-800 overflow-hidden mb-6">
        <div v-for="item in summary" :key="item.label" class="card-pad" :class="{ 'bg-slate-950/40': !item.main }">
          <dt class="label">{{ item.label }}</dt>
          <dd
            class="font-serif mt-2 tabular-nums"
            :class="item.main ? 'text-3xl sm:text-4xl text-white' : 'text-2xl sm:text-3xl text-slate-300'"
          >
            {{ item.value }}
          </dd>
          <dd v-if="item.note" class="text-xs text-slate-400 mt-1.5">{{ item.note }}</dd>
        </div>
      </dl>

      <EducationalIntro />

      <FoundersSection
        :founders="founders"
        :initial-option-pool="initialOptionPool"
        :total-initial-percentage="totalInitialPercentage"
        :is-valid="isFounderPercentageValid"
        @add="addFounder"
        @remove="removeFounder"
        @reorder="reorderFounders"
        @split-equally="splitFoundersEqually"
        @update:initial-option-pool="initialOptionPool = $event"
      />

      <FundingRoundsSection
        :funding-rounds="fundingRounds"
        :instruments="instruments"
        :conversions="equityBreakdown.conversions ?? {}"
        :snapshots="equityBreakdown.rounds"
        :removed-round-name="removedRound ? removedRound.round.name : null"
        @add-round="addFundingRound"
        @remove-round="removeFundingRound"
        @undo-remove-round="undoRemoveRound"
        @add-investor="addInvestor"
        @remove-investor="removeInvestor"
        @add-instrument="addInstrument"
        @remove-instrument="removeInstrument"
      />

      <EquityBreakdownSection :breakdown="equityBreakdown" />

      <ExitScenarioSection
        :exit-type="exitType"
        :exit-valuation="exitValuation"
        :exit-options="exitOptions"
        :effective-exit-proceeds="effectiveExitProceeds"
        :payouts="exitPayouts"
        @update:exit-type="exitType = $event"
        @update:exit-valuation="exitValuation = $event"
      />

      <footer class="mt-4 pt-6 border-t border-slate-800">
        <p class="text-slate-400 text-sm max-w-2xl">
          For learning only. This is not legal, tax, or investment advice. Real deals can include vesting,
          anti-dilution terms, warrants, and other terms that this calculator does not model.
          Your data stays in this browser.
        </p>
      </footer>
    </div>
  </div>
</template>
