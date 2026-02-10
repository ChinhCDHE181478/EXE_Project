package exe.project.backend.dtos.requests;

import exe.project.backend.enums.PaymentStatus;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class PaymentUpdateRequest {
    private PaymentStatus status;

    @Positive(message = "Amount must be positive")
    private Long amount;
}
