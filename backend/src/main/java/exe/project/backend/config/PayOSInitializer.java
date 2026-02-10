package exe.project.backend.config;

import exe.project.backend.services.IPayOSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Auto-register webhook URL with PayOS on application startup
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class PayOSInitializer {

    private final IPayOSService payOSService;

    @Bean
    public CommandLineRunner registerWebhookOnStartup() {
        return args -> {
            try {
                log.info("=== Starting PayOS webhook auto-registration ===");
                payOSService.registerWebhookUrl();
                log.info("=== PayOS webhook registered successfully ===");
            } catch (Exception e) {
                log.error(
                        "Failed to register PayOS webhook URL on startup. You may need to register manually via /payments/register-webhook endpoint",
                        e);
                // Don't rethrow - allow application to start even if webhook registration fails
            }
        };
    }
}
