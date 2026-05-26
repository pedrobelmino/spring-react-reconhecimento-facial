package br.com.academia.faceaccess.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "face.access")
public class FaceAccessProperties {

    private int cooldownMinutes = 5;
    private int feedbackSeconds = 3;
    private int recognizeIntervalMs = 800;

    public int getCooldownMinutes() {
        return cooldownMinutes;
    }

    public void setCooldownMinutes(int cooldownMinutes) {
        this.cooldownMinutes = cooldownMinutes;
    }

    public int getFeedbackSeconds() {
        return feedbackSeconds;
    }

    public void setFeedbackSeconds(int feedbackSeconds) {
        this.feedbackSeconds = feedbackSeconds;
    }

    public int getRecognizeIntervalMs() {
        return recognizeIntervalMs;
    }

    public void setRecognizeIntervalMs(int recognizeIntervalMs) {
        this.recognizeIntervalMs = recognizeIntervalMs;
    }
}
