package dev.storm.hangbeats.auth;

public record UsernameAvailabilityResponse(
        String username,
        boolean available
) {
}
