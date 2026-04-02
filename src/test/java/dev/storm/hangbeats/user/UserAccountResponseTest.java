package dev.storm.hangbeats.user;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UserAccountResponseTest {

    @Test
    void fromShouldMapAllFields() {
        UserAccount userAccount = new UserAccount();
        userAccount.setUsername("john");
        userAccount.setDisplayName("John Doe");
        ReflectionTestUtils.setField(userAccount, "id", 77L);
        ReflectionTestUtils.setField(userAccount, "createdAt", Instant.parse("2026-03-09T00:00:00Z"));
        ReflectionTestUtils.setField(userAccount, "updatedAt", Instant.parse("2026-03-09T01:00:00Z"));

        UserAccountResponse response = UserAccountResponse.from(userAccount);

        assertEquals(77L, response.id());
        assertEquals("john", response.username());
        assertEquals("John Doe", response.displayName());
        assertEquals(Instant.parse("2026-03-09T00:00:00Z"), response.createdAt());
        assertEquals(Instant.parse("2026-03-09T01:00:00Z"), response.updatedAt());
    }
}
