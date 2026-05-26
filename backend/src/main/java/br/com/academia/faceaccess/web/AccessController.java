package br.com.academia.faceaccess.web;

import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.domain.EventoMotivo;
import br.com.academia.faceaccess.domain.EventoResultado;
import br.com.academia.faceaccess.domain.FaceFoto;
import br.com.academia.faceaccess.repository.ClienteRepository;
import br.com.academia.faceaccess.repository.FaceFotoRepository;
import br.com.academia.faceaccess.service.AccessEventService;
import br.com.academia.faceaccess.service.FaceRecognitionService;
import br.com.academia.faceaccess.service.FaceRecognitionService.FaceMatch;
import br.com.academia.faceaccess.web.dto.AccessStatusResponse;
import br.com.academia.faceaccess.web.dto.FaceImageRequest;
import br.com.academia.faceaccess.web.dto.RecognizeResponse;
import jakarta.validation.Valid;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/access")
public class AccessController {

    private final FaceRecognitionService faceRecognitionService;
    private final AccessEventService accessEventService;
    private final ClienteRepository clienteRepository;
    private final FaceFotoRepository faceFotoRepository;

    public AccessController(
            FaceRecognitionService faceRecognitionService,
            AccessEventService accessEventService,
            ClienteRepository clienteRepository,
            FaceFotoRepository faceFotoRepository) {
        this.faceRecognitionService = faceRecognitionService;
        this.accessEventService = accessEventService;
        this.clienteRepository = clienteRepository;
        this.faceFotoRepository = faceFotoRepository;
    }

    @GetMapping("/status")
    public AccessStatusResponse status() {
        int activeClients = (int) faceFotoRepository.countDistinctClientesByClienteStatus(ClienteStatus.ATIVO);
        return new AccessStatusResponse(activeClients, activeClients > 0);
    }

    @PostMapping("/recognize")
    public RecognizeResponse recognize(@Valid @RequestBody FaceImageRequest request) {
        BufferedImage image = decodeImage(request.imageBase64());
        List<Rectangle> faces = faceRecognitionService.detectFaces(image);
        int faceCount = faces.size();
        if (faceCount != 1) {
            return new RecognizeResponse(null, null, null, null, null, false, 0.0, faceCount);
        }

        float[] embedding = faceRecognitionService.extractEmbedding(image);
        Optional<FaceMatch> match = faceRecognitionService.findBestMatch(embedding);
        if (match.isEmpty()) {
            AccessEventService.AccessProcessResult evento = accessEventService.registrarNegado(
                    null, EventoMotivo.NAO_RECONHECIDO, BigDecimal.ZERO);
            return new RecognizeResponse(
                    EventoResultado.NEGADO,
                    EventoMotivo.NAO_RECONHECIDO,
                    null,
                    null,
                    null,
                    evento.eventoRegistrado(),
                    0.0,
                    1);
        }

        FaceMatch faceMatch = match.get();
        Cliente cliente = clienteRepository
                .findById(faceMatch.clienteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente not found"));

        double confianca = toConfianca(faceMatch.distance());
        if (cliente.getStatus() == ClienteStatus.INATIVO) {
            AccessEventService.AccessProcessResult evento = accessEventService.registrarNegado(
                    cliente, EventoMotivo.CLIENTE_INATIVO, toBigDecimal(confianca));
            return new RecognizeResponse(
                    EventoResultado.NEGADO,
                    EventoMotivo.CLIENTE_INATIVO,
                    cliente.getId(),
                    cliente.getNome(),
                    fotoUrl(cliente.getId(), faceMatch.faceFotoId()),
                    evento.eventoRegistrado(),
                    confianca,
                    1);
        }

        AccessEventService.AccessProcessResult evento =
                accessEventService.registrarLiberado(cliente, toBigDecimal(confianca));
        return new RecognizeResponse(
                EventoResultado.LIBERADO,
                null,
                cliente.getId(),
                cliente.getNome(),
                fotoUrl(cliente.getId(), faceMatch.faceFotoId()),
                evento.eventoRegistrado(),
                confianca,
                1);
    }

    private String fotoUrl(Long clienteId, long faceFotoId) {
        return faceFotoRepository
                .findById(faceFotoId)
                .map(FaceFoto::getOrdem)
                .map(ordem -> "/api/clientes/" + clienteId + "/foto/" + ordem)
                .orElse(null);
    }

    private static double toConfianca(double distance) {
        return Math.max(0.0, 1.0 - distance);
    }

    private static BigDecimal toBigDecimal(double confianca) {
        return BigDecimal.valueOf(confianca).setScale(4, RoundingMode.HALF_UP);
    }

    private static BufferedImage decodeImage(String imageBase64) {
        try {
            String payload = imageBase64;
            int commaIndex = imageBase64.indexOf(',');
            if (commaIndex >= 0) {
                payload = imageBase64.substring(commaIndex + 1);
            }
            byte[] bytes = Base64.getDecoder().decode(payload);
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image data");
            }
            return image;
        } catch (IllegalArgumentException | IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image data");
        }
    }
}
