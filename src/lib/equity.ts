// Pure cap table and exit math. No Vue, no DOM, so `npm test` can run it in plain Node.
import type {
  Founder, FundingRound, Instrument, Conversion, Stakeholder, EquityBreakdown, ExitPayout, ExitType,
} from '@/types'

// Inputs can be '' or NaN while the user types. Treat those as 0 and never go below 0.
const num = (v: unknown) => Math.max(0, Number(v) || 0)

/** Dollars that convert: the amount paid in, plus simple interest for a note or loan. */
export function owed(inst: Instrument): number {
  const interest = inst.kind === 'safe' ? 0 : (num(inst.interestPercent) / 100) * (num(inst.months) / 12)
  return num(inst.amount) * (1 + interest)
}

/**
 * Ownership that each SAFE or note gets when it converts.
 *
 * `holdersShare` is the part of the company, after the event, that belongs to everybody who was
 * there before the new money and the new pool: 1 - new investors - new pool. It is 1 at an exit.
 * `perDollar` is the share of the company that $1 buys at the full price of the event
 * ((1 - new investors) / pre-money in a round, 1 / value at an exit, 0 if there is no price).
 *
 * The holder gets the better of two prices (YC SAFE user guide; the same rule is usual for notes):
 *   cap price      -> (amount / cap) of the company capitalization
 *                     post-money cap: the capitalization includes all converting SAFEs and notes
 *                     pre-money cap:  it excludes them, so these holders dilute each other
 *   discount price -> amount x perDollar / (1 - discount)
 * The pool increase of the round is not in either capitalization, and new money dilutes everybody.
 */
export function convert(instruments: Instrument[], holdersShare: number, perDollar: number) {
  const priced = (i: Instrument) => (owed(i) * perDollar) / (1 - Math.min(num(i.discountPercent), 99) / 100)
  let fractions = instruments.map(() => 0)
  let existing = holdersShare // share left for the holders who were there before the conversion
  // A pre-money cap depends on `existing`, which depends on the result. A few rounds settle it.
  for (let pass = 0; pass < 60; pass++) {
    fractions = instruments.map(i => {
      const cap = num(i.valuationCap)
      const atCap = cap > 0 ? (owed(i) / cap) * (i.capBasis === 'pre' ? existing : holdersShare) : 0
      return Math.max(atCap, priced(i))
    })
    const total = fractions.reduce((a, b) => a + b, 0)
    if (total > holdersShare && total > 0) {
      // More than 100% promised (caps far too low). Share out what there is.
      fractions = fractions.map(f => (f / total) * holdersShare)
    }
    existing = Math.max(0, holdersShare - fractions.reduce((a, b) => a + b, 0))
  }
  const results: Conversion[] = instruments.map((i, n) => {
    const atPrice = priced(i)
    const basis = fractions[n]! > atPrice + 1e-12 ? 'cap' : num(i.discountPercent) > 0 ? 'discount' : 'price'
    return { percentage: fractions[n]! * 100, amount: owed(i), basis }
  })
  return { results, existing }
}

const instrumentKey = (i: Instrument) => `investor:${i.name.trim()}`

