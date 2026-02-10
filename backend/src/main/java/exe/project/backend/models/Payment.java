package exe.project.backend.models;

import exe.project.backend.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity lưu lịch sử thanh toán qua PayOS
 * Dùng cho audit, đối soát, và tránh xử lý callback trùng
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    /**
     * Mã đơn hàng gửi cho PayOS (unique, numeric)
     * Generate từ timestamp
     */
    @Column(name = "order_code", unique = true, nullable = false)
    private Long orderCode;

    /**
     * Số tiền thanh toán (VNĐ)
     */
    @Column(nullable = false)
    private Long amount;

    /**
     * Trạng thái thanh toán
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    /**
     * Cổng thanh toán (fixed: "PAYOS")
     */
    @Builder.Default
    @Column(name = "payment_gateway", nullable = false, length = 50)
    private String paymentGateway = "PAYOS";

    /**
     * Payment Link ID từ PayOS
     */
    @Column(name = "payos_payment_link_id", length = 255)
    private String payosPaymentLinkId;

    /**
     * Transaction ID/Reference từ PayOS
     */
    @Column(name = "payos_transaction_id", length = 255)
    private String payosTransactionId;

    /**
     * Dữ liệu callback từ PayOS (JSON string)
     * Lưu toàn bộ để audit và debug
     */
    @Column(name = "raw_callback_data", columnDefinition = "TEXT")
    private String rawCallbackData;

    /**
     * Relationship với User
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    /**
     * Relationship với SubscriptionPackage
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", insertable = false, updatable = false)
    private SubscriptionPackage subscriptionPackage;
}
