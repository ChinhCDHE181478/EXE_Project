package exe.project.backend.dtos.local.hotel;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HotelDestinationInfo {
    @JsonProperty("destination_id")
    private String destinationId;

    private String dest_type;
    private String name;
    private String country;
    private Double latitude;
    private Double longitude;
}
