package exe.project.backend.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import exe.project.backend.dtos.local.hotel.HotelDestinationInfo;
import exe.project.backend.dtos.responses.HotelSearchResponse;
import exe.project.backend.enums.RapidApiEndPoint;
import exe.project.backend.services.IHotelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class HotelService implements IHotelService {
    private final RapidApiService rapidApiService;
    private final ObjectMapper objectMapper;

    @Override
    public CompletableFuture<HotelDestinationInfo> getHotelDestination(String query) {
        String endpoint = RapidApiEndPoint.SEARCH_HOTEL_DESTINATION.getPath();

        return CompletableFuture.supplyAsync(() -> {
            try {
                // Gọi RapidApiService, nhận về JsonNode (data array)
                JsonNode response = rapidApiService.sendGetDataNode(endpoint, Map.of("query", query));

                if (response != null && response.isArray() && !response.isEmpty()) {
                    JsonNode dest = response.get(0);

                    return new HotelDestinationInfo(
                            dest.path("dest_id").asText(""),      // destinationId
                            dest.path("city_name").asText(""),    // name
                            dest.path("cc1").asText(""),          // country
                            dest.path("latitude").asDouble(0.0),  // latitude
                            dest.path("longitude").asDouble(0.0)  // longitude
                    );
                }
                return null;
            } catch (Exception e) {
                log.error("❌ Error fetching hotel destination: {}", e.getMessage(), e);
                return null;
            }
        });
    }

    @Override
    public CompletableFuture<HotelSearchResponse> getHotelByCoordinate(Map<String, String> queries) {
        String endpoint = RapidApiEndPoint.SEARCH_HOTEL_BY_COORDINATE.getPath();

        return CompletableFuture.supplyAsync(() -> {
            try {
                JsonNode dataNode = rapidApiService.sendGetDataNode(endpoint, queries);
                if (dataNode != null) {
                    // Map JsonNode "data" sang DTO HotelSearchResponse
                    return objectMapper.treeToValue(dataNode, HotelSearchResponse.class);
                }
                return null;
            } catch (Exception e) {
                log.error("❌ Error fetching hotels by coordinate: {}", e.getMessage(), e);
                return null;
            }
        });
    }

    @Override
    public CompletableFuture<HotelSearchResponse> searchHotel(Map<String, String> queries) {
        String endpoint = RapidApiEndPoint.SEARCH_HOTEL_BY_COORDINATE.getPath();

        // Lấy giá trị query (tên địa điểm)
        String query = queries.get("destination");
        if (query == null || query.isBlank()) {
            log.warn("⚠️ Missing query parameter");
            return CompletableFuture.completedFuture(null);
        }

        // Gọi getHotelDestination trước
        return getHotelDestination(query).thenCompose(destination -> {
            if (destination == null || destination.getDestinationId().isBlank()) {
                log.warn("⚠️ Destination not found for query: {}", query);
                return CompletableFuture.completedFuture(null);
            }

            // Xóa query khỏi map, thêm dest_id mới
            Map<String, String> updatedQueries = new HashMap<>(queries);
            updatedQueries.remove("destination");
            updatedQueries.put("latitude", destination.getLatitude().toString());
            updatedQueries.put("longitude", destination.getLongitude().toString());
            updatedQueries.put("radius", "20");

            log.info("📌 Updated query params gửi đi: {}", updatedQueries);

            // Gọi API search hotels
            return CompletableFuture.supplyAsync(() -> {
                try {
                    JsonNode dataNode = rapidApiService.sendGetDataNode(endpoint, updatedQueries);
                    log.info("Data: {}", dataNode);

                    if (dataNode != null) {
                        return objectMapper.treeToValue(dataNode, HotelSearchResponse.class);
                    }
                    return null;
                } catch (Exception e) {
                    log.error("❌ Error fetching hotels by destination: {}", e.getMessage(), e);
                    return null;
                }
            });
        });
    }

    @Override
    public CompletableFuture<String> getLink(Map<String, String> queries) {
        String endpoint = RapidApiEndPoint.GET_HOTEL_DETAIL.getPath();

        return CompletableFuture.supplyAsync(() -> {
            try {
                JsonNode dataNode = rapidApiService.sendGetDataNode(endpoint, queries);
                if (dataNode != null) {
                    // lấy field "url" trong dataNode
                    return dataNode.path("url").asText("");
                }
                return null;
            } catch (Exception e) {
                log.error("❌ Error fetching hotel detail link: {}", e.getMessage(), e);
                return null;
            }
        });
    }

}
