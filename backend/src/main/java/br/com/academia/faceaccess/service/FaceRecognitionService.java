package br.com.academia.faceaccess.service;

import br.com.academia.faceaccess.config.FaceRecognitionProperties;
import br.com.academia.faceaccess.domain.FaceFoto;
import br.com.academia.faceaccess.repository.FaceFotoRepository;
import br.com.academia.faceaccess.service.faces.FaceDetector;
import br.com.academia.faceaccess.service.faces.FaceEmbedder;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class FaceRecognitionService {

    private final FaceDetector faceDetector;
    private final FaceEmbedder faceEmbedder;
    private final FaceFotoRepository faceFotoRepository;
    private final double threshold;
    private volatile List<EmbeddingCandidate> embeddingCache = List.of();

    public FaceRecognitionService(
            FaceDetector faceDetector,
            FaceEmbedder faceEmbedder,
            FaceFotoRepository faceFotoRepository,
            FaceRecognitionProperties properties) {
        this.faceDetector = faceDetector;
        this.faceEmbedder = faceEmbedder;
        this.faceFotoRepository = faceFotoRepository;
        this.threshold = properties.getThreshold();
    }

    public List<Rectangle> detectFaces(BufferedImage image) {
        return faceDetector.detectFaces(image);
    }

    public float[] extractEmbedding(BufferedImage image) {
        List<Rectangle> faces = detectFaces(image);
        if (faces.size() != 1) {
            throw new IllegalStateException("Expected exactly one face for embedding, found: " + faces.size());
        }
        BufferedImage crop = crop(image, faces.getFirst());
        return faceEmbedder.extractEmbedding(crop);
    }

    public Optional<FaceMatch> findBestMatch(float[] queryEmbedding) {
        refreshCacheIfEmpty();
        return embeddingCache.stream()
                .map(candidate -> new ScoredMatch(candidate, euclideanDistance(queryEmbedding, candidate.embedding())))
                .filter(scored -> scored.distance() <= threshold)
                .min(Comparator.comparingDouble(ScoredMatch::distance))
                .map(scored -> new FaceMatch(
                        scored.candidate().clienteId(),
                        scored.candidate().faceFotoId(),
                        scored.distance()));
    }

    public void refreshEmbeddingCache() {
        embeddingCache = faceFotoRepository.findAll().stream()
                .map(this::toCandidate)
                .toList();
    }

    private void refreshCacheIfEmpty() {
        if (embeddingCache.isEmpty()) {
            refreshEmbeddingCache();
        }
    }

    private EmbeddingCandidate toCandidate(FaceFoto foto) {
        return new EmbeddingCandidate(
                foto.getCliente().getId(),
                foto.getId(),
                toFloatArray(foto.getEmbedding(), foto.getEmbeddingDim()));
    }

    private static float[] toFloatArray(byte[] bytes, short dim) {
        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        float[] values = new float[dim];
        for (int i = 0; i < dim; i++) {
            values[i] = buffer.getFloat();
        }
        return values;
    }

    private static byte[] toBytes(float[] embedding) {
        ByteBuffer buffer = ByteBuffer.allocate(embedding.length * Float.BYTES).order(ByteOrder.LITTLE_ENDIAN);
        for (float value : embedding) {
            buffer.putFloat(value);
        }
        return buffer.array();
    }

    public static byte[] embeddingToBytes(float[] embedding) {
        return toBytes(embedding);
    }

    private static double euclideanDistance(float[] left, float[] right) {
        double sum = 0;
        int length = Math.min(left.length, right.length);
        for (int i = 0; i < length; i++) {
            double delta = left[i] - right[i];
            sum += delta * delta;
        }
        return Math.sqrt(sum);
    }

    private static BufferedImage crop(BufferedImage image, Rectangle bounds) {
        int x = Math.max(0, bounds.x);
        int y = Math.max(0, bounds.y);
        int width = Math.min(bounds.width, image.getWidth() - x);
        int height = Math.min(bounds.height, image.getHeight() - y);
        return image.getSubimage(x, y, width, height);
    }

    public record EmbeddingCandidate(long clienteId, long faceFotoId, float[] embedding) {}

    public record FaceMatch(long clienteId, long faceFotoId, double distance) {}

    private record ScoredMatch(EmbeddingCandidate candidate, double distance) {}
}
