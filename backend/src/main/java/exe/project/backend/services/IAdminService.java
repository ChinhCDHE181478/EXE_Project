package exe.project.backend.services;

import exe.project.backend.dtos.requests.PaymentFilterRequest;
import exe.project.backend.dtos.requests.PaymentUpdateRequest;
import exe.project.backend.dtos.requests.SubscriptionExtensionRequest;
import exe.project.backend.dtos.requests.UserFilterRequest;
import exe.project.backend.dtos.responses.DashboardStatsResponse;
import exe.project.backend.dtos.responses.StatsResponse;
import exe.project.backend.models.Payment;
import exe.project.backend.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface IAdminService {
    DashboardStatsResponse getDashboardStats();

    StatsResponse getUserRegistrationStats(String type, LocalDate startDate, LocalDate endDate);

    StatsResponse getRevenueStats(String type, LocalDate startDate, LocalDate endDate);

    StatsResponse getRevenueByPackage(LocalDate startDate, LocalDate endDate);

    Page<User> getUsers(UserFilterRequest request, Pageable pageable);

    void extendSubscription(SubscriptionExtensionRequest request);

    Page<Payment> getPayments(PaymentFilterRequest request, Pageable pageable);

    Payment updatePayment(Long id, PaymentUpdateRequest request);
}
