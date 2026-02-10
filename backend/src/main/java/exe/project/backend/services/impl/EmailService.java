package exe.project.backend.services.impl;

import exe.project.backend.services.IEmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailService implements IEmailService {
    private final JavaMailSender mailSender;

    @Async("taskExecutor")
    public void sendEmail(String to, String subject, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi gửi email: ", e);
        }
    }

    @Override
    @Async("taskExecutor")
    public void sendSubscriptionConfirmationEmail(
            String toEmail,
            String userName,
            String packageName,
            Long amount,
            LocalDateTime expiredAt) throws MessagingException {

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedExpiry = expiredAt.format(formatter);

        // Format amount với dấu phẩy
        NumberFormat numberFormat = NumberFormat.getInstance(new Locale("vi", "VN"));
        String formattedAmount = numberFormat.format(amount);

        String subject = "🎉 Đăng ký gói " + packageName + " thành công!";

        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                        .card { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { color: #4CAF50; margin: 0; font-size: 28px; }
                        .icon { font-size: 60px; margin-bottom: 15px; }
                        .info-box { background: #f5f5f5; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0; }
                        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .info-row:last-child { border-bottom: none; }
                        .label { font-weight: bold; color: #555; }
                        .value { color: #333; font-weight: 600; }
                        .highlight { color: #4CAF50; font-size: 18px; font-weight: bold; }
                        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="header">
                                <div class="icon">✅</div>
                                <h1>Thanh toán thành công!</h1>
                                <p>Xin chào <strong>%s</strong>,</p>
                            </div>

                            <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. Đơn hàng của bạn đã được xử lý thành công.</p>

                            <div class="info-box">
                                <h3 style="margin-top: 0; color: #4CAF50;">📦 Thông tin đơn hàng</h3>
                                <div class="info-row">
                                    <span class="label">Gói đã mua:</span>
                                    <span class="value">%s</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Tổng tiền:</span>
                                    <span class="value highlight">%s VNĐ</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Ngày hết hạn:</span>
                                    <span class="value">%s</span>
                                </div>
                            </div>

                            <p style="margin-top: 20px;">Bạn có thể bắt đầu sử dụng đầy đủ tính năng của gói <strong>%s</strong> ngay bây giờ!</p>

                            <div class="footer">
                                <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
                                <p style="margin-top: 20px;">Trân trọng,<br><strong>EXE Project Team</strong></p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(userName, packageName, formattedAmount, formattedExpiry, packageName);

        sendEmail(toEmail, subject, htmlContent);
    }

    @Override
    @Async("taskExecutor")
    public void sendSubscriptionExtensionEmail(
            String toEmail,
            String userName,
            LocalDateTime newExpiredAt) throws MessagingException {

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formattedExpiry = newExpiredAt.format(formatter);

        String subject = "🔔 Subscription của bạn đã được gia hạn";

        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                        .card { background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; margin-bottom: 25px; }
                        .header h1 { color: #2196F3; margin: 0; font-size: 26px; }
                        .icon { font-size: 50px; margin-bottom: 15px; }
                        .expiry-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .expiry-label { font-size: 14px; opacity: 0.9; margin-bottom: 5px; }
                        .expiry-date { font-size: 24px; font-weight: bold; }
                        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <div class="header">
                                <div class="icon">⏰</div>
                                <h1>Subscription đã được gia hạn</h1>
                                <p>Xin chào <strong>%s</strong>,</p>
                            </div>

                            <p>Subscription của bạn đã được gia hạn thành công bởi quản trị viên.</p>

                            <div class="expiry-box">
                                <div class="expiry-label">Ngày hết hạn mới</div>
                                <div class="expiry-date">%s</div>
                            </div>

                            <p style="text-align: center; margin-top: 20px;">Bạn có thể tiếp tục sử dụng dịch vụ đến ngày trên.</p>

                            <div class="footer">
                                <p>Cảm ơn bạn đã sử dụng dịch vụ!</p>
                                <p style="margin-top: 20px;">Trân trọng,<br><strong>EXE Project Team</strong></p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(userName, formattedExpiry);

        sendEmail(toEmail, subject, htmlContent);
    }
}
