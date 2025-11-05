package exe.project.backend.services.impl;

import exe.project.backend.dtos.responses.UserResponse;
import exe.project.backend.enums.ErrorCode;
import exe.project.backend.exceptions.ServiceException;
import exe.project.backend.mappers.UserMapper;
import exe.project.backend.models.User;
import exe.project.backend.repositories.IUserRepository;
import exe.project.backend.services.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    private final IUserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public UserResponse getMe() {
        var context = SecurityContextHolder.getContext();
        String email = context.getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ServiceException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }
}
