package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.MaquinaStatus;
import jakarta.validation.constraints.NotNull;

public record MaquinaStatusRequest(@NotNull MaquinaStatus status) {}
