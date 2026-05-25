package br.com.academia.faceaccess.repository;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class ClienteRepositoryTest {

    @Autowired
    private ClienteRepository clienteRepository;

    @Test
    void contextLoadsAndPersistsCliente() {
        Cliente cliente = new Cliente();
        cliente.setNome("Maria Silva");
        cliente.setCpf("52998224725");
        cliente.setStatus(ClienteStatus.ATIVO);

        Cliente saved = clienteRepository.save(cliente);

        assertThat(saved.getId()).isNotNull();
        assertThat(clienteRepository.findByCpf("52998224725")).isPresent();
        assertThat(clienteRepository.searchByNomeOrCpf("maria")).hasSize(1);
    }
}
