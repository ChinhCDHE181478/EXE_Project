package exe.project.backend.services.impl;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import exe.project.backend.models.RefreshToken;
import exe.project.backend.models.User;
import exe.project.backend.repositories.IRefreshTokenRepository;
import exe.project.backend.repositories.TokenBlacklistRepository;
import exe.project.backend.services.IRefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService implements IRefreshTokenService {

    private final IRefreshTokenRepository refreshTokenRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    @Value("${jwt.refreshSignerKey}")
    private String refreshSignerKey;

    @Value("${jwt.refreshTime}")
    private long refreshTime;

    @Override
    public long getExpiresIn() {
        return refreshTime;
    }

    // ================= CREATE =================

    @Override
    public String generateRefreshToken(User user) {

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer("caodoanhchinh")
                .subject(user.getEmail())
                .issueTime(new Date())
                .expirationTime(
                        new Date(
                                Instant.now()
                                        .plusSeconds(refreshTime)
                                        .toEpochMilli()
                        )
                )
                .jwtID(UUID.randomUUID().toString())
                .build();

        JWSObject jwsObject = new JWSObject(
                header,
                new Payload(claimsSet.toJSONObject())
        );

        try {
            jwsObject.sign(new MACSigner(refreshSignerKey.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Cannot sign refresh token", e);
        }
    }

    @Override
    public RefreshToken saveRefreshToken(User user, String refreshToken, boolean rememberMe) {

        Date expiryTime = new Date(
                Instant.now()
                        .plusSeconds(rememberMe ? refreshTime : 60 * 60 * 24)
                        .toEpochMilli()
        );

        String jti = extractJwtId(refreshToken);

        RefreshToken token = RefreshToken.builder()
                .id(jti)
                .expiryTime(expiryTime)
                .user(user)
                .build();

        return refreshTokenRepository.save(token);
    }

    // ================= VALIDATE =================

    @Override
    public boolean isValidRefreshToken(String token) {

        if (tokenBlacklistRepository.existsByToken(token)) {
            return false;
        }

        String tokenId = extractJwtId(token);

        return refreshTokenRepository.findById(tokenId)
                .filter(rt -> rt.getExpiryTime().after(new Date()))
                .isPresent();
    }

    // ================= EXTRACT =================

    @Override
    public String extractUserName(String token) {
        return extractAllClaims(token).getSubject();
    }

    @Override
    public Long getRemainingValidity(String token) {
        Date expiration = extractAllClaims(token).getExpirationTime();
        return expiration.getTime() - System.currentTimeMillis();
    }

    private String extractJwtId(String token) {
        return extractAllClaims(token).getJWTID();
    }

    private JWTClaimsSet extractAllClaims(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            if (!signedJWT.verify(new MACVerifier(refreshSignerKey.getBytes()))) {
                throw new RuntimeException("Refresh token signature verification failed");
            }

            return signedJWT.getJWTClaimsSet();

        } catch (ParseException | JOSEException e) {
            throw new RuntimeException("Invalid refresh token", e);
        }
    }

    // ================= DELETE =================

    @Override
    public void deleteToken(String token) {
        refreshTokenRepository.deleteById(extractJwtId(token));
    }

    @Override
    public void deleteByUserId(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}
