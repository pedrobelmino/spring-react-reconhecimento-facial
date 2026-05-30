package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.AcompanhamentoStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record AcompanhamentoDto(
        Long id,
        Long clienteId,
        String clienteNome,
        LocalDate dataConsulta,
        BigDecimal pesoKg,
        String profissional,
        String objetivo,
        String orientacoes,
        LocalDate proximaConsulta,
        AcompanhamentoStatus status,
        Instant createdAt,
        Instant updatedAt) {}
