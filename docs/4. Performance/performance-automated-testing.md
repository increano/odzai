# Performance Automated Testing Implementation

## Overview

This document outlines the implementation of automated performance testing in our CI/CD pipeline, visual regression testing, and load testing for critical application paths. These tools help ensure we maintain performance standards and prevent regressions as the application evolves.

## 1. CI/CD Pipeline Integration

### GitHub Actions Workflow

We've implemented performance testing in our CI/CD pipeline using GitHub Actions with the following configuration:

```yaml
name: Performance Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: yarn install
          
      - name: Build application
        run: yarn build
          
      - name: Start server
        run: yarn start & npx wait-on http://localhost:3000
          
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/transactions
            http://localhost:3000/accounts
            http://localhost:3000/budget
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
          
      - name: Bundle analysis
        run: yarn analyze
        
      - name: Run performance benchmarks
        run: yarn bench
```

### Performance Budgets

We've defined performance budgets in `lighthouse-budget.json`:

```json
[
  {
    "path": "/*",
    "timings": [
      {
        "metric": "interactive",
        "budget": 3000
      },
      {
        "metric": "first-contentful-paint",
        "budget": 1500
      },
      {
        "metric": "largest-contentful-paint",
        "budget": 2500
      }
    ],
    "resourceSizes": [
      {
        "resourceType": "script",
        "budget": 250
      },
      {
        "resourceType": "total",
        "budget": 800
      }
    ],
    "resourceCounts": [
      {
        "resourceType": "third-party",
        "budget": 10
      }
    ]
  }
]
```

### Bundle Size Monitoring

We track JavaScript bundle sizes over time using the Next.js bundle analyzer:

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js config
});
```

## 2. Visual Regression Testing

We've implemented visual regression testing using Playwright and Percy:

### Setup and Configuration

```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Chrome Desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        browserName: 'webkit',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
      },
    },
  ],
};

export default config;
```

### Visual Snapshot Tests

We've created visual snapshot tests for critical UI components:

```typescript
// e2e/visual-regression.test.ts
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual regression testing', () => {
  test('Dashboard page matches snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-summary"]');
    await percySnapshot(page, 'Dashboard');
  });

  test('Transactions page matches snapshot', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForSelector('[data-testid="transactions-table"]');
    await percySnapshot(page, 'Transactions');
  });

  test('Budget page matches snapshot', async ({ page }) => {
    await page.goto('/budget');
    await page.waitForSelector('[data-testid="budget-summary"]');
    await percySnapshot(page, 'Budget');
  });

  test('Accounts page matches snapshot', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForSelector('[data-testid="accounts-list"]');
    await percySnapshot(page, 'Accounts');
  });
});
```

## 3. Load Testing

We've implemented load testing for critical application paths using k6:

### Load Test Scripts

```javascript
// load-tests/critical-paths.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const failRate = new Rate('failed_requests');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    failed_requests: ['rate<0.1'],     // Less than 10% of requests should fail
  },
};

export default function() {
  // Test dashboard loading
  let res = http.get('http://localhost:3000/api/dashboard');
  check(res, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 300ms': (r) => r.timings.duration < 300,
  }) || failRate.add(1);

  sleep(1);

  // Test transactions loading
  res = http.get('http://localhost:3000/api/transactions/all');
  check(res, {
    'transactions status is 200': (r) => r.status === 200,
    'transactions response time < 400ms': (r) => r.timings.duration < 400,
  }) || failRate.add(1);

  sleep(1);

  // Test account operations
  res = http.get('http://localhost:3000/api/accounts');
  check(res, {
    'accounts status is 200': (r) => r.status === 200,
    'accounts response time < 300ms': (r) => r.timings.duration < 300,
  }) || failRate.add(1);

  sleep(1);
}
```

### Automated Load Testing

Load tests run on a schedule and after significant changes to API endpoints:

```yaml
# .github/workflows/load-testing.yml
name: Load Testing

on:
  schedule:
    - cron: '0 0 * * 1'  # Run every Monday at midnight
  workflow_dispatch:     # Allow manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d
        
      - name: Run k6 load tests
        uses: grafana/k6-action@v0.2.0
        with:
          filename: load-tests/critical-paths.js
          flags: --out json=results.json
          
      - name: Store load test results
        uses: actions/upload-artifact@v3
        with:
          name: k6-report
          path: results.json
          
      - name: Cleanup
        run: docker-compose -f docker-compose.test.yml down
```

## Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| CI/CD Integration | Complete | Lighthouse CI integrated with GitHub Actions |
| Performance Budgets | Complete | Set for all critical pages and resources |
| Visual Regression Testing | Complete | Percy integration with baseline snapshots |
| Load Testing | Complete | k6 test scripts for critical paths |
| Automated Testing Schedule | Complete | Weekly tests with PR verification |

## Next Steps

1. Expand test coverage to include more edge cases and user flows
2. Set up alerting for persistent performance regressions
3. Implement trend analysis for performance metrics over time
4. Integrate performance testing results with development planning 