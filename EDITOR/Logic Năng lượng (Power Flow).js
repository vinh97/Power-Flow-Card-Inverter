// ==========================================
// LOGIC TÍNH TOÁN VÀ BẬT/TẮT CÁC LUỒNG NĂNG LƯỢNG
// ==========================================

// Ngưỡng công suất tối thiểu (Watt) để kích hoạt chạy hiệu ứng luồng
const MIN_POWER = 5;

// --- 1. XÁC ĐỊNH TRẠNG THÁI SẠC/XẢ CỦA PIN LƯU TRỮ ---
const isBat1Charging = batP > MIN_POWER;               // Pin 1 đang nạp
const isBat1Discharging = batP < -MIN_POWER;            // Pin 1 đang xả
const isBat2Charging = showBat2 && bat2P > MIN_POWER;  // Pin 2 đang nạp
const isBat2Discharging = showBat2 && bat2P < -MIN_POWER; // Pin 2 đang xả

// Tổng công suất nạp/xả của hệ thống Pin (Pin 1 + Pin 2)
const netBatPower = batP + (showBat2 ? bat2P : 0);
const isNetCharging = netBatPower > MIN_POWER;         // Hệ thống Pin đang tổng nạp
const isNetDischarging = netBatPower < -MIN_POWER;      // Hệ thống Pin đang tổng xả

// --- 2. XÁC ĐỊNH TRẠNG THÁI ĐIỆN LƯỚI, PV VÀ TẢI TIÊU THỤ ---
const isImporting = isGridConnected && gridP < -MIN_POWER; // Đang lấy điện từ lưới (Lưới -> Bus)
const isExporting = isGridConnected && gridP > MIN_POWER;  // Đang phát điện lên lưới (Bus -> Lưới)

const hasPvPower = pvP > MIN_POWER;                 // Có công suất PV DC (Tấm pin)
const hasAcPvPower = hasAcPvP && acPvP > MIN_POWER; // Có công suất PV AC (Inverter phụ hòa lưới)
const hasLoadPower = loadP > MIN_POWER;             // Có tải tiêu thụ chính
const hasEpsPower = epsP > MIN_POWER;               // Có tải tiêu thụ dự phòng EPS

// Trạng thái đặc biệt: Mất lưới nhưng PV AC vẫn đang phát điện chung với nguồn EPS
const isAcPvSpecialOffgrid = isGridConnected && 
                             !hasLoadPower && 
                             !isImporting && 
                             (hasPvPower || isNetCharging || isNetDischarging) && 
                             hasAcPvPower && 
                             hasEpsPower;

// --- 3. BẬT / TẮT HIỂN THỊ CÁC LUỒNG NĂNG LƯỢNG MẶC ĐỊNH ---

// Luồng Nạp/Xả Pin 1 và Pin 2
this.setFlowVisible('flow-bat-charge', isBat1Charging);
this.setFlowVisible('flow-bat-discharge', isBat1Discharging);
this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging);
this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging);
this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);
this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging);

// Luồng Lấy/Phát Lưới
this.setFlowVisible('flow-grid-import', isImporting);
this.setFlowVisible('flow-grid-export', isExporting);

// Luồng PV DC (Năng lượng mặt trời từ tấm pin)
this.setFlowVisible('flow-pv', hasPvPower);

// Luồng PV AC (Hòa lưới phụ)
const showAcPvFlow = hasAcPvPower && (isGridConnected || hasEpsPower || isNetCharging || isAcPvSpecialOffgrid);
this.setFlowVisible('flow-ac-pv', showAcPvFlow);

// Luồng cấp điện từ Thanh cái (Bus AC) đến Tải tiêu thụ
this.setFlowVisible('flow-bus-to-load', isGridConnected && hasLoadPower);

// Luồng cấp điện cho Tải dự phòng EPS
this.setFlowVisible('flow-eps', hasEpsPower);

// --- 4. XÁC ĐỊNH HƯỚNG ĐI GIỮA INVERTER VÀ THANH CÁI HÒA LƯỚI (BUS AC) ---

// Điều kiện Bus AC chạy ngược vào Inverter (Ví dụ: Sạc Pin từ Lưới hoặc từ PV AC)
const isAcPvOffgridSupply = !isGridConnected && hasAcPvPower && (hasEpsPower || isNetCharging);
const isBusChargingInv = ((isImporting || hasAcPvPower) && isNetCharging) || isAcPvOffgridSupply || isAcPvSpecialOffgrid;

// Điều kiện Inverter đẩy điện ra Bus AC (Ưu tiên cấp Tải)
// Mũi tên Inverter -> Bus AC bật khi:
// 1. Có điện lưới (isGridConnected)
// 2. Công suất sạc Pin < Công suất PV DC tạo ra
// 3. Công suất mua từ Lưới < Công suất Tải đang tiêu thụ
const batChargePower = isNetCharging ? netBatPower : 0;
const gridImportPower = isImporting ? Math.abs(gridP) : 0;

const isInvSupplyingBus = isGridConnected && 
                          (batChargePower < totalPvPower) && 
                          (gridImportPower < loadP);

// Áp dụng bật/tắt luồng Inverter <-> Bus AC
this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus);
this.setFlowVisible('flow-bus-to-inv', isBusChargingInv);