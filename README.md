# What it does

This action verifies all links in all Markdown files:

- Are all **external links reachable** (expects 200 as response code)
- Are all **internal link correct** (do files exist)
- Are all **internal anchor links correct** (like "README.md#usage")

# Usage

Just add `- uses: michaelkreil/check-markdown-links@main` as step in your workflow.

## Inputs

- `path`: The directory to scan for Markdown files (default: `.`)
- `skip_hosts`: Newline-separated list of hostnames to skip during external link checking (optional)

# Example

## Basic usage

```yaml
on:
  push:

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: michaelkreil/check-markdown-links@main
```

## Skip specific hosts

```yaml
on:
  push:

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: michaelkreil/check-markdown-links@main
        with:
          skip_hosts: |
            example.com
            test.org
            unreliable-api.com
```
