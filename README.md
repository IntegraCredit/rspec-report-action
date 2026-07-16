# RSpec Report Action

Generates RSpec failure reporting in GitHub Actions.

This repository was cloned from [SonicGarden/rspec-report-action](https://github.com/SonicGarden/rspec-report-action) and is maintained for internal use and security requirements.

> Note: GitHub Actions (CI/CD) workflows for this repository are not currently running.

## What It Does

- Parses one or more RSpec JSON result files (glob supported).
- Writes a Job Summary report.
- Optionally writes a PR failure/success summary comment.
- Writes a PR slowest-examples profile comment when running in PR context.

## Inputs

Source of truth: [action.yml](action.yml).

| Name | Description | Default | Required |
| - | - | - | - |
| `json-path` | Path or glob for RSpec JSON result files. |  | yes |
| `token` | Token used for PR comment operations. | `${{ github.token }}` | no |
| `title` | Heading for summary/failure comment content. | `# :cold_sweat: RSpec failure` | no |
| `hideFooterLink` | Hides footer link in Job Summary when `true`. | `false` | no |
| `comment` | Enables summary/failure PR comment behavior when `true`. | `true` | no |
| `profileTitle` | Heading for slowest-examples PR profile comment. | `# Slowest examples` | no |
| `reportOnSuccess` | Emits success summary output when all examples pass. | `false` | no |

## Behavior Details

- `json-path` is required.
- Job Summary is written when there are failures, or when `reportOnSuccess: true`.
- PR summary/failure comments are written only when both `comment: true` and PR context exists.
- PR profile comment is written whenever PR context exists.

## Basic Usage

```yaml
name: Build
on:
  pull_request:

jobs:
  rspec:
    steps:
      # setup...

      - name: Test
        run: bundle exec rspec -f j -o tmp/rspec_results.json -f p

      - name: Publish RSpec JSON test report
        if: ${{ endsWith(inputs.report_paths, '.json') && (success() || failure()) }}
        continue-on-error: true
        uses: IntegraCredit/rspec-report-action@main
        with:
          title: ${{ inputs.report_comment_title }}
          profileTitle: ${{ inputs.report_comment_profile_title }}
          token: ${{ steps.app-token.outputs.token }}
          json-path: ${{ inputs.report_paths }}
          reportOnSuccess: ${{ inputs.report_on_success && 'true' || 'false' }}
```

## Containerized Test Runner

Run project checks in Docker instead of relying on local Node/pnpm setup.

```bash
pnpm run test:docker
```

The orchestration script is [script/dockerruntests](script/dockerruntests).

```bash
./script/dockerruntests
./script/dockerruntests pnpm run lint
./script/dockerruntests bash
```

- Always builds the Docker test image first.
- With no arguments, runs image `CMD` and exits.
- With arguments, uses them as Docker command override.
- Pass `bash` for interactive shell access.
