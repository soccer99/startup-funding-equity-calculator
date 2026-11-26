// Run with: npm test   (plain Node, no test framework)
import assert from 'node:assert/strict'
import { calculateEquity, calculatePayouts, owed } from '../equity.ts'

const M = 1_000_000
const near = (actual: number, expected: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) < 0.01, `${msg}: got ${actual}, expected ${expected}`)

const founders = (...pcts: number[]) => pcts.map((percentage, i) => ({ id: i + 1, name: `F${i + 1}`, percentage }))
const inv = (name: string, amount: number, liquidationPreference = 1, participating = false) =>
  ({ id: 0, name, amount, liquidationPreference, participating })
const round = (name: string, preMoneyValuation: number, optionPoolPercent: number, ...investors: ReturnType<typeof inv>[]) =>
  ({ id: 0, name, preMoneyValuation, optionPoolPercent, investors })
const pct = (b: ReturnType<typeof calculateEquity>, key: string) => b.stakeholders.find(s => s.key === key)!.percentage
const pay = (rows: ReturnType<typeof calculatePayouts>, key: string) => rows.find(r => r.key === key)!.payout
const total = (rows: ReturnType<typeof calculatePayouts>) => rows.reduce((sum, r) => sum + r.payout, 0)

// --- Cap table -------------------------------------------------------------

// Option pool shuffle: $5M at $20M pre with a 20% pool -> founders 60, investor 20, pool 20.
// Source: https://www.vcterminal.com/guide/option-pool-worked-example
{
  const b = calculateEquity(founders(50, 50), 0, [round('A', 20 * M, 20, inv('VC', 5 * M))])
  near(pct(b, 'founder:1') + pct(b, 'founder:2'), 60, 'shuffle founders')
  near(pct(b, 'investor:VC'), 20, 'shuffle investor')
  near(pct(b, 'pool'), 20, 'shuffle pool')
}

// Existing 10% pool, $2M at $8M pre, no new pool -> 48 / 24 / 8 / 20.
// Source: https://www.lunera.vc/insights/capitalization-table-example
{
  const b = calculateEquity(founders(60, 30), 10, [round('Seed', 8 * M, 0, inv('VC', 2 * M))])
  near(pct(b, 'founder:1'), 48, 'founder A')
  near(pct(b, 'founder:2'), 24, 'founder B')
  near(pct(b, 'pool'), 8, 'old pool diluted')
  near(pct(b, 'investor:VC'), 20, 'investor')
}

// The round's pool percent is NEW pool, added on top of the diluted old pool.
{
  const b = calculateEquity(founders(60, 30), 10, [round('Seed', 8 * M, 10, inv('VC', 2 * M))])
  near(pct(b, 'pool'), 17, 'pool = 10 * 0.7 + 10')
  near(pct(b, 'founder:1') + pct(b, 'founder:2'), 63, 'founders bear the new pool')
  near(pct(b, 'investor:VC'), 20, 'investor not diluted by the pool')
}

// Two rounds: every column sums to 100, and the same investor name is one row.
{
  const b = calculateEquity(founders(50, 50), 0, [
    round('Seed', 10 * M, 10, inv('Acme', 2.5 * M)),
    round('Series A', 40 * M, 10, inv('Acme', 2 * M), inv('Big VC', 10 * M)),
  ])
  for (const r of b.rounds) near(r.stakeholders.reduce((s, x) => s + x.percentage, 0), 100, `sum ${r.name}`)
  assert.equal(b.stakeholders.filter(s => s.type === 'investor').length, 2)
  assert.equal(b.positions.length, 3)
  near(b.totalInvested, 14.5 * M, 'total invested')
  // Seed: 20% then diluted by (1 - 12/52 - 0.10), plus 2/52 in the A round.
  near(pct(b, 'investor:Acme'), 20 * (1 - 12 / 52 - 0.1) + (2 / 52) * 100, 'Acme across rounds')
}

// --- Exit waterfall --------------------------------------------------------

