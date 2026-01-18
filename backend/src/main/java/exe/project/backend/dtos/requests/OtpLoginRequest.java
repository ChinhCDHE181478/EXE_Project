package exe.project.backend.dtos.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OtpLoginRequest {

    @JsonProperty("email")
    private String email;

    @JsonProperty("otp")
    private String otp;
}
