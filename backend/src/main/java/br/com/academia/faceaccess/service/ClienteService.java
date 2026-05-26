package br.com.academia.faceaccess.service;

import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.domain.FaceFoto;
import br.com.academia.faceaccess.repository.ClienteRepository;
import br.com.academia.faceaccess.service.exception.ClienteNotFoundException;
import br.com.academia.faceaccess.service.exception.DuplicateCpfException;
import jakarta.transaction.Transactional;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final FaceRecognitionService faceRecognitionService;
    private final ImageStorageService imageStorageService;

    public ClienteService(
            ClienteRepository clienteRepository,
            FaceRecognitionService faceRecognitionService,
            ImageStorageService imageStorageService) {
        this.clienteRepository = clienteRepository;
        this.faceRecognitionService = faceRecognitionService;
        this.imageStorageService = imageStorageService;
    }

    public record CreateClienteCommand(String nome, String cpf, List<String> photosBase64) {}

    public record UpdateClienteCommand(String nome, String cpf, List<String> photosBase64) {}

    public record ClienteSummary(
            Long id, String nome, String cpfMascarado, ClienteStatus status, Instant createdAt) {}

    public List<ClienteSummary> listar(String query) {
        List<Cliente> clientes = isBlank(query)
                ? clienteRepository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
                : clienteRepository.searchByNomeOrCpf(query.trim());
        return clientes.stream().map(this::toSummary).toList();
    }

    public Cliente buscarPorId(Long id) {
        return clienteRepository.findById(id).orElseThrow(() -> new ClienteNotFoundException(id));
    }

    @Transactional
    public Cliente criar(CreateClienteCommand command) {
        String cpf = normalizeCpf(command.cpf());
        assertCpfDisponivel(cpf, null);
        validatePhotos(command.photosBase64());

        Cliente cliente = new Cliente();
        cliente.setNome(command.nome().trim());
        cliente.setCpf(cpf);
        cliente.setStatus(ClienteStatus.ATIVO);
        persistPhotos(cliente, command.photosBase64());

        Cliente saved = clienteRepository.save(cliente);
        faceRecognitionService.refreshEmbeddingCache();
        return saved;
    }

    @Transactional
    public Cliente atualizar(Long id, UpdateClienteCommand command) {
        Cliente cliente = buscarPorId(id);
        String cpf = normalizeCpf(command.cpf());
        assertCpfDisponivel(cpf, id);

        cliente.setNome(command.nome().trim());
        cliente.setCpf(cpf);
        cliente.setUpdatedAt(Instant.now());

        if (command.photosBase64() != null) {
            validatePhotos(command.photosBase64());
            removeExistingPhotos(cliente);
            persistPhotos(cliente, command.photosBase64());
            faceRecognitionService.refreshEmbeddingCache();
        }

        return clienteRepository.save(cliente);
    }

    @Transactional
    public Cliente alterarStatus(Long id, ClienteStatus status) {
        Cliente cliente = buscarPorId(id);
        cliente.setStatus(status);
        cliente.setUpdatedAt(Instant.now());
        return clienteRepository.save(cliente);
    }

    public byte[] carregarFoto(Long clienteId, int ordem) throws IOException {
        Cliente cliente = buscarPorId(clienteId);
        FaceFoto foto = cliente.getFotos().stream()
                .filter(f -> f.getOrdem() == ordem)
                .findFirst()
                .orElseThrow(() -> new ClienteNotFoundException(clienteId));
        return imageStorageService.load(foto.getStorageKey());
    }

    public String mascararCpf(String cpf) {
        String digits = normalizeCpf(cpf);
        if (digits.length() != 11) {
            throw new IllegalArgumentException("CPF deve conter 11 dígitos");
        }
        return "***." + digits.substring(3, 6) + "." + digits.substring(6, 9) + "-**";
    }

    private ClienteSummary toSummary(Cliente cliente) {
        return new ClienteSummary(
                cliente.getId(),
                cliente.getNome(),
                mascararCpf(cliente.getCpf()),
                cliente.getStatus(),
                cliente.getCreatedAt());
    }

    private void assertCpfDisponivel(String cpf, Long excludeId) {
        clienteRepository.findByCpf(cpf).filter(existing -> !existing.getId().equals(excludeId)).ifPresent(existing -> {
            throw new DuplicateCpfException();
        });
    }

    private static void validatePhotos(List<String> photos) {
        if (photos == null || photos.size() != 2) {
            throw new IllegalArgumentException("Cliente deve ter exatamente 2 fotos");
        }
    }

    private void persistPhotos(Cliente cliente, List<String> photosBase64) {
        for (int i = 0; i < photosBase64.size(); i++) {
            byte ordem = (byte) (i + 1);
            try {
                BufferedImage image = decodeImage(photosBase64.get(i));
                float[] embedding = faceRecognitionService.extractEmbedding(image);
                String storageKey = imageStorageService.save(photosBase64.get(i));

                FaceFoto foto = new FaceFoto();
                foto.setOrdem(ordem);
                foto.setStorageKey(storageKey);
                foto.setEmbedding(FaceRecognitionService.embeddingToBytes(embedding));
                foto.setEmbeddingDim((short) embedding.length);
                cliente.addFoto(foto);
            } catch (IOException e) {
                throw new IllegalStateException("Erro ao salvar foto", e);
            }
        }
    }

    private void removeExistingPhotos(Cliente cliente) {
        for (FaceFoto foto : List.copyOf(cliente.getFotos())) {
            try {
                imageStorageService.delete(foto.getStorageKey());
            } catch (IOException e) {
                throw new IllegalStateException("Erro ao remover foto anterior", e);
            }
        }
        cliente.getFotos().clear();
    }

    private static BufferedImage decodeImage(String base64) throws IOException {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(decodeBase64(base64)));
        if (image == null) {
            throw new IllegalArgumentException("Imagem inválida");
        }
        return image;
    }

    private static byte[] decodeBase64(String base64Image) {
        String payload = base64Image;
        int commaIndex = base64Image.indexOf(',');
        if (commaIndex >= 0) {
            payload = base64Image.substring(commaIndex + 1);
        }
        return Base64.getDecoder().decode(payload);
    }

    static String normalizeCpf(String cpf) {
        return cpf.replaceAll("\\D", "");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
