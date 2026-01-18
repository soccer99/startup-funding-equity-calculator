export interface GlossaryTerm {
  term: string
  definition: string
  category?: 'valuation' | 'securities' | 'control' | 'fundraising' | 'general'
}

export const glossary: Record<string, GlossaryTerm> = {
  // General Terms
  equity: {
    term: 'Equity',
    definition: 'Ownership stake in a company, expressed as a percentage. In startups, equity is your currency to buy capital (from investors) and talent (from employees). Equity holders share in profits and losses proportional to their ownership.',
    category: 'general',
  },
  dilution: {
    term: 'Dilution',
    definition: 'The reduction in existing shareholders\' ownership percentage when new shares are issued. Think of it like baking a larger pie—your slice percentage shrinks, but the pie (company value) is bigger, so your actual "food" (share value) should increase.',
    category: 'general',
  },
  proRata: {
    term: 'Pro-Rata',
    definition: 'Latin for "in proportion." Means distributing something based on ownership percentage. If you own 20% of a company and $10M is distributed pro-rata, you receive $2M (20% × $10M). Used in exits to split proceeds, and in funding rounds where existing investors can maintain their ownership percentage by investing proportionally.',
    category: 'general',
  },
  capTable: {
    term: 'Cap Table (Capitalization Table)',
    definition: 'The master spreadsheet showing who owns what in the company. It lists all shareholders, their share counts, and ownership percentages. Updated after every funding round, employee grant, or ownership change.',
    category: 'control',
  },

  // Valuation Terms
  preMoneyValuation: {
    term: 'Pre-Money Valuation',
    definition: 'What the company is worth before receiving new investment. This is the starting point for calculating how much equity investors receive. Higher pre-money = less dilution for founders.',
    category: 'valuation',
  },
  postMoneyValuation: {
    term: 'Post-Money Valuation',
    definition: 'The company\'s value immediately after investment. Calculated as: Pre-Money Valuation + Investment Amount. This determines the new total "pie size" for calculating ownership percentages.',
    category: 'valuation',
  },
  pricePerShare: {
    term: 'Price Per Share (PPS)',
    definition: 'The dollar value of one share, calculated as Pre-Money Valuation ÷ Fully Diluted Shares. This determines how many shares investors receive for their investment.',
    category: 'valuation',
  },
  downRound: {
    term: 'Down Round',
    definition: 'A funding round where the company is valued lower than the previous round. Often considered "toxic" for founders and early investors as it signals the company has lost value and triggers anti-dilution protections.',
    category: 'valuation',
  },

  // Securities & Instruments
  commonStock: {
    term: 'Common Stock',
    definition: 'The type of shares founders and employees typically own. It usually has fewer rights than preferred stock—in an exit, common stockholders get paid after preferred stockholders.',
    category: 'securities',
  },
  preferredStock: {
    term: 'Preferred Stock',
    definition: 'The type of shares VCs and institutional investors buy. Comes with "preferences" like being paid first in an exit (liquidation preference), anti-dilution protection, and voting rights on major decisions.',
    category: 'securities',
  },
  safe: {
    term: 'SAFE (Simple Agreement for Future Equity)',
    definition: 'A popular early-stage investment instrument that isn\'t debt or equity yet—it\'s a "promise" to give equity later when a priced round happens. SAFEs convert to shares at a discount or valuation cap.',
    category: 'securities',
  },
  convertibleNote: {
    term: 'Convertible Note',
    definition: 'Similar to a SAFE but structured as debt with an interest rate and maturity date. Converts to equity at the next priced round, typically with a discount or valuation cap to reward early risk.',
    category: 'securities',
  },
  valuationCap: {
    term: 'Valuation Cap',
    definition: 'The maximum valuation at which a SAFE or convertible note will convert to equity. Protects early investors—if the company raises at $50M but the cap is $10M, they convert at the $10M price.',
    category: 'securities',
  },

  // Control & Rights
  liquidationPreference: {
    term: 'Liquidation Preference',
    definition: 'Determines how exit proceeds are distributed. The multiplier (1x, 2x, etc.) times the investment amount is paid to investors BEFORE common stockholders receive anything. Example: A VC invests $5M with a 1x preference. In a $20M exit, they first get their $5M back, then remaining $15M is split. With a 2x preference, they\'d get $10M first. If the exit is less than total preferences, investors split it pro-rata and founders get nothing.',
    category: 'control',
  },
  participatingPreferred: {
    term: 'Participating Preferred',
    definition: 'When checked, investors "double-dip": they get their liquidation preference PLUS their pro-rata share of remaining proceeds. Example: VC owns 20% and invested $2M with 1x participating. In a $10M exit: they get $2M preference + 20% of remaining $8M ($1.6M) = $3.6M total. Without participation (non-participating), they\'d choose the better of $2M preference OR 20% of $10M ($2M). Participating preferred is more investor-friendly and reduces founder payouts.',
    category: 'control',
  },
  nonParticipating: {
    term: 'Non-Participating Preferred',
    definition: 'The investor-friendlier alternative to participating. Investors choose the BETTER of: (1) their liquidation preference, OR (2) converting to common stock and taking their pro-rata share. They cannot do both. Example: VC owns 20%, invested $1M with 1x non-participating. In a $10M exit: Option 1 is $1M (preference), Option 2 is $2M (20% of $10M). They\'d convert and take $2M. In a $4M exit: Option 1 is $1M, Option 2 is $800K—they\'d take the $1M preference.',
    category: 'control',
  },
  optionPool: {
    term: 'Option Pool',
    definition: 'Shares reserved (typically 10-20%) for future employee stock options. Best created pre-money before major funding to attract talent without diluting new investors. A pre-money pool signals long-term planning and speeds up investment. Allows offering equity instead of higher salaries when cash is tight.',
    category: 'control',
  },
  optionPoolShuffle: {
    term: 'Option Pool Shuffle',
    definition: 'A negotiation tactic where VCs insist you create an employee option pool before they invest, calculated from pre-money valuation. This effectively makes founders bear 100% of the dilution for future hires, rather than sharing it with investors.',
    category: 'control',
  },
  preMoneyOptionPool: {
    term: 'Pre-Money Option Pool',
    definition: 'Option pool created before investment, carved from founder shares. Doesn\'t dilute incoming investors, making the deal cleaner. Ideal timing: before Seed/Series A, at incorporation, or before key hires.',
    category: 'control',
  },
  postMoneyOptionPool: {
    term: 'Post-Money Option Pool',
    definition: 'Option pool created after investment, where the pool size (e.g., 10-20%) comes out of post-funding valuation. This dilutes everyone equally, including new investors—less favorable for founders.',
    category: 'control',
  },
  vesting: {
    term: 'Vesting',
    definition: 'The process of earning equity over time. Standard is 4-year vesting with a 1-year cliff. Founder shares are often "re-vested" after investment—if you quit in Year 1, you lose most of your equity.',
    category: 'control',
  },
  boardSeat: {
    term: 'Board Seat',
    definition: 'A position on the Board of Directors. VCs often require board seats as part of investment terms. Board members vote on major decisions like exits, CEO changes, and future fundraising.',
    category: 'control',
  },

  // Fundraising Terms
  fundingRound: {
    term: 'Funding Round',
    definition: 'A discrete period during which a startup raises capital. Rounds are named Seed, Series A, B, C, etc. Earlier rounds are smaller, riskier, and at lower valuations.',
    category: 'fundraising',
  },
  seedRound: {
    term: 'Seed Round',
    definition: 'The first significant external funding, typically $500K-$3M. Used to prove product-market fit. Often raised from angels, seed funds, or accelerators.',
    category: 'fundraising',
  },
  seriesA: {
    term: 'Series A',
    definition: 'The first major VC round, typically $5M-$15M. Usually requires proven traction (revenue, users, growth). VCs take preferred stock with full rights and often a board seat.',
    category: 'fundraising',
  },
  termSheet: {
    term: 'Term Sheet',
    definition: 'A non-binding document outlining the key terms of a proposed investment. Focus areas: valuation, investment amount, liquidation preferences, board composition, and control provisions.',
    category: 'fundraising',
  },
  leadInvestor: {
    term: 'Lead Investor',
    definition: 'The VC who sets the terms and takes the largest portion of the round. They negotiate the term sheet and conduct due diligence. Other "follow" investors typically accept the same terms.',
    category: 'fundraising',
  },
  dueDiligence: {
    term: 'Due Diligence',
    definition: 'The "background check" phase where VCs verify your claims—examining contracts, IP ownership, financials, legal matters, and customer references before finalizing investment.',
    category: 'fundraising',
  },
  proForma: {
    term: 'Pro Forma Cap Table',
    definition: 'A forward-looking cap table that shows projected ownership after a proposed transaction (funding round, option grants, etc.) is completed.',
    category: 'fundraising',
  },

  // Exit Terms
  exit: {
    term: 'Exit',
    definition: 'An event that allows investors and founders to convert their equity into cash. Common exits: IPO (going public), acquisition (being bought), or secondary sale (selling shares privately).',
    category: 'general',
  },
  ipo: {
    term: 'IPO (Initial Public Offering)',
    definition: 'The process of offering shares to the public on a stock exchange. Provides liquidity for all shareholders but requires significant revenue, compliance, and ongoing public reporting.',
    category: 'general',
  },
  acquisition: {
    term: 'Acquisition',
    definition: 'When another company purchases your startup. The buyer pays cash, stock, or both. Proceeds are distributed according to the "exit waterfall"—preferences first, then common stockholders.',
    category: 'general',
  },
  exitWaterfall: {
    term: 'Exit Waterfall',
    definition: 'The order in which exit proceeds are distributed: 1) Debt holders, 2) Preferred stockholders (liquidation preferences), 3) Participating preferred (if applicable), 4) Common stockholders. The math matters enormously.',
    category: 'general',
  },
  founder: {
    term: 'Founder',
    definition: 'An individual who starts a company. Founders typically receive significant common stock and are responsible for the company\'s vision. Their shares usually vest over 4 years.',
    category: 'general',
  },
  investor: {
    term: 'Investor',
    definition: 'An entity providing capital in exchange for equity. Types include: Angels (individuals), VCs (funds), and Strategic investors (corporations). Each has different check sizes and expectations.',
    category: 'general',
  },

  // Exit-specific terms
  escrow: {
    term: 'Escrow / Holdback',
    definition: 'A portion of the acquisition price (typically 10-20%) held in reserve for 12-24 months to cover potential claims, breaches of representations, or indemnification obligations. Released to sellers if no claims are made.',
    category: 'general',
  },
  managementCarveout: {
    term: 'Management Carve-out',
    definition: 'A bonus pool set aside for key employees in an acquisition, paid before the exit waterfall. Used to retain and incentivize management through the transition. Reduces total proceeds available to shareholders.',
    category: 'general',
  },
  transactionCosts: {
    term: 'Transaction Costs',
    definition: 'Fees associated with completing an acquisition: investment banking fees (1-2%), legal fees, accounting fees, and other advisory costs. Typically 1-3% of deal value, paid from proceeds before distribution.',
    category: 'general',
  },
  dealStructure: {
    term: 'Deal Structure',
    definition: 'How the acquisition price is paid. Cash deals provide immediate liquidity. Stock deals give you shares in the acquirer (subject to lockup). Mixed deals combine both. Stock deals may defer taxes but carry risk if acquirer stock drops.',
    category: 'general',
  },
  underwriterFees: {
    term: 'Underwriter Fees',
    definition: 'Commission paid to investment banks for managing an IPO, typically 5-7% of gross proceeds. Covers due diligence, regulatory filings, pricing, and distributing shares to institutional investors.',
    category: 'general',
  },
  lockupPeriod: {
    term: 'Lockup Period',
    definition: 'A restriction preventing insiders (founders, employees, early investors) from selling shares after an IPO, typically 90-180 days. Prevents flooding the market and stabilizes the stock price post-IPO.',
    category: 'general',
  },
  secondaryOffering: {
    term: 'Secondary Offering',
    definition: 'When existing shareholders sell their shares during an IPO (vs. the company issuing new shares). Provides liquidity for early investors/employees but doesn\'t raise new capital for the company.',
    category: 'general',
  },
}

export const categories = {
  general: 'General Terms',
  valuation: 'Valuation Terms',
  securities: 'Securities & Instruments',
  control: 'Control & Rights',
  fundraising: 'Fundraising',
}
