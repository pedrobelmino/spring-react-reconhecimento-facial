package br.com.academia.faceaccess.web;

import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.service.ClienteService;
import br.com.academia.faceaccess.service.ClienteService.CreateClienteCommand;
import br.com.academia.faceaccess.service.ClienteService.UpdateClienteCommand;
import br.com.academia.faceaccess.web.dto.ClienteDto;
import br.com.academia.faceaccess.web.dto.ClienteSummaryDto;
import br.com.academia.faceaccess.web.dto.CreateClienteRequest;
import br.com.academia.faceaccess.web.dto.StatusRequest;
import br.com.academia.faceaccess.web.dto.UpdateClienteRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public List<ClienteSummaryDto> listar(@RequestParam(required = false) String q) {
        return clienteService.listar(q).stream().map(this::toSummaryDto).toList();
    }

    @PostMapping
    public ResponseEntity<ClienteDto> criar(@Valid @RequestBody CreateClienteRequest request) {
        Cliente cliente = clienteService.criar(new CreateClienteCommand(
                request.nome(), request.cpf(), request.photosBase64()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(cliente));
    }

    @GetMapping("/{id}")
    public ClienteDto buscar(@PathVariable Long id) {
        return toDto(clienteService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ClienteDto atualizar(@PathVariable Long id, @Valid @RequestBody UpdateClienteRequest request) {
        Cliente cliente = clienteService.atualizar(
                id, new UpdateClienteCommand(request.nome(), request.cpf(), request.photosBase64()));
        return toDto(cliente);
    }

    @PatchMapping("/{id}/status")
    public ClienteDto alterarStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return toDto(clienteService.alterarStatus(id, request.status()));
    }

    @GetMapping("/{id}/foto/{ordem}")
    public ResponseEntity<byte[]> foto(@PathVariable Long id, @PathVariable int ordem) throws IOException {
        byte[] bytes = clienteService.carregarFoto(id, ordem);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                .body(bytes);
    }

    private ClienteSummaryDto toSummaryDto(ClienteService.ClienteSummary summary) {
        return new ClienteSummaryDto(
                summary.id(),
                summary.nome(),
                summary.cpfMascarado(),
                summary.status(),
                summary.createdAt());
    }

    private ClienteDto toDto(Cliente cliente) {
        List<String> fotoUrls = cliente.getFotos().stream()
                .sorted((left, right) -> Byte.compare(left.getOrdem(), right.getOrdem()))
                .map(foto -> fotoUrl(cliente.getId(), foto.getOrdem()))
                .toList();
        return new ClienteDto(
                cliente.getId(),
                cliente.getNome(),
                cliente.getCpf(),
                cliente.getStatus(),
                cliente.getCreatedAt(),
                cliente.getUpdatedAt(),
                fotoUrls);
    }

    private static String fotoUrl(Long clienteId, byte ordem) {
        return "/api/clientes/" + clienteId + "/foto/" + ordem;
    }
}
