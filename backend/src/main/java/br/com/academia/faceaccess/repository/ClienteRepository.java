package br.com.academia.faceaccess.repository;

import br.com.academia.faceaccess.domain.Cliente;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByCpf(String cpf);

    @Query("""
            SELECT c FROM Cliente c
            WHERE LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
               OR c.cpf LIKE CONCAT('%', :termo, '%')
            ORDER BY c.nome
            """)
    List<Cliente> searchByNomeOrCpf(@Param("termo") String termo);
}
