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

    @PostMapping("/login")
    public ResponseEntity<BaseJsonResponse> login(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.login(loginRequest);
            BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("Login successfully")
                    .result(response)
                    .build();
            return ResponseEntity.ok(baseJsonResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message("User logged in failed")
                    .build());
        }
    }

    //send otp to user mail
    @PostMapping("/otp-register")
    public ResponseEntity<BaseJsonResponse> sendOtpRegister(@RequestBody RegisterRequest registerRequest) {
        OtpRegisterResponse response = authService.sendOtpRegister(registerRequest);
        return ResponseEntity.ok(BaseJsonResponse.builder()
                .status(StatusFlag.SUCCESS.getValue())
                .message("OTP sent successfully")
                .result(response)
                .build());
    }

    //verify otp to register user
    @PostMapping("/otp-verify")
    public ResponseEntity<BaseJsonResponse> verifyOtp(@RequestBody VerifyOtp verifyOtp) {
        try {
            RegisterResponse response = authService.registerUser(verifyOtp);
            BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("OTP verified successfully")
                    .result(response)
                    .build();
            return ResponseEntity.ok(baseJsonResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message("OTP verified fail")
                    .build());
        }
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
