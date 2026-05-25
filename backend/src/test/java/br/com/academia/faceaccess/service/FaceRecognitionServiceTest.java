package br.com.academia.faceaccess.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import br.com.academia.faceaccess.config.FaceRecognitionProperties;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.FaceFoto;
import br.com.academia.faceaccess.repository.FaceFotoRepository;
import br.com.academia.faceaccess.service.faces.FaceDetector;
import br.com.academia.faceaccess.service.faces.FaceEmbedder;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FaceRecognitionServiceTest {

    @Mock
    private FaceDetector faceDetector;

    @Mock
    private FaceEmbedder faceEmbedder;

    @Mock
    private FaceFotoRepository faceFotoRepository;

    private FaceRecognitionService service;

    @BeforeEach
    void setUp() {
        service = new FaceRecognitionService(
                faceDetector, faceEmbedder, faceFotoRepository, properties(0.6));
    }

    @Test
    void detectFacesReturnsEmptyList() {
        BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        when(faceDetector.detectFaces(image)).thenReturn(List.of());

        assertThat(service.detectFaces(image)).isEmpty();
    }

    @Test
    void detectFacesReturnsSingleFace() {
        BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        Rectangle face = new Rectangle(1, 1, 4, 4);
        when(faceDetector.detectFaces(image)).thenReturn(List.of(face));

        assertThat(service.detectFaces(image)).containsExactly(face);
    }

    @Test
    void detectFacesReturnsMultipleFaces() {
        BufferedImage image = new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB);
        when(faceDetector.detectFaces(image)).thenReturn(List.of(new Rectangle(0, 0, 5, 5), new Rectangle(6, 6, 5, 5)));

        assertThat(service.detectFaces(image)).hasSize(2);
    }

    @Test
    void extractEmbeddingRequiresExactlyOneFace() {
        BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        when(faceDetector.detectFaces(image)).thenReturn(List.of());

        assertThatThrownBy(() -> service.extractEmbedding(image))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Expected exactly one face");
    }

    @Test
    void findBestMatchReturnsClosestCandidateBelowThreshold() {
        when(faceFotoRepository.findAll()).thenReturn(List.of(
                faceFoto(1L, 10L, new float[] {0.9f, 0.1f}),
                faceFoto(2L, 20L, new float[] {0f, 1f})));

        Optional<FaceRecognitionService.FaceMatch> match = service.findBestMatch(new float[] {1f, 0f});

        assertThat(match).isPresent();
        assertThat(match.get().clienteId()).isEqualTo(1L);
    }

    @Test
    void findBestMatchEmptyWhenDistanceAboveThreshold() {
        service = new FaceRecognitionService(
                faceDetector, faceEmbedder, faceFotoRepository, properties(0.1));
        when(faceFotoRepository.findAll()).thenReturn(List.of(faceFoto(2L, 20L, new float[] {0f, 1f})));

        assertThat(service.findBestMatch(new float[] {1f, 0f})).isEmpty();
    }

    @Test
    void findBestMatchEmptyWhenNoCandidates() {
        when(faceFotoRepository.findAll()).thenReturn(List.of());

        assertThat(service.findBestMatch(new float[] {1f, 0f})).isEmpty();
    }

    private static FaceRecognitionProperties properties(double threshold) {
        FaceRecognitionProperties properties = new FaceRecognitionProperties();
        properties.setThreshold(threshold);
        return properties;
    }

    private static FaceFoto faceFoto(long clienteId, long fotoId, float[] embedding) {
        Cliente cliente = new Cliente();
        cliente.setId(clienteId);

        FaceFoto foto = new FaceFoto();
        foto.setId(fotoId);
        foto.setCliente(cliente);
        foto.setEmbeddingDim((short) embedding.length);
        foto.setEmbedding(FaceRecognitionService.embeddingToBytes(embedding));
        return foto;
    }
}