export function calculateEquity(
  founders: Founder[],
  initialOptionPool: number,
  fundingRounds: FundingRound[],
  instruments: Instrument[] = []
): EquityBreakdown {
  const rounds: EquityBreakdown['rounds'] = []
  const conversions: Record<number, Conversion> = {}
  let totalInvested = 0

  let stakeholders: Stakeholder[] = founders.map(f => ({
    key: `founder:${f.id}`,
    name: f.name,
    percentage: num(f.percentage),
    type: 'founder' as const,
  }))
  // One entry per investment (investor x round). The exit waterfall uses these,
  // because each investment keeps its own preference terms.
  let positions: Stakeholder[] = []

  if (num(initialOptionPool) > 0) {
    stakeholders.push({ key: 'pool', name: 'Option Pool', percentage: num(initialOptionPool), type: 'option_pool' })
  }

  // Adds a holding to the cap table. The same name in more than one place is one row.
  function addHolding(holding: Stakeholder) {
    positions.push({ ...holding })
    const existing = stakeholders.find(s => s.key === holding.key)
    if (!existing) {
      stakeholders.push({ ...holding })
      return
    }
    existing.percentage += holding.percentage
    existing.investedAmount = (existing.investedAmount || 0) + (holding.investedAmount || 0)
    if (holding.roundName && !existing.roundName?.split(', ').includes(holding.roundName)) {
      existing.roundName = existing.roundName ? `${existing.roundName}, ${holding.roundName}` : holding.roundName
    }
    // Display only. The waterfall uses each position's own terms.
    existing.liquidationPreference = Math.max(existing.liquidationPreference ?? 1, holding.liquidationPreference ?? 1)
    existing.participating = existing.participating || holding.participating
    existing.unconverted = existing.unconverted && holding.unconverted
  }

  const scale = (factor: number) => {
    stakeholders = stakeholders.map(s => ({ ...s, percentage: s.percentage * factor }))
    positions = positions.map(p => ({ ...p, percentage: p.percentage * factor }))
  }

  rounds.push({ name: 'Initial', stakeholders: [...stakeholders], postMoneyValuation: 0 })

  const convertible = instruments.filter(i => i.kind !== 'loan' && num(i.amount) > 0)
  const roundIds = new Set(fundingRounds.map(r => r.id))

  for (const round of fundingRounds) {
    const totalInvestment = round.investors.reduce((sum, i) => sum + num(i.amount), 0)
    totalInvested += totalInvestment
    const preMoney = num(round.preMoneyValuation)
    const postMoneyValuation = preMoney + totalInvestment

    // Investor share = money / post-money. The new pool is a share of post-money too.
    // Existing holders bear all of the dilution (the "option pool shuffle").
    const investorOwnership = postMoneyValuation > 0 ? totalInvestment / postMoneyValuation : 0
    const poolOwnership = Math.min(num(round.optionPoolPercent) / 100, 1 - investorOwnership)
    const holdersShare = 1 - investorOwnership - poolOwnership

    // SAFEs and notes that convert in this round. Their shares are part of the pre-money,
    // so they take their share from the existing holders, not from the new investors.
    const converting = convertible.filter(i => i.convertsInRoundId === round.id)
    const perDollar = preMoney > 0 ? (1 - investorOwnership) / preMoney : 0
    const { results, existing } = convert(converting, holdersShare, perDollar)

    scale(existing)

    if (poolOwnership > 0) {
      const pool = stakeholders.find(s => s.type === 'option_pool')
      if (pool) pool.percentage += poolOwnership * 100
      else stakeholders.push({ key: 'pool', name: 'Option Pool', percentage: poolOwnership * 100, type: 'option_pool' })
    }

    // The new stock of a SAFE or note has the same rights as the stock of the round,
    // and its preference is the amount that converted (YC "Safe Preferred Stock").
    const lead = round.investors[0]
    converting.forEach((inst, n) => {
      conversions[inst.id] = results[n]!
      totalInvested += num(inst.amount)
      addHolding({
        key: instrumentKey(inst),
        name: inst.name.trim(),
        percentage: results[n]!.percentage,
        type: 'investor',
        roundName: `${round.name} (${inst.kind === 'safe' ? 'SAFE' : 'note'})`,
        investedAmount: results[n]!.amount,
        liquidationPreference: lead?.liquidationPreference ?? 1,
        participating: lead?.participating ?? false,
        instrument: inst.kind,
      })
    })

    for (const investor of round.investors) {
      const amount = num(investor.amount)
      addHolding({
        key: `investor:${investor.name.trim()}`,
        name: investor.name.trim(),
        percentage: postMoneyValuation > 0 ? (amount / postMoneyValuation) * 100 : 0,
        type: 'investor',
        roundName: round.name,
        investedAmount: amount,
        liquidationPreference: investor.liquidationPreference,
        participating: investor.participating,
      })
    }

    rounds.push({ name: round.name, stakeholders: [...stakeholders], postMoneyValuation })
  }

  // SAFEs and notes with no priced round yet. They are not shares, but a fully diluted
  // cap table counts them as converted at their cap. Keep the table before this step too.
  const issued = { stakeholders: [...stakeholders], positions: [...positions] }
  const outstanding = convertible.filter(i => i.convertsInRoundId === null || !roundIds.has(i.convertsInRoundId))
  const loans = instruments.filter(i => i.kind === 'loan' && num(i.amount) > 0)

  if (outstanding.length) {
    for (const inst of outstanding) totalInvested += num(inst.amount)
    const converted = convertOutstanding(issued, outstanding, 0)
    stakeholders = converted.stakeholders
    positions = converted.positions
    Object.assign(conversions, converted.conversions)
    rounds.push({ name: 'If converted', stakeholders: [...stakeholders], postMoneyValuation: 0 })
  }

  return { stakeholders, positions, rounds, totalInvested, issued, outstanding, loans, conversions }
}

