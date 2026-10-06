import * as path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {reportProfileComment} from '../src/profile-comment'
import run from '../src/main'
import {expect, jest, test, beforeEach} from '@jest/globals'

jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('../src/report-summary')
jest.mock('../src/report-comment')
jest.mock('../src/profile-comment')

const mockedCore = jest.mocked(core)

const mockBooleanInputs = (reportProfile: boolean): void => {
  mockedCore.getBooleanInput.mockImplementation(name => {
    if (name === 'reportProfile') return reportProfile
    return false
  })
}

describe('reportProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedCore.getInput.mockImplementation(name => {
      if (name === 'json-path')
        return path.resolve(__dirname, '../.dummy_results-*.json')
      return ''
    })
    Object.defineProperty(github, 'context', {
      value: {
        repo: {owner: 'owner', repo: 'repo'},
        issue: {number: 123}
      }
    })
  })

  test('posts profile comment when reportProfile is true', async () => {
    mockBooleanInputs(true)
    await run()
    expect(reportProfileComment).toHaveBeenCalled()
  })

  test('skips profile comment when reportProfile is false', async () => {
    mockBooleanInputs(false)
    await run()
    expect(reportProfileComment).not.toHaveBeenCalled()
  })
})
