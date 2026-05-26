package br.com.academia.faceaccess.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.academia.faceaccess.config.SecurityConfig;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.domain.FaceFoto;
import br.com.academia.faceaccess.service.ClienteService;
import br.com.academia.faceaccess.service.exception.ClienteNotFoundException;
import br.com.academia.faceaccess.service.exception.DuplicateCpfException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ClienteController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
class ClienteControllerWebTest {

    private static final String CPF = "52998224725";
    private static final String FOTO = Base64.getEncoder().encodeToString(new byte[] {1, 2, 3});

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClienteService clienteService;

    private Cliente cliente;

    @BeforeEach
    void setUp() {
        cliente = new Cliente();
        cliente.setId(1L);
        cliente.setNome("Maria Silva");
        cliente.setCpf(CPF);
        cliente.setStatus(ClienteStatus.ATIVO);
        cliente.setCreatedAt(Instant.parse("2026-01-15T10:00:00Z"));
        cliente.setUpdatedAt(Instant.parse("2026-01-15T10:00:00Z"));

        FaceFoto foto1 = new FaceFoto();
        foto1.setOrdem((byte) 1);
        foto1.setStorageKey("key-1");
        cliente.addFoto(foto1);
    }

    @Test
    void listWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/clientes")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void listReturnsSummaries() throws Exception {
        when(clienteService.listar(null))
                .thenReturn(List.of(new ClienteService.ClienteSummary(
                        1L, "Maria Silva", "***.982.247-**", ClienteStatus.ATIVO, cliente.getCreatedAt())));

        mockMvc.perform(get("/api/clientes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Maria Silva"))
                .andExpect(jsonPath("$[0].cpfMascarado").value("***.982.247-**"));
    }

    @Test
    @WithMockUser
    void listWithQueryParam() throws Exception {
        when(clienteService.listar("maria"))
                .thenReturn(List.of(new ClienteService.ClienteSummary(
                        1L, "Maria Silva", "***.982.247-**", ClienteStatus.ATIVO, cliente.getCreatedAt())));

        mockMvc.perform(get("/api/clientes").param("q", "maria"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Maria Silva"));
    }

    @Test
    @WithMockUser
    void createReturns201() throws Exception {
        when(clienteService.criar(any())).thenReturn(cliente);

        mockMvc.perform(post("/api/clientes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Maria Silva"))
                .andExpect(jsonPath("$.fotoUrls[0]").value("/api/clientes/1/foto/1"));
    }

    @Test
    @WithMockUser
    void createDuplicateCpfReturns409() throws Exception {
        when(clienteService.criar(any())).thenThrow(new DuplicateCpfException());

        mockMvc.perform(post("/api/clientes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("CPF já cadastrado"));
    }

    @Test
    @WithMockUser
    void createInvalidCpfReturns400() throws Exception {
        mockMvc.perform(post("/api/clientes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Maria",
                                  "cpf": "11111111111",
                                  "photosBase64": ["%s", "%s"]
                                }
                                """
                                .formatted(FOTO, FOTO)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void getByIdReturns200() throws Exception {
        when(clienteService.buscarPorId(1L)).thenReturn(cliente);

        mockMvc.perform(get("/api/clientes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cpf").value(CPF))
                .andExpect(jsonPath("$.fotoUrls[0]").value("/api/clientes/1/foto/1"));
    }

    @Test
    @WithMockUser
    void getByIdNotFoundReturns404() throws Exception {
        when(clienteService.buscarPorId(99L)).thenThrow(new ClienteNotFoundException(99L));

        mockMvc.perform(get("/api/clientes/99")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void updateReturns200() throws Exception {
        when(clienteService.atualizar(eq(1L), any())).thenReturn(cliente);

        mockMvc.perform(put("/api/clientes/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Maria Atualizada",
                                  "cpf": "%s"
                                }
                                """
                                .formatted(CPF)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria Silva"));
    }

    @Test
    @WithMockUser
    void patchStatusReturns200() throws Exception {
        cliente.setStatus(ClienteStatus.INATIVO);
        when(clienteService.alterarStatus(1L, ClienteStatus.INATIVO)).thenReturn(cliente);

        mockMvc.perform(patch("/api/clientes/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INATIVO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INATIVO"));
    }

    @Test
    @WithMockUser
    void getFotoReturns200WithImageBytes() throws Exception {
        when(clienteService.carregarFoto(1L, 1)).thenReturn(new byte[] {9, 8, 7});

        mockMvc.perform(get("/api/clientes/1/foto/1"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.IMAGE_JPEG_VALUE))
                .andExpect(content().bytes(new byte[] {9, 8, 7}));
    }

    private static String createPayload() {
        return """
                {
                  "nome": "Maria Silva",
                  "cpf": "%s",
                  "photosBase64": ["%s", "%s"]
                }
                """
                .formatted(CPF, FOTO, FOTO);
    }
}
