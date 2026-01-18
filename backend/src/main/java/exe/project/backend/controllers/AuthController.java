package exe.project.backend.controllers;

import exe.project.backend.dtos.requests.*;
import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.dtos.responses.LoginResponse;
import exe.project.backend.dtos.responses.OtpRegisterResponse;
import exe.project.backend.dtos.responses.RefreshTokenResponse;
import exe.project.backend.dtos.responses.RegisterResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {
    private final IAuthService authService;

    //send otp to user mail
    @PostMapping("/otp-login/{email}")
    public ResponseEntity<BaseJsonResponse> sendOtpRegister(@PathVariable String email) {
        authService.sendOtpLogin(email);
        return ResponseEntity.ok(BaseJsonResponse.builder()
                .status(StatusFlag.SUCCESS.getValue())
                .message("OTP sent successfully")
                .result("OTP sent successfully")
                .build());
    }

    @PostMapping("/otp-login/verify")
    public ResponseEntity<BaseJsonResponse> loginWithOtp(
            @RequestBody OtpLoginRequest request) {
        LoginResponse loginResponse = authService.verifyOtpLogin(
                new VerifyOtp(request.getEmail(), request.getOtp())
        );
        return ResponseEntity.ok(
                BaseJsonResponse.builder()
                        .status(StatusFlag.SUCCESS.getValue())
                        .message("Login successfully")
                        .result(loginResponse)
                        .build()
        );
    }

    @PostMapping("/refresh")
    public ResponseEntity<BaseJsonResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            RefreshTokenResponse response = authService.refreshToken(request);
            BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("Refresh token successfully")
                    .result(response)
                    .build();
            return ResponseEntity.ok(baseJsonResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message("Refresh token fail")
                    .build());
        }
    }

    @PostMapping("/logout")
    public void logout(@RequestBody LogoutRequest request) {
        authService.logout(request);
    }

    @PostMapping("/verify")
    public ResponseEntity<Boolean> verifyToken(@RequestBody VerifyRequest request) {
        return ResponseEntity.ok(authService.verifyToken(request.getAccessToken()));
    }

    @PostMapping("/outbound/{provider}/authenticate")
    public ResponseEntity<BaseJsonResponse> outboundAuthenticate(@PathVariable String provider,
                                                                 @RequestBody Oauth2LoginRequest request) {
        try {
            var result = authService.loginWithOauth2O(request.getCode(), provider);
            BaseJsonResponse response = BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .result(result)
                    .build();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(BaseJsonResponse.builder()
                            .status(StatusFlag.ERROR.getValue())
                            .build());
        }
    }
}
