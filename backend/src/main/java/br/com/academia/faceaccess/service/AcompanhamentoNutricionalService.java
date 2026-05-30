package br.com.academia.faceaccess.service;

import br.com.academia.faceaccess.domain.AcompanhamentoNutricional;
import br.com.academia.faceaccess.domain.AcompanhamentoStatus;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.repository.AcompanhamentoNutricionalRepository;
import br.com.academia.faceaccess.repository.ClienteRepository;
import br.com.academia.faceaccess.service.exception.AcompanhamentoNotFoundException;
import br.com.academia.faceaccess.service.exception.ClienteNotFoundException;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AcompanhamentoNutricionalService {

    private static final BigDecimal PESO_MIN = new BigDecimal("20");
    private static final BigDecimal PESO_MAX = new BigDecimal("500");

    private final AcompanhamentoNutricionalRepository acompanhamentoRepository;
    private final ClienteRepository clienteRepository;

    public AcompanhamentoNutricionalService(
            AcompanhamentoNutricionalRepository acompanhamentoRepository, ClienteRepository clienteRepository) {
        this.acompanhamentoRepository = acompanhamentoRepository;
        this.clienteRepository = clienteRepository;
    }

    public record CreateAcompanhamentoCommand(
            Long clienteId,
            LocalDate dataConsulta,
            BigDecimal pesoKg,
            String profissional,
            String objetivo,
            String orientacoes,
            LocalDate proximaConsulta) {}

    public record UpdateAcompanhamentoCommand(
            LocalDate dataConsulta,
            BigDecimal pesoKg,
            String profissional,
            String objetivo,
            String orientacoes,
            LocalDate proximaConsulta) {}

    public record AcompanhamentoSummary(
            Long id,
            Long clienteId,
            String clienteNome,
            LocalDate dataConsulta,
            BigDecimal pesoKg,
            String profissional,
            AcompanhamentoStatus status,
            Instant createdAt) {}

    public List<AcompanhamentoSummary> listar(Long clienteId, String query) {
        String termo = isBlank(query) ? null : query.trim();
        return acompanhamentoRepository.findByClienteIdAndTermo(clienteId, termo).stream()
                .map(this::toSummary)
                .toList();
    }

    public AcompanhamentoNutricional buscarPorId(Long id) {
        return acompanhamentoRepository.findById(id).orElseThrow(() -> new AcompanhamentoNotFoundException(id));
    }

    @Transactional
    public AcompanhamentoNutricional criar(CreateAcompanhamentoCommand command) {
        Cliente cliente = clienteRepository
                .findById(command.clienteId())
                .orElseThrow(() -> new ClienteNotFoundException(command.clienteId()));

        validarDatas(command.dataConsulta(), command.proximaConsulta());
        validarPeso(command.pesoKg());

        AcompanhamentoNutricional acompanhamento = new AcompanhamentoNutricional();
        acompanhamento.setCliente(cliente);
        acompanhamento.setDataConsulta(command.dataConsulta());
        acompanhamento.setPesoKg(command.pesoKg());
        acompanhamento.setProfissional(trimToNull(command.profissional()));
        acompanhamento.setObjetivo(trimToNull(command.objetivo()));
        acompanhamento.setOrientacoes(trimToNull(command.orientacoes()));
        acompanhamento.setProximaConsulta(command.proximaConsulta());
        acompanhamento.setStatus(AcompanhamentoStatus.ATIVO);

        return acompanhamentoRepository.save(acompanhamento);
    }

    @Transactional
    public AcompanhamentoNutricional atualizar(Long id, UpdateAcompanhamentoCommand command) {
        AcompanhamentoNutricional acompanhamento = buscarPorId(id);

        validarDatas(command.dataConsulta(), command.proximaConsulta());
        validarPeso(command.pesoKg());

        acompanhamento.setDataConsulta(command.dataConsulta());
        acompanhamento.setPesoKg(command.pesoKg());
        acompanhamento.setProfissional(trimToNull(command.profissional()));
        acompanhamento.setObjetivo(trimToNull(command.objetivo()));
        acompanhamento.setOrientacoes(trimToNull(command.orientacoes()));
        acompanhamento.setProximaConsulta(command.proximaConsulta());
        acompanhamento.setUpdatedAt(Instant.now());

        return acompanhamentoRepository.save(acompanhamento);
    }

    @Transactional
    public AcompanhamentoNutricional alterarStatus(Long id, AcompanhamentoStatus status) {
        AcompanhamentoNutricional acompanhamento = buscarPorId(id);
        acompanhamento.setStatus(status);
        acompanhamento.setUpdatedAt(Instant.now());
        return acompanhamentoRepository.save(acompanhamento);
    }

    public void validarDatas(LocalDate dataConsulta, LocalDate proximaConsulta) {
        if (dataConsulta.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Data não pode ser futura");
        }
        if (proximaConsulta != null && proximaConsulta.isBefore(dataConsulta)) {
            throw new IllegalArgumentException("Próxima consulta deve ser após a data da consulta");
        }
    }

    public void validarPeso(BigDecimal pesoKg) {
        if (pesoKg == null) {
            return;
        }
        if (pesoKg.compareTo(PESO_MIN) < 0 || pesoKg.compareTo(PESO_MAX) > 0) {
            throw new IllegalArgumentException("Peso deve estar entre 20 e 500 kg");
        }
    }

    private AcompanhamentoSummary toSummary(AcompanhamentoNutricional acompanhamento) {
        Cliente cliente = acompanhamento.getCliente();
        return new AcompanhamentoSummary(
                acompanhamento.getId(),
                cliente.getId(),
                cliente.getNome(),
                acompanhamento.getDataConsulta(),
                acompanhamento.getPesoKg(),
                acompanhamento.getProfissional(),
                acompanhamento.getStatus(),
                acompanhamento.getCreatedAt());
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
