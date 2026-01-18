<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FundingRound, Investor } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/format'
import { roundPresets } from '@/data/roundPresets'
import InfoTooltip from './InfoTooltip.vue'
import CurrencyInput from './CurrencyInput.vue'
import InvestorCombobox from './InvestorCombobox.vue'

const props = defineProps<{
  fundingRounds: FundingRound[]
}>()

const previousInvestorNames = computed(() => {
  const names = new Set<string>()
  for (const round of props.fundingRounds) {
    for (const investor of round.investors) {
      if (investor.name && investor.name.trim()) {
        names.add(investor.name.trim())
      }
    }
  }
  return Array.from(names).sort()
})

const emit = defineEmits<{
  addRound: [presetId?: string]
  removeRound: [id: number]
  applyPreset: [roundId: number, presetId: string]
  addInvestor: [round: FundingRound]
  removeInvestor: [round: FundingRound, investorId: number]
}>()

const expandedAdvanced = ref<Set<number>>(new Set())

function toggleAdvanced(investorId: number) {
  if (expandedAdvanced.value.has(investorId)) {
    expandedAdvanced.value.delete(investorId)
  } else {
    expandedAdvanced.value.add(investorId)
  }
}

function onPresetChange(round: FundingRound, event: Event) {
  const presetId = (event.target as HTMLSelectElement).value
  if (presetId) {
    emit('applyPreset', round.id, presetId)
  }
}

function getInvestorPercentage(round: FundingRound, investor: Investor): number {
  const totalInvestment = round.investors.reduce((sum, i) => sum + i.amount, 0)
  const postMoney = round.preMoneyValuation + totalInvestment
  if (postMoney === 0) return 0
  return (investor.amount / postMoney) * 100
}
</script>

