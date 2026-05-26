package br.com.academia.faceaccess.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.academia.faceaccess.config.SecurityConfig;
import br.com.academia.faceaccess.service.FaceRecognitionService;
import java.awt.Rectangle;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FaceValidationController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class FaceValidationControllerWebTest {

    private static final String IMAGE =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FaceRecognitionService faceRecognitionService;

    @Test
    void validateWithoutAuthReturns401() throws Exception {
        mockMvc.perform(post("/api/faces/validate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void validateReturnsInvalidWhenNoFaceDetected() throws Exception {
        when(faceRecognitionService.detectFaces(any())).thenReturn(List.of());

        mockMvc.perform(post("/api/faces/validate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.faceCount").value(0))
                .andExpect(jsonPath("$.message").value("Rosto não detectado. Tente novamente."));
    }

    @Test
    @WithMockUser
    void validateReturnsInvalidWhenMultipleFacesDetected() throws Exception {
        when(faceRecognitionService.detectFaces(any()))
                .thenReturn(List.of(new Rectangle(0, 0, 1, 1), new Rectangle(1, 1, 1, 1)));

        mockMvc.perform(post("/api/faces/validate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(false))
                .andExpect(jsonPath("$.faceCount").value(2))
                .andExpect(jsonPath("$.message").value("Posicione apenas uma pessoa"));
    }

    @Test
    @WithMockUser
    void validateReturnsValidWhenSingleFaceDetected() throws Exception {
        when(faceRecognitionService.detectFaces(any())).thenReturn(List.of(new Rectangle(0, 0, 1, 1)));

        mockMvc.perform(post("/api/faces/validate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.faceCount").value(1))
                .andExpect(jsonPath("$.message").value("Rosto detectado."));
    }

    @Test
    @WithMockUser
    void validateReturnsBadRequestWhenImageBase64Missing() throws Exception {
        mockMvc.perform(post("/api/faces/validate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
