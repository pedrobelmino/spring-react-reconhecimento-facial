package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.MaquinaStatus;
import br.com.academia.faceaccess.domain.MaquinaTipo;
import java.time.Instant;

public record MaquinaSummaryDto(
        Long id, String nome, MaquinaTipo tipo, MaquinaStatus status, String localizacao, Instant createdAt) {}
