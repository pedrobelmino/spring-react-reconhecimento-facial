package br.com.academia.faceaccess.web;

import br.com.academia.faceaccess.service.FaceRecognitionService;
import br.com.academia.faceaccess.web.dto.FaceImageRequest;
import br.com.academia.faceaccess.web.dto.FaceValidationResponse;
import jakarta.validation.Valid;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/faces")
public class FaceValidationController {

    private final FaceRecognitionService faceRecognitionService;

    public FaceValidationController(FaceRecognitionService faceRecognitionService) {
        this.faceRecognitionService = faceRecognitionService;
    }

    @PostMapping("/validate")
    public FaceValidationResponse validate(@Valid @RequestBody FaceImageRequest request) {
        BufferedImage image = decodeImage(request.imageBase64());
        List<Rectangle> faces = faceRecognitionService.detectFaces(image);
        int faceCount = faces.size();

        if (faceCount == 0) {
            return new FaceValidationResponse(false, "Rosto não detectado. Tente novamente.", 0);
        }
        if (faceCount > 1) {
            return new FaceValidationResponse(false, "Posicione apenas uma pessoa", faceCount);
        }
        return new FaceValidationResponse(true, "Rosto detectado.", 1);
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
