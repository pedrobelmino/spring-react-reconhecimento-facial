package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.MaquinaTipo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateMaquinaRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull MaquinaTipo tipo,
        @Size(max = 80) String marca,
        @Size(max = 80) String modelo,
        @Size(max = 50) String codigoPatrimonio,
        @Size(max = 120) String localizacao,
        @Size(max = 500) String observacoes) {}
