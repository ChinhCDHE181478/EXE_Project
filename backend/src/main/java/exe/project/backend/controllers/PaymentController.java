package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.dtos.responses.PaymentHistoryResponse;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IPaymentService;
import exe.project.backend.services.IPayOSService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý payment và webhook
 */
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment", description = "Payment and Webhook APIs")
public class PaymentController {

    private final IPaymentService paymentService;
    private final IPayOSService payOSService;

    @PostMapping("/payos/callback")
    @Operation(summary = "PayOS Webhook Callback", description = "Endpoint nhận webhook từ PayOS khi thanh toán thành công/thất bại")
    public ResponseEntity<BaseJsonResponse> handleCallback(
            @RequestBody Object webhookBody) {
        try {
            log.info("Received PayOS webhook callback");

            paymentService.handlePayOSCallback(webhookBody);

            return ResponseEntity.ok(BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("Webhook processed successfully")
                    .build());

        } catch (Exception e) {
            log.error("Error processing webhook", e);
            // Vẫn return 200 OK để PayOS không retry
            return ResponseEntity.ok(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/register-webhook")
    @Operation(summary = "Đăng ký Webhook URL với PayOS", description = "Helper API để đăng ký webhook URL khi thay đổi ngrok")
    public ResponseEntity<BaseJsonResponse> registerWebhook() {
        try {
            log.info("Registering webhook URL with PayOS");

            payOSService.registerWebhookUrl();

            return ResponseEntity.ok(BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("Webhook URL registered successfully")
                    .build());

        } catch (Exception e) {
            log.error("Error registering webhook", e);
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message(e.getMessage())
                    .build());
        }
    }

    @GetMapping("/history")
    @Operation(summary = "Lịch sử thanh toán", description = "Lấy danh sách lịch sử thanh toán của user với phân trang")
    public ResponseEntity<BaseJsonResponse> getHistory(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            log.info("Getting payment history for userId: {}, page: {}, size: {}", userId, page, size);

            Pageable pageable = PageRequest.of(page, size);
            Page<PaymentHistoryResponse> response = paymentService.getPaymentHistory(userId, pageable);

            return ResponseEntity.ok(BaseJsonResponse.builder()
                    .status(StatusFlag.SUCCESS.getValue())
                    .message("success")
                    .result(response)
                    .build());

        } catch (Exception e) {
            log.error("Error getting payment history", e);
            return ResponseEntity.badRequest().body(BaseJsonResponse.builder()
                    .status(StatusFlag.ERROR.getValue())
                    .message(e.getMessage())
                    .build());
        }
    }
}
