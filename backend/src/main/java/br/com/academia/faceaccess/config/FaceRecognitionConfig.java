package br.com.academia.faceaccess.config;

import br.com.academia.faceaccess.service.faces.DjlFaceDetector;
import br.com.academia.faceaccess.service.faces.DjlFaceEmbedder;
import br.com.academia.faceaccess.service.faces.FaceDetector;
import br.com.academia.faceaccess.service.faces.FaceEmbedder;
import java.io.IOException;
import java.nio.file.Path;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ResourceLoader;

@Configuration
@EnableConfigurationProperties(FaceRecognitionProperties.class)
public class FaceRecognitionConfig {

    @Bean(destroyMethod = "close")
    FaceDetector faceDetector(FaceRecognitionProperties properties, ResourceLoader resourceLoader) {
        return new DjlFaceDetector(properties.getDetectorModel(), resourceLoader);
    }

    @Bean(destroyMethod = "close")
    FaceEmbedder faceEmbedder(FaceRecognitionProperties properties, ResourceLoader resourceLoader) {
        return new DjlFaceEmbedder(
                properties.getEmbedderModel(),
                properties.getEmbeddingDim(),
                resourceLoader);
    }
}
