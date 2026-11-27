# FlightPath – Mô phỏng thuật toán Dijkstra tìm chuyến bay rẻ nhất

Đồ án môn **Lý thuyết đồ thị**. Ứng dụng web (HTML/CSS/JavaScript thuần) tìm đường bay rẻ nhất
(hoặc nhanh nhất) giữa 22 sân bay dân dụng Việt Nam bằng thuật toán **Dijkstra** và mô phỏng từng bước
thuật toán trên bản đồ 2D.

## Tính năng
- Bản đồ 2D (Leaflet) hiển thị mọi chuyến bay trong ngày, tô màu **xanh – vàng – cam – đỏ** theo giá; cùng giá thì cùng màu.
- 22 sân bay: Nội Bài, Cát Bi, Vân Đồn, Điện Biên, Thọ Xuân, Vinh, Đồng Hới, Phú Bài, Đà Nẵng, Chu Lai, Phù Cát,
  Pleiku, Tuy Hòa, Buôn Ma Thuột, Cam Ranh, Liên Khương, Tân Sơn Nhất, Côn Đảo, Cần Thơ, Rạch Giá, Phú Quốc, Cà Mau.
- Chọn điểm đi – điểm đến – ngày (tháng 12/2026); tiêu chí **Rẻ nhất** hoặc **Nhanh nhất**.
- **Điểm dừng bắt buộc** (tối đa 3) và **khứ hồi**: mỗi đoạn chạy Dijkstra riêng, có ngày bay riêng; tổng tiền cả chuyến.
- **Sự cố**: hủy chặng, trễ 3 giờ, tăng giá 50%, đóng sân bay (từ chi tiết chặng hoặc bấm vào sân bay trên bản đồ).
  App chạy lại Dijkstra từ điểm dừng để **đổi đường bay**, so sánh đường cũ – đường mới.
- Danh sách mọi đường bay (tối đa 3 chặng) đã sắp xếp; đường tối ưu của Dijkstra được đánh dấu.
- Chi tiết từng chặng: hãng, số hiệu, giờ đi/đến, giá.
- Mô phỏng Dijkstra: chọn đỉnh, cập nhật khoảng cách (nới lỏng cạnh), nối đường đi; có bảng `d / đỉnh trước / đã chốt` và nhật ký.
- **Hạng vé**: Phổ thông, Phổ thông đặc biệt, Thương gia, Hạng nhất (mỗi hãng bán hạng khác nhau, giá theo hệ số).
- **Khung giờ cất cánh**: Sáng / Chiều / Tối; giao diện **sáng/tối**.
- **Khách hàng**: người lớn / trẻ em / em bé và hạng thành viên Thường / Bạc / Vàng / Bạch kim (giảm giá theo hạng).
- **Tài khoản (Firebase Auth)**, **đặt vé**, **Vé của tôi**, **đổi chuyến / hoàn vé** khi gặp sự cố.
- **Trang quản trị** (`#admin`): sân bay/tỉnh, tuyến bay, sự cố (tự đánh dấu vé bị ảnh hưởng và đề xuất lộ trình mới),
  khuyến mãi, khách hàng (hạng thành viên, quyền admin), cấu hình giá, quản lý vé (duyệt hoàn tiền).
- Song ngữ Tiếng Việt / English.

## Chạy chương trình
Không cần cài đặt. Để dùng đăng nhập, đặt vé và trang quản trị cần chạy qua máy chủ (Firebase Auth không chạy với `file://`);
cấu hình Firebase xem [data/firebase/README.md](data/firebase/README.md).

1. Chạy máy chủ tĩnh ở thư mục gốc (khuyên dùng):
   ```bash
   python3 -m http.server 8000
   ```
   rồi mở http://localhost:8000 (trang quản trị: http://localhost:8000/#admin)
2. Hoặc mở trực tiếp `index.html`: chỉ có phần tìm đường + mô phỏng, dùng dữ liệu mặc định.

Nền bản đồ (Esri) cần Internet; khi mất mạng, đỉnh và cạnh vẫn hiển thị trên nền tối.

## Kiểm thử
```bash
node tests/dijkstra.test.js
node tests/pricing.test.js
```
So sánh Dijkstra với Bellman–Ford cho mọi cặp sân bay, mọi ngày, cả hai tiêu chí; kiểm tra các loại sự cố và đổi đường bay.

## Cấu trúc
```
index.html                 Trang duy nhất của ứng dụng
data/
  ui/user/style.css        Giao diện người dùng (theme sáng/tối)
  ui/admin/admin.css       Giao diện trang quản trị
  ui/lib/leaflet.css       Thư viện Leaflet (CSS)
  scripts/lib/leaflet.js   Thư viện Leaflet (JS)
  scripts/lib/firebase/    Firebase JS SDK 13.4.0 (bản compat)
  firebase/                Firestore Rules + hướng dẫn cấu hình Firebase
  scripts/admin/
    admin.js               Khung trang quản trị, các tab
    admin-network.js       Sân bay, tuyến bay, sự cố
    admin-business.js      Khuyến mãi, khách hàng, cấu hình giá
    admin-bookings.js      Quản lý vé, đánh dấu vé bị ảnh hưởng khi có sự cố
  scripts/user/
    firebase-config.js     Cấu hình Firebase project
    store.js               Đọc/ghi Firestore (realtime), đăng nhập
    account.js             Đăng nhập / đăng ký
    booking.js             Đặt vé, Vé của tôi, đổi chuyến / hoàn vé
    pricing.js             Hạng vé, khung giờ, khuyến mãi, giá theo hành khách + hạng thành viên
    data.js                22 sân bay, tuyến bay (giá/thời gian theo khoảng cách), lịch bay tháng 12/2026
    graph.js               Dựng đồ thị có hướng, có trọng số (danh sách kề), áp dụng sự cố + chia mức màu theo giá
    dijkstra.js            Thuật toán Dijkstra O(V²), ghi lại từng bước
    paths.js               DFS liệt kê mọi đường đi đơn + sắp xếp
    trip.js                Chia chuyến thành các đoạn (điểm dừng, khứ hồi), đổi đường khi có sự cố
    map.js                 Vẽ bản đồ, đỉnh, cung đường bay, đường tối ưu
    simulation.js          Phát lại các bước Dijkstra
    app.js                 Kết nối giao diện
  language/vi.js, en.js    Từ điển Việt – Anh
  language/i18n.js         Hàm dịch, định dạng tiền/giờ
  images/                  Ảnh dùng cho bản đồ
tests/dijkstra.test.js     Kiểm thử Dijkstra (so với Bellman–Ford), sự cố, đổi đường
tests/pricing.test.js      Kiểm thử giá vé, hạng vé, khung giờ, khuyến mãi, thêm sân bay
```

## Giả định
- Dữ liệu chuyến bay là dữ liệu mô phỏng, sinh cố định (cùng kết quả mỗi lần mở); mạng bay mô phỏng mô hình trục–nan
  (HAN, SGN, DAD là trục chính).
- Trọng số cạnh u→v = chuyến rẻ nhất (hoặc nhanh nhất) từ u tới v trong ngày; không xét thời gian nối chuyến.
