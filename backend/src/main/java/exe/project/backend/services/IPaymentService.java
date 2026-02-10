package exe.project.backend.services;

import exe.project.backend.dtos.requests.PurchaseRequest;
import exe.project.backend.dtos.responses.PaymentHistoryResponse;
import exe.project.backend.dtos.responses.PurchaseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service quản lý payment
 */
public interface IPaymentService {

    /**
     * Tạo thanh toán mua gói
     */
    PurchaseResponse createPurchase(PurchaseRequest request) throws Exception;

    /**
     * Xử lý webhook callback từ PayOS
     */
    void handlePayOSCallback(Object webhookBody) throws Exception;

    /**
     * Lấy lịch sử thanh toán của user
     */
    Page<PaymentHistoryResponse> getPaymentHistory(Long userId, Pageable pageable);
}
