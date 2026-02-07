package exe.project.backend.services;

import exe.project.backend.dtos.local.flight.FlightDestinationInfor;
import exe.project.backend.dtos.responses.FlightSearchResponse;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface IFlightService {

    CompletableFuture<FlightDestinationInfor> getFlightDestination(String query, String languagecode);

    CompletableFuture<List<FlightDestinationInfor>> getListFlightDestination(String query, String languagecode);

    CompletableFuture<FlightSearchResponse> searchFlight(Map<String, String> queries);

    CompletableFuture<FlightSearchResponse> searchFlight2(Map<String, String> queries);

    CompletableFuture<String> getLink(Map<String, String> queries);
}
