package dev.storm.hangbeats.auth;

import jakarta.validation.constraints.NotBlank;

public record TokenRequest(@NotBlank String username) {
}
