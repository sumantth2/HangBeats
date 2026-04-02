package dev.storm.hangbeats.security;

import dev.storm.hangbeats.config.JwtProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    @Test
    void generateTokenShouldBeValidAndContainUsername() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("12345678901234567890123456789012");
        properties.setExpirationMinutes(15);

        JwtService jwtService = new JwtService(properties);
        String token = jwtService.generateToken("alice");

        assertTrue(jwtService.isValid(token));
        assertEquals("alice", jwtService.extractUsername(token));
    }

    @Test
    void isValidShouldReturnFalseForMalformedToken() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("12345678901234567890123456789012");
        properties.setExpirationMinutes(15);

        JwtService jwtService = new JwtService(properties);
        assertFalse(jwtService.isValid("not-a-jwt"));
    }

    @Test
    void constructorShouldRejectShortSecret() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("too-short-secret");
        properties.setExpirationMinutes(15);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> new JwtService(properties));
        assertEquals("JWT secret must be at least 32 characters long.", exception.getMessage());
    }
}
