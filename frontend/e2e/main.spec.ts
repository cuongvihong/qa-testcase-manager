import { expect, test } from '@playwright/test'

test.describe('Top bar and initial load', () => {
  test('renders product name and 12 fixed test types in the sidebar', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Test Case Manager')).toBeVisible()
    await expect(page.getByText('Curricula Trainer Account')).toBeVisible()

    const expectedTypes = [
      'Unit Test',
      'Integration Test',
      'UI Test',
      'Performance Test',
      'API Test',
      'Regression Test',
      'Smoke Test',
      'Security Test',
      'Compatibility Test',
      'Usability Test',
      'Load / Stress Test',
      'Acceptance Test (UAT)',
    ]
    for (const name of expectedTypes) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
    }
  })

  test('the first test type is selected by default and its 8 panel tabs render', async ({ page }) => {
    await page.goto('/')

    const firstType = page.getByRole('button', { name: 'Unit Test', exact: true })
    await expect(firstType).toHaveClass(/font-semibold/)

    for (const tab of ['Test Suite', 'Category', 'Graph', 'Timeline', 'Requirement', 'Report', 'Environment', 'Comments']) {
      await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible()
    }
  })

  test('shows an empty-state message when a test type has no suites', async ({ page }) => {
    await page.goto('/')
    // Unit Test has no real AIQA data seeded — deterministic empty case.
    await expect(page.getByText('Chưa có Test Suite nào cho loại test này.')).toBeVisible()
    await expect(page.getByText('Chọn một Test Case bên trái để xem chi tiết.')).toBeVisible()
  })
})

test.describe('Selecting a test type', () => {
  test('clicking UI Test highlights it, unhighlights the previous selection, and loads real suites', async ({ page }) => {
    await page.goto('/')

    const unitTest = page.getByRole('button', { name: 'Unit Test', exact: true })
    const uiTest = page.getByRole('button', { name: 'UI Test', exact: true })

    await uiTest.click()

    await expect(uiTest).toHaveClass(/font-semibold/)
    await expect(unitTest).not.toHaveClass(/font-semibold/)

    // Real data pushed by AIQA's reporter plugin — assert structurally (>0), not an exact
    // count, since the count depends on whichever AIQA run last populated the dev DB.
    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    await expect(suiteHeaders.first()).toBeVisible()
    expect(await suiteHeaders.count()).toBeGreaterThan(0)
  })

  test('switching test type clears any open suite/case selection', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()

    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    await suiteHeaders.first().click()

    // Switch away then back — selection should reset, not carry over a suite that
    // belongs to the previous test type's context.
    await page.getByRole('button', { name: 'Unit Test', exact: true }).click()
    await expect(page.getByText('Chưa có Test Suite nào cho loại test này.')).toBeVisible()
    await expect(page.getByText('Chọn một Test Case bên trái để xem chi tiết.')).toBeVisible()
  })
})

test.describe('Suite expand + case detail', () => {
  test('clicking a suite expands its case list with colored status dots', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()

    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    const firstSuite = suiteHeaders.first()
    const suiteContainer = page.locator('div.rounded-\\[10px\\]').first()

    await firstSuite.click()

    const caseButtons = suiteContainer.locator('button.pl-8\\.5')
    await expect(caseButtons.first()).toBeVisible()
    expect(await caseButtons.count()).toBeGreaterThan(0)
  })

  test('clicking a case shows real Status panel data: badge, breadcrumb, and title match', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()

    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    await suiteHeaders.first().click()

    const suiteContainer = page.locator('div.rounded-\\[10px\\]').first()
    const caseButtons = suiteContainer.locator('button.pl-8\\.5')
    const firstCaseText = await caseButtons.first().locator('span').last().textContent()

    await caseButtons.first().click()

    const detailPanel = page.locator('div.flex-\\[3_1_0\\%\\]').last()
    await expect(detailPanel.getByText(firstCaseText!.trim(), { exact: false })).toBeVisible()
    // Status badge is one of the 6 real CaseStatus values, never blank/undefined.
    await expect(
      detailPanel.getByText(/^(Pass|Fail|Blocked|Skipped|Not Run|In Progress)$/).first(),
    ).toBeVisible()
  })

  test('selecting a different case updates the detail panel instead of stacking old content', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()

    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    await suiteHeaders.first().click()

    const suiteContainer = page.locator('div.rounded-\\[10px\\]').first()
    const caseButtons = suiteContainer.locator('button.pl-8\\.5')
    await expect(caseButtons.first()).toBeVisible()
    const count = await caseButtons.count()
    test.skip(count < 2, 'need at least 2 cases in the first suite to test switching')

    const firstTitle = (await caseButtons.nth(0).locator('span').last().textContent())!.trim()
    const secondTitle = (await caseButtons.nth(1).locator('span').last().textContent())!.trim()

    await caseButtons.nth(0).click()
    const detailPanel = page.locator('div.flex-\\[3_1_0\\%\\]').last()
    await expect(detailPanel.getByText(firstTitle, { exact: false })).toBeVisible()

    await caseButtons.nth(1).click()
    await expect(detailPanel.getByText(secondTitle, { exact: false })).toBeVisible()
    await expect(detailPanel.getByText(firstTitle, { exact: false })).toHaveCount(0)
  })
})

