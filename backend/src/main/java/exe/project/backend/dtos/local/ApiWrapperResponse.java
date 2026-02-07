package exe.project.backend.dtos.local;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiWrapperResponse {
    private Boolean status;
    private Object message;
    private Long timestamp;
    private JsonNode data;
}
