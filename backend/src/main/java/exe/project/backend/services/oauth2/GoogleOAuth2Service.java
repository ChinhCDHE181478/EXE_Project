package exe.project.backend.services.oauth2;

import exe.project.backend.config.client.Oauth2GoogleClient;
import exe.project.backend.dtos.responses.ExchangeTokenResponse;
import exe.project.backend.dtos.responses.GoogleUserResponse;
import exe.project.backend.dtos.responses.OnboardingUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GoogleOAuth2Service implements OAuth2Service {

    private final Oauth2GoogleClient outboundIdentityClient;

    @Override
    public OnboardingUser getUser(String code) {
        ExchangeTokenResponse tokenResponse = outboundIdentityClient.exchangeToken(code);
        GoogleUserResponse userInfo = outboundIdentityClient.getUserInfo(tokenResponse.getAccessToken());

        return OnboardingUser.builder()
                .userId(userInfo.getSub())
                .email(userInfo.getEmail())
                .name(userInfo.getName())
                .avatarUrl(userInfo.getPicture())
                .build();
    }
}
