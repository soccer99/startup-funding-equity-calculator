// Share links and spreadsheet export. Pure functions, so `npm test` can run them in plain Node.
import type {
  Founder, FundingRound, Instrument, ExitType, ExitOptions, EquityBreakdown, ExitPayout,
} from '@/types'
import { owed } from './equity.ts'

export interface Scenario {
  founders: Founder[]
  initialOptionPool: number
  fundingRounds: FundingRound[]
  instruments: Instrument[]
  exitValuation: number
  exitType: ExitType
  exitOptions: ExitOptions
}

// ---------- Reading saved or shared data ----------
// A share link is text from another person, and saved data can be from an old version.
// Keep only fields of the right type. All other values are dropped, and the app uses its defaults.

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const number = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback)
const text = (v: unknown) => (typeof v === 'string' ? v.slice(0, 80) : '')
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T) => (allowed.includes(v as T) ? (v as T) : fallback)
const list = (v: unknown) => (Array.isArray(v) ? v.filter(isObject).slice(0, 50) : [])

export function sanitize(raw: unknown): Partial<Scenario> {
  if (!isObject(raw)) return {}
  const out: Partial<Scenario> = {}
  // Ids must be different, because the screen uses them to tell rows apart.
  let id = 0
  const nextId = () => ++id

  if (Array.isArray(raw.founders) && raw.founders.length) {
    out.founders = list(raw.founders).map(f => ({ id: nextId(), name: text(f.name), percentage: Math.min(number(f.percentage), 100) }))
  }
  if (raw.initialOptionPool !== undefined) out.initialOptionPool = Math.min(number(raw.initialOptionPool), 100)

  // Instruments point at a round by id, so keep a map from the old ids to the new ones.
  const roundIds = new Map<unknown, number>()
  if (Array.isArray(raw.fundingRounds)) {
    out.fundingRounds = list(raw.fundingRounds).map(r => {
      const roundId = nextId()
      roundIds.set(r.id, roundId)
      return {
        id: roundId,
        name: text(r.name),
        preMoneyValuation: number(r.preMoneyValuation),
        optionPoolPercent: Math.min(number(r.optionPoolPercent), 100),
        investors: list(r.investors).map(i => ({
          id: nextId(),
          name: text(i.name),
          amount: number(i.amount),
          liquidationPreference: number(i.liquidationPreference, 1),
          participating: i.participating === true,
        })),
      }
    })
  }
  if (Array.isArray(raw.instruments)) {
    out.instruments = list(raw.instruments).map(i => ({
      id: nextId(),
      kind: oneOf(i.kind, ['safe', 'note', 'loan'] as const, 'safe'),
      name: text(i.name),
      amount: number(i.amount),
      valuationCap: number(i.valuationCap),
      capBasis: oneOf(i.capBasis, ['post', 'pre'] as const, 'post'),
      discountPercent: Math.min(number(i.discountPercent), 99),
      interestPercent: number(i.interestPercent),
      months: number(i.months),
      exitMultiple: number(i.exitMultiple, 1),
      convertsInRoundId: roundIds.get(i.convertsInRoundId) ?? null,
    }))
  }
  if (raw.exitValuation !== undefined) out.exitValuation = number(raw.exitValuation)
  if (raw.exitType !== undefined) out.exitType = oneOf(raw.exitType, ['acquisition', 'ipo'] as const, 'acquisition')
  if (isObject(raw.exitOptions)) {
    const a = isObject(raw.exitOptions.acquisition) ? raw.exitOptions.acquisition : {}
    const i = isObject(raw.exitOptions.ipo) ? raw.exitOptions.ipo : {}
    out.exitOptions = {
      acquisition: {
        dealStructure: oneOf(a.dealStructure, ['cash', 'stock', 'mixed'] as const, 'cash'),
        stockPercentage: Math.min(number(a.stockPercentage, 50), 100),
        escrowPercent: Math.min(number(a.escrowPercent), 100),
        managementCarveout: number(a.managementCarveout),
        transactionCostsPercent: Math.min(number(a.transactionCostsPercent), 100),
      },
      ipo: {
        underwriterFeesPercent: Math.min(number(i.underwriterFeesPercent), 100),
        lockupDays: number(i.lockupDays, 180),
        offeringAmount: number(i.offeringAmount),
      },
    }
  }
  return out
}

// ---------- Share link ----------
// The scenario goes in the part of the address after "#". Browsers do not send that part
// to a server, so the numbers go only to the people who get the link.
//
// To keep the link short:
//   1. pack()    - lists in a fixed order, with no key names. Values at the end of a list
//                  that are the default are left out. Round numbers are written as 25e5.
//   2. deflate   - the compression that browsers have built in (CompressionStream).
//   3. base64url - letters, digits, "-" and "_", so chat apps do not break the link.
// The first two characters say how to read it: "z1" = packed + deflated, "j1" = packed only
// (used when deflate does not make it shorter, or the browser does not have it).

