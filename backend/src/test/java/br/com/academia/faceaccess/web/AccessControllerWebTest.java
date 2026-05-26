package br.com.academia.faceaccess.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.academia.faceaccess.config.SecurityConfig;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.domain.EventoMotivo;
import br.com.academia.faceaccess.domain.FaceFoto;
import br.com.academia.faceaccess.repository.ClienteRepository;
import br.com.academia.faceaccess.repository.FaceFotoRepository;
import br.com.academia.faceaccess.service.AccessEventService;
import br.com.academia.faceaccess.service.FaceRecognitionService;
import br.com.academia.faceaccess.service.FaceRecognitionService.FaceMatch;
import java.awt.Rectangle;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AccessController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class AccessControllerWebTest {

    private static final String IMAGE =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FaceRecognitionService faceRecognitionService;

    @MockBean
    private AccessEventService accessEventService;

    @MockBean
    private ClienteRepository clienteRepository;

    @MockBean
    private FaceFotoRepository faceFotoRepository;

    private Cliente activeCliente;
    private Cliente inactiveCliente;
    private FaceFoto faceFoto;

    @BeforeEach
    void setUp() {
        activeCliente = new Cliente();
        activeCliente.setId(10L);
        activeCliente.setNome("João Silva");
        activeCliente.setStatus(ClienteStatus.ATIVO);

        inactiveCliente = new Cliente();
        inactiveCliente.setId(11L);
        inactiveCliente.setNome("Maria Inativa");
        inactiveCliente.setStatus(ClienteStatus.INATIVO);

        faceFoto = new FaceFoto();
        faceFoto.setId(100L);
        faceFoto.setOrdem((byte) 1);
        faceFoto.setCliente(activeCliente);
    }

    @Test
    void statusReturnsOperacionalWhenActiveClientsExist() throws Exception {
        when(faceFotoRepository.countDistinctClientesByClienteStatus(ClienteStatus.ATIVO)).thenReturn(3L);

        mockMvc.perform(get("/api/access/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientesAtivosComFaces").value(3))
                .andExpect(jsonPath("$.operacional").value(true));
    }

    @Test
    void statusReturnsNotOperacionalWhenBaseEmpty() throws Exception {
        when(faceFotoRepository.countDistinctClientesByClienteStatus(ClienteStatus.ATIVO)).thenReturn(0L);

        mockMvc.perform(get("/api/access/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientesAtivosComFaces").value(0))
                .andExpect(jsonPath("$.operacional").value(false));
    }

    @Test
    void recognizeLiberadoForActiveClient() throws Exception {
        mockSingleFacePipeline(new FaceMatch(10L, 100L, 0.2));
        when(clienteRepository.findById(10L)).thenReturn(Optional.of(activeCliente));
        when(faceFotoRepository.findById(100L)).thenReturn(Optional.of(faceFoto));
        when(accessEventService.registrarLiberado(eq(activeCliente), any(BigDecimal.class)))
                .thenReturn(new AccessEventService.AccessProcessResult(true, null));

        mockMvc.perform(post("/api/access/recognize")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("LIBERADO"))
                .andExpect(jsonPath("$.motivo").doesNotExist())
                .andExpect(jsonPath("$.clienteId").value(10))
                .andExpect(jsonPath("$.nome").value("João Silva"))
                .andExpect(jsonPath("$.fotoUrl").value("/api/clientes/10/foto/1"))
                .andExpect(jsonPath("$.eventoRegistrado").value(true))
                .andExpect(jsonPath("$.confianca").value(0.8))
                .andExpect(jsonPath("$.faceCount").value(1));
    }

    @Test
    void recognizeNegadoForUnknownFace() throws Exception {
        mockSingleFacePipeline(null);
        when(accessEventService.registrarNegado(null, EventoMotivo.NAO_RECONHECIDO, BigDecimal.ZERO))
                .thenReturn(new AccessEventService.AccessProcessResult(true, null));

        mockMvc.perform(post("/api/access/recognize")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("NEGADO"))
                .andExpect(jsonPath("$.motivo").value("NAO_RECONHECIDO"))
                .andExpect(jsonPath("$.clienteId").doesNotExist())
                .andExpect(jsonPath("$.nome").doesNotExist())
                .andExpect(jsonPath("$.fotoUrl").doesNotExist())
                .andExpect(jsonPath("$.eventoRegistrado").value(true))
                .andExpect(jsonPath("$.faceCount").value(1));
    }

    @Test
    void recognizeNegadoForInactiveClient() throws Exception {
        mockSingleFacePipeline(new FaceMatch(11L, 101L, 0.15));
        when(clienteRepository.findById(11L)).thenReturn(Optional.of(inactiveCliente));
        FaceFoto inactiveFoto = new FaceFoto();
        inactiveFoto.setId(101L);
        inactiveFoto.setOrdem((byte) 2);
        when(faceFotoRepository.findById(101L)).thenReturn(Optional.of(inactiveFoto));
        when(accessEventService.registrarNegado(eq(inactiveCliente), eq(EventoMotivo.CLIENTE_INATIVO), any(BigDecimal.class)))
                .thenReturn(new AccessEventService.AccessProcessResult(true, null));

        mockMvc.perform(post("/api/access/recognize")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("NEGADO"))
                .andExpect(jsonPath("$.motivo").value("CLIENTE_INATIVO"))
                .andExpect(jsonPath("$.clienteId").value(11))
                .andExpect(jsonPath("$.nome").value("Maria Inativa"))
                .andExpect(jsonPath("$.fotoUrl").value("/api/clientes/11/foto/2"))
                .andExpect(jsonPath("$.eventoRegistrado").value(true))
                .andExpect(jsonPath("$.faceCount").value(1));
    }

    @Test
    void recognizeReturnsMultiFaceCountWithoutOutcome() throws Exception {
        when(faceRecognitionService.detectFaces(any())).thenReturn(List.of(new Rectangle(0, 0, 1, 1), new Rectangle(1, 1, 1, 1)));

        mockMvc.perform(post("/api/access/recognize")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.faceCount").value(2))
                .andExpect(jsonPath("$.outcome").doesNotExist())
                .andExpect(jsonPath("$.eventoRegistrado").value(false));

        verify(accessEventService, never()).registrarLiberado(any(), any());
        verify(accessEventService, never()).registrarNegado(any(), any(), any());
    }

    @Test
    void recognizeReturnsZeroFaceCountWithoutOutcome() throws Exception {
        when(faceRecognitionService.detectFaces(any())).thenReturn(List.of());

        mockMvc.perform(post("/api/access/recognize")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.faceCount").value(0))
                .andExpect(jsonPath("$.outcome").doesNotExist())
                .andExpect(jsonPath("$.eventoRegistrado").value(false));
    }

    @Test
    void recognizeSkipsEventRegistrationDuringCooldown() throws Exception {
        mockSingleFacePipeline(new FaceMatch(10L, 100L, 0.2));
        when(clienteRepository.findById(10L)).thenReturn(Optional.of(activeCliente));
        when(faceFotoRepository.findById(100L)).thenReturn(Optional.of(faceFoto));
        when(accessEventService.registrarLiberado(eq(activeCliente), any(BigDecimal.class)))
                .thenReturn(new AccessEventService.AccessProcessResult(false, null));

        mockMvc.perform(post("/api/access/recognize")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("LIBERADO"))
                .andExpect(jsonPath("$.eventoRegistrado").value(false))
                .andExpect(jsonPath("$.faceCount").value(1));
    }

    @Test
    void accessEndpointsArePublicWithoutAuthentication() throws Exception {
        when(faceFotoRepository.countDistinctClientesByClienteStatus(ClienteStatus.ATIVO)).thenReturn(1L);

        mockMvc.perform(get("/api/access/status")).andExpect(status().isOk());

        when(faceRecognitionService.detectFaces(any())).thenReturn(List.of());
        mockMvc.perform(post("/api/access/recognize")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageBase64\":\"" + IMAGE + "\"}"))
                .andExpect(status().isOk());
    }

    private void mockSingleFacePipeline(FaceMatch match) {
        when(faceRecognitionService.detectFaces(any())).thenReturn(List.of(new Rectangle(0, 0, 1, 1)));
        when(faceRecognitionService.extractEmbedding(any())).thenReturn(new float[] {0.1f, 0.2f});
        when(faceRecognitionService.findBestMatch(any())).thenReturn(Optional.ofNullable(match));
    }
}
