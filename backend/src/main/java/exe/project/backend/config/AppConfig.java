package exe.project.backend.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

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

//    @Bean
//    public ApplicationRunner applicationRunner(IUserRepository userRepository) {
//        return args -> {
//            if (userRepository.findByUsername("admin").isEmpty()) {
//                var admin = new User();
//                admin.setUsername("admin");
//                admin.setPassword(passwordEncoder().encode("admin"));
//                admin.setRole(Role.ADMIN);
//                admin.setIsDoingExam(false);
//                admin.setAccountType(AccountType.FREE_COURSE);
//                admin.setIsLocked(false);
//
//                userRepository.save(admin);
//                log.info("Admin has been created: {}", admin.getUsername());
//            }
//        };
//    }
}
