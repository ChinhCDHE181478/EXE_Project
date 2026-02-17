package exe.project.backend.services.impl;

import exe.project.backend.dtos.responses.SubscriptionStatusResponse;
import exe.project.backend.models.UserSubscription;
import exe.project.backend.repositories.UserSubscriptionRepository;
import exe.project.backend.services.ISubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Implementation của Subscription Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService implements ISubscriptionService {

    private final UserSubscriptionRepository subscriptionRepository;

    @Override
    public SubscriptionStatusResponse getStatus(Long userId) {
        log.info("Getting subscription status for userId: {}", userId);

        UserSubscription subscription = subscriptionRepository.findByUserId(userId)
                .orElse(null);

        LocalDateTime now = LocalDateTime.now();

        if (subscription == null || subscription.getExpiredAt() == null) {
            // Chưa có subscription
            return SubscriptionStatusResponse.builder()
                    .isActive(false)
                    .now(now)
                    .expiredAt(null)
                    .remainingDays(0L)
                    .build();
        }

        boolean isActive = subscription.getExpiredAt().isAfter(now);
        long seconds = ChronoUnit.SECONDS.between(now, subscription.getExpiredAt());

        long remainingDays = seconds > 0
                ? (long) Math.ceil(seconds / 86400.0)
                : 0;

        System.out.println(isActive);

        return SubscriptionStatusResponse.builder()
                .isActive(isActive)
                .expiredAt(subscription.getExpiredAt())
                .now(now)
                .remainingDays(remainingDays)
                .build();
    }

    @Override
    @Transactional
    public void extendSubscription(Long userId, int durationDays) {
        log.info("Extending subscription for userId: {} with {} days", userId, durationDays);

        UserSubscription subscription = subscriptionRepository.findByUserId(userId)
                .orElse(UserSubscription.builder()
                        .userId(userId)
                        .build());

        LocalDateTime now = LocalDateTime.now();

        // Logic cộng dồn thời gian
        if (subscription.getExpiredAt() == null || subscription.getExpiredAt().isBefore(now)) {
            // Chưa có subscription hoặc đã hết hạn -> expiredAt = now + duration
            subscription.setExpiredAt(now.plusDays(durationDays));
            log.info("First subscription or expired, setting expiredAt = now + {} days", durationDays);
        } else {
            // Còn hạn -> expiredAt = expiredAt hiện tại + duration (cộng dồn)
            LocalDateTime newExpiredAt = subscription.getExpiredAt().plusDays(durationDays);
            subscription.setExpiredAt(newExpiredAt);
            log.info("Active subscription, extending from {} to {}",
                    subscription.getExpiredAt(), newExpiredAt);
        }

        subscriptionRepository.save(subscription);
        log.info("Subscription extended successfully for userId: {}", userId);
    }
}
