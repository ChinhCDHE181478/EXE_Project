package exe.project.backend.repositories;

import exe.project.backend.models.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho UserSubscription
 */
@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    /**
     * Tìm subscription theo userId
     */
    Optional<UserSubscription> findByUserId(Long userId);
}
