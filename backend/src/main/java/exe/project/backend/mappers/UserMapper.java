package exe.project.backend.mappers;

import exe.project.backend.dtos.requests.RegisterRequest;
import exe.project.backend.dtos.responses.LoginResponse;
import exe.project.backend.dtos.responses.RegisterResponse;
import exe.project.backend.dtos.responses.UserResponse;
import exe.project.backend.models.User;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final ModelMapper modelMapper;

    public RegisterRequest toRegisterRequestDto(User user) {
        return modelMapper.map(user, RegisterRequest.class);
    }

    public LoginResponse toLoginResponseDto(User user) {
        return modelMapper.map(user, LoginResponse.class);
    }

    public RegisterResponse toRegisterResponseDto(User user) {
        return modelMapper.map(user, RegisterResponse.class);
    }

    public User toEntity(RegisterRequest request) {
        return modelMapper.map(request, User.class);
    }

    public UserResponse toUserResponse(User user) {
        return modelMapper.map(user, UserResponse.class);
    }
}
