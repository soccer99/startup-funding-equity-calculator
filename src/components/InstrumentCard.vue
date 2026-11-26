<script setup lang="ts">
import { computed } from 'vue'
import type { Conversion, FundingRound, Instrument } from '@/types'
import { owed } from '@/lib/equity'
import { formatCurrency, formatPercentage } from '@/utils/format'
import InfoTooltip from './InfoTooltip.vue'
import CurrencyInput from './CurrencyInput.vue'
import PercentInput from './PercentInput.vue'

// One SAFE, convertible note, or loan. It edits the instrument in place, like the investor rows.
const props = defineProps<{
  instrument: Instrument
  rounds: FundingRound[]
  conversion?: Conversion
}>()

const emit = defineEmits<{ remove: [] }>()

const title = { safe: 'SAFE', note: 'Convertible note', loan: 'Loan' }
const termKey = { safe: 'safe', note: 'convertibleNote', loan: 'loan' }
const basisText = { cap: 'at its valuation cap', discount: 'at its discount', price: 'at the price of the round' }

const isLoan = computed(() => props.instrument.kind === 'loan')
const uid = computed(() => `inst-${props.instrument.id}`)

// What this instrument does to the cap table or the exit, in one sentence.
const result = computed(() => {
  const inst = props.instrument
  const total = formatCurrency(owed(inst))
  if (isLoan.value) return `${total} is owed at the exit. In a sale, it is paid before all stock. It gives no ownership.`
  const round = props.rounds.find(r => r.id === inst.convertsInRoundId)
  const c = props.conversion
  if (round && c) {
    return `Converts in ${round.name || 'the round'}: ${total} becomes ${formatPercentage(c.percentage)} of the company, ${basisText[c.basis]}.`
  }
  if (c && c.percentage > 0) {
    return `Not converted yet. At its cap, ${total} is ${formatPercentage(c.percentage)} of the company. In a sale, the holder takes the greater of the cash or that share.`
  }
  return 'Not converted yet, and no cap. The share is set by the price at the exit.'
})
</script>

<template>
  <div class="card overflow-hidden">
    <!-- Phone: type and remove on line one, then the name, then the amount. Wide screen: one line. -->
    <div class="card-x py-3 border-b border-slate-800 grid grid-cols-[auto_minmax(0,1fr)_auto] sm:flex items-center gap-x-3 gap-y-2">
      <div class="w-2 h-2 rounded-full flex-shrink-0" :class="isLoan ? 'bg-slate-400' : 'bg-sky-500'"></div>
      <span class="flex items-center font-serif text-lg text-white whitespace-nowrap">
        {{ title[instrument.kind] }}<InfoTooltip :termKey="termKey[instrument.kind]" />
      </span>
      <input
        v-model="instrument.name"
        type="text"
        autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done" @keydown.enter="($event.target as HTMLInputElement).blur()"
        list="investor-names"
        autocomplete="off"
        :placeholder="isLoan ? 'Lender name' : 'Investor name'"
        :aria-label="isLoan ? 'Lender name' : 'Investor name'"
        class="field col-start-2 col-span-2 row-start-2 sm:flex-1 min-w-0 h-9 sm:h-8 px-2 text-base sm:text-sm"
      />
      <div class="col-start-2 col-span-2 row-start-3 flex items-center gap-2">
        <span class="text-slate-400">$</span>
        <CurrencyInput
          v-model="instrument.amount"
          :aria-label="`${title[instrument.kind]} amount, dollars`"
          class="field flex-1 sm:flex-none min-w-0 sm:w-28 h-9 sm:h-8 px-2 sm:text-right text-base sm:text-sm num"
        />
      </div>
      <button type="button" class="icon-btn col-start-3 row-start-1 -mr-2" :aria-label="`Remove ${instrument.name || title[instrument.kind]}`" @click="emit('remove')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="card-pad grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
      <template v-if="!isLoan">
        <div>
          <div class="flex items-center mb-2">
            <label :for="`${uid}-cap`" class="label">Valuation cap</label>
            <InfoTooltip termKey="valuationCap" />
          </div>
          <div class="flex items-center">
            <span class="text-slate-400 mr-2">$</span>
            <CurrencyInput :id="`${uid}-cap`" v-model="instrument.valuationCap" placeholder="No cap" class="field w-full px-3 py-2 num" />
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2.5" role="group" aria-label="Type of cap">
            <button type="button" class="chip" :aria-pressed="instrument.capBasis === 'post'" @click="instrument.capBasis = 'post'">Post-money cap</button>
            <button type="button" class="chip" :aria-pressed="instrument.capBasis === 'pre'" @click="instrument.capBasis = 'pre'">Pre-money cap</button>
          </div>
        </div>

        <div role="group" :aria-labelledby="`${uid}-discount`">
          <div class="flex items-center mb-2">
            <span :id="`${uid}-discount`" class="label">Discount</span>
            <InfoTooltip termKey="conversionDiscount" />
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="pct in [0, 10, 15, 20, 25]"
              :key="pct"
              type="button"
              class="chip"
              :aria-pressed="instrument.discountPercent === pct"
              @click="instrument.discountPercent = pct"
            >
              {{ pct ? `${pct}%` : 'None' }}
            </button>
          </div>
          <p class="text-xs text-slate-400 mt-1.5">The holder gets the better of the cap or the discount, not both.</p>
        </div>
      </template>

      <template v-if="instrument.kind !== 'safe'">
        <div>
          <label :for="`${uid}-interest`" class="label block mb-2">Interest per year</label>
          <div class="flex items-center">
            <PercentInput :id="`${uid}-interest`" v-model="instrument.interestPercent" :max="30" :step="0.5" class="field w-full px-3 py-2 num" />
            <span class="text-slate-400 ml-2">%</span>
          </div>
        </div>
        <div>
          <label :for="`${uid}-months`" class="label block mb-2">{{ isLoan ? 'Months until the exit' : 'Months until it converts' }}</label>
          <PercentInput :id="`${uid}-months`" v-model="instrument.months" :max="120" class="field w-full px-3 py-2 num" />
          <p class="text-xs text-slate-400 mt-1.5">Simple interest for this time is added to the amount.</p>
        </div>
      </template>

      <template v-if="!isLoan">
        <div>
          <label :for="`${uid}-round`" class="label block mb-2">Converts in</label>
          <select
            :id="`${uid}-round`"
            class="field w-full px-3 py-2 text-base sm:text-sm"
            :value="rounds.some(r => r.id === instrument.convertsInRoundId) ? instrument.convertsInRoundId : ''"
            @change="instrument.convertsInRoundId = ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null"
          >
            <option v-for="round in rounds" :key="round.id" :value="round.id">{{ round.name || 'Round' }}</option>
            <option value="">No round yet (not converted)</option>
          </select>
        </div>

        <div v-if="instrument.kind === 'note'" role="group" :aria-labelledby="`${uid}-multiple`">
          <div :id="`${uid}-multiple`" class="label mb-2">Cash back in a sale, if not converted</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="multiple in [1, 1.5, 2]"
              :key="multiple"
              type="button"
              class="chip"
              :aria-pressed="instrument.exitMultiple === multiple"
              @click="instrument.exitMultiple = multiple"
            >
              {{ multiple === 1 ? 'Principal + interest' : `${multiple}x principal` }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <div class="card-row border-t border-slate-800 bg-slate-950/40 text-sm text-slate-300">{{ result }}</div>
  </div>
</template>
