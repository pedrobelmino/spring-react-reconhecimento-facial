package br.com.academia.faceaccess.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.domain.FaceFoto;
import br.com.academia.faceaccess.repository.ClienteRepository;
import br.com.academia.faceaccess.service.ClienteService.CreateClienteCommand;
import br.com.academia.faceaccess.service.ClienteService.UpdateClienteCommand;
import br.com.academia.faceaccess.service.exception.ClienteNotFoundException;
import br.com.academia.faceaccess.service.exception.DuplicateCpfException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class ClienteServiceTest {

    private static final String CPF_VALIDO = "52998224725";
    private static final String CPF_OUTRO = "39053344705";
    private static final String FOTO_BASE64 = validImageBase64();

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private FaceRecognitionService faceRecognitionService;

    @Mock
    private ImageStorageService imageStorageService;

    private ClienteService service;

    @BeforeEach
    void setUp() {
        service = new ClienteService(clienteRepository, faceRecognitionService, imageStorageService);
    }

    @Test
    void listarSemQueryRetornaTodosOrdenadosPorNome() {
        Cliente a = cliente(1L, "Ana", CPF_VALIDO);
        Cliente b = cliente(2L, "Bruno", CPF_OUTRO);
        when(clienteRepository.findAll(Sort.by(Sort.Direction.ASC, "nome"))).thenReturn(List.of(a, b));

        List<ClienteService.ClienteSummary> result = service.listar(null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).nome()).isEqualTo("Ana");
        assertThat(result.get(1).nome()).isEqualTo("Bruno");
    }

    @Test
    void listarComQueryBuscaPorNome() {
        Cliente cliente = cliente(1L, "Maria Silva", CPF_VALIDO);
        when(clienteRepository.searchByNomeOrCpf("maria")).thenReturn(List.of(cliente));

        List<ClienteService.ClienteSummary> result = service.listar("maria");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().cpfMascarado()).isEqualTo("***.982.247-**");
    }

    @Test
    void listarComQueryBuscaPorCpf() {
        Cliente cliente = cliente(1L, "Maria Silva", CPF_VALIDO);
        when(clienteRepository.searchByNomeOrCpf("529982")).thenReturn(List.of(cliente));

        assertThat(service.listar("529982")).hasSize(1);
    }

    @Test
    void mascararCpfOcultaPrimeirosTresEUltimosDois() {
        assertThat(service.mascararCpf("52998224725")).isEqualTo("***.982.247-**");
    }

    @Test
    void criarPersisteClienteComDuasFotos() throws Exception {
        when(clienteRepository.findByCpf(CPF_VALIDO)).thenReturn(Optional.empty());
        when(imageStorageService.save(anyString())).thenReturn("key-1", "key-2");
        when(faceRecognitionService.extractEmbedding(any(BufferedImage.class)))
                .thenReturn(new float[] {0.1f, 0.2f}, new float[] {0.3f, 0.4f});
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(invocation -> {
            Cliente saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        Cliente created = service.criar(new CreateClienteCommand("Maria", CPF_VALIDO, List.of(FOTO_BASE64, FOTO_BASE64)));

        assertThat(created.getId()).isEqualTo(10L);
        assertThat(created.getNome()).isEqualTo("Maria");
        assertThat(created.getCpf()).isEqualTo(CPF_VALIDO);
        assertThat(created.getStatus()).isEqualTo(ClienteStatus.ATIVO);
        assertThat(created.getFotos()).hasSize(2);
        assertThat(created.getFotos().get(0).getOrdem()).isEqualTo((byte) 1);
        assertThat(created.getFotos().get(1).getOrdem()).isEqualTo((byte) 2);
        verify(faceRecognitionService).refreshEmbeddingCache();
    }

    @Test
    void criarNormalizaCpfComPontuacao() throws Exception {
        when(clienteRepository.findByCpf(CPF_VALIDO)).thenReturn(Optional.empty());
        when(imageStorageService.save(anyString())).thenReturn("key-1", "key-2");
        when(faceRecognitionService.extractEmbedding(any(BufferedImage.class)))
                .thenReturn(new float[] {0.1f}, new float[] {0.2f});
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Cliente created = service.criar(new CreateClienteCommand(
                "Maria", "529.982.247-25", List.of(FOTO_BASE64, FOTO_BASE64)));

        assertThat(created.getCpf()).isEqualTo(CPF_VALIDO);
    }

    @Test
    void criarCpfDuplicadoLancaException() {
        when(clienteRepository.findByCpf(CPF_VALIDO)).thenReturn(Optional.of(cliente(1L, "Outro", CPF_VALIDO)));

        assertThatThrownBy(() -> service.criar(new CreateClienteCommand(
                        "Maria", CPF_VALIDO, List.of(FOTO_BASE64, FOTO_BASE64))))
                .isInstanceOf(DuplicateCpfException.class);
        verify(clienteRepository, never()).save(any());
    }

    @Test
    void criarRejeitaMenosDeDuasFotos() {
        when(clienteRepository.findByCpf(CPF_VALIDO)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.criar(new CreateClienteCommand("Maria", CPF_VALIDO, List.of(FOTO_BASE64))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("2 fotos");
    }

    @Test
    void atualizarAlteraNome() throws Exception {
        Cliente existing = clienteComFotos(1L, "Antigo", CPF_VALIDO);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(clienteRepository.findByCpf(CPF_VALIDO)).thenReturn(Optional.of(existing));
        when(clienteRepository.save(existing)).thenReturn(existing);

        Cliente updated = service.atualizar(
                1L, new UpdateClienteCommand("Novo Nome", CPF_VALIDO, null));

        assertThat(updated.getNome()).isEqualTo("Novo Nome");
    }

    @Test
    void atualizarCpfDuplicadoDeOutroClienteLancaException() {
        Cliente existing = cliente(1L, "Maria", CPF_VALIDO);
        Cliente outro = cliente(2L, "João", CPF_OUTRO);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(clienteRepository.findByCpf(CPF_OUTRO)).thenReturn(Optional.of(outro));

        assertThatThrownBy(() -> service.atualizar(
                        1L, new UpdateClienteCommand("Maria", CPF_OUTRO, null)))
                .isInstanceOf(DuplicateCpfException.class);
    }

    @Test
    void alterarStatusParaInativo() {
        Cliente existing = cliente(1L, "Maria", CPF_VALIDO);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(clienteRepository.save(existing)).thenReturn(existing);

        Cliente updated = service.alterarStatus(1L, ClienteStatus.INATIVO);

        assertThat(updated.getStatus()).isEqualTo(ClienteStatus.INATIVO);
    }

    @Test
    void buscarPorIdNotFoundLancaException() {
        when(clienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarPorId(99L)).isInstanceOf(ClienteNotFoundException.class);
    }

    @Test
    void carregarFotoRetornaBytesDoStorage() throws Exception {
        Cliente existing = clienteComFotos(1L, "Maria", CPF_VALIDO);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(imageStorageService.load("storage-1")).thenReturn(new byte[] {9, 8, 7});

        byte[] bytes = service.carregarFoto(1L, 1);

        assertThat(bytes).containsExactly(9, 8, 7);
    }

    @Test
    void atualizarSubstituiFotosQuandoInformadas() throws Exception {
        Cliente existing = clienteComFotos(1L, "Maria", CPF_VALIDO);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(clienteRepository.findByCpf(CPF_VALIDO)).thenReturn(Optional.of(existing));
        when(imageStorageService.save(anyString())).thenReturn("new-key-1", "new-key-2");
        when(faceRecognitionService.extractEmbedding(any(BufferedImage.class)))
                .thenReturn(new float[] {0.5f}, new float[] {0.6f});
        when(clienteRepository.save(existing)).thenReturn(existing);

        service.atualizar(1L, new UpdateClienteCommand("Maria", CPF_VALIDO, List.of(FOTO_BASE64, FOTO_BASE64)));

        ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(captor.capture());
        assertThat(captor.getValue().getFotos()).hasSize(2);
        verify(imageStorageService).delete("storage-1");
        verify(imageStorageService).delete("storage-2");
        verify(faceRecognitionService).refreshEmbeddingCache();
    }

    private static String validImageBase64() {
        try {
            BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "png", out);
            return Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static Cliente cliente(long id, String nome, String cpf) {
        Cliente cliente = new Cliente();
        cliente.setId(id);
        cliente.setNome(nome);
        cliente.setCpf(cpf);
        cliente.setStatus(ClienteStatus.ATIVO);
        cliente.setCreatedAt(Instant.parse("2026-01-15T10:00:00Z"));
        return cliente;
    }

    private static Cliente clienteComFotos(long id, String nome, String cpf) {
        Cliente cliente = cliente(id, nome, cpf);
        FaceFoto foto1 = new FaceFoto();
        foto1.setOrdem((byte) 1);
        foto1.setStorageKey("storage-1");
        foto1.setEmbedding(new byte[] {1});
        foto1.setEmbeddingDim((short) 1);
        cliente.addFoto(foto1);
        FaceFoto foto2 = new FaceFoto();
        foto2.setOrdem((byte) 2);
        foto2.setStorageKey("storage-2");
        foto2.setEmbedding(new byte[] {2});
        foto2.setEmbeddingDim((short) 1);
        cliente.addFoto(foto2);
        return cliente;
    }
}
