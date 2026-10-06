// Refresh every dataset in data/, then validate the results.
// Usage: pnpm fetch:all   (all sources are keyless)

import { spawnSync } from 'node:child_process'

const steps = [
  ['fetch-cpi.mjs'],
  ['fetch-gas-prices.mjs'],
  ['fetch-deficit-fred.mjs'],
  ['fetch-debt-to-gdp.mjs'],
  ['fetch-gdp.mjs'],
  ['fetch-homeownership.mjs'],
  ['fetch-household-income.mjs'],
  ['fetch-income-gap.mjs'],
  ['fetch-life-expectancy.mjs'],
  ['fetch-sp500.mjs'],
  ['fetch-unemployment.mjs'],
  ['fetch-wages.mjs'],
  ['fetch-jobs.mjs'],
  ['fetch-groceries.mjs'],
  ['fetch-disposable-income.mjs'],
  ['fetch-housing-affordability.mjs'],
  ['validate-data.mjs'],
]

const failed = []
for (const [script, ...args] of steps) {
  console.log(`\n▶ ${script} ${args.join(' ')}`)
  const res = spawnSync(process.execPath, [`scripts/${script}`, ...args], { stdio: 'inherit' })
  if (res.status !== 0) failed.push(script)
}

if (failed.length) {
  console.error(`\nFailed: ${failed.join(', ')}`)
  process.exit(1)
}
console.log('\nAll datasets refreshed and validated.')
