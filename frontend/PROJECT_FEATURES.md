# Tài Liệu Chức Năng Dự Án (Project Feature Documentation)

Tài liệu này mô tả chi tiết các tính năng của dự án VivuPlan (EXE_Project frontend), phân chia theo từng trang và chức năng cụ thể.

## 1. Tổng Quan (Overview)
Dự án là một nền tảng đặt dịch vụ du lịch (Máy bay, Khách sạn, Thuê xe) tích hợp trợ lý ảo AI để lập kế hoạch chuyến đi. Giao diện được xây dựng hiện đại, tối ưu trải nghiệm người dùng (UX) và hỗ trợ responsive trên các thiết bị.

---

## 2. Trang Chủ (Home Page)
**Đường dẫn:** `/`  
**File:** `src/app/(main)/page.tsx`

Trang bắt đầu của ứng dụng, cung cấp lối vào nhanh các dịch vụ chính.

*   **Hero Search (Thanh tìm kiếm chính):**
    *   Cho phép tìm kiếm nhanh Máy bay, Khách sạn, Thuê xe.
    *   Giao diện tab chuyển đổi giữa các dịch vụ.
*   **NavTiles (Điều hướng nhanh):**
    *   Các thẻ (card) lối tắt để truy cập nhanh vào các trang: Vé máy bay, Khách sạn, Thuê xe, và Khám phá.
*   **ChatStrip (Thanh Chat AI - Teaser):**
    *   Một thanh nổi bật mời gọi người dùng sử dụng tính năng Chat AI để lập kế hoạch.
*   **ExploreBanner (Banner Khám phá):**
    *   Banner quảng bá các địa điểm hoặc chương trình khuyến mãi nổi bật.
*   **FAQ (Câu hỏi thường gặp):**
    *   Danh sách các câu hỏi phổ biến hỗ trợ người dùng mới.

---

## 3. Hệ Thống Xác Thực (Authentication)
**Đường dẫn:** `/pages/login`  
**File:** `src/app/pages/login/page.tsx`

Hệ thống đăng nhập hiện đại, không cần mật khẩu (Passwordless) sử dụng OTP.

*   **Đăng nhập bằng Email & OTP:**
    *   Nhập Email -> Hệ thống gửi mã OTP về email.
    *   Nhập OTP 6 số để xác thực.
    *   Có tính năng đếm ngược thời gian gửi lại mã (Resend OTP countdown) để chống spam.
*   **Social Login (Demo):**
    *   Các nút đăng nhập Google, Apple, Facebook (hiện tại là giao diện demo).
*   **Lưu trạng thái người dùng:**
    *   Sau khi đăng nhập thành công, thông tin người dùng được lưu vào `localStorage` để hiển thị trên Header (Tên, Email).
*   **Giao diện:** Split layout (Chia đôi), một bên là hình ảnh thương hiệu, một bên là form đăng nhập.

---

## 4. Trợ Lý AI Chatbox (AI Trip Planner)
**Đường dẫn:** `/chatbox`  
**File:** `src/app/(chat)/chatbox/page.tsx`

Tính năng cốt lõi giúp người dùng lập kế hoạch du lịch tự động bằng AI.

*   **AI Conversation (Hội thoại AI):**
    *   Chat trực tiếp với AI để yêu cầu lập lịch trình.
    *   Hỗ trợ Streaming Response (Phản hồi thời gian thực từng chữ).
*   **Form Cấu Hình Chuyến Đi:**
    *   Form nhập liệu chi tiết: Điểm đi, Điểm đến, Ngày đi, Số lượng khách, Ngân sách, Phương tiện, Phong cách du lịch, Yêu cầu thêm.
    *   Nút "THIẾT KẾ" để gửi yêu cầu cấu hình sẵn cho AI.
*   **Itinerary Display (Hiển thị Lịch trình):**
    *   Hiển thị lịch trình chi tiết theo từng ngày (Sáng, Chiều, Tối).
    *   Hiển thị danh sách các điểm đến, nhà hàng, khách sạn được đề xuất.
