package dev.storm.hangbeats.auth;

public record AuthTokenResponse(String accessToken, String tokenType, long expiresInMinutes) {
}
