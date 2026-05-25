package br.com.academia.faceaccess.service.faces;

import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.ndarray.NDList;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.translate.Batchifier;
import ai.djl.translate.Translator;
import ai.djl.translate.TranslatorContext;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DjlFaceEmbedder implements FaceEmbedder, AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(DjlFaceEmbedder.class);

    private final String modelLocation;
    private final ResourceLoader resourceLoader;
    private final int embeddingDim;
    private Path modelPath;
    private ZooModel<Image, float[]> model;
    private Predictor<Image, float[]> predictor;

    public DjlFaceEmbedder(String modelLocation, int embeddingDim, ResourceLoader resourceLoader) {
        this.modelLocation = modelLocation;
        this.embeddingDim = embeddingDim;
        this.resourceLoader = resourceLoader;
    }

    @Override
    public float[] extractEmbedding(BufferedImage faceImage) {
        ensureLoaded();
        try {
            return predictor.predict(ImageFactory.getInstance().fromImage(faceImage));
        } catch (Exception e) {
            throw new IllegalStateException("Face embedding failed", e);
        }
    }

    private synchronized void ensureLoaded() {
        if (predictor != null) {
            return;
        }
        Path path = resolveModelPath();
        if (!Files.exists(path)) {
            throw new IllegalStateException("Face embedder model not found: " + path);
        }
        try {
            Criteria<Image, float[]> criteria = Criteria.builder()
                    .setTypes(Image.class, float[].class)
                    .optEngine("OnnxRuntime")
                    .optModelPath(path)
                    .optTranslator(new RawEmbeddingTranslator(embeddingDim))
                    .build();
            model = criteria.loadModel();
            predictor = model.newPredictor();
            log.info("Loaded face embedder model from {}", path);
        } catch (IOException | ModelException e) {
            throw new IllegalStateException("Unable to load face embedder model", e);
        }
    }

    private Path resolveModelPath() {
        if (modelPath != null) {
            return modelPath;
        }
        try {
            Resource resource = resourceLoader.getResource(modelLocation);
            modelPath = Path.of(resource.getURI());
            return modelPath;
        } catch (IOException e) {
            throw new IllegalStateException("Unable to resolve face embedder model location: " + modelLocation, e);
        }
    }

    @Override
    public void close() {
        if (predictor != null) {
            predictor.close();
        }
        if (model != null) {
            model.close();
        }
    }

    private static final class RawEmbeddingTranslator implements Translator<Image, float[]> {

        private final int embeddingDim;

        private RawEmbeddingTranslator(int embeddingDim) {
            this.embeddingDim = embeddingDim;
        }

        @Override
        public NDList processInput(TranslatorContext ctx, Image input) {
            return new NDList(input.toNDArray(ctx.getNDManager()).expandDims(0));
        }

        @Override
        public float[] processOutput(TranslatorContext ctx, NDList list) {
            float[] values = list.get(0).toFloatArray();
            if (values.length == embeddingDim) {
                return values;
            }
            if (values.length > embeddingDim) {
                float[] trimmed = new float[embeddingDim];
                System.arraycopy(values, 0, trimmed, 0, embeddingDim);
                return trimmed;
            }
            float[] padded = new float[embeddingDim];
            System.arraycopy(values, 0, padded, 0, values.length);
            return padded;
        }

        @Override
        public Batchifier getBatchifier() {
            return Batchifier.STACK;
        }
    }
}