/**
 * Turns unconverted SAFEs and notes into holdings. `value` is the exit value, which sets the
 * price for a discount. With value 0 (no exit yet) only the caps count.
 * In a sale the holder then has a choice, like non-participating preferred stock:
 * the money back, or the share as common stock (YC SAFE user guide, "Liquidity Event").
 */
function convertOutstanding(
  issued: { stakeholders: Stakeholder[]; positions: Stakeholder[] },
  outstanding: Instrument[],
  value: number,
  exitType?: ExitType
) {
  const { results, existing } = convert(outstanding, 1, value > 0 ? 1 / value : 0)
  const stakeholders = issued.stakeholders.map(s => ({ ...s, percentage: s.percentage * existing }))
  const positions = issued.positions.map(p => ({ ...p, percentage: p.percentage * existing }))
  const conversions: Record<number, Conversion> = {}

  outstanding.forEach((inst, n) => {
    conversions[inst.id] = results[n]!
    // Cash a note gets in a sale: principal + interest, or a multiple of principal if that is more.
    const cash = inst.kind === 'note' ? Math.max(owed(inst), num(inst.amount) * num(inst.exitMultiple)) : owed(inst)
    const holding: Stakeholder = {
      key: instrumentKey(inst),
      name: inst.name.trim(),
      percentage: results[n]!.percentage,
      type: 'investor',
      roundName: inst.kind === 'safe' ? 'SAFE, not converted' : 'Note, not converted',
      investedAmount: exitType === 'acquisition' ? cash : owed(inst),
      liquidationPreference: 1,
      participating: false,
      instrument: inst.kind,
      unconverted: true,
      senior: inst.kind === 'note', // a note is debt: it ranks ahead of SAFEs and preferred stock
    }
    positions.push({ ...holding })
    const same = stakeholders.find(s => s.key === holding.key)
    if (same) {
      same.percentage += holding.percentage
      same.investedAmount = (same.investedAmount || 0) + (holding.investedAmount || 0)
      same.roundName = same.roundName ? `${same.roundName}, ${holding.roundName}` : holding.roundName
    } else {
      stakeholders.push({ ...holding })
    }
  })
  return { stakeholders, positions, conversions }
}

/**
 * Split net exit proceeds between the holders.
 *
 * Acquisition, in order:
 *   1. Loans (principal + interest).
 *   2. Preferences. Unconverted notes rank first, then preferred stock and SAFEs together.
 *   3. The rest is shared by ownership.
 *   - Participating preferred takes its preference and also shares in the rest.
 *   - Non-participating preferred, SAFEs and notes take the greater of the preference
 *     or the share as common.
 * IPO: all preferred, SAFEs and notes convert to common, so preferences do not apply.
 *   The value is the value of the equity, so loans are not taken from it.
 *
 * Not modelled: seniority between series of preferred, participation caps, dividends, warrants.
 */
