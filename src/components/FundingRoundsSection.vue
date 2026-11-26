<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Conversion, FundingRound, Instrument, InstrumentKind, Investor, RoundSnapshot } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/format'
import { roundPresets } from '@/data/roundPresets'
import InfoTooltip from './InfoTooltip.vue'
import CurrencyInput from './CurrencyInput.vue'
import PercentInput from './PercentInput.vue'
import InstrumentCard from './InstrumentCard.vue'

const props = defineProps<{
  fundingRounds: FundingRound[]
  instruments: Instrument[]
  conversions: Record<number, Conversion>
  snapshots: RoundSnapshot[] // cap table after each round; index 0 is "Initial"
  removedRoundName: string | null
}>()

const emit = defineEmits<{
  addRound: [presetId?: string]
  removeRound: [id: number]
  undoRemoveRound: []
  addInvestor: [round: FundingRound]
  removeInvestor: [round: FundingRound, investorId: number]
  addInstrument: [kind: InstrumentKind]
  removeInstrument: [id: number]
}>()

const investorNames = computed(() =>
  [...new Set([
    ...props.fundingRounds.flatMap(r => r.investors.map(i => i.name.trim())),
    ...props.instruments.map(i => i.name.trim()),
  ].filter(Boolean))].sort()
)

// SAFEs and notes are shown just before the round that converts them.
const convertingIn = (roundId: number) => props.instruments.filter(i => i.kind !== 'loan' && i.convertsInRoundId === roundId)
// No priced round yet (or its round was removed).
const unconverted = computed(() =>
  props.instruments.filter(i => i.kind !== 'loan' && !props.fundingRounds.some(r => r.id === i.convertsInRoundId))
)
const loans = computed(() => props.instruments.filter(i => i.kind === 'loan'))
const convertedShare = (roundId: number) =>
  convertingIn(roundId).reduce((sum, i) => sum + (props.conversions[i.id]?.percentage ?? 0), 0)

const expandedTerms = ref<Set<number>>(new Set())

function toggleTerms(investorId: number) {
  if (!expandedTerms.value.delete(investorId)) expandedTerms.value.add(investorId)
}

const raised = (round: FundingRound) => round.investors.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
const postMoney = (round: FundingRound) => (Number(round.preMoneyValuation) || 0) + raised(round)

function investorPercentage(round: FundingRound, investor: Investor): number {
  return postMoney(round) ? ((Number(investor.amount) || 0) / postMoney(round)) * 100 : 0
}

function foundersAfter(roundIndex: number): number {
  const snapshot = props.snapshots[roundIndex + 1]
  return snapshot ? snapshot.stakeholders.filter(s => s.type === 'founder').reduce((sum, s) => sum + s.percentage, 0) : 0
}

</script>

