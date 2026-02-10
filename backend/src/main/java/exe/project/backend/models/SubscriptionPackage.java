package exe.project.backend.models;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entity lưu thông tin các gói subscription
 * 2 gói: day (1 ngày, 10k) và month (30 ngày, 49k)
 */
@Entity
@Table(name = "subscription_packages")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SubscriptionPackage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Mã gói: "day" hoặc "month"
     */
    @Column(unique = true, nullable = false, length = 50)
    private String code;

    /**
     * Số ngày được cộng thêm khi mua gói này
     */
    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    /**
     * Giá gói (VNĐ)
     */
    @Column(nullable = false)
    private Long price;

    /**
     * Gói có đang active không
     */
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Tên hiển thị của gói
     */
    @Column(length = 255)
    private String displayName;
}
