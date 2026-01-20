package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.dtos.responses.UserResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final IUserService userService;

    @GetMapping("/getme")
    public ResponseEntity<BaseJsonResponse> getMe() {
        try {
            UserResponse response = userService.getMe();
            BaseJsonResponse baseJsonResponse = BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("Login successfully")
                    .result(response)
                    .build();
            return ResponseEntity.ok(baseJsonResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message("Get user info failed")
                    .build());
        }
    }
}
