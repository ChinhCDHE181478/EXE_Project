package exe.project.backend.services;

import exe.project.backend.models.RefreshToken;
import exe.project.backend.models.User;

public interface IRefreshTokenService {
    long getExpiresIn();

    RefreshToken saveRefreshToken(User user, String refreshToken, boolean rememberMe);

    String generateRefreshToken(User user);

    boolean isValidRefreshToken(String token);

    String extractUserName(String token);

    void deleteToken(String token);

    void deleteByUserId(Long userId);

    Long getRemainingValidity(String token);
}
