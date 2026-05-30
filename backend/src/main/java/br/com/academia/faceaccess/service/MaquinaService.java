package br.com.academia.faceaccess.service;

import br.com.academia.faceaccess.domain.Maquina;
import br.com.academia.faceaccess.domain.MaquinaStatus;
import br.com.academia.faceaccess.domain.MaquinaTipo;
import br.com.academia.faceaccess.repository.MaquinaRepository;
import br.com.academia.faceaccess.service.exception.DuplicatePatrimonioException;
import br.com.academia.faceaccess.service.exception.MaquinaNotFoundException;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MaquinaService {

    private final MaquinaRepository maquinaRepository;

    public MaquinaService(MaquinaRepository maquinaRepository) {
        this.maquinaRepository = maquinaRepository;
    }

    public record CreateMaquinaCommand(
            String nome,
            MaquinaTipo tipo,
            String marca,
            String modelo,
            String codigoPatrimonio,
            String localizacao,
            String observacoes) {}

    public record UpdateMaquinaCommand(
            String nome,
            MaquinaTipo tipo,
            String marca,
            String modelo,
            String codigoPatrimonio,
            String localizacao,
            String observacoes) {}

    public record MaquinaSummary(
            Long id, String nome, MaquinaTipo tipo, MaquinaStatus status, String localizacao, Instant createdAt) {}

    public List<MaquinaSummary> listar(String query) {
        List<Maquina> maquinas = isBlank(query)
                ? maquinaRepository.findAllByOrderByNomeAsc()
                : maquinaRepository.searchByNomeOrMarcaOrCodigoPatrimonio(query.trim());
        return maquinas.stream().map(this::toSummary).toList();
    }

    public Maquina buscarPorId(Long id) {
        return maquinaRepository.findById(id).orElseThrow(() -> new MaquinaNotFoundException(id));
    }

    @Transactional
    public Maquina criar(CreateMaquinaCommand command) {
        String codigoPatrimonio = normalizePatrimonio(command.codigoPatrimonio());
        assertPatrimonioDisponivel(codigoPatrimonio, null);

        Maquina maquina = new Maquina();
        maquina.setNome(command.nome().trim());
        maquina.setTipo(command.tipo());
        maquina.setMarca(trimToNull(command.marca()));
        maquina.setModelo(trimToNull(command.modelo()));
        maquina.setCodigoPatrimonio(codigoPatrimonio);
        maquina.setLocalizacao(trimToNull(command.localizacao()));
        maquina.setObservacoes(trimToNull(command.observacoes()));
        maquina.setStatus(MaquinaStatus.ATIVA);

        return maquinaRepository.save(maquina);
    }

    @Transactional
    public Maquina atualizar(Long id, UpdateMaquinaCommand command) {
        Maquina maquina = buscarPorId(id);
        String codigoPatrimonio = normalizePatrimonio(command.codigoPatrimonio());
        assertPatrimonioDisponivel(codigoPatrimonio, id);

        maquina.setNome(command.nome().trim());
        maquina.setTipo(command.tipo());
        maquina.setMarca(trimToNull(command.marca()));
        maquina.setModelo(trimToNull(command.modelo()));
        maquina.setCodigoPatrimonio(codigoPatrimonio);
        maquina.setLocalizacao(trimToNull(command.localizacao()));
        maquina.setObservacoes(trimToNull(command.observacoes()));
        maquina.setUpdatedAt(Instant.now());

        return maquinaRepository.save(maquina);
    }

    @Transactional
    public Maquina alterarStatus(Long id, MaquinaStatus status) {
        Maquina maquina = buscarPorId(id);
        maquina.setStatus(status);
        maquina.setUpdatedAt(Instant.now());
        return maquinaRepository.save(maquina);
    }

    static String normalizePatrimonio(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private void assertPatrimonioDisponivel(String codigoPatrimonio, Long excludeId) {
        if (codigoPatrimonio == null) {
            return;
        }
        Long exclude = excludeId != null ? excludeId : 0L;
        if (maquinaRepository.existsByCodigoPatrimonioAndIdNot(codigoPatrimonio, exclude)) {
            throw new DuplicatePatrimonioException();
        }
    }

    private MaquinaSummary toSummary(Maquina maquina) {
        return new MaquinaSummary(
                maquina.getId(),
                maquina.getNome(),
                maquina.getTipo(),
                maquina.getStatus(),
                maquina.getLocalizacao(),
                maquina.getCreatedAt());
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
