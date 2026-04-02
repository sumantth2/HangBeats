package dev.storm.hangbeats.common;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HealthControllerTest {

    @Test
    void healthShouldReturnUpStatusAndServiceName() {
        HealthController controller = new HealthController();

        Map<String, String> response = controller.health();

        assertEquals("UP", response.get("status"));
        assertEquals("hangbeats-backend", response.get("service"));
    }
}
