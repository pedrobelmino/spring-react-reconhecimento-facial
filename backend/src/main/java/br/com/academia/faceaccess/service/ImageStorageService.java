package br.com.academia.faceaccess.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ImageStorageService {

    private final Path basePath;

    public ImageStorageService(@Value("${storage.local-path:./data/faces}") String localPath) {
        this.basePath = Path.of(localPath);
    }

    public String save(String base64Image) throws IOException {
        byte[] bytes = decodeBase64(base64Image);
        String key = UUID.randomUUID() + ".jpg";
        Path target = resolve(key);
        Files.createDirectories(basePath);
        Files.write(target, bytes);
        return key;
    }

    public byte[] load(String key) throws IOException {
        return Files.readAllBytes(resolve(key));
    }

    public void delete(String key) throws IOException {
        Files.deleteIfExists(resolve(key));
    }

    private Path resolve(String key) {
        Path normalized = basePath.resolve(key).normalize();
        if (!normalized.startsWith(basePath.normalize())) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return normalized;
    }

    private static byte[] decodeBase64(String base64Image) {
        String payload = base64Image;
        int commaIndex = base64Image.indexOf(',');
        if (commaIndex >= 0) {
            payload = base64Image.substring(commaIndex + 1);
        }
        return Base64.getDecoder().decode(payload);
    }
}
