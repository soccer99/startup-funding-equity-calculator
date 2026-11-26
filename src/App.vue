<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEquityCalculator } from '@/composables/useEquityCalculator'
import { formatCurrency, formatPercentage } from '@/utils/format'
import { buildCsv } from '@/lib/share'
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
  scenario,
  shareUrl,
  isSharedView,
  keepShared,
  discardShared,
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

// ----- Save and share -----
const copied = ref(false)

async function copyLink() {
  const url = await shareUrl()
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // No clipboard access (old browser, or the page is not focused): put the link in the address bar.
    history.replaceState(null, '', url)
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2500)
}

function downloadSpreadsheet() {
  const csv = buildCsv(scenario(), equityBreakdown.value, exitPayouts.value, effectiveExitProceeds.value.net)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  link.download = `startup-equity-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// The browser's print window has "Save as PDF". The print styles are in style.css.
const savePdf = () => window.print()

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
        <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
          <div>
            <h1 class="font-serif text-3xl sm:text-4xl tracking-tight text-white mb-3">
              Startup Equity Calculator
            </h1>
            <p class="text-slate-300 max-w-xl">
              See how each funding round changes who owns the company, and who gets what at exit.
            </p>
          </div>
          <div class="sm:ml-auto">
            <div class="no-print flex flex-wrap sm:justify-end gap-2">
              <button type="button" class="btn" title="Copy a link that opens this page with all your inputs. The numbers are in the link itself." @click="copyLink">
                {{ copied ? 'Link copied' : 'Copy link' }}
              </button>
              <button type="button" class="btn-quiet" title="Opens the print window. Choose Save as PDF." @click="savePdf">PDF</button>
              <button type="button" class="btn-quiet" title="Download a .csv file for Excel, Numbers, or Google Sheets." @click="downloadSpreadsheet">Spreadsheet</button>
              <button
                type="button"
                @click="onResetClick"
                :class="confirmingReset ? 'btn !border-red-400 !text-red-400' : 'btn-quiet'"
              >
                {{ confirmingReset ? 'Delete all data?' : 'Reset' }}
              </button>
            </div>
            <p class="mt-3 text-xs text-slate-400 sm:text-right max-w-xs sm:ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="inline h-3.5 w-3.5 mr-1 -mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
              </svg>Private. Your numbers never leave this browser. No server, no account, no tracking.
            </p>
          </div>
        </div>
      </header>

      <div v-if="isSharedView" class="no-print card card-row mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm" role="status">
        <span class="text-slate-200">You opened a shared scenario. Your own saved scenario is not changed.</span>
        <span class="flex flex-wrap gap-2">
          <button type="button" class="btn" @click="keepShared">Keep this as mine</button>
          <button type="button" class="btn-quiet" @click="discardShared">Go back to mine</button>
        </span>
      </div>

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
          Your data stays in this browser. A link from "Copy link" holds your numbers in the link itself,
          so only the people you send it to can see them.
        </p>
      </footer>
    </div>
  </div>
</template>
