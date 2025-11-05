package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IFlightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/search")
    public CompletableFuture<ResponseEntity<BaseJsonResponse>> search(
            @RequestParam String query
    ) {
        return null;
    }
}
