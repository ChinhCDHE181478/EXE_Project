package exe.project.backend.services.impl;

import exe.project.backend.services.IPayOSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

/**
 * Implementation của PayOS Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSService implements IPayOSService {

    private final PayOS payOS;

    @Value("${payos.webhook.url}")
    private String webhookUrl;

    @Override
    public CreatePaymentLinkResponse createPaymentLink(
            Long orderCode,
            Long amount,
            String description,
            String returnUrl,
            String cancelUrl) throws Exception {
        log.info("Creating PayOS payment link for orderCode: {}, amount: {}", orderCode, amount);

        // Tạo item cho payment
        PaymentLinkItem item = PaymentLinkItem.builder()
                .name(description)
                .quantity(1)
                .price(amount)
                .build();

        // Tạo payment request
        CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .description(description)
                .amount(amount)
                .item(item)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .build();

        // Call PayOS API
        CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);
        log.info("Payment link created successfully: {}", response.getCheckoutUrl());

        return response;
    }

    @Override
    public WebhookData verifyWebhookSignature(Object webhookBody) throws Exception {
        log.info("Verifying PayOS webhook signature");

        // PayOS SDK tự động verify signature và parse data
        WebhookData data = payOS.webhooks().verify(webhookBody);

        log.info("Webhook verified successfully for orderCode: {}", data.getOrderCode());
        return data;
    }

    @Override
    public void registerWebhookUrl() throws Exception {
        log.info("Registering webhook URL with PayOS: {}", webhookUrl);

        // Đăng ký webhook URL với PayOS
        payOS.webhooks().confirm(webhookUrl);

        log.info("Webhook URL registered successfully");
    }
}
