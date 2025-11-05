package exe.project.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;


@Configuration
public class RapidApiConfig {

    @Value("${rapid-api.url}")
    private String url;

    @Value("${rapid-api.host}")
    private String host;

    @Value("${rapid-api.key}")
    private String key;

    @Bean
    public WebClient rapidApiClient(WebClient.Builder builder) {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(10)); // timeout 10s

        return builder
                .baseUrl(url)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader("X-RapidAPI-Host", host)
                .defaultHeader("X-RapidAPI-Key", key)
                .defaultHeader("Host", host)
                .build();
    }
}
