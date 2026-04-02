package dev.storm.hangbeats.auth;

import dev.storm.hangbeats.user.UserAccountResponse;

public record RegisterResponse(
        String accessToken,
        String tokenType,
        long expiresInMinutes,
        UserAccountResponse user
) {
}
