package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.AcompanhamentoStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record AcompanhamentoSummaryDto(
        Long id,
        Long clienteId,
        String clienteNome,
        LocalDate dataConsulta,
        BigDecimal pesoKg,
        String profissional,
        AcompanhamentoStatus status,
        Instant createdAt) {}
