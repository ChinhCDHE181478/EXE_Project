package exe.project.backend.dtos.requests;

import exe.project.backend.enums.PaymentStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PaymentFilterRequest {
    private PaymentStatus status;
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;
}
