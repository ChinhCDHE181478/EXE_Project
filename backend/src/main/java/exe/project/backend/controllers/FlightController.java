package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IFlightService;
import exe.project.backend.utils.QueryParamUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequiredArgsConstructor
@RequestMapping("/flight")
public class FlightController {
    private final IFlightService flightService;

    @GetMapping("/search-destination")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> searchDestination(@RequestParam String query, @RequestParam String languagecode) {
        return flightService.getFlightDestination(query, languagecode)
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

    @GetMapping("/search-list-destination")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> searchListDestination(@RequestParam String query, @RequestParam String languagecode) {
        return flightService.getListFlightDestination(query, languagecode)
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
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String departDate,
            @RequestParam(required = false, defaultValue = "") String returnDate,
            @RequestParam(required = false, defaultValue = "1") String page,
            @RequestParam(required = false, defaultValue = "1") String adults,
            @RequestParam(required = false, defaultValue = "") String childrenAge,
            @RequestParam(required = false, defaultValue = "") String cabinClass,
            @RequestParam(required = false, defaultValue = "VND") String currency_code
    ) {
        Map<String, String> queries = new HashMap<>();
        queries.put("from", from);
        queries.put("to", to);
        queries.put("departDate", departDate);
        queries.put("page", page);
        queries.put("currency_code", currency_code);

        QueryParamUtil.addIfNotNull(queries,
                "adults", adults,
                "childrenAge", childrenAge,
                "cabinClass", cabinClass,
                "returnDate", returnDate
        );

        return flightService.searchFlight(queries)
                .thenApply(result -> {
                    BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                            .status(StatusFlag.SUCCESS.getValue())
                            .message("Get flights successfully")
                            .result(result)
                            .build();
                    return ResponseEntity.ok(baseJsonResponse);
                })
                .exceptionally(ex -> ResponseEntity.badRequest().body(
                        BaseJsonResponse.builder()
                                .status(StatusFlag.ERROR.getValue())
                                .message("Get flights error: " + ex.getMessage())
                                .build()
                ));
    }

    @GetMapping("/search2")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> search2(
            @RequestParam String fromId,
            @RequestParam String toId,
            @RequestParam String departDate,
            @RequestParam(required = false, defaultValue = "") String returnDate,
            @RequestParam(required = false, defaultValue = "1") String page,
            @RequestParam(required = false, defaultValue = "1") String adults,
            @RequestParam(required = false, defaultValue = "") String childrenAge,
            @RequestParam(required = false, defaultValue = "") String cabinClass,
            @RequestParam(required = false, defaultValue = "VND") String currency_code
    ) {
        Map<String, String> queries = new HashMap<>();
        queries.put("fromId", fromId);
        queries.put("toId", toId);
        queries.put("departDate", departDate);
        queries.put("page", page);
        queries.put("currency_code", currency_code);

        QueryParamUtil.addIfNotNull(queries,
                "adults", adults,
                "childrenAge", childrenAge,
                "cabinClass", cabinClass,
                "returnDate", returnDate
        );

        return flightService.searchFlight2(queries)
                .thenApply(result -> {
                    BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                            .status(StatusFlag.SUCCESS.getValue())
                            .message("Get flights successfully")
                            .result(result)
                            .build();
                    return ResponseEntity.ok(baseJsonResponse);
                })
                .exceptionally(ex -> ResponseEntity.badRequest().body(
                        BaseJsonResponse.builder()
                                .status(StatusFlag.ERROR.getValue())
                                .message("Get flights error: " + ex.getMessage())
                                .build()
                ));
    }

}
