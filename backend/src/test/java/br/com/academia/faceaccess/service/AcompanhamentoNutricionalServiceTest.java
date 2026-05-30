package br.com.academia.faceaccess.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.academia.faceaccess.domain.AcompanhamentoNutricional;
import br.com.academia.faceaccess.domain.AcompanhamentoStatus;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.repository.AcompanhamentoNutricionalRepository;
import br.com.academia.faceaccess.repository.ClienteRepository;
import br.com.academia.faceaccess.service.AcompanhamentoNutricionalService.CreateAcompanhamentoCommand;
import br.com.academia.faceaccess.service.AcompanhamentoNutricionalService.UpdateAcompanhamentoCommand;
import br.com.academia.faceaccess.service.exception.AcompanhamentoNotFoundException;
import br.com.academia.faceaccess.service.exception.ClienteNotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AcompanhamentoNutricionalServiceTest {

    private static final LocalDate HOJE = LocalDate.now();
    private static final LocalDate ONTEM = HOJE.minusDays(1);

    @Mock
    private AcompanhamentoNutricionalRepository acompanhamentoRepository;

    @Mock
    private ClienteRepository clienteRepository;

    private AcompanhamentoNutricionalService service;

    @BeforeEach
    void setUp() {
        service = new AcompanhamentoNutricionalService(acompanhamentoRepository, clienteRepository);
    }

    @Test
    void listarSemFiltrosUsaQueryDoRepositorio() {
        Cliente cliente = cliente(1L, "Ana Silva");
        AcompanhamentoNutricional a = acompanhamento(10L, cliente, ONTEM);
        when(acompanhamentoRepository.findByClienteIdAndTermo(null, null)).thenReturn(List.of(a));

        List<AcompanhamentoNutricionalService.AcompanhamentoSummary> result = service.listar(null, null);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().clienteNome()).isEqualTo("Ana Silva");
        assertThat(result.getFirst().dataConsulta()).isEqualTo(ONTEM);
    }

    @Test
    void listarComClienteIdFiltraPorCliente() {
        Cliente cliente = cliente(2L, "Bruno");
        AcompanhamentoNutricional a = acompanhamento(11L, cliente, ONTEM);
        when(acompanhamentoRepository.findByClienteIdAndTermo(2L, null)).thenReturn(List.of(a));

        List<AcompanhamentoNutricionalService.AcompanhamentoSummary> result = service.listar(2L, null);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().clienteId()).isEqualTo(2L);
    }

    @Test
    void listarComQueryBuscaPorNomeOuProfissional() {
        Cliente cliente = cliente(1L, "Carla");
        AcompanhamentoNutricional a = acompanhamento(12L, cliente, ONTEM);
        a.setProfissional("Nutricionista João");
        when(acompanhamentoRepository.findByClienteIdAndTermo(null, "joão")).thenReturn(List.of(a));

        List<AcompanhamentoNutricionalService.AcompanhamentoSummary> result = service.listar(null, "joão");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().profissional()).isEqualTo("Nutricionista João");
    }

    @Test
    void criarPersisteAcompanhamentoComStatusAtivo() {
        Cliente cliente = cliente(1L, "Ana Silva");
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(acompanhamentoRepository.save(any(AcompanhamentoNutricional.class))).thenAnswer(invocation -> {
            AcompanhamentoNutricional saved = invocation.getArgument(0);
            saved.setId(100L);
            return saved;
        });

        AcompanhamentoNutricional created = service.criar(new CreateAcompanhamentoCommand(
                1L, ONTEM, new BigDecimal("72.50"), "Dr. Nutri", "Emagrecimento", "Evitar açúcar", HOJE));

        assertThat(created.getId()).isEqualTo(100L);
        assertThat(created.getCliente()).isEqualTo(cliente);
        assertThat(created.getDataConsulta()).isEqualTo(ONTEM);
        assertThat(created.getPesoKg()).isEqualByComparingTo("72.50");
        assertThat(created.getStatus()).isEqualTo(AcompanhamentoStatus.ATIVO);
    }

    @Test
    void criarClienteInexistenteLancaException() {
        when(clienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.criar(new CreateAcompanhamentoCommand(
                        99L, ONTEM, null, null, null, null, null)))
                .isInstanceOf(ClienteNotFoundException.class);
        verify(acompanhamentoRepository, never()).save(any());
    }

    @Test
    void criarClienteInativoPermitido() {
        Cliente cliente = cliente(1L, "Inativo");
        cliente.setStatus(ClienteStatus.INATIVO);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(acompanhamentoRepository.save(any(AcompanhamentoNutricional.class))).thenAnswer(invocation -> {
            AcompanhamentoNutricional saved = invocation.getArgument(0);
            saved.setId(101L);
            return saved;
        });

        AcompanhamentoNutricional created = service.criar(new CreateAcompanhamentoCommand(
                1L, ONTEM, null, null, null, null, null));

        assertThat(created.getId()).isEqualTo(101L);
        assertThat(created.getCliente().getStatus()).isEqualTo(ClienteStatus.INATIVO);
    }

    @Test
    void criarDataFuturaRejeitada() {
        Cliente cliente = cliente(1L, "Ana");
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        assertThatThrownBy(() -> service.criar(new CreateAcompanhamentoCommand(
                        1L, HOJE.plusDays(1), null, null, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Data não pode ser futura");
        verify(acompanhamentoRepository, never()).save(any());
    }

    @Test
    void criarPesoForaDoIntervaloRejeitado() {
        Cliente cliente = cliente(1L, "Ana");
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        assertThatThrownBy(() -> service.criar(new CreateAcompanhamentoCommand(
                        1L, ONTEM, new BigDecimal("19.99"), null, null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Peso deve estar entre 20 e 500 kg");
    }

    @Test
    void criarPesoNullPermitido() {
        Cliente cliente = cliente(1L, "Ana");
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(acompanhamentoRepository.save(any(AcompanhamentoNutricional.class))).thenAnswer(invocation -> {
            AcompanhamentoNutricional saved = invocation.getArgument(0);
            saved.setId(102L);
            return saved;
        });

        AcompanhamentoNutricional created = service.criar(new CreateAcompanhamentoCommand(
                1L, ONTEM, null, null, null, null, null));

        assertThat(created.getPesoKg()).isNull();
    }

    @Test
    void criarProximaConsultaAntesDaConsultaRejeitada() {
        Cliente cliente = cliente(1L, "Ana");
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        assertThatThrownBy(() -> service.criar(new CreateAcompanhamentoCommand(
                        1L, ONTEM, null, null, null, null, ONTEM.minusDays(1))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Próxima consulta deve ser após a data da consulta");
    }

    @Test
    void atualizarAlteraCampos() {
        Cliente cliente = cliente(1L, "Ana");
        AcompanhamentoNutricional existing = acompanhamento(5L, cliente, ONTEM.minusDays(7));
        when(acompanhamentoRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(acompanhamentoRepository.save(existing)).thenReturn(existing);

        AcompanhamentoNutricional updated = service.atualizar(
                5L,
                new UpdateAcompanhamentoCommand(
                        ONTEM, new BigDecimal("68.00"), "Nova Nutri", "Ganho massa", "Proteína", HOJE));

        assertThat(updated.getDataConsulta()).isEqualTo(ONTEM);
        assertThat(updated.getPesoKg()).isEqualByComparingTo("68.00");
        assertThat(updated.getProfissional()).isEqualTo("Nova Nutri");
    }

    @Test
    void alterarStatusParaInativo() {
        Cliente cliente = cliente(1L, "Ana");
        AcompanhamentoNutricional existing = acompanhamento(6L, cliente, ONTEM);
        when(acompanhamentoRepository.findById(6L)).thenReturn(Optional.of(existing));
        when(acompanhamentoRepository.save(existing)).thenReturn(existing);

        AcompanhamentoNutricional updated = service.alterarStatus(6L, AcompanhamentoStatus.INATIVO);

        assertThat(updated.getStatus()).isEqualTo(AcompanhamentoStatus.INATIVO);
    }

    @Test
    void buscarPorIdNotFoundLancaException() {
        when(acompanhamentoRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarPorId(404L)).isInstanceOf(AcompanhamentoNotFoundException.class);
    }

    @Test
    void validarDatasAceitaProximaConsultaIgualADataConsulta() {
        service.validarDatas(ONTEM, ONTEM);
    }

    private static Cliente cliente(long id, String nome) {
        Cliente cliente = new Cliente();
        cliente.setId(id);
        cliente.setNome(nome);
        cliente.setCpf("12345678901");
        cliente.setStatus(ClienteStatus.ATIVO);
        cliente.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        return cliente;
    }

    private static AcompanhamentoNutricional acompanhamento(long id, Cliente cliente, LocalDate dataConsulta) {
        AcompanhamentoNutricional acompanhamento = new AcompanhamentoNutricional();
        acompanhamento.setId(id);
        acompanhamento.setCliente(cliente);
        acompanhamento.setDataConsulta(dataConsulta);
        acompanhamento.setStatus(AcompanhamentoStatus.ATIVO);
        acompanhamento.setCreatedAt(Instant.parse("2026-01-15T10:00:00Z"));
        return acompanhamento;
    }
}
