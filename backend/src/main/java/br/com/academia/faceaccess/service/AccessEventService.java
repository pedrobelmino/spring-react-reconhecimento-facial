package br.com.academia.faceaccess.service;

import br.com.academia.faceaccess.config.FaceAccessProperties;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.EventoAcesso;
import br.com.academia.faceaccess.domain.EventoMotivo;
import br.com.academia.faceaccess.domain.EventoResultado;
import br.com.academia.faceaccess.repository.EventoAcessoRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;

@Service
public class AccessEventService {

    public static final String UNKNOWN_COOLDOWN_KEY = "unknown";

    private final EventoAcessoRepository eventoAcessoRepository;
    private final FaceAccessProperties properties;

    public AccessEventService(EventoAcessoRepository eventoAcessoRepository, FaceAccessProperties properties) {
        this.eventoAcessoRepository = eventoAcessoRepository;
        this.properties = properties;
    }

    public record AccessProcessResult(boolean eventoRegistrado, EventoAcesso evento) {}

    public boolean shouldRegisterLiberado(Long clienteId) {
        return !eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(
                cooldownKeyCliente(clienteId), cooldownCutoff());
    }

    public boolean shouldRegisterNegado(EventoMotivo motivo, String cooldownKey) {
        if (motivo == EventoMotivo.CLIENTE_INATIVO) {
            return true;
        }
        return !eventoAcessoRepository.existsByCooldownKeyAndOcorridoEmAfter(cooldownKey, cooldownCutoff());
    }

    public AccessProcessResult registrarLiberado(Cliente cliente, BigDecimal confianca) {
        if (!shouldRegisterLiberado(cliente.getId())) {
            return new AccessProcessResult(false, null);
        }
        EventoAcesso evento = persist(
                cliente,
                EventoResultado.LIBERADO,
                null,
                confianca,
                cooldownKeyCliente(cliente.getId()));
        return new AccessProcessResult(true, evento);
    }

    public AccessProcessResult registrarNegado(Cliente cliente, EventoMotivo motivo, BigDecimal confianca) {
        String cooldownKey = cooldownKeyNegado(cliente, motivo);
        if (!shouldRegisterNegado(motivo, cooldownKey)) {
            return new AccessProcessResult(false, null);
        }
        EventoAcesso evento = persist(cliente, EventoResultado.NEGADO, motivo, confianca, cooldownKey);
        return new AccessProcessResult(true, evento);
    }

    private EventoAcesso persist(
            Cliente cliente,
            EventoResultado resultado,
            EventoMotivo motivo,
            BigDecimal confianca,
            String cooldownKey) {
        EventoAcesso evento = new EventoAcesso();
        evento.setCliente(cliente);
        evento.setResultado(resultado);
        evento.setMotivo(motivo);
        evento.setConfianca(confianca);
        evento.setCooldownKey(cooldownKey);
        evento.setOcorridoEm(Instant.now());
        return eventoAcessoRepository.save(evento);
    }

    private Instant cooldownCutoff() {
        return Instant.now().minus(properties.getCooldownMinutes(), ChronoUnit.MINUTES);
    }

    private static String cooldownKeyCliente(Long clienteId) {
        return "cliente:" + clienteId;
    }

    private static String cooldownKeyNegado(Cliente cliente, EventoMotivo motivo) {
        if (motivo == EventoMotivo.NAO_RECONHECIDO) {
            return UNKNOWN_COOLDOWN_KEY;
        }
        return "cliente:" + cliente.getId() + ":negado";
    }
}
