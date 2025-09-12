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
})
