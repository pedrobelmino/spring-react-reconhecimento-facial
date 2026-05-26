package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.ClienteStatus;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull ClienteStatus status) {}
