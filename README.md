# Startup Funding Equity Calculator

A web-based tool for modeling startup equity dilution across funding rounds and exit scenarios. Understand how investment terms affect founder ownership and exit payouts.

**Live Demo:** https://soccer99.github.io/startup-funding-equity-calculator/

## Features

- **Founder Equity Management** - Add multiple founders with customizable ownership percentages and drag-to-reorder
- **Pre-Money Option Pool** - Model initial employee option pools before funding
- **Funding Round Simulation** - Add multiple rounds (Pre-Seed through Series C) with configurable terms:
  - Pre-money valuation
  - Post-money option pool expansion
  - Multiple investors per round
  - Liquidation preferences (1x, 1.5x, 2x, 3x)
  - Participating vs non-participating preferred stock
- **Cap Table Visualization** - Track ownership percentages across all funding rounds with sortable views
- **Exit Scenario Modeling** - Compare acquisition vs IPO outcomes:
  - Acquisition: escrow holdbacks, transaction costs, management carve-outs, deal structure (cash/stock/mixed)
  - IPO: underwriter fees, lockup periods
- **Exit Waterfall Calculations** - See how proceeds distribute based on liquidation preferences and participation rights
- **Educational Content** - Built-in glossary with hover tooltips explaining investment terms
- **Persistent State** - Your data saves to localStorage automatically

## Tech Stack

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Vite** for build tooling
- **floating-vue** for tooltips

## Project Structure

```
src/
├── components/
│   ├── FoundersSection.vue      # Founder management with drag reorder
│   ├── FundingRoundsSection.vue # Funding round configuration
│   ├── EquityBreakdownSection.vue # Cap table display
│   ├── ExitScenarioSection.vue  # Exit modeling and payouts
│   ├── EducationalIntro.vue     # Collapsible education section
│   ├── InfoTooltip.vue          # Glossary term tooltips
│   └── CurrencyInput.vue        # Formatted currency input
├── composables/
│   └── useEquityCalculator.ts   # Core calculation logic and state
├── data/
│   ├── glossary.ts              # Term definitions for tooltips
│   └── roundPresets.ts          # Funding round presets
├── types/
│   └── index.ts                 # TypeScript interfaces
├── utils/
│   └── format.ts                # Number formatting utilities
├── App.vue
├── main.ts
└── style.css
```

## Development

```sh
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check and build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on push to `main`. See `.github/workflows/deploy.yml`.

## Disclaimer

This calculator provides simplified estimates for educational purposes. Actual equity structures may include convertible notes, SAFEs, vesting schedules, anti-dilution provisions, and other complex terms. Consult with legal and financial advisors for real transactions.
