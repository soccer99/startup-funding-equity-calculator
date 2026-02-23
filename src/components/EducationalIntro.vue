<script setup lang="ts">
import { ref } from 'vue'
import InfoTooltip from './InfoTooltip.vue'

const isExpanded = ref(false)
</script>

<template>
  <section class="mb-10 border border-slate-800 rounded bg-slate-900/50">
    <button
      @click="isExpanded = !isExpanded"
      class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
    >
      <div>
        <h2 class="text-lg font-medium text-white">Understanding Startup Equity</h2>
        <p class="text-sm text-slate-500 mt-1">
          Key concepts, formulas, and terms you need to know
        </p>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 text-slate-500 transition-transform"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isExpanded" class="px-6 pb-6 border-t border-slate-800">
        <div class="grid md:grid-cols-2 gap-6 mt-6">
          <!-- The Pie Metaphor -->
          <div>
            <h3 class="text-sm font-medium text-slate-300 uppercase tracking-wide mb-3">The Pie Metaphor</h3>
            <div class="space-y-3 text-sm text-slate-400">
              <p>
                Think of your startup as a pie. At the start, founders own 100%.
              </p>
              <p>
                <span class="text-white">The Trade:</span> When you raise funding, you're baking a larger pie and giving new pieces to investors.
              </p>
              <p>
                <span class="text-white">The Result:</span> Your percentage shrinks, but the pie (valuation<InfoTooltip termKey="postMoneyValuation" />) is larger, so your slice's value should increase.
              </p>
            </div>
          </div>

          <!-- Key Formulas -->
          <div>
            <h3 class="text-sm font-medium text-slate-300 uppercase tracking-wide mb-3">Key Formulas</h3>
            <div class="space-y-2 text-sm font-mono">
              <div class="flex justify-between py-2 border-b border-slate-800">
                <span class="text-slate-500">Post-Money Valuation</span>
                <span class="text-slate-300">Pre-Money + Investment</span>
              </div>
              <div class="flex justify-between py-2 border-b border-slate-800">
                <span class="text-slate-500">Investor Ownership</span>
                <span class="text-slate-300">Investment / Post-Money</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-slate-500">New Ownership</span>
                <span class="text-slate-300">Old % x (1 - Investor %)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Terms -->
        <div class="mt-8">
          <h3 class="text-sm font-medium text-slate-300 uppercase tracking-wide mb-4">Key Terms</h3>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="text-sm">
              <div class="text-white mb-1">
                Pro-Rata<InfoTooltip termKey="proRata" />
              </div>
              <p class="text-slate-500">Distributing based on ownership percentage.</p>
            </div>
            <div class="text-sm">
              <div class="text-white mb-1">
                Liquidation Preference<InfoTooltip termKey="liquidationPreference" />
              </div>
              <p class="text-slate-500">Investors get paid back first before founders.</p>
            </div>
            <div class="text-sm">
              <div class="text-white mb-1">
                Participating<InfoTooltip termKey="participatingPreferred" />
              </div>
              <p class="text-slate-500">Investor gets preference plus pro-rata share.</p>
            </div>
            <div class="text-sm">
              <div class="text-white mb-1">
                Non-Participating<InfoTooltip termKey="nonParticipating" />
              </div>
              <p class="text-slate-500">Investor chooses preference or pro-rata share.</p>
            </div>
          </div>
        </div>

        <!-- Stock Types -->
        <div class="mt-8">
          <h3 class="text-sm font-medium text-slate-300 uppercase tracking-wide mb-4">Stock Types</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="flex gap-3 text-sm">
              <div class="w-1 bg-emerald-500 rounded"></div>
              <div>
                <div class="text-white mb-1">Common Stock<InfoTooltip termKey="commonStock" /></div>
                <p class="text-slate-500">What founders and employees own. Paid last in an exit.</p>
              </div>
            </div>
            <div class="flex gap-3 text-sm">
              <div class="w-1 bg-sky-500 rounded"></div>
              <div>
                <div class="text-white mb-1">Preferred Stock<InfoTooltip termKey="preferredStock" /></div>
                <p class="text-slate-500">What VCs buy. Comes with preferences, paid first.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Option Pools -->
        <div class="mt-8">
          <h3 class="text-sm font-medium text-slate-300 uppercase tracking-wide mb-4">
            Option Pools<InfoTooltip termKey="optionPool" />
          </h3>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4 text-sm text-slate-400">
              <p>
                <span class="text-white">What it is:</span> A reserve of shares set aside for future employee equity grants—stock options, RSUs, or other incentive compensation.
              </p>
              <p>
                <span class="text-white">Why it exists:</span> Startups use equity to attract talent when they can't compete on salary. The pool lets you make grants without shareholder approval each time.
              </p>
              <p>
                <span class="text-white">How dilution works:</span> When the pool is created, it dilutes existing shareholders. When options are granted from the pool, no additional dilution occurs—the shares were already reserved.
              </p>
            </div>
            <div class="space-y-4 text-sm text-slate-400">
              <p>
                <span class="text-white">When to create:</span> Typically at incorporation (small pool) and expanded before each funding round. VCs often require a "top-up" to 10-20% as a condition of investment.
              </p>
              <p>
                <span class="text-white">Pre vs Post-Money:</span><InfoTooltip termKey="optionPoolShuffle" /> Pre-money pools dilute only founders. Post-money pools dilute everyone equally. VCs prefer pre-money (the "option pool shuffle").
              </p>
              <p>
                <span class="text-white">Typical sizes:</span> 10% at Seed, 15-20% at Series A, refreshed to maintain ~10-15% unallocated for future hires.
              </p>
            </div>
          </div>
          <div class="mt-4 p-3 bg-slate-800/50 rounded">
            <h4 class="text-xs font-medium text-slate-300 uppercase tracking-wide mb-2">Rules of Thumb</h4>
            <ul class="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-400">
              <li>• Size pool for 12-24 months of hiring</li>
              <li>• First 10 employees: 0.5-2% each</li>
              <li>• Employees 11-50: 0.1-0.5% each</li>
              <li>• Negotiate pool size, not just valuation</li>
              <li>• Unused pool reverts to founders on exit</li>
              <li>• Vesting: 4 years with 1-year cliff is standard</li>
            </ul>
          </div>
        </div>

        <!-- Exit Waterfall -->
        <div class="mt-8">
          <h3 class="text-sm font-medium text-slate-300 uppercase tracking-wide mb-4">
            Exit Waterfall<InfoTooltip termKey="exitWaterfall" />
          </h3>
          <p class="text-sm text-slate-500 mb-4">When your company exits, money flows in this order:</p>
          <div class="flex flex-wrap gap-2 text-sm">
            <span class="px-3 py-1.5 bg-slate-800 text-slate-400 rounded">1. Debt holders</span>
            <span class="text-slate-600">→</span>
            <span class="px-3 py-1.5 bg-slate-800 text-slate-400 rounded">2. Liquidation preferences</span>
            <span class="text-slate-600">→</span>
            <span class="px-3 py-1.5 bg-slate-800 text-slate-400 rounded">3. Participating preferred</span>
            <span class="text-slate-600">→</span>
            <span class="px-3 py-1.5 bg-slate-800 text-slate-400 rounded">4. Common stockholders</span>
          </div>
        </div>

        <!-- Watch Out For -->
        <div class="mt-8 p-4 border border-amber-900/50 bg-amber-950/20 rounded">
          <h3 class="text-sm font-medium text-amber-200 mb-3">Watch Out For</h3>
          <ul class="space-y-2 text-sm text-slate-400">
            <li>
              <span class="text-amber-200">Option Pool Shuffle</span><InfoTooltip termKey="optionPoolShuffle" /> — VCs may ask for a 15-20% option pool from pre-money, meaning founders bear the dilution.
            </li>
            <li>
              <span class="text-amber-200">Participating Preferred</span><InfoTooltip termKey="participatingPreferred" /> — Double-dip where investors get preference and share in remaining proceeds.
            </li>
            <li>
              <span class="text-amber-200">Down Rounds</span><InfoTooltip termKey="downRound" /> — Trigger anti-dilution clauses that further dilute founders.
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </section>
</template>
