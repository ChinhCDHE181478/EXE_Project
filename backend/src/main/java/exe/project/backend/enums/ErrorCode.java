package exe.project.backend.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    UNSUPPORTED_PROVIDER(HttpStatus.BAD_REQUEST, "Unsupported provider"),
    MISSING_LOGIN_REGISTER_INFORMATION(HttpStatus.BAD_REQUEST, "Missing Login/Register Information"),
    UNCATEGORIZED_EXCEPTION(HttpStatus.INTERNAL_SERVER_ERROR, "Service Error"),
    EMAIL_EXISTED(HttpStatus.BAD_REQUEST, "Email Already Taken"),
    USER_EXISTED(HttpStatus.BAD_REQUEST, "Username Already Taken"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User Not Found"),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "Unauthenticated"),
    UNAUTHORIZED(HttpStatus.FORBIDDEN, "You Do Not Have Permission"),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "Invalid Refresh Token"),
    WRONG_PASSWORD(HttpStatus.UNAUTHORIZED, "Wrong Password"),
    USER_HAD_BEEN_DELETED(HttpStatus.BAD_REQUEST, "User Had Been Locked Or Deleted"),
    MISSED_OR_EXPIRED_OTP(HttpStatus.BAD_REQUEST, "Missed Or Expired OTP"),
    OTP_INVALID(HttpStatus.BAD_REQUEST, "OTP Invalid"),
    LINK_OAUTH2_PROVIDER_FAILED(HttpStatus.BAD_REQUEST, "Link Oauth2 Provider Failed"),;

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
