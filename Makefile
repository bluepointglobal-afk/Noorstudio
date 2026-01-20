SHELL := /bin/bash

.PHONY: ship status validate

# Main command - runs everything
ship:
	@bash scripts/ship.sh

# Check current gate status
status:
	@bash scripts/detect-gate.sh

# Run validation only
validate:
	@bash scripts/validation/run_validation.sh
