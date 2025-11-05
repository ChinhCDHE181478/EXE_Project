package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IHotelService;
import exe.project.backend.utils.QueryParamUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
            @RequestParam(defaultValue = "") String roomQty,
            @RequestParam(defaultValue = "1") String adults,
            @RequestParam(defaultValue = "") String childrenAge,
            @RequestParam(defaultValue = "1") String pageNumber,
            @RequestParam(defaultValue = "") String priceMin,
            @RequestParam(defaultValue = "") String priceMax,
            @RequestParam(defaultValue = "en-us") String languagecode,  // vi: tieng viet
            @RequestParam(defaultValue = "USD") String currencyCode   // VND
    ) {
        Map<String, String> queries = new java.util.HashMap<>(Map.ofEntries(
                Map.entry("destination", destination),
                Map.entry("arrival_date", arrivalDate),
                Map.entry("departure_date", departureDate),
                Map.entry("adults", adults),
                Map.entry("page_number", pageNumber),
                Map.entry("languagecode", languagecode),
                Map.entry("currency_code", currencyCode),
                Map.entry("units", "metric"),
                Map.entry("temperature_unit", "c")
        ));

        QueryParamUtil.addIfNotNull(queries,
                "price_max", priceMax,
                "room_qty", roomQty,
                "price_min", priceMin,
                "children_age", childrenAge
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
            @RequestParam(defaultValue = "") String roomQty,
            @RequestParam(defaultValue = "20") String radius,
            @RequestParam(defaultValue = "1") String adults,
            @RequestParam(defaultValue = "") String childrenAge,
            @RequestParam(defaultValue = "") String priceMin,
            @RequestParam(defaultValue = "") String priceMax,
            @RequestParam(defaultValue = "1") String pageNumber,
            @RequestParam(defaultValue = "en-us") String languagecode,
            @RequestParam(defaultValue = "USD") String currencyCode
    ) {
        Map<String, String> queries = new java.util.HashMap<>(Map.ofEntries(
                Map.entry("latitude", latitude),
                Map.entry("longitude", longitude),
                Map.entry("arrival_date", arrivalDate),
                Map.entry("departure_date", departureDate),
                Map.entry("radius", radius),
                Map.entry("adults", adults),
                Map.entry("page_number", pageNumber),
                Map.entry("languagecode", languagecode),
                Map.entry("currency_code", currencyCode),
                Map.entry("units", "metric"),
                Map.entry("temperature_unit", "c")
        ));

        QueryParamUtil.addIfNotNull(queries,
                "price_max", priceMax,
                "room_qty", roomQty,
                "price_min", priceMin,
                "children_age", childrenAge
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

    @GetMapping("/link")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> getLink(
            @RequestParam String hotelId,
            @RequestParam String arrivalDate,
            @RequestParam String departureDate,
            @RequestParam(defaultValue = "1") String adults,
            @RequestParam(defaultValue = "") String childrenAge,
            @RequestParam(defaultValue = "en-us") String languagecode,
            @RequestParam(defaultValue = "USD") String currencyCode
    ) {
        Map<String, String> queries = new java.util.HashMap<>(Map.ofEntries(
                Map.entry("hotel_id", hotelId),
                Map.entry("arrival_date", arrivalDate),
                Map.entry("departure_date", departureDate),
                Map.entry("adults", adults),
                Map.entry("languagecode", languagecode),
                Map.entry("currency_code", currencyCode),
                Map.entry("units", "metric"),
                Map.entry("temperature_unit", "c")
        ));

        QueryParamUtil.addIfNotNull(queries,
                "children_age", childrenAge
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
