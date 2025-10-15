package exe.project.backend.dtos.local.hotel;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@AllArgsConstructor
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class HotelByCoordinate {
    @JsonProperty("hotel_id")
    private Long hotelId;

    @JsonProperty("hotel_name_trans")
    private String hotelNameTrans;

    @JsonProperty("hotel_name")
    private String hotelName;

    @JsonProperty("city")
    private String city;

    @JsonProperty("city_in_trans")
    private String cityInTrans;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    @JsonProperty("main_photo_url")
    private String mainPhotoUrl;

    @JsonProperty("review_score")
    private Double reviewScore;

    @JsonProperty("review_nr")
    private Integer reviewCount;

    @JsonProperty("class")  // class là hạng sao
    private Integer hotelClass;

    @JsonProperty("currencycode")
    private String currencyCode;

    @JsonProperty("composite_price_breakdown")
    private CompositePriceBreakdown compositePriceBreakdown;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CompositePriceBreakdown {
        @JsonProperty("gross_amount_per_night")
        private Amount grossAmountPerNight;

        @JsonProperty("discounted_amount")
        private Amount discountedAmount;

        @JsonProperty("strikethrough_amount_per_night")
        private Amount strikethroughAmountPerNight;

    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Amount {
        private String currency;
        private Double value;
    }

}
