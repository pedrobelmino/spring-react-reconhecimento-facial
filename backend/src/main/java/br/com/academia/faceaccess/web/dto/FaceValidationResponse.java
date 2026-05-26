package br.com.academia.faceaccess.web.dto;

public record FaceValidationResponse(boolean valid, String message, int faceCount) {}
