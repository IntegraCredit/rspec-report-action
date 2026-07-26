import * as core from '@actions/core'
import * as github from '@actions/github'
import replaceComment, {deleteComment} from '@aki77/actions-replace-comment'
import {reportComment} from '../src/report-comment'
import {expect, jest, test, beforeEach, afterEach} from '@jest/globals'

jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('@aki77/actions-replace-comment')

const mockedCore = jest.mocked(core)
const mockedGithub = jest.mocked(github)
const mockedReplaceComment = jest.mocked(replaceComment)
const mockedDeleteComment = jest.mocked(deleteComment)

describe('reportComment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedCore.getInput.mockImplementation(name => {
      if (name === 'title') return 'Test Report Title'
      if (name === 'token') return 'dummy-token'
      if (name === 'reportOnSuccess') return 'true'
      return ''
    })
    mockedCore.getBooleanInput.mockImplementation(name => {
      if (name === 'reportOnSuccess') return true
      if (name === 'comment') return true
      return false
    })
    Object.defineProperty(github, 'context', {
      value: {
        repo: {owner: 'owner', repo: 'repo'},
        issue: {number: 123},
        serverUrl: 'https://github.com',
        sha: 'dummysha'
      }
    })
  })

  test('posts summary comment on success when reportOnSuccess is true', async () => {
    const result = {
      success: true,
      summary: 'All tests passed',
      examples: [],
      slowExamples: [],
      totalTime: 1.23
    }
    await reportComment(result)
    expect(replaceComment).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'dummy-token',
        owner: 'owner',
        repo: 'repo',
        issue_number: 123,
        body: expect.stringContaining(':tada:')
      })
    )
  })

  test('deletes summary comment on success when reportOnSuccess is false', async () => {
    mockedCore.getInput.mockImplementation(name => {
      if (name === 'title') return 'Test Report Title'
      if (name === 'token') return 'dummy-token'
      if (name === 'reportOnSuccess') return 'false'
      return ''
    })
    mockedCore.getBooleanInput.mockImplementation(name => {
      if (name === 'reportOnSuccess') return false
      if (name === 'comment') return true
      return false
    })
    const result = {
      success: true,
      summary: 'All tests passed',
      examples: [],
      slowExamples: [],
      totalTime: 1.23
    }
    await reportComment(result)
    expect(deleteComment).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'dummy-token',
        owner: 'owner',
        repo: 'repo',
        issue_number: 123,
        body: 'Test Report Title',
        startsWith: true
      })
    )
  })

  test('posts detailed comment on failure', async () => {
    const result = {
      success: false,
      summary: '1 failure',
      examples: [
        {
          filePath: 'spec/foo.rb',
          lineNumber: 42,
          description: 'fails',
          message: 'expected: true, got: false'
        }
      ],
      slowExamples: [],
      totalTime: 1.23
    }
    await reportComment(result)
    expect(replaceComment).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'dummy-token',
        owner: 'owner',
        repo: 'repo',
        issue_number: 123,
        body: expect.stringContaining('Test Report Title')
      })
    )
  })

  test('sanitizes multi-line descriptions and pipe characters so the table stays well-formed', async () => {
    const result = {
      success: false,
      summary: '1 failure',
      examples: [
        {
          filePath: 'spec/foo.rb',
          lineNumber: 42,
          description:
            'An existing customer navigates\nto another customer | token URL.\nThis should NOT happen.',
          message: 'expected: true, got: false'
        }
      ],
      slowExamples: [],
      totalTime: 1.23
    }
    await reportComment(result)

    const [{body}] = mockedReplaceComment.mock.calls[0]
    // The table must not contain any raw newlines or unescaped pipes within a
    // row, otherwise GitHub renders a broken table. Every line that isn't
    // itself blank should be a proper "| ... | ... |" table row.
    const tableRows = (body as string)
      .split('\n')
      .filter(line => line.startsWith('|'))
    expect(tableRows).toHaveLength(3) // header row, alignment row, one data row
    expect(tableRows[2]).toContain('to another customer \\| token URL.')
    expect(body as string).not.toContain('navigates\nto')
  })

  test('preserves paragraph breaks in multi-line descriptions as <br><br>', async () => {
    const result = {
      success: false,
      summary: '1 failure',
      examples: [
        {
          filePath: 'spec/foo.rb',
          lineNumber: 42,
          description:
            'First paragraph line one\nline two.\n\nSecond paragraph.\n\nThird paragraph.',
          message: 'expected: true, got: false'
        }
      ],
      slowExamples: [],
      totalTime: 1.23
    }
    await reportComment(result)

    const [{body}] = mockedReplaceComment.mock.calls[0]
    const tableRows = (body as string)
      .split('\n')
      .filter(line => line.startsWith('|'))
    expect(tableRows).toHaveLength(3)
    // Hard-wrapped single newline within a paragraph collapses to a space...
    expect(tableRows[2]).toContain('First paragraph line one line two.')
    // ...while blank-line paragraph breaks become <br><br>.
    expect(tableRows[2]).toContain(
      'First paragraph line one line two.<br><br>Second paragraph.<br><br>Third paragraph.'
    )
  })

  test('renders bullet lines as an actual <ul><li> list instead of inline dashes', async () => {
    const result = {
      success: false,
      summary: '1 failure',
      examples: [
        {
          filePath: 'spec/foo.rb',
          lineNumber: 42,
          description:
            'Expected behavior (once fixed):\n  - Customer B should NOT receive an LA.\n  - The system should reject the token.',
          message: 'expected: true, got: false'
        }
      ],
      slowExamples: [],
      totalTime: 1.23
    }
    await reportComment(result)

    const [{body}] = mockedReplaceComment.mock.calls[0]
    const tableRows = (body as string)
      .split('\n')
      .filter(line => line.startsWith('|'))
    expect(tableRows).toHaveLength(3)
    expect(tableRows[2]).toContain(
      'Expected behavior (once fixed): <ul><li>Customer B should NOT receive an LA.</li><li>The system should reject the token.</li></ul>'
    )
  })
})
