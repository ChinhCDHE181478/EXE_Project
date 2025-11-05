package exe.project.backend.config;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class OtpConfig {
    private final SecureRandom random = new SecureRandom();

    // Sinh OTP 6 số (000000 - 999999)
    public String generateOtp() {
        int otp = random.nextInt(1000000);  // random từ 0 -> 999999
        return String.format("%06d", otp);    // format thành 6 chữ số
    }
}
