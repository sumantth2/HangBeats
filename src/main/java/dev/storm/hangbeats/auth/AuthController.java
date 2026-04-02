package dev.storm.hangbeats.auth;

import dev.storm.hangbeats.config.JwtProperties;
import dev.storm.hangbeats.security.JwtService;
import dev.storm.hangbeats.user.UserAccount;
import dev.storm.hangbeats.user.UserAccountRepository;
import dev.storm.hangbeats.user.UserAccountResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final UserAccountRepository userAccountRepository;

    public AuthController(JwtService jwtService, JwtProperties jwtProperties, UserAccountRepository userAccountRepository) {
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.userAccountRepository = userAccountRepository;
    }

    @PostMapping("/token")
    public AuthTokenResponse issueToken(@Valid @RequestBody TokenRequest tokenRequest) {
        String token = jwtService.generateToken(tokenRequest.username());
        return new AuthTokenResponse(token, "Bearer", jwtProperties.getExpirationMinutes());
    }

    @PostMapping("/register")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest registerRequest) {
        String normalizedUsername = registerRequest.username().trim().toLowerCase();
        if (userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(normalizedUsername);
        userAccount.setDisplayName(registerRequest.displayName().trim());
        UserAccount savedUser = userAccountRepository.save(userAccount);

        String token = jwtService.generateToken(normalizedUsername);
        return new RegisterResponse(
                token,
                "Bearer",
                jwtProperties.getExpirationMinutes(),
                UserAccountResponse.from(savedUser)
        );
    }

    @GetMapping("/me")
    public CurrentUserResponse getCurrentUser(Authentication authentication) {
        return new CurrentUserResponse(authentication.getName());
    }

    @GetMapping("/username-availability")
    public UsernameAvailabilityResponse checkUsernameAvailability(@RequestParam String username) {
        String normalizedUsername = username == null ? "" : username.trim().toLowerCase();
        if (normalizedUsername.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }

        boolean exists = userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername);
        return new UsernameAvailabilityResponse(normalizedUsername, !exists);
    }
}
