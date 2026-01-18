package exe.project.backend.models;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserConversationId implements Serializable {

    private Long userId;
    private String sessionId;
}

