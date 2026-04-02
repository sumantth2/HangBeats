package dev.storm.hangbeats.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    boolean existsByUsernameIgnoreCase(String username);

    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    List<UserAccount> findAllByOrderByIdAsc();

    List<UserAccount> findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByIdAsc(
            String usernameQuery,
            String displayNameQuery
    );

    Page<UserAccount> findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
            String usernameQuery,
            String displayNameQuery,
            Pageable pageable
    );

    long countByCreatedAtAfter(Instant createdAtThreshold);
}
