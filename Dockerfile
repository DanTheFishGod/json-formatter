# syntax=docker/dockerfile:1

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
#
# Uses the official Playwright image which ships with all Chromium system
# dependencies pre-installed (fonts, shared libs, etc.).
# Version is pinned to match the @playwright/test npm package version.
FROM mcr.microsoft.com/playwright:v1.61.0-noble AS build

WORKDIR /app

# Install Bun (used by the build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install Node dependencies (includes @playwright/test)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build the production extension bundle
COPY . .
RUN NODE_ENV=production bun run task/build

# ─── Stage 2: Test ───────────────────────────────────────────────────────────
FROM build AS test

# Chromium is already installed in the Playwright base image.
# Run the production test suite.
CMD ["npx", "playwright", "test", "--project", "extension-prod"]
