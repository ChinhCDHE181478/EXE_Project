package exe.project.backend.services.impl;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import exe.project.backend.models.User;
import exe.project.backend.repositories.TokenBlacklistRepository;
import exe.project.backend.services.IJwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.StringJoiner;

@Service
@RequiredArgsConstructor
public class JwtService implements IJwtService {

    private final TokenBlacklistRepository tokenBlacklistRepository;

    @Value("${jwt.signerKey}")
    private String signerKey;

    @Value("${jwt.validTime}")
    private long accessExpire;

    @Override
    public long getExpirationTime() {
        return accessExpire;
    }

    @Override
    public String extractUserName(String token) {
        return extractAllClaims(token).getSubject();
    }

    @Override
    public Date extractExpiredTime(String token) {
        return extractAllClaims(token).getExpirationTime();
    }

    @Override
    public String generateAccessToken(User user) {
        return buildToken(user);
    }

    /**
     * Validate access token:
     * 1. Không nằm trong blacklist
     * 2. Đúng user
     * 3. Chưa hết hạn
     */
    @Override
    public boolean isValidAcessToken(String token, User user) {

        if (tokenBlacklistRepository.existsByToken(token)) {
            return false;
        }

        String email = extractUserName(token);

        return user.getEmail().equals(email) && !isTokenExpired(token);
    }

    @Override
    public Long getRemainingValidity(String token) {
        Date expiration = extractExpiredTime(token);
        return expiration.getTime() - System.currentTimeMillis();
    }

    // ================= PRIVATE =================

    private boolean isTokenExpired(String token) {
        return extractExpiredTime(token).before(new Date());
    }

    private JWTClaimsSet extractAllClaims(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            if (!signedJWT.verify(new MACVerifier(signerKey.getBytes()))) {
                throw new RuntimeException("JWT signature verification failed");
            }

            return signedJWT.getJWTClaimsSet();

        } catch (ParseException | JOSEException e) {
            throw new RuntimeException("Invalid JWT token", e);
        }
    }

    private String buildToken(User user) {

        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .issuer("caodoanhchinh")
                .subject(user.getEmail())
                .issueTime(new Date())
                .expirationTime(
                        new Date(
                                Instant.now()
                                        .plusSeconds(accessExpire)
                                        .toEpochMilli()))
                .claim("user_id", user.getId())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("id", user.getId())
                .claim("scope", buildScope(user))
                .build();

        JWSObject jwsObject = new JWSObject(
                jwsHeader,
                new Payload(claimsSet.toJSONObject()));

        try {
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Cannot sign JWT", e);
        }
    }

    private String buildScope(User user) {
        return user.getRole().name();
    }
}
