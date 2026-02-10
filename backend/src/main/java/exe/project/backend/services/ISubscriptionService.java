package exe.project.backend.services;

import exe.project.backend.dtos.responses.SubscriptionStatusResponse;

/**
 * Service quản lý subscription
 */
public interface ISubscriptionService {

    /**
     * Lấy trạng thái subscription của user
     */
    SubscriptionStatusResponse getStatus(Long userId);

    /**
     * Gia hạn subscription theo logic cộng dồn thời gian
     */
    void extendSubscription(Long userId, int durationDays);
}