<template>
  <section class="mb-10">
    <div class="flex items-baseline justify-between mb-4">
      <h2 class="text-lg font-medium text-white">
        Funding Rounds<InfoTooltip termKey="fundingRound" />
      </h2>
    </div>

    <div v-if="fundingRounds.length === 0" class="border border-slate-800 border-dashed rounded p-8 text-center">
      <p class="text-slate-500 mb-2">No funding rounds yet</p>
      <p class="text-sm text-slate-600">Add a round below to see how dilution affects equity</p>
    </div>

    <div class="space-y-4">
      <div
        v-for="round in fundingRounds"
        :key="round.id"
        class="border border-slate-800 rounded"
      >
        <!-- Round Header -->
        <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <input
              v-model="round.name"
              type="text"
              class="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-white font-medium focus:outline-none focus:border-slate-600 hover:border-slate-600 w-28"
            />
            <select
              @change="onPresetChange(round, $event)"
              class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none"
            >
              <option value="">Apply preset</option>
              <option v-for="preset in roundPresets" :key="preset.id" :value="preset.id">
                {{ preset.displayName }}
              </option>
            </select>
          </div>
          <button
            @click="emit('removeRound', round.id)"
            class="text-slate-600 hover:text-red-400 transition-colors"
            aria-label="Remove round"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Round Details -->
        <div class="p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label class="block text-xs text-slate-500 uppercase tracking-wide mb-2">
                Pre-Money Valuation<InfoTooltip termKey="preMoneyValuation" />
              </label>
              <div class="flex items-center">
                <span class="text-slate-500 mr-2">$</span>
                <CurrencyInput
                  v-model="round.preMoneyValuation"
                  :min="0"
                  :step="100000"
                  class="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-500 uppercase tracking-wide mb-2">
                Option Pool<InfoTooltip termKey="optionPool" />
              </label>
              <div class="flex items-center">
                <input
                  v-model.number="round.optionPoolPercent"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  max="30"
                  step="1"
                  class="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-slate-600"
                />
                <span class="text-slate-500 ml-2">%</span>
              </div>
              <p class="text-xs text-slate-600 mt-1">Post-money</p>
            </div>
          </div>

          <!-- Investors -->
          <div>
            <label class="block text-xs text-slate-500 uppercase tracking-wide mb-3">
              Investors<InfoTooltip termKey="investor" />
            </label>
            <div class="space-y-3">
              <div
                v-for="investor in round.investors"
                :key="investor.id"
                class="bg-slate-900/50 border border-slate-800 rounded"
              >
                <div class="p-3">
                  <div class="flex items-center gap-3">
                    <div class="w-1.5 h-1.5 bg-sky-500 rounded-full flex-shrink-0"></div>
                    <InvestorCombobox
                      v-model="investor.name"
                      :suggestions="previousInvestorNames"
                      placeholder="Investor name"
                    />
                    <div class="flex items-center gap-2">
                      <span class="text-slate-500">$</span>
                      <CurrencyInput
                        v-model="investor.amount"
                        :min="0"
                        :step="10000"
                        class="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-right text-sm focus:outline-none focus:border-slate-600"
                      />
                      <span class="text-xs text-sky-400 w-14 text-right">{{ formatPercentage(getInvestorPercentage(round, investor)) }}</span>
                    </div>
                    <button
                      @click="emit('removeInvestor', round, investor.id)"
                      class="text-slate-600 hover:text-red-400 transition-colors"
                      :disabled="round.investors.length <= 1"
                      :class="{ 'opacity-30 cursor-not-allowed hover:text-slate-600': round.investors.length <= 1 }"
                      aria-label="Remove investor"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <!-- Advanced Toggle -->
                  <div class="mt-2 pt-2 border-t border-slate-800">
                    <button
                      @click="toggleAdvanced(investor.id)"
                      class="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3 transition-transform"
                        :class="{ 'rotate-90': expandedAdvanced.has(investor.id) }"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      Terms
                      <span v-if="investor.liquidationPreference !== 1 || investor.participating" class="text-amber-500">(modified)</span>
                    </button>

                    <Transition
                      enter-active-class="transition ease-out duration-150"
                      enter-from-class="opacity-0"
                      enter-to-class="opacity-100"
                      leave-active-class="transition ease-in duration-100"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <div v-if="expandedAdvanced.has(investor.id)" class="mt-3 space-y-4">
                        <div>
                          <label class="block text-xs text-slate-500 mb-2">
                            Liquidation Preference<InfoTooltip termKey="liquidationPreference" />
                          </label>
                          <div class="flex gap-1">
                            <button
                              v-for="pref in [1, 1.5, 2, 3]"
                              :key="pref"
                              @click="investor.liquidationPreference = pref"
                              class="px-3 py-1 rounded text-xs transition-colors"
                              :class="investor.liquidationPreference === pref
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                            >
                              {{ pref }}x
                            </button>
                          </div>
                        </div>

                        <div>
                          <label class="block text-xs text-slate-500 mb-2">
                            Participation<InfoTooltip termKey="participatingPreferred" />
                          </label>
                          <div class="flex gap-1">
                            <button
                              @click="investor.participating = false"
                              class="px-3 py-1 rounded text-xs transition-colors"
                              :class="!investor.participating
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                            >
                              Non-participating
                            </button>
                            <button
                              @click="investor.participating = true"
                              class="px-3 py-1 rounded text-xs transition-colors"
                              :class="investor.participating
                                ? 'bg-amber-900/50 text-amber-200'
                                : 'bg-slate-800 text-slate-500 hover:text-slate-300'"
                            >
                              Participating
                            </button>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>
            <button
              @click="emit('addInvestor', round)"
              class="mt-2 text-xs text-slate-500 hover:text-white transition-colors"
            >
              + Add investor
            </button>
          </div>
        </div>

        <!-- Round Summary -->
        <div class="px-4 py-3 border-t border-slate-800 bg-slate-900/30 text-sm text-slate-500 flex gap-6">
          <span>
            Investment: <span class="text-slate-300">{{ formatCurrency(round.investors.reduce((sum, i) => sum + i.amount, 0)) }}</span>
          </span>
          <span>
            Post-money: <span class="text-slate-300">{{ formatCurrency(round.preMoneyValuation + round.investors.reduce((sum, i) => sum + i.amount, 0)) }}</span>
          </span>
          <span v-if="round.optionPoolPercent > 0">
            Pool: <span class="text-amber-400">{{ round.optionPoolPercent }}%</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Add Round Buttons -->
    <div class="mt-6">
      <p class="text-xs text-slate-500 uppercase tracking-wide mb-3">Add round</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in roundPresets.filter(p => p.id !== 'custom')"
          :key="preset.id"
          @click="emit('addRound', preset.id)"
          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 rounded text-sm transition-colors"
        >
          {{ preset.displayName }}
        </button>
      </div>
    </div>

  </section>
</template>
