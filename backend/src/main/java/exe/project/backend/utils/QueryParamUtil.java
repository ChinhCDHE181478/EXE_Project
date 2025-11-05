package exe.project.backend.utils;

import lombok.NoArgsConstructor;

import java.util.Map;

@NoArgsConstructor
public class QueryParamUtil {

    public static void addIfNotNull(Map<String, String> queries, String... keyValues) {
        if (keyValues.length % 2 != 0) {
            throw new IllegalArgumentException("Arguments must be in key-value pairs");
        }
        for (int i = 0; i < keyValues.length; i += 2) {
            String key = keyValues[i];
            String value = keyValues[i + 1];
            if (value != null && !value.isBlank()) {
                queries.put(key, value);
            }
        }
    }
}
