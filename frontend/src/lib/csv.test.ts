import { describe, expect, it } from 'vitest'
import { buildCsv } from './csv'

describe('buildCsv', () => {
  it('joins headers and rows with commas and newlines', () => {
    expect(buildCsv(['a', 'b'], [[1, 2], [3, 4]])).toBe('a,b\n1,2\n3,4')
  })

  it('wraps a value containing a comma in double quotes', () => {
    expect(buildCsv(['title'], [['Hello, world']])).toBe('title\n"Hello, world"')
  })

  it('escapes double quotes by doubling them', () => {
    expect(buildCsv(['title'], [['say "hi"']])).toBe('title\n"say ""hi"""')
  })

  it('wraps a value containing a newline in double quotes', () => {
    expect(buildCsv(['title'], [['line1\nline2']])).toBe('title\n"line1\nline2"')
  })

  it('leaves plain values unquoted', () => {
    expect(buildCsv(['title'], [['plain']])).toBe('title\nplain')
  })
})
