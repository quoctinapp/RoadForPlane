# Cấu hình Firebase cho FlightPath

Project: `onlinejudge-23604` (config nằm ở `data/scripts/user/firebase-config.js`).

1. **Authentication** → Sign-in method → bật **Email/Password**.
2. **Firestore Database** → Create database (chế độ Production, vùng `asia-southeast1`).
3. **Firestore Database → Rules**: dán toàn bộ nội dung `firestore.rules` trong thư mục này → **Publish**.
4. Chạy web qua máy chủ (Firebase Auth không chạy bằng `file://`):
   ```bash
   python3 -m http.server 8000
   ```
   rồi mở http://localhost:8000
5. Tạo tài khoản admin đầu tiên: bấm **Đăng nhập → Đăng ký** trên web, sau đó vào Firestore Console →
   collection `users` → document của tài khoản đó → sửa trường `role` từ `customer` thành `admin`.
6. Đăng nhập lại bằng tài khoản admin → **Quản trị** → **Khởi tạo dữ liệu mẫu** để đưa 22 sân bay, tuyến bay
   và cấu hình giá lên Firestore.

Khi chưa cấu hình xong (hoặc mất mạng), web vẫn chạy bằng dữ liệu mặc định nhưng không có đăng nhập, đặt vé, quản trị.