type Packed = (string | number | Packed)[]

const KINDS = ['safe', 'note', 'loan'] as const
const STRUCTURES = ['cash', 'stock', 'mixed'] as const

/** Removes values from the end of a list while they are equal to the defaults. */
function trim(values: Packed, defaults: (string | number)[]): Packed {
  const offset = values.length - defaults.length // the defaults line up with the end of the list
  let end = values.length
  while (end > offset && values[end - 1] === defaults[end - 1 - offset]) end--
  return values.slice(0, end)
}

function pack(s: Scenario): Packed {
  const a = s.exitOptions.acquisition
  const i = s.exitOptions.ipo
  return trim([
    s.founders.map(f => [f.name, f.percentage]),
    s.fundingRounds.map(r => [
      r.name, r.preMoneyValuation, r.optionPoolPercent,
      r.investors.map(v => trim([v.name, v.amount, v.liquidationPreference, v.participating ? 1 : 0], [1, 0])),
    ]),
    s.instruments.map(n => trim([
      KINDS.indexOf(n.kind), n.name, n.amount, n.valuationCap, n.capBasis === 'pre' ? 1 : 0, n.discountPercent,
      s.fundingRounds.findIndex(r => r.id === n.convertsInRoundId), n.interestPercent, n.months, n.exitMultiple,
    ], [0, 0, 0, -1, 0, 0, 1])),
    s.initialOptionPool,
    s.exitValuation,
    s.exitType === 'ipo' ? 1 : 0,
    trim([STRUCTURES.indexOf(a.dealStructure), a.escrowPercent, a.transactionCostsPercent, a.managementCarveout, a.stockPercentage], [0, 0, 0, 0, 50]),
    trim([i.underwriterFeesPercent, i.offeringAmount, i.lockupDays], [0, 0, 180]),
  ], [0, 100_000_000, 0, [] as never, [] as never])
}

/** Turns a packed list back into a scenario. The result still goes through sanitize(). */
function unpack(p: unknown): unknown {
  const at = (list: unknown, index: number, fallback: unknown = undefined) =>
    Array.isArray(list) && list[index] !== undefined ? list[index] : fallback
  const each = (v: unknown) => (Array.isArray(v) ? v : [])
  const a = at(p, 6, [])
  const i = at(p, 7, [])
  return {
    founders: each(at(p, 0)).map(f => ({ name: at(f, 0), percentage: at(f, 1) })),
    fundingRounds: each(at(p, 1)).map((r, index) => ({
      id: index, // instruments point at a round by its place in the list
      name: at(r, 0), preMoneyValuation: at(r, 1), optionPoolPercent: at(r, 2),
      investors: each(at(r, 3)).map(v => ({ name: at(v, 0), amount: at(v, 1), liquidationPreference: at(v, 2, 1), participating: at(v, 3, 0) === 1 })),
    })),
    instruments: each(at(p, 2)).map(n => ({
      kind: KINDS[at(n, 0) as number], name: at(n, 1), amount: at(n, 2), valuationCap: at(n, 3, 0),
      capBasis: at(n, 4, 0) === 1 ? 'pre' : 'post', discountPercent: at(n, 5, 0), convertsInRoundId: at(n, 6, -1),
      interestPercent: at(n, 7, 0), months: at(n, 8, 0), exitMultiple: at(n, 9, 1),
    })),
    initialOptionPool: at(p, 3, 0),
    exitValuation: at(p, 4, 100_000_000),
    exitType: at(p, 5, 0) === 1 ? 'ipo' : 'acquisition',
    exitOptions: {
      acquisition: { dealStructure: STRUCTURES[at(a, 0, 0) as number], escrowPercent: at(a, 1, 0), transactionCostsPercent: at(a, 2, 0), managementCarveout: at(a, 3, 0), stockPercentage: at(a, 4, 50) },
      ipo: { underwriterFeesPercent: at(i, 0, 0), offeringAmount: at(i, 1, 0), lockupDays: at(i, 2, 180) },
    },
  }
}

/** JSON, but 2500000 is written as 25e5. JSON.parse reads both. */
function write(value: Packed[number]): string {
  if (Array.isArray(value)) return `[${value.map(write).join(',')}]`
  if (typeof value === 'string') return JSON.stringify(value)
  const zeros = String(value).match(/^(\d+?)(0{3,})$/)
  return zeros ? `${zeros[1]}e${zeros[2]!.length}` : String(Number.isFinite(value) ? value : 0)
}

const toBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const fromBase64Url = (value: string) =>
  Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))

async function pipe(bytes: Uint8Array, through: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(through)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** The part of the link after the page address, starting with "#". */
export async function encodeScenario(scenario: Scenario): Promise<string> {
  const bytes = new TextEncoder().encode(write(pack(scenario)))
  const plain = 'j1' + toBase64Url(bytes)
  if (typeof CompressionStream === 'undefined') return '#' + plain
  const deflated = 'z1' + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))
  return '#' + (deflated.length < plain.length ? deflated : plain)
}

