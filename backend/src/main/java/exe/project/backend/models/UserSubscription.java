package exe.project.backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity quản lý subscription của user
 * Mỗi user chỉ có duy nhất 1 subscription record
 */
@Entity
@Table(name = "user_subscriptions")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserSubscription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private Long userId;

    /**
     * Thời điểm hết hạn subscription
     * null = chưa có subscription
     */
    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    /**
     * Relationship với User
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
