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
So sánh Dijkstra với Bellman–Ford cho mọi cặp sân bay, mọi ngày, cả hai tiêu chí; kiểm tra các loại sự cố và đổi đường bay.

## Cấu trúc
```
index.html                 Trang duy nhất của ứng dụng
data/
  ui/user/style.css        Giao diện
  ui/lib/leaflet.css       Thư viện Leaflet (CSS)
  scripts/lib/leaflet.js   Thư viện Leaflet (JS)
  scripts/user/
    data.js                22 sân bay, tuyến bay (giá/thời gian theo khoảng cách), lịch bay tháng 12/2026
    graph.js               Dựng đồ thị có hướng, có trọng số (danh sách kề), áp dụng sự cố + chia mức màu theo giá
    dijkstra.js            Thuật toán Dijkstra O(V²), ghi lại từng bước
    paths.js               DFS liệt kê mọi đường đi đơn + sắp xếp
    trip.js                Chia chuyến thành các đoạn (điểm dừng, khứ hồi), đổi đường khi có sự cố
    map.js                 Vẽ bản đồ, đỉnh, cung đường bay, đường tối ưu
    simulation.js          Phát lại các bước Dijkstra
    app.js                 Kết nối giao diện
  language/i18n.js         Song ngữ Việt – Anh
  images/                  Ảnh dùng cho bản đồ
tests/dijkstra.test.js     Kiểm thử thuật toán
```

## Giả định
- Dữ liệu chuyến bay là dữ liệu mô phỏng, sinh cố định (cùng kết quả mỗi lần mở); mạng bay mô phỏng mô hình trục–nan
  (HAN, SGN, DAD là trục chính).
- Trọng số cạnh u→v = chuyến rẻ nhất (hoặc nhanh nhất) từ u tới v trong ngày; không xét thời gian nối chuyến.