/** Returns the scenario in a link hash, or null if there is none or it cannot be read. */
export async function decodeScenario(hash: string): Promise<Partial<Scenario> | null> {
  const format = hash.slice(1, 3)
  // A real link is a few hundred characters. A very long one is not from this app.
  if ((format !== 'z1' && format !== 'j1') || hash.length > 8000) return null
  try {
    let bytes: Uint8Array = fromBase64Url(hash.slice(3))
    if (format === 'z1') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'))
    const scenario = sanitize(unpack(JSON.parse(new TextDecoder().decode(bytes))))
    return scenario.founders?.length ? scenario : null
  } catch {
    return null
  }
}

// ---------- Spreadsheet (CSV) ----------

type Cell = string | number

function cell(value: Cell): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : '0'
  // A name that starts with = + - or @ would run as a formula in a spreadsheet. The quote mark stops that.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function buildCsv(scenario: Scenario, breakdown: EquityBreakdown, payouts: ExitPayout[], netProceeds: number): string {
  const rows: Cell[][] = []
  const section = (title: string, header: Cell[]) => rows.push([], [title], header)
  const typeName = { founder: 'Founder', investor: 'Investor', option_pool: 'Option pool', debt: 'Loan' }

  rows.push(['Startup Equity Calculator'], ['Estimate only. Not legal, tax, or investment advice.'])

  section('FOUNDERS', ['Name', 'Ownership at founding %'])
  for (const f of scenario.founders) rows.push([f.name, f.percentage])
  rows.push(['Option pool at founding', scenario.initialOptionPool])

  if (scenario.instruments.length) {
    section('SAFES, NOTES AND LOANS', ['Type', 'Name', 'Amount $', 'Valuation cap $', 'Cap type', 'Discount %', 'Interest % per year', 'Months', 'Amount with interest $', 'Converts in', 'Ownership after conversion %'])
    for (const i of scenario.instruments) {
      const round = scenario.fundingRounds.find(r => r.id === i.convertsInRoundId)
      const loan = i.kind === 'loan'
      rows.push([
        { safe: 'SAFE', note: 'Convertible note', loan: 'Loan' }[i.kind], i.name, i.amount,
        loan || !i.valuationCap ? '' : i.valuationCap, loan || !i.valuationCap ? '' : `${i.capBasis}-money`,
        loan ? '' : i.discountPercent, i.kind === 'safe' ? '' : i.interestPercent, i.kind === 'safe' ? '' : i.months,
        owed(i), loan ? '' : round ? round.name : 'Not converted', loan ? '' : breakdown.conversions?.[i.id]?.percentage ?? 0,
      ])
    }
  }

  if (scenario.fundingRounds.length) {
    section('PRICED ROUNDS', ['Round', 'Pre-money valuation $', 'New option pool %', 'Investor', 'Amount $', 'Liquidation preference x', 'Participating'])
    for (const r of scenario.fundingRounds) {
      for (const i of r.investors) {
        rows.push([r.name, r.preMoneyValuation, r.optionPoolPercent, i.name, i.amount, i.liquidationPreference, i.participating ? 'Yes' : 'No'])
      }
    }
  }

  section('CAP TABLE (OWNERSHIP %)', ['Stakeholder', 'Type', ...breakdown.rounds.map(r => r.name)])
  for (const s of breakdown.stakeholders) {
    rows.push([s.name, typeName[s.type], ...breakdown.rounds.map(r => r.stakeholders.find(x => x.key === s.key)?.percentage ?? 0)])
  }

  const exit = scenario.exitType === 'ipo' ? 'IPO' : 'Acquisition'
  section('EXIT', ['Exit type', 'Value $', 'Paid to holders $'])
  rows.push([exit, scenario.exitValuation, netProceeds])
  if (scenario.exitType === 'acquisition') {
    const a = scenario.exitOptions.acquisition
    rows.push(['How the price is paid', a.dealStructure === 'mixed' ? `${100 - a.stockPercentage}% cash, ${a.stockPercentage}% stock` : a.dealStructure])
    rows.push(['Escrow %', a.escrowPercent], ['Transaction costs %', a.transactionCostsPercent], ['Management carve-out $', a.managementCarveout])
  } else {
    const i = scenario.exitOptions.ipo
    rows.push(['Money raised in the IPO $', i.offeringAmount], ['Underwriter fees %', i.underwriterFeesPercent], ['Lockup days', i.lockupDays])
  }

  section('WHO GETS WHAT', ['Holder', 'Type', 'Ownership %', 'Payout $', 'Of which preference or repayment $', 'Invested $'])
  for (const p of payouts) {
    rows.push([p.name, typeName[p.type], p.percentage, p.payout, p.preferenceAmount ?? 0, p.investedAmount ?? ''])
  }

  // The BOM makes Excel read the file as UTF-8.
  return '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
