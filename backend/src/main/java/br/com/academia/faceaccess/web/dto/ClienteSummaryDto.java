package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.ClienteStatus;
import java.time.Instant;
import java.util.List;

public record ClienteSummaryDto(
        Long id, String nome, String cpfMascarado, ClienteStatus status, Instant createdAt) {}
