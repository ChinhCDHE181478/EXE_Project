package exe.project.backend.enums;

import lombok.Getter;

@Getter
public enum RapidApiEndPoint {
    SEARCH_HOTEL_BY_COORDINATE("/hotels/searchHotelsByCoordinates"),
    SEARCH_HOTEL_DESTINATION("/hotels/searchDestination"),
    GET_HOTEL_DETAIL("/hotels/getHotelDetails"),

    SEARCH_FLIGHT_DESTINATION("/flights/searchDestination"),
    SEARCH_FLIGHT("/flights/searchFlights"),;

    private final String path;

    RapidApiEndPoint(String path) {
        this.path = path;
    }
}
