package br.com.academia.faceaccess.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.academia.faceaccess.domain.Maquina;
import br.com.academia.faceaccess.domain.MaquinaStatus;
import br.com.academia.faceaccess.domain.MaquinaTipo;
import br.com.academia.faceaccess.repository.MaquinaRepository;
import br.com.academia.faceaccess.service.MaquinaService.CreateMaquinaCommand;
import br.com.academia.faceaccess.service.MaquinaService.UpdateMaquinaCommand;
import br.com.academia.faceaccess.service.exception.DuplicatePatrimonioException;
import br.com.academia.faceaccess.service.exception.MaquinaNotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MaquinaServiceTest {

    private static final String PATRIMONIO = "PAT-001";

    @Mock
    private MaquinaRepository maquinaRepository;

    private MaquinaService service;

    @BeforeEach
    void setUp() {
        service = new MaquinaService(maquinaRepository);
    }

    @Test
    void listarSemQueryRetornaTodosOrdenadosPorNome() {
        Maquina a = maquina(1L, "Esteira", MaquinaTipo.CARDIO);
        Maquina b = maquina(2L, "Leg Press", MaquinaTipo.MUSCULACAO);
        when(maquinaRepository.findAllByOrderByNomeAsc()).thenReturn(List.of(a, b));

        List<MaquinaService.MaquinaSummary> result = service.listar(null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).nome()).isEqualTo("Esteira");
        assertThat(result.get(1).nome()).isEqualTo("Leg Press");
    }

    @Test
    void listarComQueryBuscaPorNomeMarcaOuPatrimonio() {
        Maquina maquina = maquina(1L, "Esteira Pro", MaquinaTipo.CARDIO);
        when(maquinaRepository.searchByNomeOrMarcaOrCodigoPatrimonio("esteira")).thenReturn(List.of(maquina));

        List<MaquinaService.MaquinaSummary> result = service.listar("esteira");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().tipo()).isEqualTo(MaquinaTipo.CARDIO);
    }

    @Test
    void normalizePatrimonioTrimEBlankParaNull() {
        assertThat(MaquinaService.normalizePatrimonio("  PAT-001  ")).isEqualTo("PAT-001");
        assertThat(MaquinaService.normalizePatrimonio("   ")).isNull();
        assertThat(MaquinaService.normalizePatrimonio(null)).isNull();
    }

    @Test
    void criarPersisteMaquinaComStatusAtiva() {
        when(maquinaRepository.existsByCodigoPatrimonioAndIdNot(PATRIMONIO, 0L)).thenReturn(false);
        when(maquinaRepository.save(any(Maquina.class))).thenAnswer(invocation -> {
            Maquina saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        Maquina created = service.criar(new CreateMaquinaCommand(
                "Esteira",
                MaquinaTipo.CARDIO,
                "Technogym",
                "Run 500",
                PATRIMONIO,
                "Sala cardio",
                "Nova"));

        assertThat(created.getId()).isEqualTo(10L);
        assertThat(created.getNome()).isEqualTo("Esteira");
        assertThat(created.getTipo()).isEqualTo(MaquinaTipo.CARDIO);
        assertThat(created.getCodigoPatrimonio()).isEqualTo(PATRIMONIO);
        assertThat(created.getStatus()).isEqualTo(MaquinaStatus.ATIVA);
    }

    @Test
    void criarNormalizaPatrimonioEmBrancoParaNull() {
        when(maquinaRepository.save(any(Maquina.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Maquina created = service.criar(new CreateMaquinaCommand(
                "Bike", MaquinaTipo.CARDIO, null, null, "   ", null, null));

        assertThat(created.getCodigoPatrimonio()).isNull();
        verify(maquinaRepository, never()).existsByCodigoPatrimonioAndIdNot(any(), any());
    }

    @Test
    void criarPatrimonioDuplicadoLancaException() {
        when(maquinaRepository.existsByCodigoPatrimonioAndIdNot(PATRIMONIO, 0L)).thenReturn(true);

        assertThatThrownBy(() -> service.criar(new CreateMaquinaCommand(
                        "Esteira", MaquinaTipo.CARDIO, null, null, PATRIMONIO, null, null)))
                .isInstanceOf(DuplicatePatrimonioException.class);
        verify(maquinaRepository, never()).save(any());
    }

    @Test
    void atualizarAlteraNome() {
        Maquina existing = maquina(1L, "Antigo", MaquinaTipo.CARDIO);
        existing.setCodigoPatrimonio(PATRIMONIO);
        when(maquinaRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(maquinaRepository.existsByCodigoPatrimonioAndIdNot(PATRIMONIO, 1L)).thenReturn(false);
        when(maquinaRepository.save(existing)).thenReturn(existing);

        Maquina updated = service.atualizar(
                1L,
                new UpdateMaquinaCommand(
                        "Novo Nome", MaquinaTipo.CARDIO, null, null, PATRIMONIO, null, null));

        assertThat(updated.getNome()).isEqualTo("Novo Nome");
    }

    @Test
    void atualizarPatrimonioDuplicadoDeOutraMaquinaLancaException() {
        Maquina existing = maquina(1L, "Esteira A", MaquinaTipo.CARDIO);
        existing.setCodigoPatrimonio("PAT-001");
        when(maquinaRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(maquinaRepository.existsByCodigoPatrimonioAndIdNot("PAT-002", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.atualizar(
                        1L,
                        new UpdateMaquinaCommand(
                                "Esteira A", MaquinaTipo.CARDIO, null, null, "PAT-002", null, null)))
                .isInstanceOf(DuplicatePatrimonioException.class);
    }

    @Test
    void alterarStatusParaManutencao() {
        Maquina existing = maquina(1L, "Esteira", MaquinaTipo.CARDIO);
        when(maquinaRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(maquinaRepository.save(existing)).thenReturn(existing);

        Maquina updated = service.alterarStatus(1L, MaquinaStatus.MANUTENCAO);

        assertThat(updated.getStatus()).isEqualTo(MaquinaStatus.MANUTENCAO);
    }

    @Test
    void buscarPorIdNotFoundLancaException() {
        when(maquinaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarPorId(99L)).isInstanceOf(MaquinaNotFoundException.class);
    }

    private static Maquina maquina(long id, String nome, MaquinaTipo tipo) {
        Maquina maquina = new Maquina();
        maquina.setId(id);
        maquina.setNome(nome);
        maquina.setTipo(tipo);
        maquina.setStatus(MaquinaStatus.ATIVA);
        maquina.setCreatedAt(Instant.parse("2026-01-15T10:00:00Z"));
        return maquina;
    }
}
