package br.com.academia.faceaccess.repository;

import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.domain.FaceFoto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FaceFotoRepository extends JpaRepository<FaceFoto, Long> {

    List<FaceFoto> findByClienteIdOrderByOrdemAsc(Long clienteId);

    @Query("""
            SELECT COUNT(DISTINCT f.cliente.id) FROM FaceFoto f
            WHERE f.cliente.status = :status
            """)
    long countDistinctClientesByClienteStatus(ClienteStatus status);
}
