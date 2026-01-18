package exe.project.backend.repositories;

import exe.project.backend.models.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpVerificationRepository
        extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
            String email,
            String purpose
    );

    void deleteByExpiresAtBefore(LocalDateTime time);
}