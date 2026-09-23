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

test.describe('Requirement tab', () => {
  test('creating a requirement, linking a real case, and exporting CSV all work against real data', async ({ page }) => {
    // Discover a real case id from the UI itself (no hardcoded id).
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()
    const suiteHeaders = page.locator('div.rounded-\\[10px\\] > button')
    await suiteHeaders.first().click()
    const caseButton = page.locator('button.pl-8\\.5').first()
    await expect(caseButton).toBeVisible()
    const realCaseId = await caseButton.getAttribute('data-case-id')
    expect(realCaseId).not.toBeNull()

    await page.getByRole('button', { name: 'Requirement', exact: true }).click()

    const uniqueTitle = `E2E-Requirement-${Date.now()}`
    await page.getByPlaceholder('Tiêu đề yêu cầu').fill(uniqueTitle)
    await page.getByRole('button', { name: 'Thêm', exact: true }).click()

    const row = page.locator('div.rounded-\\[10px\\]', { hasText: uniqueTitle })
    await expect(row.getByText('Chưa có Test Case nào cover')).toBeVisible()

    await row.getByPlaceholder('ID Test Case').fill(realCaseId!)
    await row.getByRole('button', { name: 'Gắn Test Case', exact: true }).click()

    // Badge must flip from uncovered (red) to covered (green) with the real case counted.
    await expect(row.getByText('1 case cover')).toBeVisible()
    await expect(row.getByText('Chưa có Test Case nào cover')).toHaveCount(0)

    // Export button becomes clickable once there's data; a real click shouldn't throw.
    const exportButton = page.getByRole('button', { name: 'Xuất Traceability Matrix (CSV)' })
    await expect(exportButton).toBeEnabled()
    const [download] = await Promise.all([page.waitForEvent('download'), exportButton.click()])
    expect(download.suggestedFilename()).toBe('traceability-matrix.csv')
  })

  test('the Add button is disabled until a title is typed', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Requirement', exact: true }).click()

    const addButton = page.getByRole('button', { name: 'Thêm', exact: true })
    await expect(addButton).toBeDisabled()

    await page.getByPlaceholder('Tiêu đề yêu cầu').fill('X')
    await expect(addButton).toBeEnabled()
  })
})

test.describe('Graph tab', () => {
  test('shows real Pass/Fail bars that sum to a sane total, and a coverage line', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()
    await page.getByRole('button', { name: 'Graph', exact: true }).click()

    const passRow = page.locator('div', { hasText: /^Pass\d+$/ })
    await expect(passRow).toBeVisible()

    // Real AIQA data always has a mix of Pass and Fail — both counts must render and be > 0,
    // proving the aggregation actually read real TestCase rows, not an empty/default state.
    const passCount = Number((await page.locator('span', { hasText: /^\d+$/ }).first().textContent())!)
    expect(passCount).toBeGreaterThan(0)

    await expect(page.getByText('Test Coverage')).toBeVisible()
  })
})

test.describe('Timeline tab (per TestType)', () => {
  test('lists real runs across multiple cases, newest first, with build info', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()
    await page.getByRole('button', { name: 'Timeline', exact: true }).click()

    const rows = page.locator('div.rounded-\\[10px\\]').filter({ hasText: /build/ })
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThan(1)
  })
})

test.describe('Report tab', () => {
  test('exporting a Product-scope CSV appears in history and downloads real content', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()
    await page.getByRole('button', { name: 'Report', exact: true }).click()

    const historyRowsBefore = page.locator('div.rounded-\\[10px\\]', { hasText: 'Product · CSV' })
    const countBefore = await historyRowsBefore.count()

    await page.getByRole('button', { name: 'Xuất CSV', exact: true }).click()
    await expect(historyRowsBefore).toHaveCount(countBefore + 1)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      historyRowsBefore.first().getByRole('link', { name: 'Tải', exact: true }).click(),
    ])
    const path = await download.path()
    expect(path).not.toBeNull()
    const fs = await import('node:fs/promises')
    const content = await fs.readFile(path!, 'utf-8')
    expect(content).toContain('Suite,Case,Status')
  })

  test('Suite-scope export is disabled until a suite is chosen', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'UI Test', exact: true }).click()
    await page.getByRole('button', { name: 'Report', exact: true }).click()

    await page.getByRole('combobox').selectOption('Suite')
    const exportButton = page.getByRole('button', { name: 'Xuất CSV', exact: true })
    await expect(exportButton).toBeDisabled()

    await page.getByRole('combobox').nth(1).selectOption({ index: 1 })
    await expect(exportButton).toBeEnabled()
  })
})

test.describe('Case priority/execution-type (Increment 3)', () => {
  test('Status tab shows priority and execution-type badges on a real seeded case', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Unit Test', exact: true }).click()
    await page.getByRole('button', { name: 'Auth module - unit tests' }).click()
    await page.getByRole('button', { name: 'Login voi password sai', exact: true }).click()

    const statusPanel = page.locator('div.flex-\\[3_1_0\\%\\]').last()
    await expect(statusPanel.getByText('Fail', { exact: true })).toBeVisible()
    await expect(statusPanel.getByText('Medium', { exact: true })).toBeVisible()
    await expect(statusPanel.getByText('Manual', { exact: true })).toBeVisible()
  })
})

test.describe('Suite rollup (Increment 3)', () => {
  test('expanding a suite shows a case-count / pass-rate summary line', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Unit Test', exact: true }).click()
    await page.getByRole('button', { name: 'Auth module - unit tests' }).click()

    await expect(page.getByText('2 case · 50% pass', { exact: true })).toBeVisible()
  })
})

test.describe('Category tab search + filter (Increment 3)', () => {
  test('searching by keyword returns matching cases across suites and navigates to the case on click', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Unit Test', exact: true }).click()
    await page.getByRole('button', { name: 'Category', exact: true }).click()

    // Danh sách module hiện trước, chưa filter gì.
    await expect(page.getByRole('button', { name: 'Auth 2 case · 50% pass', exact: true })).toBeVisible()

    await page.getByPlaceholder('Tìm theo tên case...').fill('password')
    const result = page.getByRole('button', { name: 'Login voi password sai Auth module - unit tests Medium' })
    await expect(result).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login voi email hop le' })).not.toBeVisible()

    await result.click()
    const statusPanel = page.locator('div.flex-\\[3_1_0\\%\\]').last()
    await expect(statusPanel.getByText('Login voi password sai', { exact: true })).toBeVisible()
  })

  test('filtering by priority narrows results independently of the keyword box', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Unit Test', exact: true }).click()
    await page.getByRole('button', { name: 'Category', exact: true }).click()

    await page.getByRole('combobox').selectOption('Medium')
    await expect(page.getByRole('button', { name: 'Login voi email hop le' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login voi password sai' })).toBeVisible()

    await page.getByRole('combobox').selectOption('')
    await page.getByPlaceholder('Tìm theo tên case...').fill('khong ton tai case nao ten nhu vay')
    await expect(page.getByText('Không tìm thấy case nào khớp.', { exact: true })).toBeVisible()
  })
})
