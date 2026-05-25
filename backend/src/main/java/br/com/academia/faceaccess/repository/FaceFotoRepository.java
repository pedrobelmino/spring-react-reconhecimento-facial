package br.com.academia.faceaccess.repository;

import br.com.academia.faceaccess.domain.FaceFoto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaceFotoRepository extends JpaRepository<FaceFoto, Long> {

    List<FaceFoto> findByClienteIdOrderByOrdemAsc(Long clienteId);
}
