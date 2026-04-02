package dev.storm.hangbeats.user;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class UserAccountTest {

    @Test
    void onCreateShouldSetCreatedAtWhenMissing() {
        UserAccount userAccount = new UserAccount();

        userAccount.onCreate();

        assertNotNull(userAccount.getCreatedAt());
    }

    @Test
    void onCreateShouldNotOverrideCreatedAtWhenPresent() {
        UserAccount userAccount = new UserAccount();
        Instant fixedTime = Instant.parse("2026-03-09T00:00:00Z");
        ReflectionTestUtils.setField(userAccount, "createdAt", fixedTime);

        userAccount.onCreate();

        assertEquals(fixedTime, userAccount.getCreatedAt());
    }
}