*   **Interactive Map (Bản đồ tương tác):**
    *   Tự động hiển thị các địa điểm trong lịch trình lên bản đồ.
    *   Hỗ trợ Geocoding (tìm tọa độ) cho các địa điểm nếu thiếu dữ liệu.
*   **Lịch sử Chat:**
    *   Lưu và xem lại các chuyến đi (Sessions) đã tạo trước đó.
    *   Tạo chuyến đi mới.

---

## 5. Trang Đặt Khách Sạn (Hotels)
**Đường dẫn:** `/pages/hotels`  
**File:** `src/app/pages/hotels/page.tsx`

Landing page cho dịch vụ đặt phòng khách sạn.

*   **Hotel Banner:** Banner chính phục vụ tìm kiếm khách sạn.
*   **Brand Row:** Hiển thị logo các đối tác/chuỗi khách sạn lớn.
*   **Domestic Section:** Các khách sạn/điểm đến trong nước nổi bật.
*   **City Break Section:** Gợi ý các điểm đến nghỉ dưỡng ngắn ngày tại thành phố.
*   **Benefits Strip:** Các lợi ích khi đặt phòng qua VivuPlan.
*   **FAQ:** Câu hỏi thường gặp về đặt phòng.

---

## 6. Trang Vé Máy Bay (Flights)
**Đường dẫn:** `/pages/flights`  
**File:** `src/app/pages/flights/page.tsx`

Landing page cho dịch vụ đặt vé máy bay.

*   **Banner Section:** Banner tích hợp form tìm kiếm chuyến bay.
*   **Cheap Flights:** Danh sách các chuyến bay giá rẻ hoặc ưu đãi hiện có.

---

## 7. Trang Thuê Xe (Cars)
**Đường dẫn:** `/pages/cars`  
**File:** `src/app/pages/cars/page.tsx`

Landing page cho dịch vụ thuê xe.

*   **Car Banner:** Banner tìm kiếm xe thuê.
*   **Benefits Row:** Lợi ích của dịch vụ (Xe mới, giá tốt, bảo hiểm...).
*   **Popular Destinations:** Các điểm đến thuê xe phổ biến.
*   **Best Deals Hanoi:** Deal thuê xe tốt nhất tại Hà Nội (Ví dụ cụ thể).
*   **How To Find Deals:** Hướng dẫn săn deal thuê xe.
*   **Ready To Plan:** Call-to-action khuyến khích người dùng đặt xe.

---

## 8. Hồ Sơ Người Dùng (User Profile)
**Đường dẫn:** `/pages/profile`  
**File:** `src/app/pages/profile/page.tsx`

Trang quản lý thông tin cá nhân của người dùng.

*   **Dashboard Sidebar:** Menu điều hướng nhanh (Thông báo, Account, Lịch sử).
*   **Account Settings (Tài khoản):**
    *   Xem thông tin (Tên, Email).
    *   Đăng ký nhận tin tức (Newsletter subscription).
    *   Thêm sân bay ưu thích (Preferred Airports) để nhận gợi ý phù hợp.
*   **Alerts (Thông báo giá):**
    *   Quản lý các thông báo giá vé/phòng đã đăng ký (Mock UI).
*   **History (Lịch sử):**
    *   Xem lại lịch sử đặt chỗ hoặc tìm kiếm (Mock UI).

---

## 9. Trang Quản Trị (Admin Dashboard)
**Đường dẫn:** `/admin` (thuộc group `(admin)`)
**File:** `src/app/(admin)/admin/...`

Khu vực dành cho quản trị viên (dựa trên cấu trúc thư mục).

*   **Accounts:** Quản lý danh sách người dùng.
*   **API Usage:** Theo dõi thống kê sử dụng API (có thể của AI hoặc các dịch vụ bên thứ 3).
*   **System Logs:** Xem nhật ký hệ thống để debug hoặc theo dõi hoạt động.

---
*Tài liệu được tạo tự động dựa trên cấu trúc source code hiện tại.*
