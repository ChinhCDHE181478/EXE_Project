package exe.project.backend.dtos.responses;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import exe.project.backend.dtos.local.hotel.HotelByCoordinate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HotelSearchResponse {
    private int count;
    @JsonProperty("extended_count")
    private int extendedCount;
    @JsonProperty("unfiltered_count")
    private int unfilteredCount;
    @JsonProperty("page_loading_threshold")
    private int pageLoadingThreshold;
    @JsonProperty("unfiltered_primary_count")
    private int unfilteredPrimaryCount;

    private List<HotelByCoordinate> result;

}
