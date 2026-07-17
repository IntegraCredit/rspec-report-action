# RSpec Report Action

Generates RSpec failure reporting in GitHub Actions.

This repository was cloned from [SonicGarden/rspec-report-action](https://github.com/SonicGarden/rspec-report-action) and is maintained for internal use and security requirements.

> :bangbang: GitHub Actions (CI/CD) workflows for this repository are not
> currently running and the `test.yml` workflow file is a remnant from original
> clone.

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

## Containerized Development Environment

Run project checks in Docker instead of relying on local Node/pnpm setup. The container uses the same Node 24 runtime as the published action.

The orchestration script is [script/dockerrun](script/dockerrun).

```bash
./script/dockerrun              # runs pnpm test (default)
./script/dockerrun pnpm run all # build + format + lint + package + test
./script/dockerrun bash         # interactive shell access
```

- Always builds the Docker image first.
- Volume-mounts the project root into the container so build output (e.g. `dist/`) lands on the host filesystem.
- Installs dependencies inside the container before running the command.
- With no arguments, runs `pnpm test`.
- With arguments, runs them as the command.
- Script exit code is always the exit code of the container command.

### Building for Release

To build the distributable `dist/` bundle for release, run:

```bash
./script/dockerrun pnpm run package
```

This compiles the TypeScript source and bundles it with `ncc` into `dist/index.js`, which is what GitHub Actions executes at runtime. The resulting `dist/` changes should be committed.

To run the full pipeline (build, format, lint, package, and test):

```bash
./script/dockerrun pnpm run all
```

### npm Script Shortcuts

| Script | Command |
| - | - |
| `pnpm run test:docker` | `./script/dockerrun` (tests only) |
| `pnpm run build:docker` | `./script/dockerrun pnpm run package` |
| `pnpm run all:docker` | `./script/dockerrun pnpm run all` |
