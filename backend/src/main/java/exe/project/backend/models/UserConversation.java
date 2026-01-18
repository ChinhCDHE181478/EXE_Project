package exe.project.backend.models;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(UserConversationId.class)
public class UserConversation {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "session_id", nullable = false, length = 255)
    private String sessionId;

    @Column(name = "title", length = 255)
    private String title = "New Chat";

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
