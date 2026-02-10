package exe.project.backend.repositories;

import exe.project.backend.models.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository cho Payment
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Tìm payment theo orderCode
     */
    Optional<Payment> findByOrderCode(Long orderCode);

    /**
     * Tìm payment theo orderCode với pessimistic write lock
     * Dùng cho webhook callback để tránh race condition
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.orderCode = :orderCode")
    Optional<Payment> findByOrderCodeForUpdate(@Param("orderCode") Long orderCode);

    /**
     * Lấy lịch sử thanh toán của user theo trạng thái
     */
    Page<Payment> findByUserIdAndStatusOrderByCreateAtDesc(Long userId, exe.project.backend.enums.PaymentStatus status,
            Pageable pageable);

    /**
     * Lấy lịch sử thanh toán của user
     * Sort theo createAt desc
     */
    Page<Payment> findByUserIdOrderByCreateAtDesc(Long userId, Pageable pageable);
}
