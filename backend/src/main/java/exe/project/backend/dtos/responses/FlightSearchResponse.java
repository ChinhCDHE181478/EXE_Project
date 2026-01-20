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
public class FlightSearchResponse {

    private List<FlightOffers> flightOffers;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FlightOffers {
        private String token;

        @JsonIgnoreProperties(ignoreUnknown = true)
        private String linkFFFlight;

        private String tripType;

        private List<Segments> segments;

        private PriceBreakdown priceBreakdown;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PriceBreakdown {
        private Price total;
        private Price baseFare;
        private Price fee;
        private Price tax;
        private Price totalRounded;
        private Price discount;
        private Price totalWithoutDiscount;
        private Price totalWithoutDiscountRounded;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Price {
        private String currencyCode;
        private String units;
        private String nanos;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Segments {
        private String token;

        private Airport departureAirport;

        private Airport arrivalAirport;

        private String departureTime;

        private String arrivalTime;

        private List<Legs> legs;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Airport {
        private String code;

        private String name;

        private String city;

        private String cityName;

        private String country;

        private String countryName;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Legs {
        private String cabinClass;

        private String countryName;

        private List<CarriersData> carriersData;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CarriersData {
        private String name;

        private String code;

        private String logo;
    }
}
