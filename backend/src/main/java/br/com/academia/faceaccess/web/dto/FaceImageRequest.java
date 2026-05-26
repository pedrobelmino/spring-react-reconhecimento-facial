package br.com.academia.faceaccess.web.dto;

import jakarta.validation.constraints.NotBlank;

public record FaceImageRequest(@NotBlank String imageBase64) {}