// $5M for 20%, 1x non-participating. $20M exit -> takes $5M. $50M exit -> converts, $10M.
// Source: https://www.crv.com/content/liquidation-preference
{
  const b = calculateEquity(founders(100), 0, [round('A', 20 * M, 0, inv('VC', 5 * M))])
  let rows = calculatePayouts(b, 20 * M, 'acquisition')
  near(pay(rows, 'investor:VC'), 5 * M, 'CRV 20M investor')
  near(pay(rows, 'founder:1'), 15 * M, 'CRV 20M common')
  rows = calculatePayouts(b, 50 * M, 'acquisition')
  near(pay(rows, 'investor:VC'), 10 * M, 'CRV 50M investor')
  near(pay(rows, 'founder:1'), 40 * M, 'CRV 50M common')
}

// $5M for 50%: the conversion point is a $10M sale.
// Source: https://www.morse.law/news/liquidation-preference/
{
  const b = calculateEquity(founders(100), 0, [round('A', 5 * M, 0, inv('VC', 5 * M))])
  near(pay(calculatePayouts(b, 8 * M, 'acquisition'), 'investor:VC'), 5 * M, 'Morse below threshold')
  near(pay(calculatePayouts(b, 10 * M, 'acquisition'), 'investor:VC'), 5 * M, 'Morse at threshold')
  near(pay(calculatePayouts(b, 12 * M, 'acquisition'), 'investor:VC'), 6 * M, 'Morse above threshold')
}

// Participating: $2M for 20%, 1x. $10M exit -> $2M + 20% of $8M = $3.6M.
{
  const b = calculateEquity(founders(100), 0, [round('A', 8 * M, 0, inv('VC', 2 * M, 1, true))])
  const rows = calculatePayouts(b, 10 * M, 'acquisition')
  near(pay(rows, 'investor:VC'), 3.6 * M, 'participating investor')
  near(pay(rows, 'founder:1'), 6.4 * M, 'participating common')
}

// Exit below total preferences: preferred splits it by preference size, common gets 0.
{
  const b = calculateEquity(founders(100), 0, [round('A', 10 * M, 0, inv('X', 3 * M), inv('Y', 1 * M, 2))])
  const rows = calculatePayouts(b, 2.5 * M, 'acquisition') // prefs: X 3M, Y 2M
  near(pay(rows, 'investor:X'), 1.5 * M, 'short X')
  near(pay(rows, 'investor:Y'), 1 * M, 'short Y')
  near(pay(rows, 'founder:1'), 0, 'short common')
}

// A holder must not convert when the other holder's preference eats the proceeds.
// A: $5M 1x for 20%. B: $20M 2x for 20%. Founders 60%. $55M exit.
// Both keep the preference: A $5M, B $40M, founders $10M. (Converting gives A only $3.75M.)
{
  const b = {
    stakeholders: [
      { key: 'founder:1', name: 'F', percentage: 60, type: 'founder' as const },
      { key: 'investor:A', name: 'A', percentage: 20, type: 'investor' as const },
      { key: 'investor:B', name: 'B', percentage: 20, type: 'investor' as const },
    ],
    positions: [
      { key: 'investor:A', name: 'A', percentage: 20, type: 'investor' as const, investedAmount: 5 * M, liquidationPreference: 1 },
      { key: 'investor:B', name: 'B', percentage: 20, type: 'investor' as const, investedAmount: 20 * M, liquidationPreference: 2 },
    ],
  }
  const rows = calculatePayouts(b, 55 * M, 'acquisition')
  near(pay(rows, 'investor:A'), 5 * M, 'A keeps preference')
  near(pay(rows, 'investor:B'), 40 * M, 'B keeps preference')
  near(pay(rows, 'founder:1'), 10 * M, 'founders get the rest')
}

// 0x preference = same as common.
{
  const b = calculateEquity(founders(100), 0, [round('Angel', 20 * M, 0, inv('Angel', 5 * M, 0))])
  near(pay(calculatePayouts(b, 10 * M, 'acquisition'), 'investor:Angel'), 2 * M, '0x gets its share only')
  near(pay(calculatePayouts(b, 0, 'acquisition'), 'investor:Angel'), 0, '0x at $0 exit is 0, not NaN')
}

