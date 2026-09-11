// --- XÁC ĐỊNH TRẠNG THÁI CÁC THIẾT BỊ ---

const MIN_POWER = 5; // Ngưỡng công suất tối thiểu (W) để kích hoạt luồng chảy

// Trạng thái sạc/xả Pin lưu trữ 1 & 2
const isBat1Charging = batP > MIN_POWER;
const isBat1Discharging = batP < -MIN_POWER;
const isBat2Charging = showBat2 && bat2P > MIN_POWER;
const isBat2Discharging = showBat2 && bat2P < -MIN_POWER;

// Tổng công suất sạc/xả của hệ thống Pin
const netBatPower = batP + (showBat2 ? bat2P : 0);
const isNetCharging = netBatPower > MIN_POWER;
const isNetDischarging = netBatPower < -MIN_POWER;

// Trạng thái Nhập / Phát điện lưới
const isImporting = isGridConnected && gridP < -MIN_POWER; // Nhập lưới (Mua điện)
const isExporting = isGridConnected && gridP > MIN_POWER;  // Phát lưới (Bán điện)

// Trạng thái có công suất nguồn & tải
const hasPvPower = pvP > MIN_POWER;
const hasAcPvPower = hasAcPvP && acPvP > MIN_POWER;
const hasLoadPower = loadP > MIN_POWER;
const hasEpsPower = epsP > MIN_POWER;

// Trường hợp đặc biệt: AC PV cấp điện khi mất lưới hoặc chạy chế độ riêng
const isAcPvSpecialOffgrid = isGridConnected && 
                             !hasLoadPower && 
                             !isImporting && 
                             (hasPvPower || isNetCharging || isNetDischarging) && 
                             hasAcPvPower && 
                             hasEpsPower;


// --- BẬT / TẮT ĐƯỜNG ĐI CỦA CÁC LUỒNG NĂNG LƯỢNG (SET FLOW VISIBILITY) ---

// 1. Luồng Pin lưu trữ
this.setFlowVisible('flow-bat-charge', isBat1Charging);             // Sạc Pin 1
this.setFlowVisible('flow-bat-discharge', isBat1Discharging);       // Xả Pin 1
this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging); // Sạc Pin 2
this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging); // Xả Pin 2
this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);       // Luồng tổng nạp Pin
this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging); // Luồng tổng xả Pin

// 2. Luồng Điện lưới
this.setFlowVisible('flow-grid-import', isImporting); // Mua điện từ lưới
this.setFlowVisible('flow-grid-export', isExporting); // Bán điện ra lưới

// 3. Luồng Quang điện DC (Tấm pin mặt trời)
this.setFlowVisible('flow-pv', hasPvPower);

// 4. Luồng Quang điện AC (Hệ thống inverter phụ hòa lưới)
const showAcPvFlow = hasAcPvPower && (isGridConnected || hasEpsPower || isNetCharging || isAcPvSpecialOffgrid);
this.setFlowVisible('flow-ac-pv', showAcPvFlow);

// 5. Luồng từ Thanh cái AC (Bus) cấp cho Tải tiêu thụ
this.setFlowVisible('flow-bus-to-load', isGridConnected && hasLoadPower);

// 6. Luồng cấp điện cho Tải dự phòng (EPS)
this.setFlowVisible('flow-eps', hasEpsPower);

// 7. Luồng điện sạc Pin từ Thanh cái AC vào Inverter (Bus -> Inverter)
const isAcPvOffgridSupply = !isGridConnected && hasAcPvPower && (hasEpsPower || isNetCharging);
const isBusChargingInv = ((isImporting || hasAcPvPower) && isNetCharging) || isAcPvOffgridSupply || isAcPvSpecialOffgrid;


// --- TÍNH TOÁN HƯỚNG DÒNG ĐIỆN GIỮA INVERTER VÀ THANH CÁI AC (BUS) ---

const batChargePower = isNetCharging ? netBatPower : 0;
const gridImportPower = isImporting ? Math.abs(gridP) : 0;

// Chế độ 1: Ưu tiên tải (Load Priority Mode)
// Điều kiện: Có lưới + Công suất nạp Pin < Công suất PV + Công suất mua lưới < Công suất tải
const isLoadPriorityInvToBus = isGridConnected && 
                               (batChargePower < totalPvPower) && 
                               (gridImportPower < loadP);

// Chế độ 2: Ưu tiên lưu trữ (Storage Priority Mode)
// Điều kiện: Có lưới + Có PV + Pin đang nạp + Không mua lưới + Có tải tiêu thụ
const isStoragePriorityInvToBus = isGridConnected && 
                                  hasPvPower && 
                                  isNetCharging && 
                                  (!isImporting || gridImportPower === 0) && 
                                  hasLoadPower;

// Kích hoạt luồng điện từ Inverter -> Thanh cái AC khi thỏa mãn Chế độ 1 HOẶC Chế độ 2
const isInvSupplyingBus = isLoadPriorityInvToBus || isStoragePriorityInvToBus;

this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus); // Inverter cấp điện ra Bus
this.setFlowVisible('flow-bus-to-inv', isBusChargingInv);  // Bus cấp điện ngược lại Inverter (Sạc)