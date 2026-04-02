package dev.storm.hangbeats.user;

import java.util.List;

public record PaginatedUsersResponse(
        List<UserAccountResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
}
