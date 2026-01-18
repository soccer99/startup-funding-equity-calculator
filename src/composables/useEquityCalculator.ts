import { ref, computed, watch } from 'vue'
import type { Founder, FundingRound, Stakeholder, EquityBreakdown, ExitPayout, ExitType, ExitOptions, AcquisitionOptions, IPOOptions } from '@/types'
import { getNextRoundPreset, getPresetById, type RoundPreset } from '@/data/roundPresets'

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
  secondaryOffering: 0,
}

interface StoredData {
  founders: Founder[]
  initialOptionPool: number
  fundingRounds: FundingRound[]
  exitValuation: number
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
  const exitType = ref<ExitType>('acquisition')
  const exitValuation = ref<number>(stored.exitValuation ?? 100000000)
  const exitOptions = ref<ExitOptions>(stored.exitOptions ?? {
    acquisition: { ...DEFAULT_ACQUISITION_OPTIONS },
    ipo: { ...DEFAULT_IPO_OPTIONS },
  })

  // Calculate next IDs based on existing data
  let nextFounderId = Math.max(0, ...founders.value.map(f => f.id)) + 1
  let nextRoundId = Math.max(0, ...fundingRounds.value.map(r => r.id)) + 1
  let nextInvestorId = Math.max(0, ...fundingRounds.value.flatMap(r => r.investors.map(i => i.id))) + 1

  // Watch and save to localStorage
  watch(
    [founders, initialOptionPool, fundingRounds, exitValuation, exitOptions],
    () => {
      saveToStorage({
        founders: founders.value,
        initialOptionPool: initialOptionPool.value,
        fundingRounds: fundingRounds.value,
        exitValuation: exitValuation.value,
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

    fundingRounds.value.push({
      id: nextRoundId++,
      name: preset.name,
      preMoneyValuation: preset.preMoneyValuation,
      optionPoolPercent: preset.optionPoolPercent,
      investors: [{
        id: nextInvestorId++,
        name: 'Lead Investor',
        amount: preset.typicalInvestment,
        liquidationPreference: preset.liquidationPreference,
        participating: preset.participating,
      }],
    })
  }

  function applyPresetToRound(roundId: number, presetId: string) {
    const round = fundingRounds.value.find(r => r.id === roundId)
    const preset = getPresetById(presetId)
    if (!round || !preset) return

    round.name = preset.name
    round.preMoneyValuation = preset.preMoneyValuation
    round.optionPoolPercent = preset.optionPoolPercent

    // Update the first investor with preset defaults
    const firstInvestor = round.investors[0]
    if (firstInvestor) {
      firstInvestor.amount = preset.typicalInvestment
      firstInvestor.liquidationPreference = preset.liquidationPreference
      firstInvestor.participating = preset.participating
    }
  }

  function removeFundingRound(id: number) {
    fundingRounds.value = fundingRounds.value.filter(r => r.id !== id)
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

  const totalFounderPercentage = computed(() => {
    return founders.value.reduce((sum, f) => sum + f.percentage, 0)
  })

  const totalInitialPercentage = computed(() => {
    return totalFounderPercentage.value + initialOptionPool.value
  })

  const isFounderPercentageValid = computed(() => {
    return Math.abs(totalInitialPercentage.value - 100) < 0.01
  })

  function calculateEquityAfterRounds(): EquityBreakdown {
    const rounds: EquityBreakdown['rounds'] = []
    let totalInvested = 0

    let currentStakeholders: Stakeholder[] = founders.value.map(f => ({
      name: f.name,
      percentage: f.percentage,
      type: 'founder' as const,
    }))

    // Add initial option pool if set
    if (initialOptionPool.value > 0) {
      currentStakeholders.push({
        name: 'Option Pool',
        percentage: initialOptionPool.value,
        type: 'option_pool',
      })
    }

    rounds.push({
      name: 'Initial',
      stakeholders: [...currentStakeholders],
      postMoneyValuation: 0,
    })

    for (const round of fundingRounds.value) {
      const totalInvestment = round.investors.reduce((sum, i) => sum + i.amount, 0)
      totalInvested += totalInvestment
      const postMoneyValuation = round.preMoneyValuation + totalInvestment

      // Calculate option pool dilution first (from post-money)
      const optionPoolPercent = round.optionPoolPercent / 100

      // Total new ownership going to investors and option pool
      const investorOwnership = totalInvestment / postMoneyValuation
      const totalNewOwnership = investorOwnership + optionPoolPercent

      // Dilution factor for existing shareholders
      const dilutionFactor = 1 - totalNewOwnership

      // Dilute existing stakeholders
      currentStakeholders = currentStakeholders.map(s => ({
        ...s,
        percentage: s.percentage * dilutionFactor,
      }))

      // Add option pool if specified
      if (round.optionPoolPercent > 0) {
        // Check if option pool already exists
        const existingPool = currentStakeholders.find(s => s.type === 'option_pool')
        if (existingPool) {
          // Add to existing pool
          existingPool.percentage += optionPoolPercent * 100
        } else {
          currentStakeholders.push({
            name: 'Option Pool',
            percentage: optionPoolPercent * 100,
            type: 'option_pool',
          })
        }
      }

      // Add new investors (consolidate by name if same investor across rounds)
      for (const investor of round.investors) {
        const investorPercentage = (investor.amount / postMoneyValuation) * 100
        const existingInvestor = currentStakeholders.find(
          s => s.type === 'investor' && s.name === investor.name
        )

        if (existingInvestor) {
          // Same investor investing in another round - consolidate
          existingInvestor.percentage += investorPercentage
          existingInvestor.investedAmount = (existingInvestor.investedAmount || 0) + investor.amount
          existingInvestor.roundName = existingInvestor.roundName
            ? `${existingInvestor.roundName}, ${round.name}`
            : round.name
          // Use worst-case for preferences (most favorable to investor)
          existingInvestor.liquidationPreference = Math.max(
            existingInvestor.liquidationPreference || 1,
            investor.liquidationPreference
          )
          // If any investment is participating, consider them participating
          existingInvestor.participating = existingInvestor.participating || investor.participating
        } else {
          currentStakeholders.push({
            name: investor.name,
            percentage: investorPercentage,
            type: 'investor',
            roundName: round.name,
            investedAmount: investor.amount,
            liquidationPreference: investor.liquidationPreference,
            participating: investor.participating,
          })
        }
      }

      rounds.push({
        name: round.name,
        stakeholders: [...currentStakeholders],
        postMoneyValuation,
      })
    }

    return { stakeholders: currentStakeholders, rounds, totalInvested }
  }

  const equityBreakdown = computed(() => calculateEquityAfterRounds())

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
        net: grossExit - transactionCosts - escrowAmount - carveout,
      }
    } else {
      const opts = options.ipo
      const underwriterFees = grossExit * (opts.underwriterFeesPercent / 100)
      return {
        gross: grossExit,
        transactionCosts: 0,
        escrowAmount: 0,
        managementCarveout: 0,
        underwriterFees,
        net: grossExit - underwriterFees,
      }
    }
  })

