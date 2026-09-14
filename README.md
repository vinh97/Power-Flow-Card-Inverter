# 🔋 Inverter Hybrid Card cho Home Assistant

Thẻ Lovelace tùy chỉnh hiển thị sơ đồ luồng năng lượng và thống kê cho hệ thống Biến tần Hybrid (Solar / Battery / Grid / Load / EPS) trong Home Assistant.

---
<img width="1282" height="1344" alt="5" src="https://github.com/user-attachments/assets/fafae187-92cb-46d8-b712-e1a93d687720" />

<img width="1267" height="1354" alt="2" src="https://github.com/user-attachments/assets/708aab5f-35bf-4e18-8bed-648122b36c0d" />

<img width="938" height="1467" alt="1" src="https://github.com/user-attachments/assets/7931c3af-f732-4660-afca-df7ab54e0670" />

<img width="1273" height="1556" alt="1" src="https://github.com/user-attachments/assets/c7ac41b8-624c-4c15-bb8f-a4652fb8dd1f" />

<img width="1272" height="1594" alt="5" src="https://github.com/user-attachments/assets/1e995c9a-59a7-4a6b-89a4-f8cc2d394dc1" />
<img width="1263" height="1602" alt="4" src="https://github.com/user-attachments/assets/caec91b1-6010-4816-afa4-29ef24c8e659" />
<img width="927" height="1321" alt="2" src="https://github.com/user-attachments/assets/8262ac7c-d8f3-4be2-a2e7-4d7c7b3d59cf" />
<img width="1272" height="1600" alt="1" src="https://github.com/user-attachments/assets/f4e63a99-144a-44ba-805e-02137092b95b" />



## ⚙️ Cài đặt qua HACS (Custom Repository)

1. Mở **HACS** trong Home Assistant.
2. Nhấn vào biểu tượng 3 chấm ở góc trên bên phải `⋮` ➔ chọn **Custom repositories** (Kho lưu trữ tùy chỉnh).
3. Nhập đường dẫn GitHub repository của bạn:
   - **Repository:** `https://github.com/vinh97/Power-Flow-Card-Inverter`
   - **Type:** `Plugin`
4. Bấm **Add** (Thêm), sau đó tìm kiếm **Power Flow Card** và bấm **Download**.
5. Tải lại trang giao diện Home Assistant.

---

## ⚙️ Cài đặt Thủ công (Manual)

     1. Copy thư mục `power-flow-card` về và đặt vào thư mục `/config/www/community/` trong Home Assistant.
     2. Thêm vào `resources` thông qua UI
     Thêm qua UI

     Vào Settings → Dashboards → Resources → Add Resource

     Nhập:

     URL: /local/community/power-flow-card-inverter/power-flow-card-inverter.js?ver=1.0.0.0.0

     Resource type: JavaScript Module


     ## 🛠️ Cấu hình mẫu
     Bước 3: Tạo thẻ trên Dashboard bằng YAML
     Vào Dashboard bất kỳ, chọn Chỉnh sửa giao diện, thêm thẻ mới dạng Thủ công (Manual) và nhập cấu hình mẫu sau:

## 🛠️ Cấu hình mẫu trên Dashboard (YAML)

Vào Dashboard bất kỳ ➔ Chọn **Chỉnh sửa giao diện** (Edit Dashboard) ➔ Thêm thẻ mới dạng **Thủ công** (Manual) ➔ Dán đoạn mã cấu hình YAML sau:

