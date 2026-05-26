package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.ClienteStatus;
import java.time.Instant;
import java.util.List;

public record ClienteDto(
        Long id,
        String nome,
        String cpf,
        ClienteStatus status,
        Instant createdAt,
        Instant updatedAt,
        List<String> fotoUrls) {}
