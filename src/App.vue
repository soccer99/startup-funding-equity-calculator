<script setup lang="ts">
import { useEquityCalculator } from '@/composables/useEquityCalculator'
import EducationalIntro from '@/components/EducationalIntro.vue'
import FoundersSection from '@/components/FoundersSection.vue'
import FundingRoundsSection from '@/components/FundingRoundsSection.vue'
import EquityBreakdownSection from '@/components/EquityBreakdownSection.vue'
import ExitScenarioSection from '@/components/ExitScenarioSection.vue'

const {
  founders,
  initialOptionPool,
  fundingRounds,
  exitType,
  exitValuation,
  exitOptions,
  effectiveExitProceeds,
  totalFounderPercentage,
  totalInitialPercentage,
  isFounderPercentageValid,
  equityBreakdown,
  exitPayouts,
  addFounder,
  removeFounder,
  reorderFounders,
  addFundingRound,
  applyPresetToRound,
  removeFundingRound,
  addInvestor,
  removeInvestor,
} = useEquityCalculator()
</script>

<template>
  <div class="dark min-h-screen bg-slate-950 text-slate-100">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header class="mb-8 sm:mb-12">
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2 sm:mb-3">
          Equity Dilution Calculator
        </h1>
        <p class="text-slate-400 max-w-2xl">
          Model funding rounds, ownership dilution, and exit scenarios.
          <span class="text-slate-500">Hover over info icons for term definitions.</span>
        </p>
      </header>

      <EducationalIntro />

      <FoundersSection
        :founders="founders"
        :initial-option-pool="initialOptionPool"
        :total-percentage="totalFounderPercentage"
        :total-initial-percentage="totalInitialPercentage"
        :is-valid="isFounderPercentageValid"
        @add="addFounder"
        @remove="removeFounder"
        @reorder="reorderFounders"
        @update:initial-option-pool="initialOptionPool = $event"
      />

      <FundingRoundsSection
        :funding-rounds="fundingRounds"
        @add-round="addFundingRound"
        @apply-preset="applyPresetToRound"
        @remove-round="removeFundingRound"
        @add-investor="addInvestor"
        @remove-investor="removeInvestor"
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

      <footer class="mt-16 pt-8 border-t border-slate-800">
        <p class="text-slate-500 text-sm max-w-2xl">
          This calculator provides simplified estimates for educational purposes.
          Actual equity structures may include convertible notes, SAFEs, vesting schedules,
          anti-dilution provisions, and other complex terms. Consult with legal and financial
          advisors for real transactions.
        </p>
      </footer>
    </div>
  </div>
</template>
