package exe.project.backend.services.impl;

import exe.project.backend.config.OtpConfig;
import exe.project.backend.dtos.local.TempRegisterData;
import exe.project.backend.dtos.requests.*;
import exe.project.backend.dtos.responses.*;
import exe.project.backend.enums.ErrorCode;
import exe.project.backend.enums.ProviderType;
import exe.project.backend.enums.Role;
import exe.project.backend.exceptions.ServiceException;
import exe.project.backend.mappers.UserMapper;
import exe.project.backend.models.User;
import exe.project.backend.models.UserProvider;
import exe.project.backend.repositories.IUserProviderRepository;
import exe.project.backend.repositories.IUserRepository;
import exe.project.backend.services.IAuthService;
import exe.project.backend.services.IEmailService;
import exe.project.backend.services.IJwtService;
import exe.project.backend.services.IRefreshTokenService;
import exe.project.backend.services.oauth2.OAuth2Service;
import exe.project.backend.services.oauth2.OAuth2ServiceFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final IUserRepository userRepository;
    private final IRefreshTokenService refreshTokenService;
    private final IJwtService jwtService;
    private final IEmailService emailService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final OtpConfig otpConfig;
    private final OAuth2ServiceFactory oauth2ServiceFactory;
    private final IUserProviderRepository userProviderRepository;

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        if (loginRequest.getEmail() == null || loginRequest.getEmail().isBlank()
                || loginRequest.getPassword() == null || loginRequest.getPassword().isBlank()) {
            throw new ServiceException(ErrorCode.MISSING_LOGIN_REGISTER_INFORMATION);
        }

        User user = userRepository.findByEmail(loginRequest.getEmail()).orElse(null);

        if (user == null) {
            throw new ServiceException(ErrorCode.USER_NOT_FOUND);
        } else if (user.isDeleteFlag()) {
            throw new ServiceException(ErrorCode.USER_HAD_BEEN_DELETED);
        } else if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new ServiceException(ErrorCode.WRONG_PASSWORD);
        }

        String refreshToken = refreshTokenService.generateRefreshToken(user);
        String accessToken = jwtService.generateAccessToken(user);

        LoginResponse response = userMapper.toLoginResponseDto(user);
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setAccessTokenExpiresIn(jwtService.getExpirationTime());
        response.setRefreshTokenExpiresIn(refreshTokenService.getExpiresIn());
        return response;
    }

    @Override
    public OtpRegisterResponse sendOtpRegister(RegisterRequest registerRequest) {
        if (registerRequest.getEmail() == null || registerRequest.getEmail().isBlank()
                || registerRequest.getPassword() == null || registerRequest.getPassword().isBlank()) {
            throw new ServiceException(ErrorCode.MISSING_LOGIN_REGISTER_INFORMATION);
        }

        User user = userRepository.findByEmail(registerRequest.getEmail()).orElse(null);

        if (user != null) {
            throw new ServiceException(ErrorCode.EMAIL_EXISTED);
        }

        String otp = otpConfig.generateOtp();

        TempRegisterData tempData = new TempRegisterData(
                registerRequest.getEmail(),
                registerRequest.getPassword(),
                otp
        );

        redisTemplate.opsForValue().set(
                "REGISTER:" + registerRequest.getEmail(),
                tempData,
                5, TimeUnit.MINUTES
        );

        try {
            emailService.sendEmail(registerRequest.getEmail(),
                    "Vivuplan",
                    "Your otp code for registration: " + otp);
        } catch (Exception ignored) {
        }
        return OtpRegisterResponse.builder().email(registerRequest.getEmail()).build();
    }

    @Override
    public RegisterResponse registerUser(VerifyOtp verifyOtp) {
        if (verifyOtp.getEmail() == null || verifyOtp.getEmail().isBlank()
                || verifyOtp.getOtp() == null || verifyOtp.getOtp().isBlank()) {
            throw new ServiceException(ErrorCode.MISSING_LOGIN_REGISTER_INFORMATION);
        }

        String key = "REGISTER:" + verifyOtp.getEmail();

        TempRegisterData tempData = (TempRegisterData) redisTemplate.opsForValue().get(key);

        if (tempData == null) {
            throw new ServiceException(ErrorCode.MISSED_OR_EXPIRED_OTP);
        }

        if (!tempData.getOtp().equals(verifyOtp.getOtp())) {
            throw new ServiceException(ErrorCode.OTP_INVALID);
        }

        User user = new User();
        user.setRole(Role.USER);
        user.setEmail(tempData.getEmail());
        user.setPassword(passwordEncoder.encode(tempData.getPassword())); // mã hóa pass
        user = userRepository.save(user);

        redisTemplate.delete(key);

        return RegisterResponse.builder()
                .id(user.getId())
                .build();
    }

    @Override
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        Boolean isBlacklisted = redisTemplate.hasKey("BLACKLIST:REFRESH:" + refreshToken);
        if (Boolean.TRUE.equals(isBlacklisted)) {
            throw new ServiceException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (!refreshTokenService.isValidRefreshToken(refreshToken)) {
            throw new ServiceException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String email = refreshTokenService.extractUserName(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ServiceException(ErrorCode.USER_NOT_FOUND));

        if (user.isDeleteFlag()) {
            throw new RuntimeException("user is locked");
        }

        String accessToken = jwtService.generateAccessToken(user);
        return new RefreshTokenResponse(accessToken, refreshToken);
    }

    @Override
    public boolean verifyToken(String token) {
        try {
            Boolean isBlacklisted = redisTemplate.hasKey("BLACKLIST:ACCESS:" + token);
            if (Boolean.TRUE.equals(isBlacklisted)) {
                return false;
            }

            String email = jwtService.extractUserName(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ServiceException(ErrorCode.USER_NOT_FOUND));

            return jwtService.isValidAcessToken(token, user);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void logout(LogoutRequest request) {
        Long ref = refreshTokenService.getRemainingValidity(request.getRefreshToken());
        Long access = jwtService.getRemainingValidity(request.getAccessToken());

        if (ref > 0) {
            redisTemplate.opsForValue().set(
                    "BLACKLIST:REFRESH:" + request.getRefreshToken(),
                    "true",
                    ref,
                    TimeUnit.MILLISECONDS
            );
        }

        if (access > 0) {
            redisTemplate.opsForValue().set(
                    "BLACKLIST:ACCESS:" + request.getAccessToken(),
                    "true",
                    access,
                    TimeUnit.MILLISECONDS
            );
        }
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

    private User findOrRegisterUser(OnboardingUser onboardingUser) {
        return userRepository.findByEmail(onboardingUser.getEmail())
                .orElseGet(() -> registerOauth2User(onboardingUser));
    }

    private User registerOauth2User(OnboardingUser onboardingUser) {
        User user = User.builder()
                .email(onboardingUser.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
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
