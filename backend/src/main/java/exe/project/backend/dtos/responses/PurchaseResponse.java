package exe.project.backend.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response sau khi tạo thanh toán
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseResponse {

    private Long paymentId;
    private String checkoutUrl;
}
