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
import br.com.academia.faceaccess.domain.AcompanhamentoNutricional;
import br.com.academia.faceaccess.domain.AcompanhamentoStatus;
import br.com.academia.faceaccess.domain.Cliente;
import br.com.academia.faceaccess.domain.ClienteStatus;
import br.com.academia.faceaccess.service.AcompanhamentoNutricionalService;
import br.com.academia.faceaccess.service.exception.AcompanhamentoNotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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

@WebMvcTest(AcompanhamentoNutricionalController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
class AcompanhamentoNutricionalControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AcompanhamentoNutricionalService acompanhamentoService;

    private AcompanhamentoNutricional acompanhamento;
    private Cliente cliente;

    @BeforeEach
    void setUp() {
        cliente = new Cliente();
        cliente.setId(10L);
        cliente.setNome("Maria Silva");
        cliente.setCpf("52998224725");
        cliente.setStatus(ClienteStatus.ATIVO);

        acompanhamento = new AcompanhamentoNutricional();
        acompanhamento.setId(1L);
        acompanhamento.setCliente(cliente);
        acompanhamento.setDataConsulta(LocalDate.of(2026, 1, 10));
        acompanhamento.setPesoKg(new BigDecimal("72.50"));
        acompanhamento.setProfissional("Dr. Nutri");
        acompanhamento.setObjetivo("Emagrecimento");
        acompanhamento.setOrientacoes("Hidratação e proteína");
        acompanhamento.setProximaConsulta(LocalDate.of(2026, 2, 10));
        acompanhamento.setStatus(AcompanhamentoStatus.ATIVO);
        acompanhamento.setCreatedAt(Instant.parse("2026-01-15T10:00:00Z"));
        acompanhamento.setUpdatedAt(Instant.parse("2026-01-15T10:00:00Z"));
    }

    @Test
    void listWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/acompanhamentos")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void listReturnsSummaries() throws Exception {
        when(acompanhamentoService.listar(null, null))
                .thenReturn(List.of(new AcompanhamentoNutricionalService.AcompanhamentoSummary(
                        1L,
                        10L,
                        "Maria Silva",
                        LocalDate.of(2026, 1, 10),
                        new BigDecimal("72.50"),
                        "Dr. Nutri",
                        AcompanhamentoStatus.ATIVO,
                        acompanhamento.getCreatedAt())));

        mockMvc.perform(get("/api/acompanhamentos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].clienteNome").value("Maria Silva"))
                .andExpect(jsonPath("$[0].pesoKg").value(72.50))
                .andExpect(jsonPath("$[0].status").value("ATIVO"));
    }

    @Test
    @WithMockUser
    void listWithClienteIdFilter() throws Exception {
        when(acompanhamentoService.listar(10L, null))
                .thenReturn(List.of(new AcompanhamentoNutricionalService.AcompanhamentoSummary(
                        1L,
                        10L,
                        "Maria Silva",
                        LocalDate.of(2026, 1, 10),
                        new BigDecimal("72.50"),
                        "Dr. Nutri",
                        AcompanhamentoStatus.ATIVO,
                        acompanhamento.getCreatedAt())));

        mockMvc.perform(get("/api/acompanhamentos").param("clienteId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].clienteId").value(10));
    }

    @Test
    @WithMockUser
    void listWithQueryParam() throws Exception {
        when(acompanhamentoService.listar(null, "nutri"))
                .thenReturn(List.of(new AcompanhamentoNutricionalService.AcompanhamentoSummary(
                        1L,
                        10L,
                        "Maria Silva",
                        LocalDate.of(2026, 1, 10),
                        new BigDecimal("72.50"),
                        "Dr. Nutri",
                        AcompanhamentoStatus.ATIVO,
                        acompanhamento.getCreatedAt())));

        mockMvc.perform(get("/api/acompanhamentos").param("q", "nutri"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].profissional").value("Dr. Nutri"));
    }

    @Test
    @WithMockUser
    void createReturns201() throws Exception {
        when(acompanhamentoService.criar(any())).thenReturn(acompanhamento);

        mockMvc.perform(post("/api/acompanhamentos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.clienteNome").value("Maria Silva"))
                .andExpect(jsonPath("$.pesoKg").value(72.50));
    }

    @Test
    @WithMockUser
    void createMissingClienteIdReturns400() throws Exception {
        mockMvc.perform(post("/api/acompanhamentos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dataConsulta": "2026-01-10",
                                  "pesoKg": 72.5
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser
    void getByIdNotFoundReturns404() throws Exception {
        when(acompanhamentoService.buscarPorId(99L)).thenThrow(new AcompanhamentoNotFoundException(99L));

        mockMvc.perform(get("/api/acompanhamentos/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Acompanhamento nutricional não encontrado: 99"));
    }

    @Test
    @WithMockUser
    void getByIdReturns200() throws Exception {
        when(acompanhamentoService.buscarPorId(1L)).thenReturn(acompanhamento);

        mockMvc.perform(get("/api/acompanhamentos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.objetivo").value("Emagrecimento"))
                .andExpect(jsonPath("$.orientacoes").value("Hidratação e proteína"));
    }

    @Test
    @WithMockUser
    void updateReturns200() throws Exception {
        when(acompanhamentoService.atualizar(eq(1L), any())).thenReturn(acompanhamento);

        mockMvc.perform(put("/api/acompanhamentos/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clienteId").value(10));
    }

    @Test
    @WithMockUser
    void patchStatusReturns200() throws Exception {
        acompanhamento.setStatus(AcompanhamentoStatus.INATIVO);
        when(acompanhamentoService.alterarStatus(1L, AcompanhamentoStatus.INATIVO)).thenReturn(acompanhamento);

        mockMvc.perform(patch("/api/acompanhamentos/1/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INATIVO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INATIVO"));
    }

    private static String createPayload() {
        return """
                {
                  "clienteId": 10,
                  "dataConsulta": "2026-01-10",
                  "pesoKg": 72.5,
                  "profissional": "Dr. Nutri",
                  "objetivo": "Emagrecimento",
                  "orientacoes": "Hidratação e proteína",
                  "proximaConsulta": "2026-02-10"
                }
                """;
    }

    private static String updatePayload() {
        return """
                {
                  "dataConsulta": "2026-01-10",
                  "pesoKg": 71.0,
                  "profissional": "Dr. Nutri",
                  "objetivo": "Emagrecimento",
                  "orientacoes": "Atualizado"
                }
                """;
    }
}
