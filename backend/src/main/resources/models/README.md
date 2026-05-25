# ONNX models

Run from repository root:

```bash
./scripts/download-face-models.sh
```

Expected files:

| File | Purpose |
| ---- | ------- |
| `face_detector.onnx` | Ultra-Light face detector |
| `face_embedder.onnx` | MobileFaceNet / ArcFace embedding (512-d) |

Models are loaded lazily on first inference. The Spring Boot app starts without loading them into memory.
