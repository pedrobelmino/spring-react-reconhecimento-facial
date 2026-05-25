package br.com.academia.faceaccess.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "face.recognition")
public class FaceRecognitionProperties {

    private double threshold = 0.6;
    private int embeddingDim = 512;
    private String detectorModel = "classpath:models/face_detector.onnx";
    private String embedderModel = "classpath:models/face_embedder.onnx";

    public double getThreshold() {
        return threshold;
    }

    public void setThreshold(double threshold) {
        this.threshold = threshold;
    }

    public int getEmbeddingDim() {
        return embeddingDim;
    }

    public void setEmbeddingDim(int embeddingDim) {
        this.embeddingDim = embeddingDim;
    }

    public String getDetectorModel() {
        return detectorModel;
    }

    public void setDetectorModel(String detectorModel) {
        this.detectorModel = detectorModel;
    }

    public String getEmbedderModel() {
        return embedderModel;
    }

    public void setEmbedderModel(String embedderModel) {
        this.embedderModel = embedderModel;
    }
}
