package exe.project.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import exe.project.backend.dtos.local.ApiWrapperResponse;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

public interface IRapidApiService {
    CompletableFuture<ApiWrapperResponse> sendGetRequestWrapper(String endpoint, Map<String, String> params);
    JsonNode sendGetDataNode(String endpoint, Map<String, String> params);
    <T> T sendGetRequest(String endpoint, Map<String, String> params, Class<T> responseType);
}
