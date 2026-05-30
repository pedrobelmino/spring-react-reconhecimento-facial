package br.com.academia.faceaccess.web;

import br.com.academia.faceaccess.domain.Maquina;
import br.com.academia.faceaccess.service.MaquinaService;
import br.com.academia.faceaccess.service.MaquinaService.CreateMaquinaCommand;
import br.com.academia.faceaccess.service.MaquinaService.UpdateMaquinaCommand;
import br.com.academia.faceaccess.web.dto.CreateMaquinaRequest;
import br.com.academia.faceaccess.web.dto.MaquinaDto;
import br.com.academia.faceaccess.web.dto.MaquinaStatusRequest;
import br.com.academia.faceaccess.web.dto.MaquinaSummaryDto;
import br.com.academia.faceaccess.web.dto.UpdateMaquinaRequest;
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
@RequestMapping("/api/maquinas")
public class MaquinaController {

    private final MaquinaService maquinaService;

    public MaquinaController(MaquinaService maquinaService) {
        this.maquinaService = maquinaService;
    }

    @GetMapping
    public List<MaquinaSummaryDto> listar(@RequestParam(required = false) String q) {
        return maquinaService.listar(q).stream().map(this::toSummaryDto).toList();
    }

    @PostMapping
    public ResponseEntity<MaquinaDto> criar(@Valid @RequestBody CreateMaquinaRequest request) {
        Maquina maquina = maquinaService.criar(new CreateMaquinaCommand(
                request.nome(),
                request.tipo(),
                request.marca(),
                request.modelo(),
                request.codigoPatrimonio(),
                request.localizacao(),
                request.observacoes()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(maquina));
    }

    @GetMapping("/{id}")
    public MaquinaDto buscar(@PathVariable Long id) {
        return toDto(maquinaService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public MaquinaDto atualizar(@PathVariable Long id, @Valid @RequestBody UpdateMaquinaRequest request) {
        Maquina maquina = maquinaService.atualizar(
                id,
                new UpdateMaquinaCommand(
                        request.nome(),
                        request.tipo(),
                        request.marca(),
                        request.modelo(),
                        request.codigoPatrimonio(),
                        request.localizacao(),
                        request.observacoes()));
        return toDto(maquina);
    }

    @PatchMapping("/{id}/status")
    public MaquinaDto alterarStatus(@PathVariable Long id, @Valid @RequestBody MaquinaStatusRequest request) {
        return toDto(maquinaService.alterarStatus(id, request.status()));
    }

    private MaquinaSummaryDto toSummaryDto(MaquinaService.MaquinaSummary summary) {
        return new MaquinaSummaryDto(
                summary.id(),
                summary.nome(),
                summary.tipo(),
                summary.status(),
                summary.localizacao(),
                summary.createdAt());
    }

    private MaquinaDto toDto(Maquina maquina) {
        return new MaquinaDto(
                maquina.getId(),
                maquina.getNome(),
                maquina.getTipo(),
                maquina.getMarca(),
                maquina.getModelo(),
                maquina.getCodigoPatrimonio(),
                maquina.getLocalizacao(),
                maquina.getStatus(),
                maquina.getObservacoes(),
                maquina.getCreatedAt(),
                maquina.getUpdatedAt());
    }
}
