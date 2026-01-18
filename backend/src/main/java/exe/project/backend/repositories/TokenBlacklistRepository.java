package exe.project.backend.repositories;

import exe.project.backend.models.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface TokenBlacklistRepository
        extends JpaRepository<TokenBlacklist, Long> {

    boolean existsByToken(String token);

    void deleteByExpiresAtBefore(LocalDateTime time);
}
