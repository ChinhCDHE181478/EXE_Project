package exe.project.backend.dtos.requests;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class SubscriptionExtensionRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Type is required")
    @Pattern(regexp = "DAY|MONTH", message = "Type must be DAY or MONTH")
    private String type; // DAY or MONTH

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Integer amount;
}
