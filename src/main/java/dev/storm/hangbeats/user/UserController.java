package dev.storm.hangbeats.user;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserAccountRepository userAccountRepository;

    public UserController(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping
    public List<UserAccountResponse> getUsers(@RequestParam(required = false) String query) {
        List<UserAccount> users;
        if (query != null && !query.trim().isEmpty()) {
            String normalizedQuery = query.trim();
            users = userAccountRepository.findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByIdAsc(
                    normalizedQuery,
                    normalizedQuery
            );
        } else {
            users = userAccountRepository.findAllByOrderByIdAsc();
        }

        return users.stream()
                .map(UserAccountResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public UserAccountResponse getUserById(@PathVariable Long id) {
        UserAccount userAccount = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserAccountResponse.from(userAccount);
    }

    @PostMapping
    public ResponseEntity<UserAccountResponse> createUser(@Valid @RequestBody UserAccountRequest userAccountRequest) {
        String normalizedUsername = normalizeUsername(userAccountRequest.username());

        if (userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(normalizedUsername);
        userAccount.setDisplayName(normalizeDisplayName(userAccountRequest.displayName()));

        UserAccount savedUser = userAccountRepository.save(userAccount);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserAccountResponse.from(savedUser));
    }

    @PutMapping("/{id}")
    public UserAccountResponse updateUser(@PathVariable Long id, @Valid @RequestBody UserAccountUpdateRequest request) {
        UserAccount userAccount = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String normalizedUsername = normalizeUsername(request.username());
        Optional<UserAccount> existingUser = userAccountRepository.findByUsernameIgnoreCase(normalizedUsername);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        userAccount.setUsername(normalizedUsername);
        userAccount.setDisplayName(normalizeDisplayName(request.displayName()));

        UserAccount updatedUser = userAccountRepository.save(userAccount);
        return UserAccountResponse.from(updatedUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userAccountRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        userAccountRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String normalizeUsername(String rawUsername) {
        return rawUsername.trim().toLowerCase();
    }

    private String normalizeDisplayName(String rawDisplayName) {
        return rawDisplayName.trim();
    }
}