export function calculatePayouts(breakdown: EquityBreakdown | Pick<EquityBreakdown, 'stakeholders' | 'positions'>, netProceeds: number, exitType: ExitType): ExitPayout[] {
  const full = breakdown as EquityBreakdown
  let exit = num(netProceeds)
  const debtRows: ExitPayout[] = []

  // 1. Loans.
  const loans = exitType === 'acquisition' ? full.loans ?? [] : []
  const totalLoans = loans.reduce((sum, l) => sum + owed(l), 0)
  const loanRatio = totalLoans > 0 ? Math.min(1, exit / totalLoans) : 0
  for (const loan of loans) {
    debtRows.push({
      key: `debt:${loan.id}`, name: loan.name.trim(), percentage: 0, type: 'debt', instrument: 'loan',
      investedAmount: num(loan.amount), payout: owed(loan) * loanRatio, preferenceAmount: owed(loan) * loanRatio,
    })
  }
  exit -= totalLoans * loanRatio

  // Unconverted SAFEs and notes become holdings at the price of this exit.
  const base = full.outstanding?.length && full.issued
    ? convertOutstanding(full.issued, full.outstanding, exit, exitType)
    : { stakeholders: breakdown.stakeholders, positions: breakdown.positions }

  const common = base.stakeholders.filter(s => s.type !== 'investor')
  const positions = base.positions.map(p => ({
    ...p,
    pref: exitType === 'ipo' ? 0 : (p.investedAmount || 0) * (p.liquidationPreference ?? 1),
    // In an IPO everybody is common. Start with nobody converted in an acquisition.
    shares: exitType === 'ipo' || !!p.participating,
    converted: exitType === 'ipo',
  }))

  const totalPrefs = positions.reduce((sum, p) => sum + p.pref, 0)
  const result = new Map<string, ExitPayout>(
    base.stakeholders.map(s => [s.key, { ...s, payout: 0, preferenceAmount: 0, participationAmount: 0 }])
  )
  const done = () => [...debtRows, ...result.values()]

  if (exit <= totalPrefs) {
    // Not enough to pay all preferences. Notes are paid first, then preferred and SAFEs
    // split what is left. Common gets nothing.
    let left = exit
    for (const tier of [positions.filter(p => p.senior), positions.filter(p => !p.senior)]) {
      const owedTier = tier.reduce((sum, p) => sum + p.pref, 0)
      const ratio = owedTier > 0 ? Math.min(1, left / owedTier) : 0
      for (const p of tier) {
        const row = result.get(p.key)!
        row.payout += p.pref * ratio
        row.preferenceAmount! += p.pref * ratio
      }
      left -= owedTier * ratio
    }
    return done()
  }

  // `rest` is shared by everybody in `sharingPercent` (common + participating + converted).
  let rest = exit - totalPrefs
  let sharingPercent =
    common.reduce((sum, s) => sum + s.percentage, 0) +
    positions.filter(p => p.shares).reduce((sum, p) => sum + p.percentage, 0)

  // Non-participating holders convert when their share as common is worth more than the
  // preference. Each conversion lowers the value per share for the others, so convert in
  // order of the lowest break-even price and stop at the first holder who prefers the preference.
  const candidates = positions
    .filter(p => !p.shares && p.percentage > 0)
    .sort((a, b) => a.pref / a.percentage - b.pref / b.percentage)
  for (const p of candidates) {
    const asCommon = (p.percentage / (sharingPercent + p.percentage)) * (rest + p.pref)
    if (asCommon <= p.pref) break
    p.shares = true
    p.converted = true
    rest += p.pref
    sharingPercent += p.percentage
  }

  const share = (percentage: number) => (sharingPercent > 0 ? (percentage / sharingPercent) * rest : 0)

  for (const s of common) {
    result.get(s.key)!.payout = share(s.percentage)
  }
  for (const p of positions) {
    const row = result.get(p.key)!
    if (p.converted) {
      row.payout += share(p.percentage)
    } else {
      row.payout += p.pref
      row.preferenceAmount! += p.pref
      if (p.shares) {
        row.payout += share(p.percentage)
        row.participationAmount! += share(p.percentage)
      }
    }
  }
  return done()
}
