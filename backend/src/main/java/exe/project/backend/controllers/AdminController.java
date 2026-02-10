package exe.project.backend.controllers;

import exe.project.backend.dtos.base.BaseJsonResponse;
import exe.project.backend.dtos.requests.PaymentFilterRequest;
import exe.project.backend.dtos.requests.PaymentUpdateRequest;
import exe.project.backend.dtos.requests.SubscriptionExtensionRequest;
import exe.project.backend.dtos.requests.UserFilterRequest;
import exe.project.backend.enums.PaymentStatus;
import exe.project.backend.enums.Role;
import exe.project.backend.enums.StatusFlag;
import exe.project.backend.services.IAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "APIs quản lý admin: thống kê, quản lý user, payment")
public class AdminController {

        private final IAdminService adminService;

        @GetMapping("/dashboard")
        @Operation(summary = "Dashboard Overview", description = "Lấy thống kê tổng quan cho dashboard admin: tổng user, tổng doanh thu, user mới hôm nay")
        @ApiResponse(responseCode = "200", description = "Thành công", content = @Content(schema = @Schema(implementation = BaseJsonResponse.class)))
        public ResponseEntity<BaseJsonResponse> getDashboardStats() {
                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Get dashboard stats successfully")
                                .result(adminService.getDashboardStats())
                                .build());
        }

        @GetMapping("/stats/users")
        @Operation(summary = "Thống kê đăng ký user theo thời gian", description = "Lấy biểu đồ số lượng user đăng ký mới theo ngày hoặc tháng. "
                        +
                        "Dùng để vẽ LINE CHART theo thời gian.\n\n" +
                        "**Cách dùng:**\n" +
                        "- Mặc định: 7 ngày gần nhất theo DAY\n" +
                        "- Theo tháng: type=MONTH&startDate=2024-01-01&endDate=2024-12-31\n" +
                        "- Custom range: type=DAY&startDate=2024-01-01&endDate=2024-01-07")
        @ApiResponse(responseCode = "200", description = "Trả về labels (thời gian) và data (số user)")
        public ResponseEntity<BaseJsonResponse> getUserRegistrationStats(
                        @Parameter(description = "Loại thống kê: DAY hoặc MONTH", example = "DAY") @RequestParam(required = false, defaultValue = "DAY") String type,
                        @Parameter(description = "Ngày bắt đầu (format: yyyy-MM-dd)", example = "2024-01-01") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @Parameter(description = "Ngày kết thúc (format: yyyy-MM-dd)", example = "2024-01-07") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Get user stats successfully")
                                .result(adminService.getUserRegistrationStats(type, startDate, endDate))
                                .build());
        }

        @GetMapping("/stats/revenue")
        @Operation(summary = "Thống kê doanh thu theo thời gian", description = "Lấy biểu đồ doanh thu theo ngày hoặc tháng. "
                        +
                        "Dùng để vẽ LINE CHART theo thời gian.\n\n" +
                        "**Cách dùng:**\n" +
                        "- Mặc định: 7 ngày gần nhất theo DAY\n" +
                        "- Theo tháng: type=MONTH&startDate=2024-01-01&endDate=2024-12-31\n" +
                        "- Custom range: type=DAY&startDate=2024-01-01&endDate=2024-01-07")
        @ApiResponse(responseCode = "200", description = "Trả về labels (thời gian) và data (doanh thu)")
        public ResponseEntity<BaseJsonResponse> getRevenueStats(
                        @Parameter(description = "Loại thống kê: DAY hoặc MONTH", example = "DAY") @RequestParam(required = false, defaultValue = "DAY") String type,
                        @Parameter(description = "Ngày bắt đầu (format: yyyy-MM-dd)", example = "2024-01-01") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @Parameter(description = "Ngày kết thúc (format: yyyy-MM-dd)", example = "2024-01-31") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Get revenue stats successfully")
                                .result(adminService.getRevenueStats(type, startDate, endDate))
                                .build());
        }

        @GetMapping("/stats/revenue-by-package")
        @Operation(summary = "Thống kê doanh thu theo gói subscription", description = "Lấy doanh thu tổng theo từng gói subscription trong khoảng thời gian. "
                        +
                        "Dùng để vẽ PIE CHART hoặc BAR CHART so sánh các gói.\n\n" +
                        "**Khác với /stats/revenue:** API này nhóm theo GÓI, không theo thời gian.\n\n" +
                        "**Ví dụ kết quả:**\n" +
                        "```json\n" +
                        "{\n" +
                        "  \"labels\": [\"Premium Package\", \"Basic Package\"],\n" +
                        "  \"data\": [5000000, 2000000]\n" +
                        "}\n" +
                        "```")
        @ApiResponse(responseCode = "200", description = "Trả về labels (tên gói) và data (doanh thu)")
        public ResponseEntity<BaseJsonResponse> getRevenueByPackage(
                        @Parameter(description = "Ngày bắt đầu (format: yyyy-MM-dd). Mặc định: 7 ngày trước", example = "2024-01-01") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @Parameter(description = "Ngày kết thúc (format: yyyy-MM-dd). Mặc định: hôm nay", example = "2024-01-31") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Get revenue by package successfully")
                                .result(adminService.getRevenueByPackage(startDate, endDate))
                                .build());
        }

        @GetMapping("/users")
        @Operation(summary = "Danh sách user có phân trang và filter", description = "Lấy danh sách user với các điều kiện lọc:\n"
                        +
                        "- email: Tìm kiếm theo email (LIKE search)\n" +
                        "- role: Lọc theo vai trò (USER/ADMIN)\n" +
                        "- isSubscribed: Lọc user có subscription hay không\n" +
                        "- isBlocked: Lọc user bị block hay không\n\n" +
                        "**Pagination:** Dùng params: page, size, sort\n" +
                        "Mặc định sort theo createAt DESC")
        @ApiResponse(responseCode = "200", description = "Trả về Page<User>")
        public ResponseEntity<BaseJsonResponse> getUsers(
                        @Parameter(description = "Email để search (tìm kiếm tương đối)", example = "user@example.com") @RequestParam(required = false) String email,
                        @Parameter(description = "Vai trò: USER hoặc ADMIN", example = "USER") @RequestParam(required = false) Role role,
                        @Parameter(description = "Có subscription active không", example = "true") @RequestParam(required = false) Boolean isSubscribed,
                        @Parameter(description = "Đã bị block chưa (deleteFlag)", example = "false") @RequestParam(required = false) Boolean isBlocked,
                        @Parameter(hidden = true) @PageableDefault(sort = "createAt", direction = Sort.Direction.DESC) Pageable pageable) {

                UserFilterRequest request = new UserFilterRequest();
                request.setEmail(email);
                request.setRole(role);
                request.setIsSubscribed(isSubscribed);
                request.setIsBlocked(isBlocked);

                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Get users successfully")
                                .result(adminService.getUsers(request, pageable))
                                .build());
        }

        @PostMapping("/users/subscription/extend")
        @Operation(summary = "Gia hạn subscription cho user", description = "Admin gia hạn subscription cho user theo số ngày hoặc tháng.\n\n"
                        +
                        "**Body example:**\n" +
                        "```json\n" +
                        "{\n" +
                        "  \"userId\": 1,\n" +
                        "  \"type\": \"DAY\" hoặc \"MONTH\",\n" +
                        "  \"amount\": 30\n" +
                        "}\n" +
                        "```\n\n" +
                        "Nếu subscription đã hết hạn, sẽ extend từ thời điểm hiện tại.")
        @ApiResponse(responseCode = "200", description = "Gia hạn thành công")
        public ResponseEntity<BaseJsonResponse> extendSubscription(
                        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Thông tin gia hạn subscription", required = true, content = @Content(schema = @Schema(implementation = SubscriptionExtensionRequest.class))) @Valid @RequestBody SubscriptionExtensionRequest request) {
                adminService.extendSubscription(request);
                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Subscription extended successfully")
                                .result("Subscription extended successfully")
                                .build());
        }

        @GetMapping("/payments")
        @Operation(summary = "Danh sách payment có phân trang và filter", description = "Lấy danh sách payment với các điều kiện lọc:\n"
                        +
                        "- status: SUCCESS, PENDING, FAILED, CANCELLED\n" +
                        "- userId: Lọc theo user\n" +
                        "- startDate/endDate: Lọc theo khoảng thời gian\n\n" +
                        "**Pagination:** Dùng params: page, size, sort\n" +
                        "Mặc định sort theo createAt DESC")
        @ApiResponse(responseCode = "200", description = "Trả về Page<Payment>")
        public ResponseEntity<BaseJsonResponse> getPayments(
                        @Parameter(description = "Trạng thái payment", example = "SUCCESS") @RequestParam(required = false) PaymentStatus status,
                        @Parameter(description = "ID của user", example = "1") @RequestParam(required = false) Long userId,
                        @Parameter(description = "Ngày bắt đầu (format: yyyy-MM-dd)", example = "2024-01-01") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @Parameter(description = "Ngày kết thúc (format: yyyy-MM-dd)", example = "2024-01-31") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        @Parameter(hidden = true) @PageableDefault(sort = "createAt", direction = Sort.Direction.DESC) Pageable pageable) {

                PaymentFilterRequest request = new PaymentFilterRequest();
                request.setStatus(status);
                request.setUserId(userId);
                request.setStartDate(startDate);
                request.setEndDate(endDate);

                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Get payments successfully")
                                .result(adminService.getPayments(request, pageable))
                                .build());
        }

        @PutMapping("/payments/{id}")
        @Operation(summary = "Cập nhật payment (admin manual update)", description = "Admin có thể cập nhật status hoặc amount của payment.\n\n"
                        +
                        "**Use case:** Fix lỗi payment, refund, adjust amount\n\n" +
                        "**Body example:**\n" +
                        "```json\n" +
                        "{\n" +
                        "  \"status\": \"SUCCESS\",\n" +
                        "  \"amount\": 100000\n" +
                        "}\n" +
                        "```\n\n" +
                        "Cả 2 fields đều optional, chỉ update field nào có giá trị.")
        @ApiResponse(responseCode = "200", description = "Cập nhật thành công, trả về Payment đã update")
        public ResponseEntity<BaseJsonResponse> updatePayment(
                        @Parameter(description = "ID của payment cần update", example = "1", required = true) @PathVariable Long id,
                        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Thông tin cập nhật (status và/hoặc amount)", required = true, content = @Content(schema = @Schema(implementation = PaymentUpdateRequest.class))) @Valid @RequestBody PaymentUpdateRequest request) {
                return ResponseEntity.ok(BaseJsonResponse.builder()
                                .status(StatusFlag.SUCCESS.getValue())
                                .message("Payment updated successfully")
                                .result(adminService.updatePayment(id, request))
                                .build());
        }
}
