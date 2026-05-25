package br.com.academia.faceaccess.repository;

import br.com.academia.faceaccess.domain.EventoAcesso;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoAcessoRepository extends JpaRepository<EventoAcesso, Long> {

    boolean existsByClienteIdAndOcorridoEmAfter(Long clienteId, Instant after);

    boolean existsByCooldownKeyAndOcorridoEmAfter(String cooldownKey, Instant after);
}
