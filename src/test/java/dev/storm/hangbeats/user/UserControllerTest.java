package dev.storm.hangbeats.user;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private UserController userController;

    @Test
    void getUsersShouldReturnUsersSortedById() {
        UserAccount second = userAccount(2L, "second", "Second User");
        UserAccount first = userAccount(1L, "first", "First User");
        when(userAccountRepository.findAllByOrderByIdAsc()).thenReturn(List.of(first, second));

        List<UserAccountResponse> response = userController.getUsers(null);

        assertEquals(2, response.size());
        assertEquals(1L, response.get(0).id());
        assertEquals(2L, response.get(1).id());
    }

    @Test
    void getUsersShouldApplyQueryFilteringWhenProvided() {
        UserAccount filtered = userAccount(3L, "alice", "Alice Doe");
        when(userAccountRepository.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByIdAsc("ali", "ali"))
                .thenReturn(List.of(filtered));

        List<UserAccountResponse> response = userController.getUsers("ali");

        assertEquals(1, response.size());
        assertEquals("alice", response.getFirst().username());
    }

    @Test
    void getUserByIdShouldReturnUserWhenExists() {
        UserAccount stored = userAccount(10L, "john", "John Doe");
        when(userAccountRepository.findById(10L)).thenReturn(Optional.of(stored));

        UserAccountResponse response = userController.getUserById(10L);

        assertEquals(10L, response.id());
        assertEquals("john", response.username());
    }

    @Test
    void getUserByIdShouldThrowNotFoundWhenMissing() {
        when(userAccountRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userController.getUserById(999L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }

    @Test
    void createUserShouldNormalizeAndPersistUser() {
        when(userAccountRepository.existsByUsernameIgnoreCase("alice")).thenReturn(false);
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount entity = invocation.getArgument(0);
            ReflectionTestUtils.setField(entity, "id", 10L);
            ReflectionTestUtils.setField(entity, "createdAt", Instant.parse("2026-03-09T00:00:00Z"));
            return entity;
        });

        ResponseEntity<UserAccountResponse> response = userController.createUser(new UserAccountRequest("ALICE ", " Alice Doe "));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(10L, response.getBody().id());
        assertEquals("alice", response.getBody().username());
        assertEquals("Alice Doe", response.getBody().displayName());
        assertEquals(Instant.parse("2026-03-09T00:00:00Z"), response.getBody().createdAt());
    }

    @Test
    void createUserShouldThrowConflictForDuplicateUsername() {
        when(userAccountRepository.existsByUsernameIgnoreCase("alice")).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userController.createUser(new UserAccountRequest("alice", "Alice"))
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    @Test
    void updateUserShouldNormalizeValuesAndPersist() {
        UserAccount stored = userAccount(5L, "oldname", "Old Name");
        when(userAccountRepository.findById(5L)).thenReturn(Optional.of(stored));
        when(userAccountRepository.findByUsernameIgnoreCase("newname")).thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserAccountResponse response = userController.updateUser(5L, new UserAccountUpdateRequest(" NewName ", " New Name "));

        assertEquals(5L, response.id());
        assertEquals("newname", response.username());
        assertEquals("New Name", response.displayName());
    }

    @Test
    void updateUserShouldRejectDuplicateUsernameFromAnotherUser() {
        UserAccount current = userAccount(7L, "alpha", "Alpha");
        UserAccount duplicate = userAccount(9L, "beta", "Beta");
        when(userAccountRepository.findById(7L)).thenReturn(Optional.of(current));
        when(userAccountRepository.findByUsernameIgnoreCase("beta")).thenReturn(Optional.of(duplicate));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userController.updateUser(7L, new UserAccountUpdateRequest("beta", "Alpha Updated"))
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }

    @Test
    void deleteUserShouldDeleteWhenUserExists() {
        when(userAccountRepository.existsById(6L)).thenReturn(true);
        doNothing().when(userAccountRepository).deleteById(6L);

        ResponseEntity<Void> response = userController.deleteUser(6L);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(userAccountRepository).deleteById(6L);
    }

    @Test
    void deleteUserShouldThrowNotFoundWhenUserMissing() {
        when(userAccountRepository.existsById(404L)).thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userController.deleteUser(404L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(userAccountRepository, never()).deleteById(404L);
    }

    private static UserAccount userAccount(Long id, String username, String displayName) {
        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(username);
        userAccount.setDisplayName(displayName);
        ReflectionTestUtils.setField(userAccount, "id", id);
        ReflectionTestUtils.setField(userAccount, "createdAt", Instant.parse("2026-03-09T00:00:00Z"));
        return userAccount;
    }
}
