package exe.project.backend.services;

import exe.project.backend.models.User;

import java.util.Date;


public interface IJwtService {
    long getExpirationTime();

    String extractUserName(String token);

    Date extractExpiredTime(String token);

    String generateAccessToken(User user);

    boolean isValidAcessToken(String token, User user);

    Long getRemainingValidity(String token);
}
