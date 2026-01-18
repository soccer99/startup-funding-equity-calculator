export interface Founder {
  id: number
  name: string
  percentage: number
}

export interface Investor {
  id: number
  name: string
  amount: number
  liquidationPreference: number // multiplier, e.g., 1 = 1x, 2 = 2x
  participating: boolean // participating preferred
}

export interface FundingRound {
  id: number
  name: string
  preMoneyValuation: number
  optionPoolPercent: number // percentage of post-money for option pool
  investors: Investor[]
}

export interface Stakeholder {
  name: string
  percentage: number
  type: 'founder' | 'investor' | 'option_pool'
  roundName?: string
  investedAmount?: number
  liquidationPreference?: number
  participating?: boolean
}

export interface RoundSnapshot {
  name: string
  stakeholders: Stakeholder[]
  postMoneyValuation: number
}

export interface EquityBreakdown {
  stakeholders: Stakeholder[]
  rounds: RoundSnapshot[]
  totalInvested: number
}

export interface ExitPayout extends Stakeholder {
  payout: number
  preferenceAmount?: number
  participationAmount?: number
}

export type ExitType = 'ipo' | 'acquisition'

export type DealStructure = 'cash' | 'stock' | 'mixed'

export interface AcquisitionOptions {
  dealStructure: DealStructure
  stockPercentage: number // 0-100, only relevant if dealStructure is 'mixed'
  escrowPercent: number // typically 10-20% held back for indemnification
  managementCarveout: number // dollar amount for management bonus pool
  transactionCostsPercent: number // 1-3% for legal, banking fees
}

export interface IPOOptions {
  underwriterFeesPercent: number // typically 5-7%
  lockupDays: number // typically 180 days
  secondaryOffering: number // dollar amount of existing shares being sold
}

export interface ExitOptions {
  acquisition: AcquisitionOptions
  ipo: IPOOptions
}
