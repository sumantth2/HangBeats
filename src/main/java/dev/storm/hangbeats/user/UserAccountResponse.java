package dev.storm.hangbeats.user;

import java.time.Instant;

public record UserAccountResponse(
        Long id,
        String username,
        String displayName,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserAccountResponse from(UserAccount userAccount) {
        return new UserAccountResponse(
                userAccount.getId(),
                userAccount.getUsername(),
                userAccount.getDisplayName(),
                userAccount.getCreatedAt(),
                userAccount.getUpdatedAt()
        );
    }
}
