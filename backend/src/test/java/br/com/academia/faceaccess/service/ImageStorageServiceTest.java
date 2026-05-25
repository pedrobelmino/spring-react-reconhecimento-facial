package br.com.academia.faceaccess.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ImageStorageServiceTest {

    @TempDir
    Path tempDir;

    private ImageStorageService service;

    @BeforeEach
    void setUp() {
        service = new ImageStorageService(tempDir.toString());
    }

    @Test
    void saveLoadAndDeleteRoundTrip() throws Exception {
        String base64 = Base64.getEncoder().encodeToString("face-image".getBytes());

        String key = service.save(base64);
        byte[] loaded = service.load(key);

        assertThat(loaded).isEqualTo("face-image".getBytes());
        service.delete(key);
        assertThat(Files.exists(tempDir.resolve(key))).isFalse();
    }

    @Test
    void saveAcceptsDataUrlPrefix() throws Exception {
        String key = service.save("data:image/jpeg;base64," + Base64.getEncoder().encodeToString(new byte[]{1, 2, 3}));

        assertThat(service.load(key)).containsExactly(1, 2, 3);
    }

    @Test
    void deleteIsIdempotent() throws Exception {
        String key = service.save(Base64.getEncoder().encodeToString(new byte[]{9}));

        service.delete(key);
        service.delete(key);
    }

    @Test
    void rejectsPathTraversalKeyOnLoad() {
        assertThatThrownBy(() -> service.load("../secret.txt"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
