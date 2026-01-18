export interface RoundPreset {
  id: string
  name: string
  displayName: string
  description: string
  preMoneyValuation: number
  typicalInvestment: number
  optionPoolPercent: number
  liquidationPreference: number
  participating: boolean
}

// 2025 Silicon Valley tech startup funding round defaults
// Based on typical ranges for successful tech startups
export const roundPresets: RoundPreset[] = [
  {
    id: 'pre-seed',
    name: 'Pre-Seed',
    displayName: 'Pre-Seed',
    description: 'First external capital, often from angels or accelerators',
    preMoneyValuation: 3_000_000,
    typicalInvestment: 500_000,
    optionPoolPercent: 10,
    liquidationPreference: 1,
    participating: false,
  },
  {
    id: 'seed',
    name: 'Seed',
    displayName: 'Seed Round',
    description: 'Prove product-market fit, build initial team',
    preMoneyValuation: 10_000_000,
    typicalInvestment: 2_500_000,
    optionPoolPercent: 10,
    liquidationPreference: 1,
    participating: false,
  },
  {
    id: 'series-a',
    name: 'Series A',
    displayName: 'Series A',
    description: 'Scale product and go-to-market, institutional VCs lead',
    preMoneyValuation: 40_000_000,
    typicalInvestment: 12_000_000,
    optionPoolPercent: 10,
    liquidationPreference: 1,
    participating: false,
  },
  {
    id: 'series-b',
    name: 'Series B',
    displayName: 'Series B',
    description: 'Scale operations, expand market presence',
    preMoneyValuation: 120_000_000,
    typicalInvestment: 35_000_000,
    optionPoolPercent: 5,
    liquidationPreference: 1,
    participating: false,
  },
  {
    id: 'series-c',
    name: 'Series C',
    displayName: 'Series C',
    description: 'Late-stage growth, prepare for exit',
    preMoneyValuation: 350_000_000,
    typicalInvestment: 75_000_000,
    optionPoolPercent: 3,
    liquidationPreference: 1,
    participating: false,
  },
  {
    id: 'series-d',
    name: 'Series D',
    displayName: 'Series D+',
    description: 'Pre-IPO or continued expansion',
    preMoneyValuation: 800_000_000,
    typicalInvestment: 150_000_000,
    optionPoolPercent: 2,
    liquidationPreference: 1,
    participating: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    displayName: 'Custom Round',
    description: 'Set your own terms',
    preMoneyValuation: 10_000_000,
    typicalInvestment: 2_000_000,
    optionPoolPercent: 10,
    liquidationPreference: 1,
    participating: false,
  },
]

export function getPresetById(id: string): RoundPreset | undefined {
  return roundPresets.find(p => p.id === id)
}

export function getNextRoundPreset(currentRounds: number): RoundPreset {
  // Suggest the next logical round based on how many rounds exist
  const roundOrder: string[] = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'series-d']
  const nextIndex = Math.min(currentRounds, roundOrder.length - 1)
  const presetId = roundOrder[nextIndex]
  if (presetId) {
    const preset = getPresetById(presetId)
    if (preset) return preset
  }
  // Fallback to pre-seed preset (always exists)
  return roundPresets.find(p => p.id === 'pre-seed')!
}
