package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.dtos.requests.PurchaseRequest;
import exe.project.backend.dtos.responses.PurchaseResponse;
import exe.project.backend.dtos.responses.SubscriptionStatusResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IPaymentService;
import exe.project.backend.services.ISubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý subscription
 */
@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Subscription", description = "Subscription Management APIs")
public class SubscriptionController {

    private final IPaymentService paymentService;
    private final ISubscriptionService subscriptionService;

    @PostMapping("/purchase")
    @Operation(summary = "Mua gói subscription", description = "Tạo payment link để thanh toán qua PayOS")
    public ResponseEntity<BaseJsonResponse> purchase(
            @RequestBody @Valid PurchaseRequest request) {
        try {
            log.info("Purchase request for userId: {}, packageCode: {}",
                    request.getUserId(), request.getPackageCode());

            PurchaseResponse response = paymentService.createPurchase(request);

            return ResponseEntity.ok(BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("Payment link created successfully")
                    .result(response)
                    .build());

        } catch (Exception e) {
            log.error("Error creating purchase", e);
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/status")
    @Operation(summary = "Kiểm tra trạng thái subscription", description = "Lấy thông tin subscription hiện tại của user")
    public ResponseEntity<BaseJsonResponse> getStatus(
            @RequestParam Long userId) {
        try {
            log.info("Getting subscription status for userId: {}", userId);

            SubscriptionStatusResponse response = subscriptionService.getStatus(userId);

            return ResponseEntity.ok(BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("success")
                    .result(response)
                    .build());

        } catch (Exception e) {
            log.error("Error getting subscription status", e);
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message(e.getMessage())
                    .build());
        }
    }
}
