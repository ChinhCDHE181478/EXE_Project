package exe.project.backend.dtos.responses;

import exe.project.backend.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response cho lịch sử thanh toán
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentHistoryResponse {

    private Long paymentId;
    private String packageName;
    private Long amount;
    private PaymentStatus status;
    private LocalDateTime createdAt;
}
