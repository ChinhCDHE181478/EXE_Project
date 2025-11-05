package exe.project.backend.repositories;

import exe.project.backend.models.UserProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IUserProviderRepository extends JpaRepository<UserProvider, Long> {

    @Query("SELECT p from UserProvider p WHERE p.providerId = ?1 and p.deleteFlag = false ")
    Optional<UserProvider> getProviderByProviderId(String providerId);

}

