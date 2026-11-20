# FlightPath – Mô phỏng thuật toán Dijkstra tìm chuyến bay rẻ nhất

Đồ án môn **Lý thuyết đồ thị**. Ứng dụng web (HTML/CSS/JavaScript thuần) tìm đường bay rẻ nhất
(hoặc nhanh nhất) giữa 9 thành phố Việt Nam bằng thuật toán **Dijkstra** và mô phỏng từng bước
thuật toán trên bản đồ 2D.

## Tính năng
- Bản đồ 2D (Leaflet) hiển thị mọi chuyến bay trong ngày, tô màu **xanh – vàng – cam – đỏ** theo giá; cùng giá thì cùng màu.
- 9 thành phố: Hà Nội, TP.HCM, Hải Phòng, Đà Nẵng, Cần Thơ, Huế, Đồng Nai, Quảng Ninh, Bắc Ninh.
- Chọn điểm đi – điểm đến – ngày (tháng 12/2026); tiêu chí **Rẻ nhất** hoặc **Nhanh nhất**.
- Danh sách mọi đường bay (tối đa 3 chặng) đã sắp xếp; đường tối ưu của Dijkstra được đánh dấu.
- Chi tiết từng chặng: hãng, số hiệu, giờ đi/đến, giá.
- Mô phỏng Dijkstra: chọn đỉnh, cập nhật khoảng cách (nới lỏng cạnh), nối đường đi; có bảng `d / đỉnh trước / đã chốt` và nhật ký.
- Song ngữ Tiếng Việt / English.

## Chạy chương trình
Không cần cài đặt.

1. Mở trực tiếp `index.html` bằng trình duyệt; **hoặc**
2. Chạy máy chủ tĩnh ở thư mục gốc:
   ```bash
   python3 -m http.server 8000
   ```
   rồi mở http://localhost:8000

Nền bản đồ (Esri) cần Internet; khi mất mạng, đỉnh và cạnh vẫn hiển thị trên nền tối.

## Kiểm thử
```bash
node tests/dijkstra.test.js
```
So sánh kết quả Dijkstra với duyệt vét cạn mọi đường đi đơn cho mọi cặp thành phố, mọi ngày, cả hai tiêu chí.

## Cấu trúc
```
index.html                 Trang duy nhất của ứng dụng
data/
  ui/user/style.css        Giao diện
  ui/lib/leaflet.css       Thư viện Leaflet (CSS)
  scripts/lib/leaflet.js   Thư viện Leaflet (JS)
  scripts/user/
    data.js                9 thành phố, tuyến bay, sinh lịch bay tháng 12/2026
    graph.js               Dựng đồ thị có hướng, có trọng số (danh sách kề) + chia mức màu theo giá
    dijkstra.js            Thuật toán Dijkstra O(V²), ghi lại từng bước
    paths.js               DFS liệt kê mọi đường đi đơn + sắp xếp
    map.js                 Vẽ bản đồ, đỉnh, cung đường bay, đường tối ưu
    simulation.js          Phát lại các bước Dijkstra
    app.js                 Kết nối giao diện
  language/i18n.js         Song ngữ Việt – Anh
  images/                  Ảnh dùng cho bản đồ
tests/dijkstra.test.js     Kiểm thử thuật toán
```

## Giả định
- Dữ liệu chuyến bay là dữ liệu mô phỏng, sinh cố định (cùng kết quả mỗi lần mở). Sân bay Long Thành (Đồng Nai)
  và Gia Bình (Bắc Ninh) là dữ liệu giả lập của đồ án.
- Trọng số cạnh u→v = chuyến rẻ nhất (hoặc nhanh nhất) từ u tới v trong ngày; không xét thời gian nối chuyến.