<template>
  <section class="section">
    <h2 class="section-title mb-5">
      <span class="step">2</span>Funding Rounds<InfoTooltip termKey="fundingRound" />
    </h2>

    <datalist id="investor-names">
      <option v-for="name in investorNames" :key="name" :value="name" />
    </datalist>

    <div v-if="fundingRounds.length === 0 && instruments.length === 0" class="border border-slate-700 border-dashed rounded-lg p-8 text-center">
      <p class="text-slate-300 mb-2">No funding yet</p>
      <p class="text-sm text-slate-400">Add a SAFE, a note, or a priced round below to see how dilution changes ownership.</p>
    </div>

    <div class="space-y-5">
      <template v-for="(round, roundIndex) in fundingRounds" :key="round.id">
      <InstrumentCard
        v-for="instrument in convertingIn(round.id)"
        :key="instrument.id"
        :instrument="instrument"
        :rounds="fundingRounds"
        :conversion="conversions[instrument.id]"
        @remove="emit('removeInstrument', instrument.id)"
      />
      <div class="card overflow-hidden">
        <!-- Round Header -->
        <div class="card-x py-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <input
            v-model="round.name"
            type="text"
            aria-label="Round name"
            class="field flex-1 min-w-0 max-w-56 px-2 py-1 font-serif text-lg"
          />
          <button
            type="button"
            @click="emit('removeRound', round.id)"
            class="icon-btn -mr-2"
            :aria-label="`Remove ${round.name || 'round'}`"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Round Details -->
        <div class="card-pad">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-6">
            <div>
              <div class="flex items-center mb-2">
                <label :for="`pre-${round.id}`" class="label">Pre-money valuation</label>
                <InfoTooltip termKey="preMoneyValuation" />
              </div>
              <div class="flex items-center">
                <span class="text-slate-400 mr-2">$</span>
                <CurrencyInput
                  :id="`pre-${round.id}`"
                  v-model="round.preMoneyValuation"
                  class="field w-full px-3 py-2 num"
                />
              </div>
              <p class="text-xs text-slate-400 mt-1.5">You can type 10m or 500k.</p>
            </div>
            <div>
              <div class="flex items-center mb-2">
                <label :for="`pool-${round.id}`" class="label">New option pool</label>
                <InfoTooltip termKey="optionPoolShuffle" />
              </div>
              <div class="flex items-center">
                <PercentInput
                  :id="`pool-${round.id}`"
                  v-model="round.optionPoolPercent"
                  :max="50"
                  class="field w-full px-3 py-2 num"
                />
                <span class="text-slate-400 ml-2">%</span>
              </div>
              <p class="text-xs text-slate-400 mt-1.5">Added in this round, as % of the company after the round. Existing holders take the dilution.</p>
            </div>
          </div>

          <!-- Investors -->
          <div>
            <div class="flex items-center mb-3">
              <span class="label">Investors</span>
              <InfoTooltip termKey="investor" />
            </div>
            <div class="space-y-3">
              <div
                v-for="investor in round.investors"
                :key="investor.id"
                class="card-inset px-3 py-3 sm:px-4"
              >
                <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div class="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0"></div>
                  <input
                    v-model="investor.name"
                    type="text"
                    list="investor-names"
                    autocomplete="off"
                    placeholder="Investor name"
                    aria-label="Investor name"
                    class="field flex-1 min-w-0 basis-32 h-8 px-2 text-base sm:text-sm"
                  />
                  <div class="flex items-center gap-2 ml-auto">
                    <span class="text-slate-400">$</span>
                    <CurrencyInput
                      v-model="investor.amount"
                      :aria-label="`${investor.name || 'Investor'} investment, dollars`"
                      class="field w-28 h-8 px-2 text-right text-base sm:text-sm num"
                    />
                    <span class="text-xs text-sky-400 w-14 text-right num" title="Share of the company bought in this round">
                      {{ formatPercentage(investorPercentage(round, investor)) }}
                    </span>
                    <button
                      type="button"
                      @click="emit('removeInvestor', round, investor.id)"
                      class="icon-btn -mr-2"
                      :disabled="round.investors.length <= 1"
                      :title="round.investors.length <= 1 ? 'A round needs one investor' : undefined"
                      :aria-label="`Remove ${investor.name || 'investor'}`"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Terms -->
                <div class="mt-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    @click="toggleTerms(investor.id)"
                    :aria-expanded="expandedTerms.has(investor.id)"
                    class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3 transition-transform"
                      :class="{ 'rotate-90': expandedTerms.has(investor.id) }"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Terms:
                    <span class="text-slate-300">
                      {{ investor.liquidationPreference ? `${investor.liquidationPreference}x` : 'no' }} preference,
                      {{ investor.participating ? 'participating' : 'non-participating' }}
                    </span>
                  </button>

                  <div v-if="expandedTerms.has(investor.id)" class="mt-3 space-y-4">
                    <div role="group" :aria-labelledby="`pref-${investor.id}`">
                      <div class="flex items-center mb-2">
                        <span :id="`pref-${investor.id}`" class="text-xs text-slate-400">Liquidation preference</span>
                        <InfoTooltip termKey="liquidationPreference" />
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          v-for="pref in [0, 1, 1.5, 2, 3]"
                          :key="pref"
                          type="button"
                          @click="investor.liquidationPreference = pref"
                          :aria-pressed="investor.liquidationPreference === pref"
                          class="chip"
                        >
                          {{ pref ? `${pref}x` : 'None' }}
                        </button>
                      </div>
                    </div>

                    <div role="group" :aria-labelledby="`part-${investor.id}`">
                      <div class="flex items-center mb-2">
                        <span :id="`part-${investor.id}`" class="text-xs text-slate-400">Participation</span>
                        <InfoTooltip termKey="participatingPreferred" />
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          @click="investor.participating = false"
                          :aria-pressed="!investor.participating"
                          class="chip"
                        >
                          Non-participating
                        </button>
                        <button
                          type="button"
                          @click="investor.participating = true"
                          :aria-pressed="investor.participating"
                          class="chip"
                        >
                          Participating
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              @click="emit('addInvestor', round)"
              class="btn-quiet mt-3 !text-xs"
            >
              + Add investor
            </button>
          </div>
        </div>

        <!-- Round Summary -->
        <div class="card-row border-t border-slate-800 bg-slate-950/40 text-sm text-slate-400 flex flex-wrap gap-x-6 gap-y-1">
          <span>Raised: <span class="num text-slate-100">{{ formatCurrency(raised(round)) }}</span></span>
          <span>Post-money: <span class="num text-slate-100">{{ formatCurrency(postMoney(round)) }}</span></span>
          <span v-if="round.optionPoolPercent > 0">Pool added: <span class="num text-amber-400">+{{ round.optionPoolPercent }}%</span></span>
          <span v-if="convertingIn(round.id).length">SAFEs and notes converted: <span class="num text-sky-400">{{ formatPercentage(convertedShare(round.id)) }}</span></span>
          <span>Founders after: <span class="num text-emerald-400">{{ formatPercentage(foundersAfter(roundIndex)) }}</span></span>
        </div>
      </div>
      </template>

      <InstrumentCard
        v-for="instrument in [...unconverted, ...loans]"
        :key="instrument.id"
        :instrument="instrument"
        :rounds="fundingRounds"
        :conversion="conversions[instrument.id]"
        @remove="emit('removeInstrument', instrument.id)"
      />
    </div>

    <div
      v-if="removedRoundName !== null"
      class="card card-row mt-5 text-sm text-slate-300 flex items-center justify-between gap-3"
      role="status"
    >
      <span>Removed {{ removedRoundName || 'round' }}.</span>
      <button type="button" @click="emit('undoRemoveRound')" class="text-white underline underline-offset-2 hover:no-underline font-medium">Undo</button>
    </div>

    <!-- Add buttons -->
    <div class="no-print mt-8">
      <p class="label mb-3">Add early or other funding</p>
      <div class="flex flex-wrap gap-2 mb-6">
        <button type="button" class="btn" title="Simple Agreement for Future Equity. Converts to stock in the next priced round." @click="emit('addInstrument', 'safe')">+ SAFE</button>
        <button type="button" class="btn" title="A loan that converts to stock in the next priced round." @click="emit('addInstrument', 'note')">+ Convertible note</button>
        <button type="button" class="btn" title="Debt that is repaid before stock in a sale. It gives no ownership." @click="emit('addInstrument', 'loan')">+ Loan</button>
      </div>
      <p class="label mb-3">Add priced round</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in roundPresets"
          :key="preset.id"
          type="button"
          @click="emit('addRound', preset.id)"
          :title="preset.description"
          class="btn"
        >
          + {{ preset.id === 'custom' ? 'Custom' : preset.displayName }}
        </button>
      </div>
    </div>
  </section>
</template>
