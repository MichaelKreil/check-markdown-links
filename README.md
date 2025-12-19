# What it does

This action verifies all links in all Markdown files:

- Are all **external links reachable** (expects 200 as response code)
- Are all **internal link correct** (do files exist)
- Are all **internal anchor links correct** (like "README.md#usage")

# Usage

Just add `- uses: michaelkreil/check-markdown-links@main` as step in your workflow.

# Example

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
