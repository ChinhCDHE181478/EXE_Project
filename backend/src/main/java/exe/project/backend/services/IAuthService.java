package exe.project.backend.services;

import exe.project.backend.dtos.requests.*;
import exe.project.backend.dtos.responses.LoginResponse;
import exe.project.backend.dtos.responses.OtpRegisterResponse;
import exe.project.backend.dtos.responses.RefreshTokenResponse;
import exe.project.backend.dtos.responses.RegisterResponse;

public interface IAuthService {

    RefreshTokenResponse refreshToken(RefreshTokenRequest request);

    boolean verifyToken(String token);

    void logout(LogoutRequest request);

    LoginResponse loginWithOauth2O(String code, String provider);

    void sendOtpLogin(String email);

    LoginResponse verifyOtpLogin(VerifyOtp request);
}
