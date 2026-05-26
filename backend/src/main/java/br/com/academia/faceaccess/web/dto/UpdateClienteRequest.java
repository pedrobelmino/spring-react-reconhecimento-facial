package br.com.academia.faceaccess.web.dto;

import br.com.academia.faceaccess.validation.CpfValid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record UpdateClienteRequest(
        @NotBlank String nome, @NotBlank @CpfValid String cpf, List<@NotBlank String> photosBase64) {}
