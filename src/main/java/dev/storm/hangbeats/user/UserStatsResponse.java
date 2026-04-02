package dev.storm.hangbeats.user;

public record UserStatsResponse(
        long totalUsers,
        long usersCreatedLast24Hours
) {
}
