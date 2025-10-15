package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.dtos.local.hotel.DestinationInfo;
import exe.project.backend.dtos.responses.RegisterResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IHotelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RequiredArgsConstructor
@RestController
@RequestMapping("/hotel")
public class HotelController {
    private final IHotelService hotelService;

    @GetMapping("/search-destination")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> searchDestination(@RequestParam String query) {
        return hotelService.getHotelDestination(query)
                .thenApply(response -> {
                    BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                            .status(StatusFlag.SUCCESS.getValue())
                            .message("Get Destination successfully")
                            .result(response)
                            .build();
                    return ResponseEntity.ok(baseJsonResponse);
                })
                .exceptionally(ex -> ResponseEntity.badRequest().body(
                        BaseJsonResponse.builder()
                                .status(StatusFlag.ERROR.getValue())
                                .message("Get Destination Error: " + ex.getMessage())
                                .build()
                ));
    }

    @GetMapping("/search")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> search(
            @RequestParam String destination,
            @RequestParam String arrivalDate,
            @RequestParam String departureDate,
            @RequestParam(defaultValue = "") String adults,
            @RequestParam(defaultValue = "") Integer children,
            @RequestParam(defaultValue = "1") String pageNumber,
            @RequestParam(defaultValue = "") String priceMin,
            @RequestParam(defaultValue = "") String priceMax,
            @RequestParam(defaultValue = "en-us") String languagecode,  // vi: tieng viet
            @RequestParam(defaultValue = "USD") String currencyCode   // VND
    ) {
        String childrenAge = "";
        if (children != null && children > 0) {
            childrenAge = String.join(",",
                    java.util.Collections.nCopies(children, "10")
            );
        }
        Map<String, String> queries = Map.ofEntries(
                Map.entry("destination", destination),
                Map.entry("arrival_date", arrivalDate),
                Map.entry("departure_date", departureDate),
                Map.entry("adults", adults),
                Map.entry("children_age", childrenAge),
                Map.entry("price_min", priceMin),
                Map.entry("price_max", priceMax),
                Map.entry("page_number", pageNumber),
                Map.entry("languagecode", languagecode),
                Map.entry("currency_code", currencyCode),
                Map.entry("units", "metric"),
                Map.entry("temperature_unit", "c")
        );
        return hotelService.searchHotel(queries)
                .thenApply(result -> {
                    BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                            .status(StatusFlag.SUCCESS.getValue())
                            .message("Get hotels successfully")
                            .result(result)
                            .build();
                    return ResponseEntity.ok(baseJsonResponse);
                })
                .exceptionally(ex -> ResponseEntity.badRequest().body(
                        BaseJsonResponse.builder()
                                .status(StatusFlag.ERROR.getValue())
                                .message("Get hotels error: " + ex.getMessage())
                                .build()
                ));
    }

    @GetMapping("/search-by-coordinate")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> searchByCoordinate(
            @RequestParam String latitude,
            @RequestParam String longitude,
            @RequestParam String arrivalDate,
            @RequestParam String departureDate,
            @RequestParam(defaultValue = "20") String radius,
            @RequestParam(defaultValue = "") String adults,
            @RequestParam(defaultValue = "0") Integer children,
            @RequestParam(defaultValue = "") String priceMin,
            @RequestParam(defaultValue = "") String priceMax,
            @RequestParam(defaultValue = "1") String pageNumber,
            @RequestParam(defaultValue = "en-us") String languagecode,
            @RequestParam(defaultValue = "USD") String currencyCode
    ) {
        String childrenAge = "";
        if (children != null && children > 0) {
            childrenAge = String.join(",",
                    java.util.Collections.nCopies(children, "10")
            );
        }
        Map<String, String> queries = Map.ofEntries(
                Map.entry("latitude", latitude),
                Map.entry("longitude", longitude),
                Map.entry("arrival_date", arrivalDate),
                Map.entry("departure_date", departureDate),
                Map.entry("radius", radius),
                Map.entry("adults", adults),
                Map.entry("children_age", childrenAge),
                Map.entry("price_min", priceMin),
                Map.entry("price_max", priceMax),
                Map.entry("page_number", pageNumber),
                Map.entry("languagecode", languagecode),
                Map.entry("currency_code", currencyCode),
                Map.entry("units", "metric"),
                Map.entry("temperature_unit", "c")
        );

        return hotelService.getHotelByCoordinate(queries)
                .thenApply(result -> {
                    BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                            .status(StatusFlag.SUCCESS.getValue())
                            .message("Get hotels successfully")
                            .result(result)
                            .build();
                    return ResponseEntity.ok(baseJsonResponse);
                })
                .exceptionally(ex -> ResponseEntity.badRequest().body(
                        BaseJsonResponse.builder()
                                .status(StatusFlag.ERROR.getValue())
                                .message("Get hotels error: " + ex.getMessage())
                                .build()
                ));
    }

    public CompletableFuture<ResponseEntity<BaseJsonResponse>> getLink(
            @RequestParam String hotelId,
            @RequestParam String arrivalDate,
            @RequestParam String departureDate,
            @RequestParam(defaultValue = "") String adults,
            @RequestParam(defaultValue = "0") Integer children,
            @RequestParam(defaultValue = "en-us") String languagecode,
            @RequestParam(defaultValue = "USD") String currencyCode
    ) {
        String childrenAge = "";
        if (children != null && children > 0) {
            childrenAge = String.join(",",
                    java.util.Collections.nCopies(children, "10")
            );
        }
        Map<String, String> queries = Map.ofEntries(
                Map.entry("arrival_date", arrivalDate),
                Map.entry("departure_date", departureDate),
                Map.entry("adults", adults),
                Map.entry("children_age", childrenAge),
                Map.entry("languagecode", languagecode),
                Map.entry("currency_code", currencyCode),
                Map.entry("units", "metric"),
                Map.entry("temperature_unit", "c")
        );

        return hotelService.getLink(queries)
                .thenApply(result -> {
                    BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                            .status(StatusFlag.SUCCESS.getValue())
                            .message("Get hotels successfully")
                            .result(result)
                            .build();
                    return ResponseEntity.ok(baseJsonResponse);
                })
                .exceptionally(ex -> ResponseEntity.badRequest().body(
                        BaseJsonResponse.builder()
                                .status(StatusFlag.ERROR.getValue())
                                .message("Get hotels error: " + ex.getMessage())
                                .build()
                ));
    }


}
