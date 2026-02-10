package exe.project.backend.enums;

/**
 * Trạng thái thanh toán
 */
public enum PaymentStatus {
    /**
     * Chờ thanh toán
     */
    PENDING,

    /**
     * Thanh toán thành công
     */
    SUCCESS,

    /**
     * Thanh toán thất bại
     */
    FAILED,

    /**
     * Đã hủy
     */
    CANCELLED
}