// Same investor in two rounds keeps each round's own terms: $1M at 1x + $10M at 2x = $21M of preference.
{
  const b = calculateEquity(founders(100), 0, [
    round('Seed', 4 * M, 0, inv('VC', 1 * M)),
    round('A', 40 * M, 0, inv('VC', 10 * M, 2)),
  ])
  const rows = calculatePayouts(b, 21 * M, 'acquisition')
  near(pay(rows, 'investor:VC'), 21 * M, 'mixed terms preference')
  near(pay(rows, 'founder:1'), 0, 'mixed terms common')
}

// IPO: preferred converts to common, so even 2x participating gets only its share.
// Source: https://viewpoint.pwc.com/dt/us/en/aicpav2/avg-pci/avg-pci/avg-pci_appB/avg-pci_appB_07/avg-pci-appB-07-Economic-Rights.html
{
  const b = calculateEquity(founders(100), 0, [round('A', 8 * M, 0, inv('VC', 2 * M, 2, true))])
  const rows = calculatePayouts(b, 10 * M, 'ipo')
  near(pay(rows, 'investor:VC'), 2 * M, 'IPO investor')
  near(pay(rows, 'founder:1'), 8 * M, 'IPO common')
}

// Bad input must not give NaN: empty fields, zero valuation, pool above 100%.
{
  const b = calculateEquity(
    [{ id: 1, name: 'F', percentage: '' as unknown as number }],
    NaN,
    [round('X', 0, 150, inv('VC', 0)), round('Y', '' as unknown as number, 0, inv('VC2', '' as unknown as number))]
  )
  for (const s of b.stakeholders) assert.ok(Number.isFinite(s.percentage) && s.percentage >= 0, `finite ${s.key}`)
  for (const r of calculatePayouts(b, -5, 'acquisition')) assert.ok(Number.isFinite(r.payout) && r.payout >= 0, `finite ${r.key}`)
}

// --- SAFEs, convertible notes and loans --------------------------------------

let nextId = 100
const rnd2 = (name: string, pre: number, pool: number, ...investors: ReturnType<typeof inv>[]) =>
  ({ ...round(name, pre, pool, ...investors), id: nextId++ })
const instrument = (kind: 'safe' | 'note' | 'loan', name: string, amount: number, o: Record<string, number | string | null> = {}) => ({
  id: nextId++, kind, name, amount, valuationCap: 0, capBasis: (kind === 'safe' ? 'post' : 'pre') as 'post' | 'pre',
  discountPercent: 0, interestPercent: 0, months: 0, exitMultiple: 1, convertsInRoundId: null as number | null, ...o,
})

// Post-money SAFE: $1M at a $10M cap is 10% before the round, then the round dilutes it.
// Source: Y Combinator SAFE user guide (Safe Price = cap / company capitalization).
{
  const a = rnd2('A', 20 * M, 0, inv('VC', 5 * M))
  const b = calculateEquity(founders(100), 0, [a], [instrument('safe', 'Angel', 1 * M, { valuationCap: 10 * M, convertsInRoundId: a.id })])
  near(pct(b, 'investor:Angel'), 8, 'SAFE 10% x 0.8')
  near(pct(b, 'investor:VC'), 20, 'new investor is not diluted by the SAFE')
  near(pct(b, 'founder:1'), 72, 'founders carry the SAFE')
  assert.equal(Object.values(b.conversions!)[0]!.basis, 'cap')
}

// Cap above the round valuation: the SAFE converts at the round price ($1M of $25M post = 4%).
{
  const a = rnd2('A', 20 * M, 0, inv('VC', 5 * M))
  const b = calculateEquity(founders(100), 0, [a], [instrument('safe', 'Angel', 1 * M, { valuationCap: 30 * M, convertsInRoundId: a.id })])
  near(pct(b, 'investor:Angel'), 4, 'SAFE at round price')
  assert.equal(Object.values(b.conversions!)[0]!.basis, 'price')
}

// Discount only: 20% off the round price gives 1 / 0.8 = 1.25x the shares (4% -> 5%).
{
  const a = rnd2('A', 20 * M, 0, inv('VC', 5 * M))
  const b = calculateEquity(founders(100), 0, [a], [instrument('safe', 'Angel', 1 * M, { discountPercent: 20, convertsInRoundId: a.id })])
  near(pct(b, 'investor:Angel'), 5, 'SAFE at discount')
  assert.equal(Object.values(b.conversions!)[0]!.basis, 'discount')
}

