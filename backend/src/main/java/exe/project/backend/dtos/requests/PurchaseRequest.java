package exe.project.backend.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request để mua gói subscription
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotBlank(message = "packageCode is required")
    private String packageCode;
}
