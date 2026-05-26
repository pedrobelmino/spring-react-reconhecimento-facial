package br.com.academia.faceaccess.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FaceAccessProperties.class)
public class FaceAccessConfig {
}
