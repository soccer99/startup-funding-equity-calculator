<script setup lang="ts">
import { ref } from 'vue'
import InfoTooltip from './InfoTooltip.vue'

const isExpanded = ref(false)

// Further reading for each step. Each page was read and checked against the text here (November 2026).
const sources = {
  equity: [
    { by: 'Carta', title: 'Share dilution', url: 'https://carta.com/learn/startups/equity-management/share-dilution/' },
    { by: 'Holloway', title: 'A Primer on Ownership', url: 'https://www.holloway.com/g/venture-capital/sections/a-primer-on-ownership' },
  ],
  roundMath: [
    { by: 'Investopedia', title: 'Pre-Money vs. Post-Money Valuation', url: 'https://www.investopedia.com/ask/answers/difference-between-premoney-and-postmoney/' },
    { by: 'Holloway', title: 'Price, Dilution, and Valuation', url: 'https://www.holloway.com/g/venture-capital/sections/a-primer-on-ownership' },
  ],
  safe: [
    { by: 'Y Combinator', title: 'The SAFE', url: 'https://www.ycombinator.com/safe/' },
    { by: 'Y Combinator', title: 'SAFE user guide (PDF)', url: 'https://bookface-static.ycombinator.com/assets/ycdc/SAFE%20User%20Guide-a47c6588327d73aa2799e61ed7c2cae9f1a0ee9acfa9c43b62039dc06e715832.pdf' },
    { by: 'Westaway', title: 'Founder Guide: Convertible Notes', url: 'https://www.westaway.com/guides/convertible-notes' },
  ],
  stock: [
    { by: 'Carta', title: 'Equity in business: common and preferred shares', url: 'https://carta.com/learn/equity/' },
  ],
  pool: [
    { by: 'Venture Hacks', title: 'The Option Pool Shuffle', url: 'https://venturehacks.com/option-pool-shuffle' },
    { by: 'Cooley GO', title: 'Negotiating the Option Pool', url: 'https://www.cooleygo.com/negotiating-option-pool/' },
    { by: 'Carta', title: 'What is an option pool?', url: 'https://carta.com/learn/startups/equity-management/option-pool/' },
  ],
  exit: [
    { by: 'Carta', title: 'Liquidation preferences', url: 'https://carta.com/learn/equity/liquidity-events/liquidation-preferences/' },
    { by: 'Andreessen Horowitz', title: 'Funding When Capital Isn’t Cheap', url: 'https://a16z.com/funding-when-capital-isnt-cheap/' },
    { by: 'Carta', title: 'Waterfall analysis', url: 'https://carta.com/learn/startups/exit-strategies/waterfall-analysis/' },
    { by: 'Cooley GO', title: 'Venture financing data: how common each term is', url: 'https://www.cooleygo.com/trends/' },
  ],
  ipo: [
    { by: 'SEC Investor.gov', title: 'IPO lockup agreements', url: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/initial-public-offerings-lockup-agreements' },
    { by: 'PwC / AICPA', title: 'Economic rights of preferred stock (conversion in an IPO)', url: 'https://viewpoint.pwc.com/dt/us/en/aicpav2/avg-pci/avg-pci/avg-pci_appB/avg-pci_appB_07/avg-pci-appB-07-Economic-Rights.html' },
  ],
  watch: [
    { by: 'Carta', title: 'Down rounds', url: 'https://carta.com/learn/startups/fundraising/down-rounds/' },
    { by: 'Orrick', title: 'Raising a Down Round and How to Be Prepared', url: 'https://www.orrick.com/en/tech-studio/insights/raising-a-down-round-and-how-to-be-prepared' },
  ],
}
</script>

<template>
  <section class="no-print section card overflow-hidden">
    <h2>
      <button
        type="button"
        @click="isExpanded = !isExpanded"
        :aria-expanded="isExpanded"
        class="w-full card-pad flex items-center justify-between gap-4 text-left hover:bg-slate-800/40 transition-colors"
      >
        <span>
          <span class="block font-serif text-xl text-white">New to startup equity?</span>
          <span class="block text-sm text-slate-400 mt-1">A five-minute lesson, with links to trusted guides for each step.</span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform"
          :class="{ 'rotate-180': isExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </h2>

    <div v-if="isExpanded" class="card-x pt-6 pb-8 border-t border-slate-800 space-y-8 text-sm text-slate-300 leading-relaxed">
      <!-- 1 -->
      <div class="max-w-2xl">
        <h3 class="font-serif text-lg text-white mb-2">1. Equity is a slice of the company</h3>
        <p>
          Think of the company as a pie. Equity<InfoTooltip termKey="equity" /> is your slice, shown as a percent.
          At the start, the founders own 100%.
        </p>
        <p class="mt-2">
          To raise money, the company makes new slices and sells them to investors. Each old slice becomes a smaller
          percent of the pie. This is dilution<InfoTooltip termKey="dilution" />. It can still be a good trade:
          a smaller slice of a much larger pie can be worth more.
        </p>

        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.equity" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.equity.length - 1 ? ' · ' : '' }}
          </template>
        </p>
      </div>

      <!-- 2 -->
      <div>
        <h3 class="font-serif text-lg text-white mb-2">2. The math of one funding round</h3>
        <p class="max-w-2xl mb-4">
          Investors and founders agree on what the company is worth before the money comes in.
          This is the pre-money valuation<InfoTooltip termKey="preMoneyValuation" />. All the other numbers follow from it.
        </p>
        <div class="card-inset divide-y divide-slate-800 max-w-2xl">
          <div class="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span class="text-slate-400">Post-money value = pre-money + investment</span>
            <span class="num text-white">$8M + $2M = $10M</span>
          </div>
          <div class="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span class="text-slate-400">Investor's share = investment ÷ post-money</span>
            <span class="num text-white">$2M ÷ $10M = 20%</span>
          </div>
          <div class="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
            <span class="text-slate-400">Your new share = old share × (100% − new shares)</span>
            <span class="num text-white">100% × 80% = 80%</span>
          </div>
        </div>

        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.roundMath" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.roundMath.length - 1 ? ' · ' : '' }}
          </template>
        </p>
      </div>

      <!-- SAFEs and notes -->
      <div class="max-w-2xl">
        <h3 class="font-serif text-lg text-white mb-2">Before the first priced round: SAFEs and notes</h3>
        <p>
          Very young companies are hard to value. So early investors often use a SAFE<InfoTooltip termKey="safe" />
          or a convertible note<InfoTooltip termKey="convertibleNote" />. The investor pays now and gets stock later,
          in the first priced round.
        </p>
        <p class="mt-2">
          A valuation cap<InfoTooltip termKey="valuationCap" /> sets the highest price they can pay. Example: $500K on a SAFE
          with a $5M post-money cap is 10% of the company just before the round. The new round then dilutes it, like all other holders.
          A note is a loan, so it also earns interest, and the interest converts too.
        </p>
        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.safe" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.safe.length - 1 ? ' · ' : '' }}
          </template>
        </p>
      </div>

      <!-- 3 -->
      <div>
        <h3 class="font-serif text-lg text-white mb-3">3. Two kinds of stock</h3>
        <div class="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div class="flex gap-3">
            <div class="w-1 bg-emerald-500 rounded"></div>
            <div>
              <div class="text-white font-medium">Common stock<InfoTooltip termKey="commonStock" /></div>
              <p class="text-slate-400">Founders and employees hold it. It has no special rights.</p>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="w-1 bg-sky-500 rounded"></div>
            <div>
              <div class="text-white font-medium">Preferred stock<InfoTooltip termKey="preferredStock" /></div>
              <p class="text-slate-400">Investors buy it. In a sale, it is paid before common stock.</p>
            </div>
          </div>
        </div>

        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.stock" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.stock.length - 1 ? ' · ' : '' }}
          </template>
        </p>
      </div>

      <!-- 4 -->
      <div class="max-w-2xl">
        <h3 class="font-serif text-lg text-white mb-2">4. The option pool</h3>
        <p>
          An option pool<InfoTooltip termKey="optionPool" /> is a group of shares set aside to give to future employees.
          A pool is often 10% to 20% of the company.
        </p>
        <p class="mt-2">
          A new pool is a new slice, so it dilutes the other owners. Investors usually ask that the pool is made
          before they invest. Then the founders take all of that dilution and the new investor takes none.
          This is the "option pool shuffle"<InfoTooltip termKey="optionPoolShuffle" />. This calculator works this way.
        </p>

        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.pool" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.pool.length - 1 ? ' · ' : '' }}
          </template>
        </p>
      </div>

      <!-- 5 -->
      <div>
        <h3 class="font-serif text-lg text-white mb-2">5. Who gets paid when the company is sold</h3>
        <p class="max-w-2xl mb-4">
          The money is paid in order<InfoTooltip termKey="exitWaterfall" />. Each step is paid in full before the next step gets anything.
        </p>
        <ol class="card-inset divide-y divide-slate-800 max-w-2xl">
          <li class="px-4 py-3"><span class="text-white font-medium">First: debts and deal costs.</span> Loans, unconverted notes, lawyers, and bankers.</li>
          <li class="px-4 py-3">
            <span class="text-white font-medium">Second: investors' preferences.</span>
            A liquidation preference<InfoTooltip termKey="liquidationPreference" /> gives investors their money back first.
            "1x" means one times the amount they invested.
          </li>
          <li class="px-4 py-3"><span class="text-white font-medium">Last: all the rest.</span> It is split by ownership percent.</li>
        </ol>

        <div class="grid sm:grid-cols-2 gap-4 max-w-2xl mt-4">
          <div>
            <div class="text-white font-medium">Non-participating<InfoTooltip termKey="nonParticipating" /></div>
            <p class="text-slate-400">
              The usual deal. The investor picks the larger of two amounts: the preference, or their percent of the sale. Not both.
            </p>
          </div>
          <div>
            <div class="text-white font-medium">Participating<InfoTooltip termKey="participatingPreferred" /></div>
            <p class="text-slate-400">
              Rare, and worse for founders. The investor takes the preference and also their percent of the rest.
            </p>
          </div>
        </div>

        <div class="card-inset px-4 py-3 max-w-2xl mt-4">
          <div class="label mb-2">Example</div>
          <p>An investor paid $5M for 20% of the company, with a 1x non-participating preference.</p>
          <ul class="mt-2 space-y-1">
            <li><span class="num text-white">$20M</span> sale: 20% is $4M. The $5M preference is larger, so the investor takes $5M.</li>
            <li><span class="num text-white">$50M</span> sale: 20% is $10M. That is larger, so the investor takes $10M.</li>
          </ul>
        </div>

        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.exit" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.exit.length - 1 ? ' · ' : '' }}
          </template>
        </p>

        <p class="max-w-2xl mt-4">
          <span class="text-white font-medium">An IPO is different.</span>
          When a company sells shares to the public<InfoTooltip termKey="ipo" />, preferred stock turns into common stock.
          There are no preferences. Each owner's shares are worth their percent of the company.
        </p>

        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.ipo" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.ipo.length - 1 ? ' · ' : '' }}
          </template>
        </p>
      </div>

      <!-- 6 -->
      <div class="max-w-2xl">
        <h3 class="font-serif text-lg text-white mb-2">6. Three things to watch for</h3>
        <ul class="space-y-2">
          <li><span class="text-white font-medium">A large option pool.</span> A larger pool lowers the founders' share in the same way as a lower valuation.</li>
          <li><span class="text-white font-medium">Participating preferred or a preference above 1x.</span> In a small sale, they can leave very little for founders.</li>
          <li>
            <span class="text-white font-medium">A down round<InfoTooltip termKey="downRound" />.</span>
            This is a round at a lower valuation than the last one. Earlier investors often have anti-dilution rights. These give them a larger share when their stock converts, and that dilutes founders more.
          </li>
        </ul>

        <p class="mt-3 text-xs text-slate-400 max-w-2xl">
          Read more:
          <template v-for="(source, index) in sources.watch" :key="source.url + source.title">
            <a :href="source.url" target="_blank" rel="noopener" class="text-slate-100 underline underline-offset-2 hover:no-underline">{{ source.title }}</a>
            ({{ source.by }}){{ index < sources.watch.length - 1 ? ' · ' : '' }}
          </template>
        </p>
      </div>
    </div>
  </section>
</template>
