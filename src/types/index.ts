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

// A SAFE, a convertible note, or a loan. These are not shares when they are issued.
export type InstrumentKind = 'safe' | 'note' | 'loan'

export interface Instrument {
  id: number
  kind: InstrumentKind
  name: string // investor or lender
  amount: number // dollars paid in (principal)
  valuationCap: number // 0 = no cap
  capBasis: 'post' | 'pre' // post-money cap (YC standard SAFE) or pre-money cap (usual for notes)
  discountPercent: number // discount to the price of the round, 0 = none
  interestPercent: number // notes and loans: simple interest per year
  months: number // notes and loans: time until conversion, or until exit if not converted
  exitMultiple: number // notes: cash paid in a sale as a multiple of principal (1 = principal + interest)
  convertsInRoundId: number | null // SAFEs and notes: the priced round that converts it. null = not converted
}

// The result of one conversion, for display.
export interface Conversion {
  percentage: number // ownership right after the conversion
  amount: number // dollars converted (principal + interest)
  basis: 'cap' | 'discount' | 'price' // which price gave the holder the most shares
}

export interface Stakeholder {
  key: string // stable id: founder:<id>, pool, investor:<name>
  name: string
  percentage: number
  type: 'founder' | 'investor' | 'option_pool'
  roundName?: string
  investedAmount?: number
  liquidationPreference?: number
  participating?: boolean
  instrument?: InstrumentKind // set when the holding comes from a SAFE or note
  unconverted?: boolean // SAFE or note with no priced round yet
  senior?: boolean // unconverted note: it is debt, so it is paid before preferred stock
}

export interface RoundSnapshot {
  name: string
  stakeholders: Stakeholder[]
  postMoneyValuation: number
}

export interface EquityBreakdown {
  stakeholders: Stakeholder[]
  positions: Stakeholder[] // one per investment (investor x round), used by the exit waterfall
  rounds: RoundSnapshot[]
  totalInvested: number
  // Everything above treats unconverted SAFEs and notes as converted at their cap (fully diluted).
  // `issued` is the cap table before that step. The exit math starts from it.
  issued?: { stakeholders: Stakeholder[]; positions: Stakeholder[] }
  outstanding?: Instrument[] // SAFEs and notes with no priced round yet
  loans?: Instrument[]
  conversions?: Record<number, Conversion>
}

export interface ExitPayout extends Omit<Stakeholder, 'type'> {
  type: Stakeholder['type'] | 'debt'
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
  offeringAmount: number // dollars raised in the IPO; underwriter fees are a percent of this
}

export interface ExitOptions {
  acquisition: AcquisitionOptions
  ipo: IPOOptions
}
