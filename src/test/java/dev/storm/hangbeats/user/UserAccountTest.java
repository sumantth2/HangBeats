package dev.storm.hangbeats.user;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class UserAccountTest {

    @Test
    void onCreateShouldSetCreatedAtWhenMissing() {
        UserAccount userAccount = new UserAccount();

        userAccount.onCreate();

        assertNotNull(userAccount.getCreatedAt());
        assertNotNull(userAccount.getUpdatedAt());
    }

    @Test
    void onCreateShouldNotOverrideCreatedAtWhenPresent() {
        UserAccount userAccount = new UserAccount();
        Instant fixedTime = Instant.parse("2026-03-09T00:00:00Z");
        ReflectionTestUtils.setField(userAccount, "createdAt", fixedTime);

        userAccount.onCreate();

        assertEquals(fixedTime, userAccount.getCreatedAt());
        assertNotNull(userAccount.getUpdatedAt());
    }

    @Test
    void onUpdateShouldRefreshUpdatedAt() {
        UserAccount userAccount = new UserAccount();
        Instant oldUpdatedAt = Instant.parse("2026-03-09T00:00:00Z");
        ReflectionTestUtils.setField(userAccount, "updatedAt", oldUpdatedAt);

        userAccount.onUpdate();

        assertNotNull(userAccount.getUpdatedAt());
        assertNotEquals(oldUpdatedAt, userAccount.getUpdatedAt());
    }
}
