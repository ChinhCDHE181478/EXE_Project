package exe.project.backend.repositories;

import exe.project.backend.models.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface IRefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    @Modifying
    @Transactional
    @Query("delete from RefreshToken r where r.user.id=:userId")
    void deleteByUserId(Long userId);
}
