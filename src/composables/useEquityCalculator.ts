import { ref, computed, watch } from 'vue'
import type { Founder, FundingRound, Instrument, InstrumentKind, ExitPayout, ExitType, ExitOptions, AcquisitionOptions, IPOOptions } from '@/types'
import { calculateEquity, calculatePayouts } from '@/lib/equity'
import { getNextRoundPreset, getPresetById } from '@/data/roundPresets'

const STORAGE_KEY = 'equity-calculator-data'

const DEFAULT_ACQUISITION_OPTIONS: AcquisitionOptions = {
  dealStructure: 'cash',
  stockPercentage: 50,
  escrowPercent: 0,
  managementCarveout: 0,
  transactionCostsPercent: 0,
}

const DEFAULT_IPO_OPTIONS: IPOOptions = {
  underwriterFeesPercent: 0,
  lockupDays: 180,
  offeringAmount: 0,
}

interface StoredData {
  founders: Founder[]
  initialOptionPool: number
  fundingRounds: FundingRound[]
  instruments: Instrument[]
  exitValuation: number
  exitType: ExitType
  exitOptions: ExitOptions
}

function loadFromStorage(): Partial<StoredData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e)
  }
  return {}
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

export function useEquityCalculator() {
  const stored = loadFromStorage()

  const founders = ref<Founder[]>(stored.founders ?? [
    { id: 1, name: 'Founder 1', percentage: 50 },
    { id: 2, name: 'Founder 2', percentage: 50 },
  ])

  // Initial option pool created at founding (before any funding)
  const initialOptionPool = ref<number>(stored.initialOptionPool ?? 0)

  const fundingRounds = ref<FundingRound[]>(stored.fundingRounds ?? [])
  // SAFEs, convertible notes and loans. They are not part of a priced round.
  const instruments = ref<Instrument[]>(stored.instruments ?? [])
  const exitType = ref<ExitType>(stored.exitType ?? 'acquisition')
  const exitValuation = ref<number>(stored.exitValuation ?? 100000000)
  // Merge with the defaults, so data saved by an older version gets the new fields.
  const exitOptions = ref<ExitOptions>({
    acquisition: { ...DEFAULT_ACQUISITION_OPTIONS, ...stored.exitOptions?.acquisition },
    ipo: { ...DEFAULT_IPO_OPTIONS, ...stored.exitOptions?.ipo },
  })

  // Calculate next IDs based on existing data
  let nextFounderId = Math.max(0, ...founders.value.map(f => f.id)) + 1
  let nextRoundId = Math.max(0, ...fundingRounds.value.map(r => r.id)) + 1
  let nextInstrumentId = Math.max(0, ...instruments.value.map(i => i.id)) + 1
  let nextInvestorId = Math.max(0, ...fundingRounds.value.flatMap(r => r.investors.map(i => i.id))) + 1

  // Watch and save to localStorage
  watch(
    [founders, initialOptionPool, fundingRounds, instruments, exitValuation, exitType, exitOptions],
    () => {
      saveToStorage({
        founders: founders.value,
        initialOptionPool: initialOptionPool.value,
        fundingRounds: fundingRounds.value,
        instruments: instruments.value,
        exitValuation: exitValuation.value,
        exitType: exitType.value,
        exitOptions: exitOptions.value,
      })
    },
    { deep: true }
  )

  function addFounder() {
    founders.value.push({
      id: nextFounderId++,
      name: `Founder ${founders.value.length + 1}`,
      percentage: 0,
    })
  }

  function removeFounder(id: number) {
    founders.value = founders.value.filter(f => f.id !== id)
  }

  function reorderFounders(fromIndex: number, toIndex: number) {
    const items = [...founders.value]
    const removed = items.splice(fromIndex, 1)[0]
    if (removed) {
      items.splice(toIndex, 0, removed)
      founders.value = items
    }
  }

  function addFundingRound(presetId?: string) {
    const preset = presetId
      ? getPresetById(presetId)
      : getNextRoundPreset(fundingRounds.value.length)

    if (!preset) return
    removedRound.value = null

    const id = nextRoundId++
    // A SAFE or note with no round yet converts in the next priced round. This is that round.
    for (const inst of instruments.value) {
      if (inst.kind !== 'loan' && inst.convertsInRoundId === null) inst.convertsInRoundId = id
    }

    fundingRounds.value.push({
      id,
      name: preset.name,
      preMoneyValuation: preset.preMoneyValuation,
      optionPoolPercent: preset.optionPoolPercent,
      investors: [{
        id: nextInvestorId++,
        name: `${preset.name} Lead`,
        amount: preset.typicalInvestment,
        liquidationPreference: preset.liquidationPreference,
        participating: preset.participating,
      }],
    })
  }

  // The last removed round, kept so that one click can bring it back.
  const removedRound = ref<{ round: FundingRound; index: number; instrumentIds: number[] } | null>(null)

  function removeFundingRound(id: number) {
    const index = fundingRounds.value.findIndex(r => r.id === id)
    if (index === -1) return
    const moved = instruments.value.filter(i => i.convertsInRoundId === id)
    removedRound.value = { round: fundingRounds.value[index]!, index, instrumentIds: moved.map(i => i.id) }
    fundingRounds.value.splice(index, 1)
    // Its SAFEs and notes now convert in the round that follows, or stay unconverted.
    const next = fundingRounds.value[index]?.id ?? null
    for (const inst of moved) inst.convertsInRoundId = next
  }

  function undoRemoveRound() {
    if (!removedRound.value) return
    const { round, index, instrumentIds } = removedRound.value
    fundingRounds.value.splice(index, 0, round)
    for (const inst of instruments.value) {
      if (instrumentIds.includes(inst.id)) inst.convertsInRoundId = round.id
    }
    removedRound.value = null
  }

  // Typical terms. SAFE: post-money cap, no discount (the YC standard form).
  // Note: pre-money cap, 20% discount, 6% interest, 18 months.
  function addInstrument(kind: InstrumentKind) {
    const count = instruments.value.filter(i => i.kind === kind).length + 1
    const isLoan = kind === 'loan'
    instruments.value.push({
      id: nextInstrumentId++,
      kind,
      name: `${kind === 'safe' ? 'SAFE investor' : kind === 'note' ? 'Note investor' : 'Lender'} ${count}`,
      amount: isLoan ? 1_000_000 : 500_000,
      valuationCap: isLoan ? 0 : 8_000_000,
      capBasis: kind === 'safe' ? 'post' : 'pre',
      discountPercent: kind === 'note' ? 20 : 0,
      interestPercent: kind === 'note' ? 6 : isLoan ? 10 : 0,
      months: kind === 'note' ? 18 : isLoan ? 24 : 0,
      exitMultiple: 1,
      // Early money converts in the first priced round. The user can change this.
      convertsInRoundId: isLoan ? null : fundingRounds.value[0]?.id ?? null,
    })
  }

  function removeInstrument(id: number) {
    instruments.value = instruments.value.filter(i => i.id !== id)
  }

  // Give each founder the same share of what the option pool leaves.
  function splitFoundersEqually() {
    const available = 100 - (Number(initialOptionPool.value) || 0)
    const share = Math.floor((available / founders.value.length) * 100) / 100
    founders.value.forEach((f, i) => {
      // The last founder takes the rounding remainder, so the total is exactly 100.
      f.percentage = i < founders.value.length - 1 ? share : Math.round((available - share * i) * 100) / 100
    })
  }

  function addInvestor(round: FundingRound) {
    round.investors.push({
      id: nextInvestorId++,
      name: `Investor ${round.investors.length + 1}`,
      amount: 500000,
      liquidationPreference: 1,
      participating: false,
    })
  }

  function removeInvestor(round: FundingRound, investorId: number) {
    round.investors = round.investors.filter(i => i.id !== investorId)
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY)
    founders.value = [
      { id: 1, name: 'Founder 1', percentage: 50 },
      { id: 2, name: 'Founder 2', percentage: 50 },
    ]
    initialOptionPool.value = 0
    fundingRounds.value = []
    instruments.value = []
    removedRound.value = null
    exitType.value = 'acquisition'
    exitValuation.value = 100000000
    exitOptions.value = {
      acquisition: { ...DEFAULT_ACQUISITION_OPTIONS },
      ipo: { ...DEFAULT_IPO_OPTIONS },
    }
    nextFounderId = 3
    nextRoundId = 1
    nextInstrumentId = 1
    nextInvestorId = 1
  }

  const totalFounderPercentage = computed(() => {
    return founders.value.reduce((sum, f) => sum + (Number(f.percentage) || 0), 0)
  })

  const totalInitialPercentage = computed(() => {
    return totalFounderPercentage.value + (Number(initialOptionPool.value) || 0)
  })

  const isFounderPercentageValid = computed(() => {
    return Math.abs(totalInitialPercentage.value - 100) < 0.01
  })

  const equityBreakdown = computed(() => calculateEquity(founders.value, initialOptionPool.value, fundingRounds.value, instruments.value))

  // Calculate effective exit proceeds after costs/deductions
  const effectiveExitProceeds = computed(() => {
    const grossExit = exitValuation.value
    const type = exitType.value
    const options = exitOptions.value

    if (type === 'acquisition') {
      const opts = options.acquisition
      const transactionCosts = grossExit * (opts.transactionCostsPercent / 100)
      const escrowAmount = grossExit * (opts.escrowPercent / 100)
      const carveout = opts.managementCarveout
      return {
        gross: grossExit,
        transactionCosts,
        escrowAmount,
        managementCarveout: carveout,
        underwriterFees: 0,
        net: Math.max(0, grossExit - transactionCosts - escrowAmount - carveout),
      }
    } else {
      const opts = options.ipo
      // The fee is a percent of the money raised in the IPO, not of the company value.
      const underwriterFees = (Number(opts.offeringAmount) || 0) * (opts.underwriterFeesPercent / 100)
      return {
        gross: grossExit,
        transactionCosts: 0,
        escrowAmount: 0,
        managementCarveout: 0,
        underwriterFees,
        net: Math.max(0, grossExit - underwriterFees),
      }
    }
  })

  const exitPayouts = computed<ExitPayout[]>(() => {
    const rank = { debt: 0, investor: 1, founder: 2, option_pool: 3 }
    // In order of payment: loans, investors (largest payout first), founders in their own order, the pool.
    return calculatePayouts(equityBreakdown.value, effectiveExitProceeds.value.net, exitType.value).sort(
      (a, b) => rank[a.type] - rank[b.type] || (a.type === 'investor' ? b.payout - a.payout : 0)
    )
  })

  return {
    founders,
    initialOptionPool,
    fundingRounds,
    instruments,
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
    removeFundingRound,
    undoRemoveRound,
    removedRound,
    splitFoundersEqually,
    addInstrument,
    removeInstrument,
    addInvestor,
    removeInvestor,
    reset,
  }
}
