package br.com.academia.faceaccess.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.academia.faceaccess.config.SecurityConfig;
import br.com.academia.faceaccess.domain.Maquina;
import br.com.academia.faceaccess.domain.MaquinaStatus;
import br.com.academia.faceaccess.domain.MaquinaTipo;
import br.com.academia.faceaccess.service.MaquinaService;
import br.com.academia.faceaccess.service.exception.DuplicatePatrimonioException;
import java.time.Instant;
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

@WebMvcTest(MaquinaController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
class MaquinaControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MaquinaService maquinaService;

    private Maquina maquina;

    @BeforeEach
    void setUp() {
        maquina = new Maquina();
        maquina.setId(1L);
        maquina.setNome("Esteira 01");
        maquina.setTipo(MaquinaTipo.CARDIO);
        maquina.setMarca("Technogym");
        maquina.setModelo("Run 500");
        maquina.setCodigoPatrimonio("PAT-001");
        maquina.setLocalizacao("Sala cardio");
        maquina.setStatus(MaquinaStatus.ATIVA);
        maquina.setObservacoes("Manutenção trimestral");
        maquina.setCreatedAt(Instant.parse("2026-01-15T10:00:00Z"));
        maquina.setUpdatedAt(Instant.parse("2026-01-15T10:00:00Z"));
    }

    @Test
    void listWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/maquinas")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void listReturnsSummaries() throws Exception {
        when(maquinaService.listar(null))
                .thenReturn(List.of(new MaquinaService.MaquinaSummary(
                        1L,
                        "Esteira 01",
                        MaquinaTipo.CARDIO,
                        MaquinaStatus.ATIVA,
                        "Sala cardio",
                        maquina.getCreatedAt())));

        mockMvc.perform(get("/api/maquinas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Esteira 01"))
                .andExpect(jsonPath("$[0].tipo").value("CARDIO"))
                .andExpect(jsonPath("$[0].localizacao").value("Sala cardio"));
    }

    @Test
    @WithMockUser
    void listWithQueryParam() throws Exception {
        when(maquinaService.listar("esteira"))
                .thenReturn(List.of(new MaquinaService.MaquinaSummary(
                        1L,
                        "Esteira 01",
                        MaquinaTipo.CARDIO,
                        MaquinaStatus.ATIVA,
                        "Sala cardio",
                        maquina.getCreatedAt())));

        mockMvc.perform(get("/api/maquinas").param("q", "esteira"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nome").value("Esteira 01"));
    }

    @Test
    @WithMockUser
    void createReturns201() throws Exception {
        when(maquinaService.criar(any())).thenReturn(maquina);

        mockMvc.perform(post("/api/maquinas")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nome").value("Esteira 01"))
                .andExpect(jsonPath("$.codigoPatrimonio").value("PAT-001"));
    }

    @Test
    @WithMockUser
    void createDuplicatePatrimonioReturns409() throws Exception {
        when(maquinaService.criar(any())).thenThrow(new DuplicatePatrimonioException());

        mockMvc.perform(post("/api/maquinas")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Código de patrimônio já cadastrado"));
    }

    @Test
    @WithMockUser
    void getByIdReturns200() throws Exception {
        when(maquinaService.buscarPorId(1L)).thenReturn(maquina);

        mockMvc.perform(get("/api/maquinas/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Esteira 01"))
                .andExpect(jsonPath("$.marca").value("Technogym"));
    }

    @Test
    @WithMockUser
    void updateReturns200() throws Exception {
        when(maquinaService.atualizar(eq(1L), any())).thenReturn(maquina);

        mockMvc.perform(put("/api/maquinas/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Esteira Atualizada",
                                  "tipo": "CARDIO",
                                  "marca": "Technogym",
                                  "modelo": "Run 500",
                                  "codigoPatrimonio": "PAT-001",
                                  "localizacao": "Sala cardio"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Esteira 01"));
    }

    @Test
    @WithMockUser
    void patchStatusReturns200() throws Exception {
        maquina.setStatus(MaquinaStatus.MANUTENCAO);
        when(maquinaService.alterarStatus(1L, MaquinaStatus.MANUTENCAO)).thenReturn(maquina);

        mockMvc.perform(patch("/api/maquinas/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"MANUTENCAO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("MANUTENCAO"));
    }

    private static String createPayload() {
        return """
                {
                  "nome": "Esteira 01",
                  "tipo": "CARDIO",
                  "marca": "Technogym",
                  "modelo": "Run 500",
                  "codigoPatrimonio": "PAT-001",
                  "localizacao": "Sala cardio",
                  "observacoes": "Manutenção trimestral"
                }
                """;
    }
}