// Two SAFEs, then a Series A with a pool. Founders 90% + 10% pool; $500K at a $6M cap and
// $2.5M at a $20M cap; $10M at $40M pre; pool increase of 1,118,797 / 17,187,982 shares.
// Published result: 6.12% / 9.19% / 20.00% / founders 52.36%.
// Source: https://seedspace.io/instruments/priced-round/
{
  const a = rnd2('Series A', 40 * M, (1118797 / 17187982) * 100, inv('New', 10 * M))
  const b = calculateEquity(founders(45, 45), 10, [a], [
    instrument('safe', 'Pre-seed', 0.5 * M, { valuationCap: 6 * M, convertsInRoundId: a.id }),
    instrument('safe', 'Seed', 2.5 * M, { valuationCap: 20 * M, convertsInRoundId: a.id }),
  ])
  near(pct(b, 'investor:Pre-seed'), 6.1242, 'pre-seed SAFEs')
  near(pct(b, 'investor:Seed'), 9.1864, 'seed SAFEs')
  near(pct(b, 'investor:New'), 20, 'new investors')
  near(pct(b, 'founder:1') + pct(b, 'founder:2'), 52.363, 'founders')
  near(b.stakeholders.reduce((s, x) => s + x.percentage, 0), 100, 'sums to 100')
}

// Convertible note: $500K at 6% for 18 months converts as $545,000.
// Source: https://www.westaway.com/guides/convertible-notes
{
  const note = instrument('note', 'Noteholder', 0.5 * M, { interestPercent: 6, months: 18, valuationCap: 10 * M, discountPercent: 20, exitMultiple: 1.5 })
  near(owed(note), 545_000, 'principal + simple interest')

  // In a $5M round at $20M pre, with 10,000,000 old shares: cap price $1.00 -> 545,000 shares.
  // Round price = $20M / 10,545,000 = $1.8966 -> 2,636,250 new shares. Note = 545,000 / 13,181,250.
  const a = rnd2('Seed', 20 * M, 0, inv('VC', 5 * M))
  const b = calculateEquity(founders(100), 0, [a], [{ ...note, convertsInRoundId: a.id }])
  near(pct(b, 'investor:Noteholder'), (545_000 / 13_181_250) * 100, 'note at pre-money cap')
  near(pct(b, 'investor:VC'), 20, 'new investor')
  assert.equal(Object.values(b.conversions!)[0]!.basis, 'cap')

  // Sold for $40M before any round: 1.5x principal is $750K, but the shares are worth more.
  // The guide gives "about 5.2%" and "roughly $2,070,000".
  const unconverted = calculateEquity(founders(100), 0, [], [note])
  near(pct(unconverted, 'investor:Noteholder'), (545_000 / 10_545_000) * 100, 'note as converted at cap')
  let rows = calculatePayouts(unconverted, 40 * M, 'acquisition')
  near(pay(rows, 'investor:Noteholder'), (545_000 / 10_545_000) * 40 * M, 'note converts in a large sale')
  // Small sale: the cash multiple wins.
  rows = calculatePayouts(unconverted, 5 * M, 'acquisition')
  near(pay(rows, 'investor:Noteholder'), 750_000, 'note takes 1.5x principal in a small sale')
  near(pay(rows, 'founder:1'), 4_250_000, 'founders get the rest')
}

// Pre-money caps dilute each other: two notes of 10% each end at 8.33% each.
{
  const b = calculateEquity(founders(100), 0, [], [
    instrument('note', 'N1', 1 * M, { valuationCap: 10 * M }),
    instrument('note', 'N2', 1 * M, { valuationCap: 10 * M }),
  ])
  near(pct(b, 'investor:N1'), 100 / 12, 'pre-money cap note 1')
  near(pct(b, 'founder:1'), 1000 / 12, 'founders')
  assert.equal(b.rounds[b.rounds.length - 1]!.name, 'If converted')
  near(b.issued!.stakeholders.reduce((s, x) => s + x.percentage, 0), 100, 'issued shares still sum to 100')
}

