package exe.project.backend.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response trạng thái subscription
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionStatusResponse {

    private Boolean isActive;
    private LocalDateTime now;
    private LocalDateTime expiredAt;
    private Long remainingDays;
}
