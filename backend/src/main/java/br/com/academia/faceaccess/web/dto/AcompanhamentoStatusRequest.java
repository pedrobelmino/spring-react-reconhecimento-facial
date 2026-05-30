package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.AcompanhamentoStatus;
import jakarta.validation.constraints.NotNull;

public record AcompanhamentoStatusRequest(@NotNull AcompanhamentoStatus status) {}
