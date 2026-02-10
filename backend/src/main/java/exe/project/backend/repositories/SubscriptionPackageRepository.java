package exe.project.backend.repositories;

import exe.project.backend.models.SubscriptionPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho SubscriptionPackage
 */
@Repository
public interface SubscriptionPackageRepository extends JpaRepository<SubscriptionPackage, Long> {

    /**
     * Tìm package theo code và đang active
     */
    Optional<SubscriptionPackage> findByCodeAndIsActiveTrue(String code);
}
