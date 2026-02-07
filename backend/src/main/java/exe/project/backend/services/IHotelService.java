package exe.project.backend.services;

import exe.project.backend.dtos.local.hotel.HotelDestinationInfo;
import exe.project.backend.dtos.responses.HotelSearchResponse;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface IHotelService {
    CompletableFuture<HotelDestinationInfo> getHotelDestination(String query);

    CompletableFuture<List<HotelDestinationInfo>> getListHotelDestination(String query);

    CompletableFuture<HotelSearchResponse> getHotelByCoordinate(Map<String, String> queries);

    CompletableFuture<HotelSearchResponse> searchHotel(Map<String, String> queries);

    CompletableFuture<String> getLink(Map<String, String> queries);
}
