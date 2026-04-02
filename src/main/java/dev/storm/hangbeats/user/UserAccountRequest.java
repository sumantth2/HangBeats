package dev.storm.hangbeats.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserAccountRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Size(min = 2, max = 100) String displayName
) {
}
