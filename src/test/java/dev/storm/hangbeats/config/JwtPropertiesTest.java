package dev.storm.hangbeats.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtPropertiesTest {

    @Test
    void gettersAndSettersShouldWork() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("12345678901234567890123456789012");
        properties.setExpirationMinutes(20);

        assertEquals("12345678901234567890123456789012", properties.getSecret());
        assertEquals(20, properties.getExpirationMinutes());
    }
}
