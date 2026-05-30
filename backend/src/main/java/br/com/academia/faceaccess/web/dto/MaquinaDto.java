package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.MaquinaStatus;
import br.com.academia.faceaccess.domain.MaquinaTipo;
import java.time.Instant;

public record MaquinaDto(
        Long id,
        String nome,
        MaquinaTipo tipo,
        String marca,
        String modelo,
        String codigoPatrimonio,
        String localizacao,
        MaquinaStatus status,
        String observacoes,
        Instant createdAt,
        Instant updatedAt) {}
