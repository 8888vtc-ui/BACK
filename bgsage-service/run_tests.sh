#!/usr/bin/env bash
# Lance les tests pytest du microservice bgsage.
# Usage : ./run_tests.sh
set -e

cd "$(dirname "$0")"

python -m pytest tests/ -v
