package exe.project.backend.services;

import jakarta.mail.MessagingException;

import java.time.LocalDateTime;

public interface IEmailService {
    void sendEmail(String to, String subject, String body) throws MessagingException;

    /**
     * Gửi email xác nhận mua subscription thành công
     * 
     * @param toEmail     Email người nhận
     * @param userName    Tên user
     * @param packageName Tên gói subscription
     * @param amount      Số tiền thanh toán
     * @param expiredAt   Ngày hết hạn subscription
     */
    void sendSubscriptionConfirmationEmail(
            String toEmail,
            String userName,
            String packageName,
            Long amount,
            LocalDateTime expiredAt) throws MessagingException;

    /**
     * Gửi email thông báo admin gia hạn subscription
     * 
     * @param toEmail      Email người nhận
     * @param userName     Tên user
     * @param newExpiredAt Ngày hết hạn mới
     */
    void sendSubscriptionExtensionEmail(
            String toEmail,
            String userName,
            LocalDateTime newExpiredAt) throws MessagingException;
}
