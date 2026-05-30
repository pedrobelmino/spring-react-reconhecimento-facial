package br.com.academia.faceaccess.web;

import br.com.academia.faceaccess.domain.AcompanhamentoNutricional;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.service.AcompanhamentoNutricionalService;
import br.com.academia.faceaccess.service.AcompanhamentoNutricionalService.CreateAcompanhamentoCommand;
import br.com.academia.faceaccess.service.AcompanhamentoNutricionalService.UpdateAcompanhamentoCommand;
import br.com.academia.faceaccess.web.dto.AcompanhamentoDto;
import br.com.academia.faceaccess.web.dto.AcompanhamentoStatusRequest;
import br.com.academia.faceaccess.web.dto.AcompanhamentoSummaryDto;
import br.com.academia.faceaccess.web.dto.CreateAcompanhamentoRequest;
import br.com.academia.faceaccess.web.dto.UpdateAcompanhamentoRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/acompanhamentos")
public class AcompanhamentoNutricionalController {

    private final AcompanhamentoNutricionalService acompanhamentoService;

    public AcompanhamentoNutricionalController(AcompanhamentoNutricionalService acompanhamentoService) {
        this.acompanhamentoService = acompanhamentoService;
    }

    @GetMapping
    public List<AcompanhamentoSummaryDto> listar(
            @RequestParam(required = false) Long clienteId, @RequestParam(required = false) String q) {
        return acompanhamentoService.listar(clienteId, q).stream().map(this::toSummaryDto).toList();
    }

    @PostMapping
    public ResponseEntity<AcompanhamentoDto> criar(@Valid @RequestBody CreateAcompanhamentoRequest request) {
        AcompanhamentoNutricional acompanhamento = acompanhamentoService.criar(new CreateAcompanhamentoCommand(
                request.clienteId(),
                request.dataConsulta(),
                request.pesoKg(),
                request.profissional(),
                request.objetivo(),
                request.orientacoes(),
                request.proximaConsulta()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(acompanhamento));
    }

    @GetMapping("/{id}")
    public AcompanhamentoDto buscar(@PathVariable Long id) {
        return toDto(acompanhamentoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public AcompanhamentoDto atualizar(
            @PathVariable Long id, @Valid @RequestBody UpdateAcompanhamentoRequest request) {
        AcompanhamentoNutricional acompanhamento = acompanhamentoService.atualizar(
                id,
                new UpdateAcompanhamentoCommand(
                        request.dataConsulta(),
                        request.pesoKg(),
                        request.profissional(),
                        request.objetivo(),
                        request.orientacoes(),
                        request.proximaConsulta()));
        return toDto(acompanhamento);
    }

    @PatchMapping("/{id}/status")
    public AcompanhamentoDto alterarStatus(
            @PathVariable Long id, @Valid @RequestBody AcompanhamentoStatusRequest request) {
        return toDto(acompanhamentoService.alterarStatus(id, request.status()));
    }

    private AcompanhamentoSummaryDto toSummaryDto(AcompanhamentoNutricionalService.AcompanhamentoSummary summary) {
        return new AcompanhamentoSummaryDto(
                summary.id(),
                summary.clienteId(),
                summary.clienteNome(),
                summary.dataConsulta(),
                summary.pesoKg(),
                summary.profissional(),
                summary.status(),
                summary.createdAt());
    }

    private AcompanhamentoDto toDto(AcompanhamentoNutricional acompanhamento) {
        Cliente cliente = acompanhamento.getCliente();
        return new AcompanhamentoDto(
                acompanhamento.getId(),
                cliente.getId(),
                cliente.getNome(),
                acompanhamento.getDataConsulta(),
                acompanhamento.getPesoKg(),
                acompanhamento.getProfissional(),
                acompanhamento.getObjetivo(),
                acompanhamento.getOrientacoes(),
                acompanhamento.getProximaConsulta(),
                acompanhamento.getStatus(),
                acompanhamento.getCreatedAt(),
                acompanhamento.getUpdatedAt());
    }
}
