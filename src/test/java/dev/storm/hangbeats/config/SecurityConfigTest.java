package dev.storm.hangbeats.config;

import dev.storm.hangbeats.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class SecurityConfigTest {

    @Test
    void corsConfigurationSourceShouldExposeConfiguredOriginAndMethods() {
        SecurityConfig securityConfig = new SecurityConfig(Mockito.mock(JwtAuthenticationFilter.class));
        ReflectionTestUtils.setField(securityConfig, "allowedOrigin", "http://localhost:5173");

        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/users");
        CorsConfiguration corsConfiguration = source.getCorsConfiguration(request);

        assertNotNull(corsConfiguration);
        assertEquals(1, corsConfiguration.getAllowedOrigins().size());
        assertEquals("http://localhost:5173", corsConfiguration.getAllowedOrigins().getFirst());
        assertEquals(true, corsConfiguration.getAllowCredentials());
        assertEquals(6, corsConfiguration.getAllowedMethods().size());
    }
}
