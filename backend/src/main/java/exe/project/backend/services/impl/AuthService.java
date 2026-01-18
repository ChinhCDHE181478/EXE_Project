package exe.project.backend.services.impl;

import exe.project.backend.config.OtpConfig;
import exe.project.backend.dtos.requests.*;
import exe.project.backend.dtos.responses.*;
import exe.project.backend.enums.ErrorCode;
import exe.project.backend.enums.ProviderType;
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

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ServiceException(ErrorCode.USER_NOT_FOUND));

        if (user.isDeleteFlag()) {
            throw new ServiceException(ErrorCode.USER_HAD_BEEN_DELETED);
        }

        String otp = otpConfig.generateOtp();

        OtpVerification otpEntity = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .purpose("LOGIN")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        otpVerificationRepository.save(otpEntity);

        try{
            emailService.sendEmail(
                    email,
                    "Login to Vivuplan",
                    "Your OTP code: " + otp
            );
        } catch (Exception ignored){}
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

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ServiceException(ErrorCode.USER_NOT_FOUND));

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
