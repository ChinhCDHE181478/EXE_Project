package exe.project.backend.services;

import exe.project.backend.dtos.local.hotel.DestinationInfo;
import exe.project.backend.dtos.responses.HotelSearchResponse;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface IHotelService {
    CompletableFuture<DestinationInfo> getHotelDestination(String query);

    CompletableFuture<HotelSearchResponse> getHotelByCoordinate(Map<String, String> queries);

    CompletableFuture<HotelSearchResponse> searchHotel(Map<String, String> queries);

    CompletableFuture<String> getLink(Map<String, String> queries);
}
