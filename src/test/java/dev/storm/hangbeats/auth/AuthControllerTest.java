package dev.storm.hangbeats.auth;

import dev.storm.hangbeats.config.JwtProperties;
import dev.storm.hangbeats.security.JwtService;
import dev.storm.hangbeats.user.UserAccount;
import dev.storm.hangbeats.user.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Test
    void issueTokenShouldReturnExpectedPayload() {
        JwtService jwtService = Mockito.mock(JwtService.class);
        UserAccountRepository userAccountRepository = Mockito.mock(UserAccountRepository.class);
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("12345678901234567890123456789012");
        jwtProperties.setExpirationMinutes(15);

        AuthController controller = new AuthController(jwtService, jwtProperties, userAccountRepository);
        when(jwtService.generateToken("john")).thenReturn("jwt-token");

        AuthTokenResponse response = controller.issueToken(new TokenRequest("john"));

        assertEquals("jwt-token", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(15, response.expiresInMinutes());
    }

    @Test
    void getCurrentUserShouldReturnPrincipalName() {
        JwtService jwtService = Mockito.mock(JwtService.class);
        UserAccountRepository userAccountRepository = Mockito.mock(UserAccountRepository.class);
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("12345678901234567890123456789012");
        jwtProperties.setExpirationMinutes(15);
        AuthController controller = new AuthController(jwtService, jwtProperties, userAccountRepository);

        Authentication authentication = new UsernamePasswordAuthenticationToken("alice", null);

        CurrentUserResponse response = controller.getCurrentUser(authentication);

        assertEquals("alice", response.username());
    }

    @Test
    void registerShouldCreateUserAndReturnTokenPayload() {
        JwtService jwtService = Mockito.mock(JwtService.class);
        UserAccountRepository userAccountRepository = Mockito.mock(UserAccountRepository.class);
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("12345678901234567890123456789012");
        jwtProperties.setExpirationMinutes(15);
        AuthController controller = new AuthController(jwtService, jwtProperties, userAccountRepository);

        when(userAccountRepository.existsByUsernameIgnoreCase("john")).thenReturn(false);
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount entity = invocation.getArgument(0);
            ReflectionTestUtils.setField(entity, "id", 1L);
            ReflectionTestUtils.setField(entity, "createdAt", Instant.parse("2026-03-09T00:00:00Z"));
            return entity;
        });
        when(jwtService.generateToken("john")).thenReturn("jwt-token");

        RegisterResponse response = controller.register(new RegisterRequest(" JOHN ", " John Doe "));

        assertEquals("jwt-token", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(15, response.expiresInMinutes());
        assertEquals("john", response.user().username());
        assertEquals("John Doe", response.user().displayName());
    }

    @Test
    void registerShouldRejectDuplicateUsername() {
        JwtService jwtService = Mockito.mock(JwtService.class);
        UserAccountRepository userAccountRepository = Mockito.mock(UserAccountRepository.class);
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("12345678901234567890123456789012");
        jwtProperties.setExpirationMinutes(15);
        AuthController controller = new AuthController(jwtService, jwtProperties, userAccountRepository);

        when(userAccountRepository.existsByUsernameIgnoreCase("john")).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.register(new RegisterRequest("john", "John Doe"))
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Username already exists", exception.getReason());
    }
}
