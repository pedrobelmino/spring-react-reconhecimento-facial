package br.com.academia.faceaccess.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateAcompanhamentoRequest(
        @NotNull @PastOrPresent LocalDate dataConsulta,
        @DecimalMin("20.0") @DecimalMax("500.0") BigDecimal pesoKg,
        @Size(max = 120) String profissional,
        @Size(max = 200) String objetivo,
        @Size(max = 2000) String orientacoes,
        LocalDate proximaConsulta) {}