// Unconverted SAFE in a sale: the greater of the money back or the share at the cap.
// It ranks with preferred stock, behind debt, ahead of common.
// Source: Y Combinator SAFE user guide, "Liquidity Event".
{
  const b = calculateEquity(founders(100), 0, [], [instrument('safe', 'Angel', 1 * M, { valuationCap: 10 * M })])
  let rows = calculatePayouts(b, 5 * M, 'acquisition')
  near(pay(rows, 'investor:Angel'), 1 * M, 'SAFE takes its money back')
  near(pay(rows, 'founder:1'), 4 * M, 'founders')
  rows = calculatePayouts(b, 50 * M, 'acquisition')
  near(pay(rows, 'investor:Angel'), 5 * M, 'SAFE converts: 10% of $50M')
  rows = calculatePayouts(b, 0.5 * M, 'acquisition')
  near(pay(rows, 'investor:Angel'), 0.5 * M, 'SAFE gets all of a very small sale')
  near(pay(rows, 'founder:1'), 0, 'founders get nothing')
  rows = calculatePayouts(b, 50 * M, 'ipo')
  near(pay(rows, 'investor:Angel'), 5 * M, 'IPO above the cap: SAFE converts to 10%')
  // Below the cap, the cap does not apply. $1M buys shares at the IPO price: $1M of $5M.
  rows = calculatePayouts(b, 5 * M, 'ipo')
  near(pay(rows, 'investor:Angel'), 1 * M, 'IPO below the cap: SAFE converts at the IPO price')
}

// Order of payment: loan, then note, then SAFE, then common.
{
  const b = calculateEquity(founders(100), 0, [], [
    instrument('loan', 'Bank', 2 * M, { interestPercent: 10, months: 12 }),
    instrument('note', 'Noteholder', 1 * M, { valuationCap: 10 * M }),
    instrument('safe', 'Angel', 1 * M, { valuationCap: 10 * M }),
  ])
  const loanKey = (rows: ReturnType<typeof calculatePayouts>) => rows.find(r => r.type === 'debt')!
  let rows = calculatePayouts(b, 3.7 * M, 'acquisition')
  near(loanKey(rows).payout, 2.2 * M, 'loan: principal + interest first')
  near(pay(rows, 'investor:Noteholder'), 1 * M, 'note next')
  near(pay(rows, 'investor:Angel'), 0.5 * M, 'SAFE gets what is left')
  near(pay(rows, 'founder:1'), 0, 'common gets nothing')
  near(total(rows), 3.7 * M, 'all proceeds are paid out')
  rows = calculatePayouts(b, 1 * M, 'acquisition')
  near(loanKey(rows).payout, 1 * M, 'loan takes all of a tiny sale')
  rows = calculatePayouts(b, 100 * M, 'ipo')
  assert.ok(!rows.some(r => r.type === 'debt'), 'IPO value is equity value: loans are not taken from it')
  near(total(rows), 100 * M, 'IPO sums to value')
}

