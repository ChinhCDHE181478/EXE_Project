package exe.project.backend.services.oauth2;

import exe.project.backend.config.client.Oauth2FacebookClient;
import exe.project.backend.dtos.responses.ExchangeTokenResponse;
import exe.project.backend.dtos.responses.FacebookUserResponse;
import exe.project.backend.dtos.responses.OnboardingUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FacebookOAuth2Service implements OAuth2Service {

    private final Oauth2FacebookClient outboundIdentityClient;

    @Override
    public OnboardingUser getUser(String code) {
        ExchangeTokenResponse tokenResponse = outboundIdentityClient.exchangeToken(code);
        FacebookUserResponse userInfo = outboundIdentityClient.getUserInfo(tokenResponse.getAccessToken());

        return OnboardingUser.builder()
                .userId(userInfo.getId())
                .email(userInfo.getEmail())
                .name(userInfo.getName())
                .avatarUrl(userInfo.getPicture())
                .build();
    }
}
