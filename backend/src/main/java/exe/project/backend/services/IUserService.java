package exe.project.backend.services;

import exe.project.backend.dtos.responses.UserResponse;

public interface IUserService {
    UserResponse getMe();
}
