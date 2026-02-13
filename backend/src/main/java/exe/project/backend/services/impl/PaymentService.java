package exe.project.backend.services.impl;

import com.google.gson.Gson;
import exe.project.backend.dtos.requests.PurchaseRequest;
import exe.project.backend.dtos.responses.PaymentHistoryResponse;
import exe.project.backend.dtos.responses.PurchaseResponse;
import exe.project.backend.enums.PaymentStatus;
import exe.project.backend.models.Payment;
import exe.project.backend.models.SubscriptionPackage;
import exe.project.backend.repositories.PaymentRepository;
import exe.project.backend.repositories.SubscriptionPackageRepository;
import exe.project.backend.services.IPaymentService;
import exe.project.backend.services.IPayOSService;
import exe.project.backend.services.ISubscriptionService;
import exe.project.backend.services.IEmailService;
import exe.project.backend.repositories.IUserRepository;
import exe.project.backend.models.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.WebhookData;

/**
 * Implementation của Payment Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService implements IPaymentService {

        private final PaymentRepository paymentRepository;
        private final SubscriptionPackageRepository packageRepository;
        private final IPayOSService payOSService;
        private final ISubscriptionService subscriptionService;
        private final IEmailService emailService;
        private final IUserRepository userRepository;
        @Value("${payos.return.url}")
        private String returnUrl;

        @Value("${payos.cancel.url}")
        private String cancelUrl;

        private final Gson gson = new Gson();

        @Override
        @Transactional
        public PurchaseResponse createPurchase(PurchaseRequest request) throws Exception {
                log.info("Creating purchase for userId: {}, packageCode: {}",
                                request.getUserId(), request.getPackageCode());

                // 1. Validate package
                SubscriptionPackage pkg = packageRepository
                                .findByCodeAndIsActiveTrue(request.getPackageCode())
                                .orElseThrow(() -> new RuntimeException(
                                                "Package not found or inactive: " + request.getPackageCode()));

                // 2. Generate unique orderCode (timestamp-based)
                Long orderCode = System.currentTimeMillis();
                log.info("Generated orderCode: {}", orderCode);

                // 3. Tạo payment record với status = PENDING
                Payment payment = Payment.builder()
                                .userId(request.getUserId())
                                .packageId(pkg.getId())
                                .orderCode(orderCode)
                                .amount(pkg.getPrice())
                                .status(PaymentStatus.PENDING)
                                .paymentGateway("PAYOS")
                                .build();

                payment = paymentRepository.save(payment);
                log.info("Payment record created with id: {}", payment.getId());

                // 4. Gọi PayOS create payment link
                String description = String.format("Subscription - %s", pkg.getCode());

                CreatePaymentLinkResponse paymentLinkData = payOSService.createPaymentLink(
                                orderCode,
                                pkg.getPrice().longValue(),
                                description,
                                returnUrl,
                                cancelUrl);

                // 5. Update payment với checkout URL for reference
                // Note: PayOS v2 CreatePaymentLinkResponse doesn't expose the payment link ID
                // We use orderCode as the reference
                paymentRepository.save(payment);

                log.info("Payment link created successfully: {}", paymentLinkData.getCheckoutUrl());

                // 6. Return checkout URL
                return PurchaseResponse.builder()
                                .paymentId(payment.getId())
                                .checkoutUrl(paymentLinkData.getCheckoutUrl())
                                .build();
        }

        @Override
        @Transactional(isolation = Isolation.SERIALIZABLE)
        public void handlePayOSCallback(Object webhookBody) throws Exception {
                log.info("Handling PayOS callback");

                // 1. Verify signature
                WebhookData webhookData = payOSService.verifyWebhookSignature(webhookBody);
                Long orderCode = webhookData.getOrderCode();

                log.info("Webhook verified for orderCode: {}, status: {}", orderCode, webhookData.getCode());

                // 2. Lock payment record để tránh race condition
                Payment payment = paymentRepository.findByOrderCodeForUpdate(orderCode)
                                .orElseThrow(() -> new RuntimeException(
                                                "Payment not found for orderCode: " + orderCode));

                // 3. Idempotent check - nếu đã SUCCESS thì skip
                if (payment.getStatus() == PaymentStatus.SUCCESS) {
                        log.info("Payment already processed (idempotent), orderCode: {}", orderCode);
                        return;
                }

                // 4. Parse webhook status
                PaymentStatus newStatus;
                if ("00".equals(webhookData.getCode())) {
                        newStatus = PaymentStatus.SUCCESS;
                } else if ("CANCELLED".equals(webhookData.getCode())) {
                        newStatus = PaymentStatus.CANCELLED;
                } else {
                        newStatus = PaymentStatus.FAILED;
                }

                // 5. Update payment
                payment.setStatus(newStatus);
                payment.setPayosTransactionId(webhookData.getReference());
                payment.setRawCallbackData(gson.toJson(webhookData));
                paymentRepository.save(payment);

                log.info("Payment updated with status: {}", newStatus);

                // 6. Nếu SUCCESS -> gia hạn subscription
                if (newStatus == PaymentStatus.SUCCESS) {
                        SubscriptionPackage pkg = packageRepository.findById(payment.getPackageId())
                                        .orElseThrow(() -> new RuntimeException("Package not found"));

                        subscriptionService.extendSubscription(payment.getUserId(), pkg.getDurationDays());

                        log.info("Subscription extended successfully for userId: {} with {} days",
                                        payment.getUserId(), pkg.getDurationDays());

                        // 7. Gửi email thông báo mua gói thành công
                        try {
                                User user = userRepository.findById(payment.getUserId())
                                                .orElse(null);

                                if (user != null && user.getEmail() != null) {
                                        // Lấy subscription để biết expiredAt
                                        var subscription = subscriptionService.getStatus(payment.getUserId());

                                        emailService.sendSubscriptionConfirmationEmail(
                                                        user.getEmail(),
                                                        user.getEmail(), // userName = email vì User model không có name
                                                                         // field
                                                        pkg.getDisplayName(),
                                                        payment.getAmount(),
                                                        subscription.getExpiredAt());

                                        log.info("Confirmation email sent to userId: {}", payment.getUserId());
                                } else {
                                        log.warn("Cannot send email: User not found or email is null for userId: {}",
                                                        payment.getUserId());
                                }
                        } catch (Exception e) {
                                // Log error nhưng không fail transaction
                                log.error("Failed to send confirmation email for userId: {}",
                                                payment.getUserId(), e);
                        }
                }

                log.info("Webhook processed successfully for orderCode: {}", orderCode);
        }

        @Override
        public Page<PaymentHistoryResponse> getPaymentHistory(Long userId, Pageable pageable) {
                log.info("Getting successful payment history for userId: {}", userId);

                Page<Payment> payments = paymentRepository.findByUserIdAndStatusOrderByCreateAtDesc(
                                userId, PaymentStatus.SUCCESS, pageable);

                return payments.map(payment -> {
                        SubscriptionPackage pkg = packageRepository.findById(payment.getPackageId())
                                        .orElse(null);

                        String packageName = pkg != null ? pkg.getDisplayName() : "Unknown Package";

                        return PaymentHistoryResponse.builder()
                                        .paymentId(payment.getId())
                                        .packageName(packageName)
                                        .amount(payment.getAmount())
                                        .status(payment.getStatus())
                                        .createdAt(payment.getCreateAt())
                                        .build();
                });
        }
}