  const exitPayouts = computed<ExitPayout[]>(() => {
    const { stakeholders, totalInvested } = equityBreakdown.value
    const exitVal = effectiveExitProceeds.value.net

    // Separate stakeholders by type
    const investors = stakeholders.filter(s => s.type === 'investor')
    const commonHolders = stakeholders.filter(s => s.type === 'founder' || s.type === 'option_pool')

    // Calculate total liquidation preferences
    let totalPreferences = 0
    const investorPreferences: { stakeholder: Stakeholder; preference: number }[] = []

    for (const investor of investors) {
      const preference = (investor.investedAmount || 0) * (investor.liquidationPreference || 1)
      totalPreferences += preference
      investorPreferences.push({ stakeholder: investor, preference })
    }

    // Calculate payouts based on exit waterfall
    const payouts: ExitPayout[] = []
    let remainingProceeds = exitVal

    // Step 1: Pay liquidation preferences first
    if (remainingProceeds <= totalPreferences) {
      // Not enough to cover all preferences - pro-rata distribution
      const prefRatio = remainingProceeds / totalPreferences

      for (const { stakeholder, preference } of investorPreferences) {
        payouts.push({
          ...stakeholder,
          payout: preference * prefRatio,
          preferenceAmount: preference * prefRatio,
        })
      }

      // Common holders get nothing
      for (const holder of commonHolders) {
        payouts.push({
          ...holder,
          payout: 0,
        })
      }
    } else {
      // Enough to cover preferences - calculate exit waterfall

      const participatingInvestors = investors.filter(s => s.participating)
      const nonParticipatingInvestors = investors.filter(s => !s.participating)

      // Step 1: Determine which non-participating investors will convert to common
      // They convert if their pro-rata share of remaining (after preferences) > their preference
      const nonParticipatingWhoConvert: Stakeholder[] = []
      const nonParticipatingWhoTakePreference: Stakeholder[] = []

      // Calculate preferences from participating investors (they always take preference)
      const participatingPreferences = participatingInvestors.reduce(
        (sum, s) => sum + (s.investedAmount || 0) * (s.liquidationPreference || 1),
        0
      )

      for (const investor of nonParticipatingInvestors) {
        const preference = (investor.investedAmount || 0) * (investor.liquidationPreference || 1)
        // Estimate: if they convert, they share remaining with common + participating + other converters
        // Simplified: compare preference vs pro-rata of (exit - participating preferences)
        const remainingIfConvert = exitVal - participatingPreferences
        const proRataIfConvert = (investor.percentage / 100) * remainingIfConvert

        if (proRataIfConvert > preference) {
          nonParticipatingWhoConvert.push(investor)
        } else {
          nonParticipatingWhoTakePreference.push(investor)
        }
      }

      // Step 2: Calculate total preferences to be paid out
      const nonParticipatingPreferencesPaid = nonParticipatingWhoTakePreference.reduce(
        (sum, s) => sum + (s.investedAmount || 0) * (s.liquidationPreference || 1),
        0
      )
      const totalPreferencesPaid = participatingPreferences + nonParticipatingPreferencesPaid

      // Step 3: Calculate remaining proceeds after preferences
      remainingProceeds = exitVal - totalPreferencesPaid

      // Step 4: Calculate who participates in remaining proceeds
      const commonPercent = commonHolders.reduce((sum, s) => sum + s.percentage, 0)
      const participatingPercent = participatingInvestors.reduce((sum, s) => sum + s.percentage, 0)
      const convertedPercent = nonParticipatingWhoConvert.reduce((sum, s) => sum + s.percentage, 0)
      const totalParticipatingPercent = commonPercent + participatingPercent + convertedPercent

      // Step 5: Pay out non-participating who take preference (they get preference only)
      for (const investor of nonParticipatingWhoTakePreference) {
        const preference = (investor.investedAmount || 0) * (investor.liquidationPreference || 1)
        payouts.push({
          ...investor,
          payout: preference,
          preferenceAmount: preference,
        })
      }

      // Step 6: Pay out non-participating who convert (they share remaining pro-rata)
      for (const investor of nonParticipatingWhoConvert) {
        const share = (investor.percentage / totalParticipatingPercent) * remainingProceeds
        payouts.push({
          ...investor,
          payout: share,
          preferenceAmount: 0,
        })
      }

      // Step 7: Participating preferred get preference + pro-rata of remainder
      for (const investor of participatingInvestors) {
        const preference = (investor.investedAmount || 0) * (investor.liquidationPreference || 1)
        const participationShare = (investor.percentage / totalParticipatingPercent) * remainingProceeds

        payouts.push({
          ...investor,
          payout: preference + participationShare,
          preferenceAmount: preference,
          participationAmount: participationShare,
        })
      }

      // Step 8: Common holders get their share of remaining proceeds
      for (const holder of commonHolders) {
        const share = (holder.percentage / totalParticipatingPercent) * remainingProceeds
        payouts.push({
          ...holder,
          payout: share,
        })
      }
    }

    // Consolidate payouts by name (same investor across multiple rounds)
    const consolidatedPayouts = new Map<string, ExitPayout>()

    for (const payout of payouts) {
      const key = payout.name
      const existing = consolidatedPayouts.get(key)

      if (existing) {
        // Merge with existing entry
        existing.percentage += payout.percentage
        existing.payout += payout.payout
        existing.investedAmount = (existing.investedAmount || 0) + (payout.investedAmount || 0)
        existing.preferenceAmount = (existing.preferenceAmount || 0) + (payout.preferenceAmount || 0)
        existing.participationAmount = (existing.participationAmount || 0) + (payout.participationAmount || 0)
        // Keep roundName as comma-separated list
        if (payout.roundName && existing.roundName) {
          existing.roundName = `${existing.roundName}, ${payout.roundName}`
        } else if (payout.roundName) {
          existing.roundName = payout.roundName
        }
      } else {
        consolidatedPayouts.set(key, { ...payout })
      }
    }

    // Sort: investors first (by payout desc), then founders (in original order), then option pool
    const founderOrder = new Map(founders.value.map((f, i) => [f.name, i]))

    return Array.from(consolidatedPayouts.values()).sort((a, b) => {
      // Investors (preferred) come first
      if (a.type === 'investor' && b.type !== 'investor') return -1
      if (a.type !== 'investor' && b.type === 'investor') return 1

      // Among investors, sort by payout descending
      if (a.type === 'investor' && b.type === 'investor') {
        return b.payout - a.payout
      }

      // Option pool comes last
      if (a.type === 'option_pool' && b.type !== 'option_pool') return 1
      if (a.type !== 'option_pool' && b.type === 'option_pool') return -1

      // Among founders, preserve original order
      if (a.type === 'founder' && b.type === 'founder') {
        const orderA = founderOrder.get(a.name) ?? 999
        const orderB = founderOrder.get(b.name) ?? 999
        return orderA - orderB
      }

      return 0
    })
  })

  return {
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
  }
}