```yaml
type: custom:power-flow-card-inverter

# ==========================================
# CẤU HÌNH HỆ THỐNG CHUNG
# ==========================================
language: vi                        # Ngôn ngữ hiển thị (vi: Tiếng Việt, en: Tiếng Anh)
dark_mode: false                    # Chế độ tối (true: Bật, false: Tắt)
three_phase: false                  # Hệ thống điện 3 pha (true: Bật 3 pha, false: 1 pha)
single_load_mode: false             # Gom chung tải tiêu thụ nhà và tải dự phòng
invert_grid_power: false            # Đảo chiều giá trị công suất lưới (âm <-> dương)
invert_battery_power: false         # Đảo chiều giá trị công suất Pin 1
always_show_battery2: false         # Luôn hiển thị Pin lưu trữ thứ 2
invert_battery2_power: false        # Đảo chiều giá trị công suất Pin 2
always_show_aux: false              # Luôn hiển thị tải phụ / cổng AUX
invert_aux_power: false             # Đảo chiều giá trị công suất cổng AUX
smart_load_aux: false               # AUX là Smart Load (Tải) thay vì nguồn phát (AC PV)

# ==========================================
# CẤU HÌNH TÙY CHỈNH ẢNH / ICON & TỌA ĐỘ KÍCH THƯỚC
# ==========================================

# --- Biến tần (Inverter) ---
inverter_image: false               # Bật true nếu muốn dùng ảnh riêng (hoặc điền đường dẫn ảnh)
inverter_icon: "mdi:solar-inverter" # Icon MDI mặc định khi không dùng ảnh
inverter_x: 136                     # Tọa độ X toàn khối Inverter
inverter_y: 68                      # Tọa độ Y toàn khối Inverter
inverter_width: 75                  # Chiều rộng hình ảnh (W)
inverter_height: 75                 # Chiều cao hình ảnh (H)
inverter_custom_x: 0                # Tọa độ X tùy chỉnh cho icon
inverter_custom_y: 0                # Tọa độ Y tùy chỉnh cho icon

# --- Điện mặt trời (PV) ---
pv_image: false                     # Sử dụng ảnh PV tùy chỉnh
pv_icon: ""                         # Đường dẫn Icon/Ảnh PV riêng
pv_x: 138                           # Tọa độ X khối PV
pv_y: -56                           # Tọa độ Y khối PV
pv_width: 50                        # Chiều rộng khối PV
pv_height: 50                       # Chiều cao khối PV
pv_custom_x: 0
pv_custom_y: 0

# --- Tải phụ / Smart Load (AUX) ---
aux_image: false                    # Sử dụng ảnh AUX riêng
aux_icon: ""                        # Đường dẫn Icon/Ảnh AUX riêng
aux_x: 274                          # Tọa độ X khối AUX
aux_y: -58                          # Tọa độ Y khối AUX
aux_width: 44                       # Chiều rộng khối AUX
aux_height: 46                      # Chiều cao khối AUX
aux_custom_x: 0
aux_custom_y: 0

# --- Tải tiêu thụ nhà (Load) ---
load_image: false                   # Sử dụng ảnh Tải nhà riêng
load_icon: ""                       # Đường dẫn Icon/Ảnh Tải riêng
load_x: 0                           # Tọa độ X khối Tải
load_y: 0                           # Tọa độ Y khối Tải
load_width: 100                     # Chiều rộng Tải
load_height: 92                     # Chiều cao Tải
load_custom_x: 0
load_custom_y: 0

# --- Tải dự phòng (EPS / Backup Load) ---
eps_image: false                    # Sử dụng ảnh EPS riêng
eps_icon: ""                        # Đường dẫn Icon/Ảnh EPS riêng
eps_x: 0                            # Tọa độ X khối EPS
eps_y: 0                            # Tọa độ Y khối EPS
eps_width: 50                       # Chiều rộng EPS
eps_height: 50                      # Chiều cao EPS
eps_custom_x: 0
eps_custom_y: 0

# ==========================================
# KHAI BÁO CÁC THỰC THỂ (ENTITIES)
# ==========================================
entities:
  # --- Thông tin Biến tần (Inverter) ---
  inverter_power: sensor.inverter_power
  inverter_current: sensor.inverter_current
  inverter_voltage: sensor.inverter_voltage
  inverter_temp: sensor.inverter_temperature

  # --- Tổng Pin lưu trữ (Battery 1 + 2) ---
  battery1_battery2_power: sensor.battery_power_all
  battery1_battery2_current: sensor.battery_current_all

  # --- Điện mặt trời (Solar PV 1-4 & Tổng) ---
  pv_power: sensor.pv_total_power
  pv1_power: sensor.pv1_power
  pv1_voltage: sensor.pv1_voltage
  pv1_current: sensor.pv1_current
  pv2_power: sensor.pv2_power
  pv2_voltage: sensor.pv2_voltage
  pv2_current: sensor.pv2_current
  pv3_power: sensor.pv3_power
  pv3_voltage: sensor.pv3_voltage
  pv3_current: sensor.pv3_current
  pv4_power: sensor.pv4_power
  pv4_voltage: sensor.pv4_voltage
  pv4_current: sensor.pv4_current

  # --- Điện lưới 1 Pha (Grid 1-Phase) ---
  grid_power: sensor.lux_grid_flow_live
  grid_voltage: sensor.grid_voltage
  grid_frequency: sensor.grid_frequency
  grid_current: sensor.grid_current

  # --- Điện lưới 3 Pha (Grid 3-Phase) ---
  grid_power_l1: sensor.grid_power_l1
  grid_power_l2: sensor.grid_power_l2
  grid_power_l3: sensor.grid_power_l3
  grid_voltage_l1: sensor.grid_voltage_l1
  grid_voltage_l2: sensor.grid_voltage_l2
  grid_voltage_l3: sensor.grid_voltage_l3
  grid_frequency_l1: sensor.grid_frequency_l1
  grid_frequency_l2: sensor.grid_frequency_l2
  grid_frequency_l3: sensor.grid_frequency_l3
  grid_current_l1: sensor.grid_current_l1
  grid_current_l2: sensor.grid_current_l2
  grid_current_l3: sensor.grid_current_l3

  # --- Tải tiêu thụ nhà (Load 1 Pha & 3 Pha) ---
  load_power: sensor.load_power
  load_voltage: sensor.load_voltage
  load_frequency: sensor.load_frequency
  load_current: sensor.load_current
  load_power_l1: sensor.load_power_l1
  load_power_l2: sensor.load_power_l2
  load_power_l3: sensor.load_power_l3
  load_voltage_l1: sensor.load_voltage_l1
  load_voltage_l2: sensor.load_voltage_l2
  load_voltage_l3: sensor.load_voltage_l3
  load_current_l1: sensor.load_current_l1
  load_current_l2: sensor.load_current_l2
  load_current_l3: sensor.load_current_l3

  # --- Tải dự phòng (EPS / Backup Load 1 Pha & 3 Pha) ---
  eps_power: sensor.eps_power
  eps_voltage: sensor.eps_voltage
  eps_frequency: sensor.eps_frequency
  eps_current: sensor.eps_current
  eps_power_l1: sensor.eps_power_l1
  eps_power_l2: sensor.eps_power_l2
  eps_power_l3: sensor.eps_power_l3
  eps_voltage_l1: sensor.eps_voltage_l1
  eps_voltage_l2: sensor.eps_voltage_l2
  eps_voltage_l3: sensor.eps_voltage_l3
  eps_frequency_l1: sensor.eps_frequency_l1
  eps_frequency_l2: sensor.eps_frequency_l2
  eps_frequency_l3: sensor.eps_frequency_l3
  eps_current_l1: sensor.eps_current_l1
  eps_current_l2: sensor.eps_current_l2
  eps_current_l3: sensor.eps_current_l3

  # --- Tải phụ / Smart Load (AUX 1 Pha & 3 Pha) ---
  aux_power: sensor.aux_power
  aux_voltage: sensor.aux_voltage
  aux_frequency: sensor.aux_frequency
  aux_current: sensor.aux_current
  aux_power_l1: sensor.aux_power_l1
  aux_power_l2: sensor.aux_power_l2
  aux_power_l3: sensor.aux_power_l3
  aux_voltage_l1: sensor.aux_voltage_l1
  aux_voltage_l2: sensor.aux_voltage_l2
  aux_voltage_l3: sensor.aux_voltage_l3
  aux_frequency_l1: sensor.aux_frequency_l1
  aux_frequency_l2: sensor.aux_frequency_l2
  aux_frequency_l3: sensor.aux_frequency_l3
  aux_current_l1: sensor.aux_current_l1
  aux_current_l2: sensor.aux_current_l2
  aux_current_l3: sensor.aux_current_l3

  # --- Pin lưu trữ 1 (Battery 1) ---
  battery_power: sensor.lux_battery_flow_live
  battery_voltage: sensor.battery_voltage
  battery_soc: sensor.battery_soc
  battery_current: sensor.battery_current
  battery_temp: sensor.battery_temperature

  # --- Pin lưu trữ 2 (Battery 2) ---
  battery2_power: sensor.battery2_power
  battery2_voltage: sensor.battery2_voltage
  battery2_soc: sensor.battery2_soc
  battery2_current: sensor.battery2_current
  battery2_temp: sensor.battery2_temperature

  # --- Bảng Thống Kê Sản Lượng & Tiêu Thụ ---
  pv_daily: sensor.pv_energy_today
  pv_total: sensor.pv_energy_total
  grid_buy_daily: sensor.grid_import_today
  grid_buy_total: sensor.grid_import_total
  grid_sell_daily: sensor.grid_export_today
  grid_sell_total: sensor.grid_export_total
  load_daily: sensor.load_energy_today
  load_total: sensor.load_energy_total
  battery_charge_daily: sensor.battery_charge_today
  battery_charge_total: sensor.battery_charge_total
  battery_discharge_daily: sensor.battery_discharge_today
  battery_discharge_total: sensor.battery_discharge_total