// --- Random scenarios: rules that must always hold --------------------------
{
  let seed = 42
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]!
  for (let n = 0; n < 3000; n++) {
    const rounds = Array.from({ length: 1 + Math.floor(rnd() * 4) }, (_, r) =>
      round(`R${r}`, (1 + rnd() * 50) * M, pick([0, 5, 10]),
        ...Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, i) =>
          inv(`I${Math.floor(rnd() * 5)}`, (0.2 + rnd() * 20) * M, pick([0, 1, 1, 1.5, 2, 3]), rnd() < 0.3)))
    )
    const b = calculateEquity(founders(60, 40), 0, rounds)
    near(b.stakeholders.reduce((s, x) => s + x.percentage, 0), 100, 'cap table sums to 100')

    // The same scenario with random SAFEs, notes and loans: totals must still hold.
    {
      const withIds = rounds.map((r, i) => ({ ...r, id: i + 1 }))
      const extras = Array.from({ length: Math.floor(rnd() * 4) }, (_, i) =>
        instrument(pick(['safe', 'note', 'loan'] as const), `X${i}`, (0.1 + rnd() * 3) * M, {
          valuationCap: pick([0, 5, 10, 30]) * M, capBasis: pick(['post', 'pre']), discountPercent: pick([0, 15, 20]),
          interestPercent: pick([0, 6, 8]), months: pick([0, 12, 18]), exitMultiple: pick([1, 1.5]),
          convertsInRoundId: pick([null, ...withIds.map(r => r.id)]),
        }))
      const e = calculateEquity(founders(60, 40), 0, withIds, extras)
      for (const r of e.rounds) near(r.stakeholders.reduce((s, x) => s + x.percentage, 0), 100, `with instruments: sum ${r.name}`)
      for (const s of e.stakeholders) assert.ok(s.percentage >= -1e-9, 'no negative ownership')
      const value = rnd() * 150 * M
      for (const type of ['acquisition', 'ipo'] as const) {
        const rows = calculatePayouts(e, value, type)
        assert.ok(Math.abs(total(rows) - value) < 1, `with instruments: ${type} payouts sum to the exit (${total(rows)} vs ${value})`)
        for (const r of rows) assert.ok(r.payout >= -1e-6, 'no negative payout')
      }
    }
    near(b.positions.reduce((s, x) => s + x.percentage, 0), b.stakeholders.filter(s => s.type === 'investor').reduce((s, x) => s + x.percentage, 0), 'positions match investors')

    const exit = rnd() * 150 * M
    const totalPrefs = b.positions.reduce((s, p) => s + p.investedAmount! * p.liquidationPreference!, 0)
    const rows = calculatePayouts(b, exit, 'acquisition')
    assert.ok(Math.abs(total(rows) - exit) < 1, `payouts sum to exit: ${total(rows)} vs ${exit}`)
    near(total(calculatePayouts(b, exit, 'ipo')) / M, exit / M, 'IPO payouts sum to exit')

    if (exit > totalPrefs) {
      // Work out the split again from scratch for the model's set of converters, then
      // check that no non-participating holder does better by switching its choice.
      const commonPct = b.stakeholders.filter(s => s.type !== 'investor').reduce((s, x) => s + x.percentage, 0)
      const value = (converted: Set<number>, who: number) => {
        let rest = exit, sharing = commonPct
        b.positions.forEach((p, i) => {
          const pref = p.investedAmount! * p.liquidationPreference!
          if (p.participating) { rest -= pref; sharing += p.percentage }
          else if (converted.has(i)) sharing += p.percentage
          else rest -= pref
        })
        const p = b.positions[who]!
        return converted.has(who) ? (p.percentage / sharing) * rest : p.investedAmount! * p.liquidationPreference!
      }
      // Find the stable set by brute force over all subsets of non-participating positions.
      const np = b.positions.map((p, i) => (p.participating ? -1 : i)).filter(i => i >= 0)
      const stable: Set<number>[] = []
      for (let mask = 0; mask < 1 << np.length; mask++) {
        const set = new Set(np.filter((_, j) => mask & (1 << j)))
        const ok = np.every(i => {
          const flipped = new Set(set)
          flipped.has(i) ? flipped.delete(i) : flipped.add(i)
          const now = value(set, i), other = value(flipped, i)
          return set.has(i) ? now > other - 1e-6 : now >= other - 1e-6
        })
        if (ok) stable.push(set)
      }
      assert.ok(stable.length >= 1, 'a stable outcome exists')
      // The model's investor totals must match one stable outcome.
      const matches = stable.some(set => {
        const byKey = new Map<string, number>()
        b.positions.forEach((p, i) => {
          let v = value(set, i)
          if (p.participating) {
            // preference + share of the rest
            let rest = exit, sharing = commonPct
            b.positions.forEach((q, j) => {
              const pref = q.investedAmount! * q.liquidationPreference!
              if (q.participating) { rest -= pref; sharing += q.percentage }
              else if (set.has(j)) sharing += q.percentage
              else rest -= pref
            })
            v = p.investedAmount! * p.liquidationPreference! + (p.percentage / sharing) * rest
          }
          byKey.set(p.key, (byKey.get(p.key) || 0) + v)
        })
        return [...byKey].every(([key, v]) => Math.abs(pay(rows, key) - v) < 1)
      })
      assert.ok(matches, `payouts match a stable conversion outcome (case ${n})`)
    }
  }
}

console.log('equity tests passed')
