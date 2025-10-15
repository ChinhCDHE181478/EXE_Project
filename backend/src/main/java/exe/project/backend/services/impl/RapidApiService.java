package exe.project.backend.services.impl;

import com.fasterxml.jackson.databind.JsonNode;
import exe.project.backend.dtos.local.ApiWrapperResponse;
import exe.project.backend.services.IRapidApiService;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class RapidApiService implements IRapidApiService {
    private final WebClient rapidApiClient;

    @Override
    @CircuitBreaker(name = "rapidApiCB", fallbackMethod = "fallbackResponse")
    @Bulkhead(name = "rapidApiThreadPoolBulkhead", type = Bulkhead.Type.THREADPOOL)
    @Retry(name = "rapidApiRetry")
    public CompletableFuture<ApiWrapperResponse> sendGetRequestWrapper(String endpoint, Map<String, String> params) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromPath(endpoint);
        if (params != null) {
            params.forEach(builder::queryParam);
        }
        String uri = builder.toUriString();

        return rapidApiClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(ApiWrapperResponse.class)
                .toFuture(); // async, để Bulkhead quản lý thread pool
    }

    // Fallback khi queue đầy hoặc circuit breaker mở
    private CompletableFuture<ApiWrapperResponse> fallbackResponse(String endpoint, Map<String, String> params, Throwable ex) {
        System.out.println("⚠️ RapidAPI fallback triggered: " + ex.getMessage());
        return CompletableFuture.completedFuture(
                ApiWrapperResponse.builder()
                        .status(false)
                        .message("Hotel API not available")
                        .data(null)
                        .build()
        );
    }

    @Override
    public JsonNode sendGetDataNode(String endpoint, Map<String, String> params) {
        try {
            return sendGetRequestWrapper(endpoint, params).get().getData();
        } catch (Exception e) {
            log.error("Error calling RapidAPI: {}", e.getMessage(), e);
            return null;
        }
    }

    @Override
    public <T> T sendGetRequest(String endpoint, Map<String, String> params, Class<T> responseType) {
        try {
            return rapidApiClient.get()
                    .uri(endpoint)
                    .retrieve()
                    .bodyToMono(responseType)
                    .block();
        } catch (Exception e) {
            log.error("Error calling RapidAPI: {}", e.getMessage(), e);
            return null;
        }
    }

}
