package br.com.academia.faceaccess.repository;

import br.com.academia.faceaccess.domain.AcompanhamentoNutricional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AcompanhamentoNutricionalRepository extends JpaRepository<AcompanhamentoNutricional, Long> {

    List<AcompanhamentoNutricional> findAllByOrderByDataConsultaDesc();

    @Query("""
            SELECT a FROM AcompanhamentoNutricional a
            JOIN a.cliente c
            WHERE (:clienteId IS NULL OR c.id = :clienteId)
              AND (:termo IS NULL OR :termo = ''
                   OR LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
                   OR LOWER(a.profissional) LIKE LOWER(CONCAT('%', :termo, '%')))
            ORDER BY a.dataConsulta DESC
            """)
    List<AcompanhamentoNutricional> findByClienteIdAndTermo(
            @Param("clienteId") Long clienteId,
            @Param("termo") String termo);
}
