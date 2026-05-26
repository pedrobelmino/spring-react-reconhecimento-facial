package br.com.academia.faceaccess.web;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.academia.faceaccess.config.SecurityConfig;
import br.com.academia.faceaccess.domain.AdminUser;
import br.com.academia.faceaccess.repository.AdminUserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class AuthControllerWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminUser adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new AdminUser();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
        adminUser.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
    }

    @Test
    void loginWithValidCredentialsReturnsOkAndUsername() throws Exception {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void loginWithInvalidPasswordReturns401() throws Exception {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithUnknownUsernameReturns401() throws Exception {
        when(adminUserRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"unknown\",\"password\":\"admin123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meWithoutSessionReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void meAfterLoginReturnsUser() throws Exception {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));

        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void logoutInvalidatesSession() throws Exception {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));

        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/logout").with(csrf()).session(session))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
    }
}
