package br.com.academia.faceaccess.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.academia.faceaccess.config.FaceAccessProperties;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.EventoAcesso;
import br.com.academia.faceaccess.domain.EventoMotivo;
import br.com.academia.faceaccess.domain.EventoResultado;
import br.com.academia.faceaccess.repository.EventoAcessoRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccessEventServiceTest {

    private static final String UNKNOWN_COOLDOWN_KEY = "unknown";

    @Mock
    private EventoAcessoRepository eventoAcessoRepository;

    private AccessEventService service;

    @BeforeEach
    void setUp() {
        FaceAccessProperties properties = new FaceAccessProperties();
        properties.setCooldownMinutes(5);
        service = new AccessEventService(eventoAcessoRepository, properties);
    }

    @Test
    void shouldRegisterLiberadoWhenNoRecentEvent() {
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq("cliente:42"), any()))
                .thenReturn(false);

        assertThat(service.shouldRegisterLiberado(42L)).isTrue();
    }

    @Test
    void shouldNotRegisterLiberadoDuringCooldown() {
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq("cliente:42"), any()))
                .thenReturn(true);

        assertThat(service.shouldRegisterLiberado(42L)).isFalse();
    }

    @Test
    void registrarLiberadoPersistsEventWhenAllowed() {
        Cliente cliente = cliente(7L);
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq("cliente:7"), any()))
                .thenReturn(false);
        when(eventoAcessoRepository.save(any(EventoAcesso.class))).thenAnswer(invocation -> {
            EventoAcesso evento = invocation.getArgument(0);
            evento.setId(1L);
            return evento;
        });

        AccessEventService.AccessProcessResult result =
                service.registrarLiberado(cliente, BigDecimal.valueOf(0.91));

        assertThat(result.eventoRegistrado()).isTrue();
        assertThat(result.evento()).isNotNull();
        ArgumentCaptor<EventoAcesso> captor = ArgumentCaptor.forClass(EventoAcesso.class);
        verify(eventoAcessoRepository).save(captor.capture());
        EventoAcesso saved = captor.getValue();
        assertThat(saved.getResultado()).isEqualTo(EventoResultado.LIBERADO);
        assertThat(saved.getMotivo()).isNull();
        assertThat(saved.getCliente()).isEqualTo(cliente);
        assertThat(saved.getConfianca()).isEqualByComparingTo("0.9100");
        assertThat(saved.getCooldownKey()).isEqualTo("cliente:7");
        assertThat(saved.getOcorridoEm()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    void registrarLiberadoSkipsPersistDuringCooldown() {
        Cliente cliente = cliente(7L);
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq("cliente:7"), any()))
                .thenReturn(true);

        AccessEventService.AccessProcessResult result =
                service.registrarLiberado(cliente, BigDecimal.valueOf(0.91));

        assertThat(result.eventoRegistrado()).isFalse();
        assertThat(result.evento()).isNull();
        verify(eventoAcessoRepository, never()).save(any());
    }

    @Test
    void shouldRegisterNegadoDesconhecidoWhenNoRecentEvent() {
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq(UNKNOWN_COOLDOWN_KEY), any()))
                .thenReturn(false);

        assertThat(service.shouldRegisterNegado(EventoMotivo.NAO_RECONHECIDO, UNKNOWN_COOLDOWN_KEY))
                .isTrue();
    }

    @Test
    void shouldNotRegisterNegadoDesconhecidoDuringCooldown() {
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq(UNKNOWN_COOLDOWN_KEY), any()))
                .thenReturn(true);

        assertThat(service.shouldRegisterNegado(EventoMotivo.NAO_RECONHECIDO, UNKNOWN_COOLDOWN_KEY))
                .isFalse();
    }

    @Test
    void shouldAlwaysRegisterNegadoInativo() {
        assertThat(service.shouldRegisterNegado(EventoMotivo.CLIENTE_INATIVO, "cliente:9:negado"))
                .isTrue();
    }

    @Test
    void registrarNegadoInativoAlwaysPersists() {
        Cliente cliente = cliente(9L);
        when(eventoAcessoRepository.save(any(EventoAcesso.class))).thenAnswer(invocation -> {
            EventoAcesso evento = invocation.getArgument(0);
            evento.setId(2L);
            return evento;
        });

        AccessEventService.AccessProcessResult result =
                service.registrarNegado(cliente, EventoMotivo.CLIENTE_INATIVO, BigDecimal.valueOf(0.88));

        assertThat(result.eventoRegistrado()).isTrue();
        ArgumentCaptor<EventoAcesso> captor = ArgumentCaptor.forClass(EventoAcesso.class);
        verify(eventoAcessoRepository).save(captor.capture());
        EventoAcesso saved = captor.getValue();
        assertThat(saved.getResultado()).isEqualTo(EventoResultado.NEGADO);
        assertThat(saved.getMotivo()).isEqualTo(EventoMotivo.CLIENTE_INATIVO);
        assertThat(saved.getCliente()).isEqualTo(cliente);
        assertThat(saved.getCooldownKey()).isEqualTo("cliente:9:negado");
    }

    @Test
    void registrarNegadoDesconhecidoSkipsDuringCooldown() {
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq(UNKNOWN_COOLDOWN_KEY), any()))
                .thenReturn(true);

        AccessEventService.AccessProcessResult result =
                service.registrarNegado(null, EventoMotivo.NAO_RECONHECIDO, BigDecimal.ZERO);

        assertThat(result.eventoRegistrado()).isFalse();
        verify(eventoAcessoRepository, never()).save(any());
    }

    @Test
    void registrarNegadoDesconhecidoPersistsWithNullCliente() {
        when(eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(eq(UNKNOWN_COOLDOWN_KEY), any()))
                .thenReturn(false);
        when(eventoAcessoRepository.save(any(EventoAcesso.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccessEventService.AccessProcessResult result =
                service.registrarNegado(null, EventoMotivo.NAO_RECONHECIDO, BigDecimal.ZERO);

        assertThat(result.eventoRegistrado()).isTrue();
        ArgumentCaptor<EventoAcesso> captor = ArgumentCaptor.forClass(EventoAcesso.class);
        verify(eventoAcessoRepository).save(captor.capture());
        EventoAcesso saved = captor.getValue();
        assertThat(saved.getCliente()).isNull();
        assertThat(saved.getMotivo()).isEqualTo(EventoMotivo.NAO_RECONHECIDO);
        assertThat(saved.getCooldownKey()).isEqualTo(UNKNOWN_COOLDOWN_KEY);
    }

    private static Cliente cliente(long id) {
        Cliente cliente = new Cliente();
        cliente.setId(id);
        cliente.setNome("Cliente " + id);
        return cliente;
    }
}
