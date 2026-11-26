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
    definition: 'The drop in your ownership percentage when the company issues new shares. Your slice of the pie gets smaller, but the pie should be larger, so the slice can still be worth more.',
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
    definition: 'The type of shares founders and employees typically own. It usually has fewer rights than preferred stock. In a sale, common stockholders get paid after preferred stockholders.',
    category: 'securities',
  },
  preferredStock: {
    term: 'Preferred Stock',
    definition: 'The type of shares VCs and institutional investors buy. Comes with "preferences" like being paid first in an exit (liquidation preference), anti-dilution protection, and voting rights on major decisions.',
    category: 'securities',
  },
  safe: {
    term: 'SAFE (Simple Agreement for Future Equity)',
    definition: 'An investment that is not stock yet. The investor pays now and gets stock in the next priced round, at the better of a valuation cap or a discount. It has no interest and no due date. If the company is sold first, the investor takes the greater of the money back or the share at the cap. A post-money cap makes the share easy to see: $500K at a $5M cap is 10% before the round.',
    category: 'securities',
  },
  convertibleNote: {
    term: 'Convertible Note',
    definition: 'A loan that turns into stock in the next priced round. The amount paid in plus interest converts, at the better of a valuation cap or a discount. Typical terms: 6% to 8% interest, a 20% discount, 18 to 24 months. If the company is sold first, the holder takes cash (often 1x to 2x the principal) or converts at the cap. As debt, it is paid before SAFEs and stock.',
    category: 'securities',
  },
  valuationCap: {
    term: 'Valuation Cap',
    definition: 'The highest valuation at which a SAFE or note converts. If the round values the company above the cap, the holder converts as if the valuation were the cap, and gets more shares. A post-money cap counts all SAFEs and notes in the company. A pre-money cap does not, so those holders dilute each other.',
    category: 'securities',
  },

  conversionDiscount: {
    term: 'Conversion Discount',
    definition: 'A lower price for a SAFE or note when it converts. With a 20% discount, the holder pays 80% of the price that the new investors pay, and gets 1.25 times the shares. If there is also a cap, the holder gets the better of the two, not both.',
    category: 'securities',
  },
  loan: {
    term: 'Loan (Venture Debt)',
    definition: 'Money that the company must pay back with interest. It gives the lender no ownership. In a sale, loans are paid before all stock, so a loan lowers what every holder gets. This calculator uses simple interest and does not model warrants.',
    category: 'securities',
  },

  // Control & Rights
  liquidationPreference: {
    term: 'Liquidation Preference',
    definition: 'In a sale, the money investors get back before common stock gets anything. It is the multiple (1x, 2x) times the amount invested. Example: a VC invests $5M at 1x. In a $20M sale they can take $5M first. At 2x it is $10M. If the sale price is below the total of all preferences, investors split it and common gets nothing. In an IPO, preferred stock converts to common and the preference does not apply.',
    category: 'control',
  },
  participatingPreferred: {
    term: 'Participating Preferred',
    definition: 'When on, the investor takes the liquidation preference and also a share of what is left. Example: a VC owns 20% and invested $2M at 1x participating. In a $10M sale they get $2M, plus 20% of the remaining $8M ($1.6M), for $3.6M. Non-participating investors must choose one or the other. Participating is better for the investor and rare: about 2% to 5% of deals.',
    category: 'control',
  },
  nonParticipating: {
    term: 'Non-Participating Preferred',
    definition: 'The standard structure, and the better one for founders. The investor takes the greater of (1) the liquidation preference or (2) the share they would get as common stock. Not both. Example: a VC owns 20% and invested $1M at 1x. In a $10M sale, the share is $2M, so they convert and take $2M. In a $4M sale, the share is $800K, so they take the $1M preference.',
    category: 'control',
  },
  optionPool: {
    term: 'Option Pool',
    definition: 'Shares reserved for future employee grants. To create or grow the pool dilutes the existing holders. Investors usually ask for it to be counted before their money comes in, so the founders carry the dilution.',
    category: 'control',
  },
  optionPoolShuffle: {
    term: 'Option Pool Shuffle',
    definition: 'When investors ask for the option pool to be counted in the pre-money valuation. The new pool then dilutes only the existing holders, not the new investor. It lowers your real pre-money valuation. This calculator uses this method for each round.',
    category: 'control',
  },
  preMoneyOptionPool: {
    term: 'Pre-Money Option Pool',
    definition: 'A pool that exists before any investment. It is part of the first split of the company, with the founders. Later rounds dilute it in the same way as the founders.',
    category: 'control',
  },
  postMoneyOptionPool: {
    term: 'Post-Money Option Pool',
    definition: 'A pool created after the investment. All holders, the new investor too, share the dilution. This is better for founders, and investors rarely agree to it.',
    category: 'control',
  },
  vesting: {
    term: 'Vesting',
    definition: 'The process of earning equity over time. The standard is 4 years with a 1-year cliff. Investors often ask founders to vest again after a round: if you leave in year 1, you lose most of your equity.',
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
    definition: 'The first significant priced round, now typically $2M to $5M. Used to prove product-market fit. Often raised from angels and seed funds.',
    category: 'fundraising',
  },
  seriesA: {
    term: 'Series A',
    definition: 'The first major VC round, now typically $10M to $20M. Usually needs proven traction (revenue, users, growth). VCs take preferred stock and often a board seat.',
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
    definition: 'The check that VCs do before they invest. They examine contracts, IP ownership, financials, legal matters, and customer references.',
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
    definition: 'The first sale of shares to the public on a stock exchange. Preferred stock converts to common, so all holders are paid by ownership. Insiders usually cannot sell for a lockup period.',
    category: 'general',
  },
  acquisition: {
    term: 'Acquisition',
    definition: 'When another company buys your startup. The buyer pays cash, stock, or both. Proceeds follow the exit waterfall: preferences first, then common stockholders.',
    category: 'general',
  },
  exitWaterfall: {
    term: 'Exit Waterfall',
    definition: 'The order in which sale proceeds are paid: 1) debt and deal costs, 2) liquidation preferences of preferred stock, 3) what is left is split between common stock and participating preferred by ownership. Non-participating preferred joins step 3 only if it gives up its preference.',
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
    definition: 'A part of the sale price, often about 10%, held back for 12 to 18 months to cover claims against the sellers. It is paid to the sellers later if there are no claims. This calculator leaves it out of the payouts at closing.',
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
    definition: 'The commission paid to the investment banks that run the IPO. It is about 7% of the money raised for most IPOs, and less for very large ones. It is a percent of the money raised, not of the company value.',
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
