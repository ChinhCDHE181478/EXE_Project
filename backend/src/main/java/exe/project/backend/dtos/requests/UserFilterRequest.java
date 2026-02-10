package exe.project.backend.dtos.requests;

import exe.project.backend.enums.Role;
import lombok.Data;

@Data
public class UserFilterRequest {
    private String email;
    private Role role;
    private Boolean isSubscribed;
    private Boolean isBlocked; // Maps to deleteFlag
}
