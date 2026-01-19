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
                        if (typeNode != null && "CITY".equalsIgnoreCase(typeNode.asText())) {
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
    public CompletableFuture<FlightSearchResponse> searchFlight(Map<String, String> queries) {
        String endpoint = RapidApiEndPoint.SEARCH_FLIGHT.getPath();

        return CompletableFuture.supplyAsync(() -> {
            try {
                JsonNode dataNode = rapidApiService.sendGetDataNode(endpoint, queries);
                if (dataNode != null) {
                    // Map JsonNode "data" sang DTO HotelSearchResponse
                    return objectMapper.treeToValue(dataNode, FlightSearchResponse.class);
                }
                return null;
            } catch (Exception e) {
                log.error("❌ Error fetching flights by coordinate: {}", e.getMessage(), e);
                return null;
            }
        });
    }

    @Override
    public CompletableFuture<String> getLink(Map<String, String> queries) {
        return null;
    }
}
