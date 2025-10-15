package exe.project.backend.dtos.local.hotel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hotel {
    private String type;
    private String name;
    private String propertyToken;
    private String source;
    private Double latitude;
    private Double longitude;
    private Integer hotelClass;
    private Double overallRating;
    private Integer reviews;
    private String price;
    private List<String> amenities;

}
