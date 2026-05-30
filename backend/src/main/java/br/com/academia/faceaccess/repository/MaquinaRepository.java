package br.com.academia.faceaccess.repository;

import br.com.academia.faceaccess.domain.Maquina;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MaquinaRepository extends JpaRepository<Maquina, Long> {

    List<Maquina> findAllByOrderByNomeAsc();

    @Query("""
            SELECT m FROM Maquina m
            WHERE LOWER(m.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
               OR LOWER(m.marca) LIKE LOWER(CONCAT('%', :termo, '%'))
               OR LOWER(m.codigoPatrimonio) LIKE LOWER(CONCAT('%', :termo, '%'))
            ORDER BY m.nome
            """)
    List<Maquina> searchByNomeOrMarcaOrCodigoPatrimonio(@Param("termo") String termo);

    boolean existsByCodigoPatrimonioAndIdNot(String codigoPatrimonio, Long id);
}
