package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.validation.CpfValid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateClienteRequest(
        @NotBlank String nome,
        @NotBlank @CpfValid String cpf,
        @Size(min = 2, max = 2) List<@NotBlank String> photosBase64) {}