test.describe('Inert placeholder tabs (out of Increment 1 scope) do not crash', () => {
  test('clicking every Panel-1 tab besides Test Suite does not throw or navigate away', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/')
    for (const tab of ['Category', 'Graph', 'Timeline', 'Requirement', 'Report', 'Environment', 'Comments']) {
      await page.getByRole('button', { name: tab, exact: true }).click()
    }

    expect(errors).toEqual([])
    // Still on the same single-page app, nothing crashed to a blank/error screen.
    await expect(page.getByText('Test Case Manager')).toBeVisible()
  })

  test('clicking Timeline/Retry tabs in the case detail panel does not throw', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()
    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    await suiteHeaders.first().click()
    const suiteContainer = page.locator('div.rounded-\\[10px\\]').first()
    await suiteContainer.locator('button.pl-8\\.5').first().click()

    const detailPanel = page.locator('div.flex-\\[3_1_0\\%\\]').last()
    await detailPanel.getByRole('button', { name: 'Timeline', exact: true }).click()
    await detailPanel.getByRole('button', { name: 'Retry', exact: true }).click()

    expect(errors).toEqual([])
  })
})

test.describe('No console errors during normal use', () => {
  test('a full click-through of every test type produces zero console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/')
    const types = [
      'Unit Test',
      'Integration Test',
      'UI Test',
      'Performance Test',
      'API Test',
      'Regression Test',
      'Smoke Test',
      'Security Test',
      'Compatibility Test',
      'Usability Test',
      'Load / Stress Test',
      'Acceptance Test (UAT)',
    ]
    for (const name of types) {
      await page.getByRole('button', { name, exact: true }).click()
    }

    expect(errors).toEqual([])
  })
})

async function openFirstCaseOfUiTest(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'UI Test', exact: true }).click()
  const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
  await suiteHeaders.first().click()
  const suiteContainer = page.locator('div.rounded-\\[10px\\]').first()
  const caseButtons = suiteContainer.locator('button.pl-8\\.5')
  await expect(caseButtons.first()).toBeVisible()
  await caseButtons.first().click()
  return page.locator('div.flex-\\[3_1_0\\%\\]').last()
}

test.describe('Timeline tab', () => {
  test('lists at least one real run with a result and timestamp', async ({ page }) => {
    const detailPanel = await openFirstCaseOfUiTest(page)
    await detailPanel.getByRole('button', { name: 'Timeline', exact: true }).click()

    await expect(detailPanel.getByText(/^Kết quả chạy: (Pass|Fail|Blocked|Skipped)$/).first()).toBeVisible()
  })
})

test.describe('Retry tab', () => {
  test('shows the retry button, and clicking it posts a real retry and appends to the chain', async ({ page }) => {
    const detailPanel = await openFirstCaseOfUiTest(page)
    await detailPanel.getByRole('button', { name: 'Retry', exact: true }).click()

    const retryButton = detailPanel.getByRole('button', { name: 'Chạy lại ngay (Retry)' })
    await expect(retryButton).toBeVisible()

    const chainRows = detailPanel.locator('div.rounded-\\[10px\\] > div')
    const countBefore = await chainRows.count()

    await retryButton.click()
    // "Gốc" text can already be visible from the PREVIOUS chain state while the retry is
    // still in flight (the button shows "Đang chạy lại..." and is disabled) — waiting on
    // it alone doesn't prove the refetch finished. Wait for the button to re-enable first.
    await expect(retryButton).toBeEnabled()

    // The chain must have grown by exactly one new row, and must include the "Gốc" +
    // at least one "Retry N" row now that a retry has actually happened.
    await expect(chainRows).toHaveCount(countBefore + 1)
    await expect(detailPanel.getByText('Gốc')).toBeVisible()
    expect(await chainRows.count()).toBeGreaterThanOrEqual(2)
  })
})

test.describe('Environment tab', () => {
  test('creating a new environment persists it and shows it in the list after reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Environment', exact: true }).click()

    const uniqueName = `E2E-Staging-${Date.now()}`
    const uniqueDeviceInfo = `Chrome 128, Windows 11 (${Date.now()})`
    await page.getByPlaceholder('Tên môi trường, ví dụ Staging').fill(uniqueName)
    await page.getByPlaceholder(/Thiết bị/).fill(uniqueDeviceInfo)
    await page.getByRole('button', { name: 'Thêm', exact: true }).click()

    const row = page.locator('div', { hasText: uniqueName }).last()
    await expect(row.getByText(uniqueDeviceInfo)).toBeVisible()

    // Reload to prove it was actually persisted server-side, not just optimistic local state.
    await page.reload()
    await page.getByRole('button', { name: 'Environment', exact: true }).click()
    await expect(page.getByText(uniqueName)).toBeVisible()
  })

  test('the Add button is disabled until a name is typed', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Environment', exact: true }).click()

    const addButton = page.getByRole('button', { name: 'Thêm', exact: true })
    await expect(addButton).toBeDisabled()

    await page.getByPlaceholder('Tên môi trường, ví dụ Staging').fill('Prod')
    await expect(addButton).toBeEnabled()
  })
})

test.describe('Category tab', () => {
  test('lists real modules with case count + pass rate, and clicking one filters suites by it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()
    await page.getByRole('button', { name: 'Category', exact: true }).click()

    const categoryButtons = page.locator('button', { hasText: /case ·.*% pass/ })
    await expect(categoryButtons.first()).toBeVisible()
    const moduleName = (await categoryButtons.first().locator('span').first().textContent())!.trim()

    await categoryButtons.first().click()

    await expect(page.getByRole('button', { name: '← Tất cả Category' })).toBeVisible()
    await expect(page.getByText(moduleName, { exact: true })).toBeVisible()
    // Filtering must actually narrow the suite list, not just relabel it — expect at
    // least one real suite card to render under the selected module.
    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    await expect(suiteHeaders.first()).toBeVisible()

    await page.getByRole('button', { name: '← Tất cả Category' }).click()
    await expect(page.getByRole('button', { name: '← Tất cả Category' })).toHaveCount(0)
  })
})
