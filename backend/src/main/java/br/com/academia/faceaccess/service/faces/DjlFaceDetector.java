package br.com.academia.faceaccess.service.faces;

import ai.djl.ModelException;
import ai.djl.inference.Predictor;
import ai.djl.modality.Classifications;
import ai.djl.modality.cv.Image;
import ai.djl.modality.cv.ImageFactory;
import ai.djl.modality.cv.output.DetectedObjects;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.translate.TranslateException;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DjlFaceDetector implements FaceDetector, AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(DjlFaceDetector.class);

    private final String modelLocation;
    private final ResourceLoader resourceLoader;
    private Path modelPath;
    private ZooModel<Image, DetectedObjects> model;
    private Predictor<Image, DetectedObjects> predictor;

    public DjlFaceDetector(String modelLocation, ResourceLoader resourceLoader) {
        this.modelLocation = modelLocation;
        this.resourceLoader = resourceLoader;
    }

    @Override
    public List<Rectangle> detectFaces(BufferedImage image) {
        ensureLoaded();
        try {
            DetectedObjects detections = predictor.predict(ImageFactory.getInstance().fromImage(image));
            List<Rectangle> faces = new ArrayList<>();
            for (Classifications.Classification item : detections.items()) {
                if (item instanceof DetectedObjects.DetectedObject detected) {
                    faces.add(toRectangle(detected.getBoundingBox().getBounds()));
                }
            }
            return faces;
        } catch (TranslateException e) {
            throw new IllegalStateException("Face detection failed", e);
        }
    }

    private static Rectangle toRectangle(ai.djl.modality.cv.output.Rectangle bounds) {
        return new Rectangle(
                (int) bounds.getX(),
                (int) bounds.getY(),
                (int) bounds.getWidth(),
                (int) bounds.getHeight());
    }

    private synchronized void ensureLoaded() {
        if (predictor != null) {
            return;
        }
        Path path = resolveModelPath();
        if (!Files.exists(path)) {
            throw new IllegalStateException("Face detector model not found: " + path);
        }
        try {
            Criteria<Image, DetectedObjects> criteria = Criteria.builder()
                    .setTypes(Image.class, DetectedObjects.class)
                    .optEngine("OnnxRuntime")
                    .optModelPath(path)
                    .optTranslator(new UltraLightFaceDetectorTranslator())
                    .build();
            model = criteria.loadModel();
            predictor = model.newPredictor();
            log.info("Loaded face detector model from {}", path);
        } catch (IOException | ModelException e) {
            throw new IllegalStateException("Unable to load face detector model", e);
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
            throw new IllegalStateException("Unable to resolve face detector model location: " + modelLocation, e);
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
}
