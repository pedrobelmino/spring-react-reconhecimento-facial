#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building frontend..."
cd "$ROOT/frontend"
npm ci
npm run build

echo "Building backend JAR..."
cd "$ROOT/backend"
mvn -q package -DskipTests

echo "Artifact: $ROOT/backend/target/faceaccess-0.0.1-SNAPSHOT.jar"
