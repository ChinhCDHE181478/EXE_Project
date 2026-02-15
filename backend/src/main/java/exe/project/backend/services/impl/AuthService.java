package exe.project.backend.services.impl;

import exe.project.backend.config.OtpConfig;
import exe.project.backend.dtos.requests.*;
import exe.project.backend.dtos.responses.*;
import exe.project.backend.enums.ErrorCode;
import exe.project.backend.enums.ProviderType;
import exe.project.backend.enums.Role;
import exe.project.backend.exceptions.ServiceException;
import exe.project.backend.mappers.UserMapper;
import exe.project.backend.models.OtpVerification;
import exe.project.backend.models.TokenBlacklist;
import exe.project.backend.models.User;
import exe.project.backend.models.UserProvider;
import exe.project.backend.repositories.IUserProviderRepository;
import exe.project.backend.repositories.IUserRepository;
import exe.project.backend.repositories.OtpVerificationRepository;
import exe.project.backend.repositories.TokenBlacklistRepository;
import exe.project.backend.services.IAuthService;
import exe.project.backend.services.IEmailService;
import exe.project.backend.services.IJwtService;
import exe.project.backend.services.IRefreshTokenService;
import exe.project.backend.services.oauth2.OAuth2Service;
import exe.project.backend.services.oauth2.OAuth2ServiceFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final IUserRepository userRepository;
    private final IRefreshTokenService refreshTokenService;
    private final IJwtService jwtService;
    private final IEmailService emailService;
    private final OtpConfig otpConfig;
    private final OAuth2ServiceFactory oauth2ServiceFactory;
    private final IUserProviderRepository userProviderRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    @Override
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {

        if (tokenBlacklistRepository.existsByToken(request.getRefreshToken())) {
            throw new ServiceException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (!refreshTokenService.isValidRefreshToken(request.getRefreshToken())) {
            throw new ServiceException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String email = refreshTokenService.extractUserName(request.getRefreshToken());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ServiceException(ErrorCode.USER_NOT_FOUND));

        if (user.isDeleteFlag()) {
            throw new ServiceException(ErrorCode.USER_HAD_BEEN_DELETED);
        }

        String newAccessToken = jwtService.generateAccessToken(user);

        return new RefreshTokenResponse(
                newAccessToken,
                request.getRefreshToken()
        );
    }

    @Override
    public boolean verifyToken(String token) {
        try {
            if (tokenBlacklistRepository.existsByToken(token)) {
                return false;
            }

            String email = jwtService.extractUserName(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow();

            return jwtService.isValidAcessToken(token, user);
        } catch (Exception e) {
            return false;
        }
    }


    @Override
    public void logout(LogoutRequest request) {

        blacklistToken(
                request.getAccessToken(),
                "ACCESS",
                jwtService.getRemainingValidity(request.getAccessToken())
        );

        blacklistToken(
                request.getRefreshToken(),
                "REFRESH",
                refreshTokenService.getRemainingValidity(request.getRefreshToken())
        );
    }

    private void blacklistToken(String token, String type, Long remainingMs) {
        if (remainingMs <= 0) return;

        TokenBlacklist blacklist = TokenBlacklist.builder()
                .token(token)
                .tokenType(type)
                .expiresAt(
                        LocalDateTime.now().plusNanos(remainingMs * 1_000_000)
                )
                .build();

        tokenBlacklistRepository.save(blacklist);
    }


    @Override
    public LoginResponse loginWithOauth2O(String code, String provider) {
        ProviderType providerType;
        try {
            providerType = ProviderType.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ServiceException(ErrorCode.UNSUPPORTED_PROVIDER);
        }
        OAuth2Service oauth2Service = oauth2ServiceFactory.getService(providerType);
        OnboardingUser onboardingUser = oauth2Service.getUser(code);

        User user = findOrRegisterUser(onboardingUser);

        linkProvider(user, providerType.name().toLowerCase(), onboardingUser.getUserId());

        LoginResponse loginResponse = userMapper.toLoginResponseDto(user);
        populateTokens(user, loginResponse);

        return loginResponse;
    }

    @Override
    public void sendOtpLogin(String email) {
        // 1. Kiểm tra user (giữ nguyên logic cũ)
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.isDeleteFlag()) {
                throw new ServiceException(ErrorCode.USER_HAD_BEEN_DELETED);
            }
        });

        // 2. Tạo OTP (giữ nguyên)
        String otp = otpConfig.generateOtp();

        // 3. Lưu vào DB (giữ nguyên)
        OtpVerification otpEntity = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .purpose("LOGIN")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        otpVerificationRepository.save(otpEntity);

        // 4. Gửi Email HTML chuyên nghiệp
        try {
            // Lấy tên người dùng từ email (hoặc truy vấn DB nếu muốn hiển thị tên thật)
            String name = email.split("@")[0];

            // Tạo nội dung HTML
            String htmlContent = buildOtpEmailTemplate(name, otp);

            emailService.sendEmail(
                    email,
                    "🔐 Mã xác thực đăng nhập Vivuplan", // Subject có icon tạo sự chú ý
                    htmlContent
            );
        } catch (Exception e) {
            // Log lỗi nếu cần thiết
            // log.error("Error sending OTP email", e);
        }
    }

    /**
     * Tạo giao diện Email HTML chuyên nghiệp
     */
    private String buildOtpEmailTemplate(String name, String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; }
                    .header { background-color: #0056D2; padding: 30px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
                    .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #1a1a1a; }
                    .message { margin-bottom: 25px; color: #555555; }
                    .otp-box { background-color: #f0f7ff; border: 2px dashed #0056D2; border-radius: 8px; padding: 15px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 36px; font-weight: 800; color: #0056D2; letter-spacing: 8px; font-family: 'Courier New', monospace; }
                    .expiry { font-size: 13px; color: #888888; margin-top: 10px; text-align: center; }
                    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }
                    .footer a { color: #0056D2; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>VIVUPLAN</h1>
                    </div>
                    <div class="content">
                        <div class="greeting">Xin chào %s,</div>
                        <div class="message">
                            Chúng tôi nhận được yêu cầu đăng nhập vào tài khoản Vivuplan của bạn. 
                            Vui lòng sử dụng mã bên dưới để hoàn tất xác thực.
                        </div>
                        
                        <div class="otp-box">
                            <div class="otp-code">%s</div>
                        </div>
                        
                        <div class="expiry">Mã này sẽ hết hạn sau <strong>5 phút</strong>.</div>
                        
                        <div class="message" style="margin-top: 25px; font-size: 14px; color: #cc0000;">
                            ⚠️ Lưu ý: Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên Vivuplan.
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Vivuplan. All rights reserved.</p>
                        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này hoặc <a href="#">liên hệ hỗ trợ</a>.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(name, otp);
    }

    @Override
    public LoginResponse verifyOtpLogin(VerifyOtp request) {

        OtpVerification otp = otpVerificationRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(
                        request.getEmail(), "LOGIN")
                .orElseThrow(() -> new ServiceException(ErrorCode.MISSED_OR_EXPIRED_OTP));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ServiceException(ErrorCode.MISSED_OR_EXPIRED_OTP);
        }

        if (!otp.getOtp().equals(request.getOtp())) {
            throw new ServiceException(ErrorCode.OTP_INVALID);
        }

        // 🔥 TẠO USER NẾU CHƯA TỒN TẠI
        User user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(request.getEmail())
                            .role(Role.USER) // role mặc định
                            .build();
                    return userRepository.save(newUser);
                });

        otp.setUsed(true);
        otpVerificationRepository.save(otp);

        LoginResponse response = userMapper.toLoginResponseDto(user);
        populateTokens(user, response);

        return response;
    }


    private User findOrRegisterUser(OnboardingUser onboardingUser) {
        return userRepository.findByEmail(onboardingUser.getEmail())
                .orElseGet(() -> registerOauth2User(onboardingUser));
    }

    private User registerOauth2User(OnboardingUser onboardingUser) {
        User user = User.builder()
                .email(onboardingUser.getEmail())
                .build();
        return userRepository.save(user);
    }

    private void linkProvider(User user, String provider, String providerId) {
        try {
            boolean exists = userProviderRepository.getProviderByProviderId(providerId)
                    .isPresent();

            if (!exists) {
                UserProvider newProvider = UserProvider.builder()
                        .provider(provider)
                        .providerId(providerId)
                        .user(user)
                        .build();

                userProviderRepository.save(newProvider);
            }
        } catch (Exception e) {
            throw new ServiceException(ErrorCode.LINK_OAUTH2_PROVIDER_FAILED);
        }
    }

    private void populateTokens(User user, LoginResponse loginResponse) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.generateRefreshToken(user);

        loginResponse.setAccessToken(accessToken);
        loginResponse.setAccessTokenExpiresIn(jwtService.getExpirationTime());
        loginResponse.setRefreshToken(refreshToken);
        loginResponse.setRefreshTokenExpiresIn(refreshTokenService.getExpiresIn());
    }

}
