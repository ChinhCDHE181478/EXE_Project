package exe.project.backend.services.oauth2;

import exe.project.backend.dtos.responses.OnboardingUser;

public interface OAuth2Service {
    OnboardingUser getUser(String code);
}
