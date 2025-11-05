package exe.project.backend.services.oauth2;

import exe.project.backend.enums.ErrorCode;
import exe.project.backend.enums.ProviderType;
import exe.project.backend.exceptions.ServiceException;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class OAuth2ServiceFactory {

    private final Map<ProviderType, OAuth2Service> serviceMap;

    public OAuth2ServiceFactory(GoogleOAuth2Service googleOAuth2Service, FacebookOAuth2Service facebookOAuth2Service) {
        this.serviceMap = Map.of(
                ProviderType.GOOGLE, googleOAuth2Service,
                ProviderType.FACEBOOK, facebookOAuth2Service);
    }

    public OAuth2Service getService(ProviderType providerType) {
        OAuth2Service service = serviceMap.get(providerType);
        if (service == null) {
            throw new ServiceException(ErrorCode.UNSUPPORTED_PROVIDER);
        }
        return service;
    }
}