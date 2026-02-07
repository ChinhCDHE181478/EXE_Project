package exe.project.backend.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import exe.project.backend.dtos.local.flight.FlightDestinationInfor;
import exe.project.backend.dtos.local.hotel.HotelDestinationInfo;
import exe.project.backend.dtos.responses.FlightSearchResponse;
import exe.project.backend.dtos.responses.HotelSearchResponse;
import exe.project.backend.enums.RapidApiEndPoint;
import exe.project.backend.services.IFlightService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlightService implements IFlightService {
    private final RapidApiService rapidApiService;
    private final ObjectMapper objectMapper;


    @Override
    public CompletableFuture<FlightDestinationInfor> getFlightDestination(String query, String languagecode) {
        String endpoint = RapidApiEndPoint.SEARCH_FLIGHT_DESTINATION.getPath();

        return CompletableFuture.supplyAsync(() -> {
            try {
                // Gọi RapidApiService, nhận về JsonNode (data array)
                JsonNode response = rapidApiService.sendGetDataNode(endpoint, Map.of("query", query));

                if (response != null && response.isArray() && !response.isEmpty()) {
                    // duyệt toàn bộ array để tìm phần tử có type = CITY
                    for (JsonNode dest : response) {
                        JsonNode typeNode = dest.get("type");
                        if (typeNode != null && "AIRPORT".equalsIgnoreCase(typeNode.asText())) {
                            return objectMapper.treeToValue(dest, FlightDestinationInfor.class);
                        }
                    }
                }
                return null;
            } catch (Exception e) {
                log.error("❌ Error fetching flight destination: {}", e.getMessage(), e);
                return null;
            }
        });
    }

    @Override
    public CompletableFuture<List<FlightDestinationInfor>> getListFlightDestination(String query, String languagecode) {
        String endpoint = RapidApiEndPoint.SEARCH_FLIGHT_DESTINATION.getPath();

        return CompletableFuture.supplyAsync(() -> {
            try {
                JsonNode response = rapidApiService.sendGetDataNode(endpoint, Map.of("query", query));

                List<FlightDestinationInfor> results = new ArrayList<>();

                if (response != null && response.isArray() && !response.isEmpty()) {

                    for (JsonNode dest : response) {
                        FlightDestinationInfor info = objectMapper.treeToValue(dest, FlightDestinationInfor.class);
                        results.add(info);
                    }
                }

                return results;

            } catch (Exception e) {
                log.error("❌ Error fetching flight destination: {}", e.getMessage(), e);
                return Collections.emptyList();
            }
        });
    }


//    @Override
//    public CompletableFuture<FlightSearchResponse> searchFlight(Map<String, String> queries) {
//        String endpoint = RapidApiEndPoint.SEARCH_FLIGHT.getPath();
//
//        CompletableFuture<FlightDestinationInfor> fromFuture =
//                getFlightDestination(queries.get("from"), "vi")
//                        .exceptionally(ex -> {
//                            log.error("From destination failed", ex);
//                            return null;
//                        });
//
//        CompletableFuture<FlightDestinationInfor> toFuture =
//                getFlightDestination(queries.get("to"), "vi")
//                        .exceptionally(ex -> {
//                            log.error("To destination failed", ex);
//                            return null;
//                        });
//
//        return CompletableFuture
//                .allOf(fromFuture, toFuture)
//                .thenCompose(v -> {
//
//                    FlightDestinationInfor from = fromFuture.join();
//                    FlightDestinationInfor to = toFuture.join();
//
//                    queries.put("fromId", from.getDestinationId());
//                    queries.put("toId", to.getDestinationId());
//                    queries.remove("from");
//                    queries.remove("to");
//
//                    return CompletableFuture.supplyAsync(() -> {
//                        try {
//                            JsonNode dataNode =
//                                    rapidApiService.sendGetDataNode(endpoint, queries);
//
//                            if (dataNode != null) {
//                                FlightSearchResponse response =
//                                        objectMapper.treeToValue(
//                                                dataNode,
//                                                FlightSearchResponse.class
//                                        );
//
//                                // 🔁 Lặp và gán custom link
//                                if (response.getFlightOffers() != null) {
//                                    for (FlightSearchResponse.FlightOffers offer : response.getFlightOffers()) {
//
//                                        if (offer.getSegments() == null || offer.getSegments().isEmpty()) {
//                                            continue;
//                                        }
//
//                                        String customLink = "https://flights.booking.com/flights/"
//                                                + offer.getSegments().getFirst().getDepartureAirport().getCode() + ".AIRPORT-"
//                                                + offer.getSegments().getFirst().getArrivalAirport().getCode() + ".AIRPORT/d7699_"
//                                                + offer.getToken().substring(6)
//                                                + "/?type=" + offer.getTripType()
//                                                + "&adults=" + queries.get("adults") + "&children=";
//                                        if(queries.get("childrenAge") != null) {
//                                            customLink += queries.get("childrenAge");
//                                        }
//                                        offer.setLinkFFFlight(customLink);
//                                    }
//                                }
//
//                                return response;
//                            }
//                            return null;
//                        } catch (Exception e) {
//                            log.error("❌ Error fetching flights: {}", e.getMessage(), e);
//                            return null;
//                        }
//                    });
//                });
//    }


    @Override
    public CompletableFuture<FlightSearchResponse> searchFlight(Map<String, String> queries) {
        String endpoint = RapidApiEndPoint.SEARCH_FLIGHT.getPath();

        return getFlightDestination(queries.get("from"), "vi")
                .thenCompose(from -> {

                    if (from == null) {
                        throw new RuntimeException("From destination not found");
                    }

                    queries.put("fromId", from.getDestinationId());
                    queries.remove("from");

                    // ➜ Sau khi có FROM mới gọi TO
                    return getFlightDestination(queries.get("to"), "vi");
                })
                .thenCompose(to -> {

                    if (to == null) {
                        throw new RuntimeException("To destination not found");
                    }

                    queries.put("toId", to.getDestinationId());
                    queries.remove("to");

                    // ➜ Sau khi có FROM + TO mới search flight
                    return CompletableFuture.supplyAsync(() -> {
                        try {
                            JsonNode dataNode =
                                    rapidApiService.sendGetDataNode(endpoint, queries);

                            if (dataNode != null) {
                                FlightSearchResponse response =
                                        objectMapper.treeToValue(
                                                dataNode,
                                                FlightSearchResponse.class
                                        );

                                // 🔁 Gán custom link
                                if (response.getFlightOffers() != null) {
                                    for (FlightSearchResponse.FlightOffers offer : response.getFlightOffers()) {

                                        if (offer.getSegments() == null || offer.getSegments().isEmpty()) {
                                            continue;
                                        }

                                        String customLink =
                                                "https://flights.booking.com/flights/"
                                                        + offer.getSegments().getFirst().getDepartureAirport().getCode() + ".AIRPORT-"
                                                        + offer.getSegments().getFirst().getArrivalAirport().getCode() + ".AIRPORT/d7699_"
                                                        + offer.getToken().substring(6)
                                                        + "/?type=" + offer.getTripType()
                                                        + "&adults=" + queries.get("adults")
                                                        + "&children=" + queries.getOrDefault("childrenAge", "");

                                        offer.setLinkFFFlight(customLink);
                                    }
                                }

                                return response;
                            }
                            return null;
                        } catch (Exception e) {
                            log.error("❌ Error fetching flights", e);
                            return null;
                        }
                    });
                });
    }

    @Override
    public CompletableFuture<FlightSearchResponse> searchFlight2(Map<String, String> queries) {
        String endpoint = RapidApiEndPoint.SEARCH_FLIGHT.getPath();

        return CompletableFuture.supplyAsync(() -> {
            try {

                JsonNode dataNode =
                        rapidApiService.sendGetDataNode(endpoint, queries);

                if (dataNode != null) {

                    FlightSearchResponse response =
                            objectMapper.treeToValue(
                                    dataNode,
                                    FlightSearchResponse.class
                            );

                    // 🔁 Gán custom link
                    if (response.getFlightOffers() != null) {

                        for (FlightSearchResponse.FlightOffers offer : response.getFlightOffers()) {

                            if (offer.getSegments() == null || offer.getSegments().isEmpty()) {
                                continue;
                            }

                            String customLink =
                                    "https://flights.booking.com/flights/"
                                            + offer.getSegments().getFirst().getDepartureAirport().getCode() + ".AIRPORT-"
                                            + offer.getSegments().getFirst().getArrivalAirport().getCode() + ".AIRPORT/d7699_"
                                            + offer.getToken().substring(6)
                                            + "/?type=" + offer.getTripType()
                                            + "&adults=" + queries.get("adults")
                                            + "&children=" + queries.getOrDefault("childrenAge", "");

                            offer.setLinkFFFlight(customLink);
                        }
                    }

                    return response;
                }

                return null;

            } catch (Exception e) {
                log.error("❌ Error fetching flights", e);
                return null;
            }
        });
    }


    @Override
    public CompletableFuture<String> getLink(Map<String, String> queries) {
        return null;
    }
}
