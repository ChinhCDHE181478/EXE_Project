package exe.project.backend.services;

import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.WebhookData;

/**
 * Service wrapper cho PayOS SDK operations
 */
public interface IPayOSService {

    /**
     * Tạo payment link với PayOS
     */
    CreatePaymentLinkResponse createPaymentLink(
            Long orderCode,
            Long amount,
            String description,
            String returnUrl,
            String cancelUrl) throws Exception;

    /**
     * Verify webhook signature và parse data
     */
    WebhookData verifyWebhookSignature(Object webhookBody) throws Exception;

    /**
     * Đăng ký webhook URL với PayOS
     */
    void registerWebhookUrl() throws Exception;
}
