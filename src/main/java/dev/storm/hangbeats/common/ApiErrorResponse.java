package dev.storm.hangbeats.common;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        String message,
        Instant timestamp,
        List<String> details
) {
}
