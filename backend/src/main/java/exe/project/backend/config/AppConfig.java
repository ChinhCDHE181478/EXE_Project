package exe.project.backend.config;

import exe.project.backend.enums.Role;
import exe.project.backend.models.User;
import exe.project.backend.repositories.IUserRepository;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    @Value("${admin.email}")
    private String adminEmail;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();
        mapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setFieldMatchingEnabled(true)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE)
                .setSkipNullEnabled(true);

        return mapper;
    }

    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public ApplicationRunner applicationRunner(IUserRepository userRepository) {
        return args -> {
            User admin = userRepository.findByEmail(adminEmail).orElse(null);
            if (admin == null) {
                admin = User.builder()
                        .email(adminEmail)
                        .role(Role.ADMIN)
                        .build();

                userRepository.save(admin);
            } else {
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
            }
        };
    }
}
