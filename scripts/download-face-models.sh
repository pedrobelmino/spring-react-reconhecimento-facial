#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL_DIR="$ROOT/backend/src/main/resources/models"

mkdir -p "$MODEL_DIR"

DETECTOR_URL="https://github.com/Linzaer/Ultra-Light-Fast-Generic-Face-Detector-1MB/raw/master/models/onnx/version-RFB-320.onnx"
EMBEDDER_URL="https://github.com/onnx/models/raw/main/vision/body_analysis/arcface/model/arcfaceresnet100-8.onnx"

echo "Downloading face_detector.onnx..."
curl -fsSL "$DETECTOR_URL" -o "$MODEL_DIR/face_detector.onnx"

echo "Downloading face_embedder.onnx..."
curl -fsSL "$EMBEDDER_URL" -o "$MODEL_DIR/face_embedder.onnx"

echo "Models saved to $MODEL_DIR"
