package exe.project.backend.dtos.local.flight;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FlightDestinationInfor {
    @JsonProperty("id")
    private String destinationId;

    private String type;
    private String name;
    private String country;
    private String countryName;
    private String city;
    private String cityName;
}
