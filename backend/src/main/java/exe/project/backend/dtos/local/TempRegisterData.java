package exe.project.backend.dtos.local;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TempRegisterData {
    private String email;
    private String otp;
}
