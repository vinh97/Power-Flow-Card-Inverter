// =========================================================================
// 1. CẤU HÌNH NGƯỠNG & KIỂM TRA TRẠNG THÁI PIN (BATTERY)
// =========================================================================
const MIN_POWER = 5; // Ngưỡng công suất tối thiểu để tính dòng điện (W)

const isBat1Charging = batP > MIN_POWER; // Pin 1 đang sạc
const isBat1Discharging = batP < -MIN_POWER; // Pin 1 đang xả
const isBat2Charging = showBat2 && bat2P > MIN_POWER; // Pin 2 đang sạc
const isBat2Discharging = showBat2 && bat2P < -MIN_POWER; // Pin 2 đang xả

const netBatPower = batP + (showBat2 ? bat2P : 0); // Tổng công suất Pin
const isNetCharging = netBatPower > MIN_POWER; // Trạng thái Pin tổng đang sạc
const isNetDischarging = netBatPower < -MIN_POWER; // Trạng thái Pin tổng đang xả

// =========================================================================
// 2. KIỂM TRA TRẠNG THÁI LƯỚI & CÁC NGUỒN ĐIỆN / TẢI TIÊU THỤ
// =========================================================================
const isImporting = isGridConnected && gridP < -MIN_POWER; // Đang nhận (nhập) điện từ Lưới
const isExporting = isGridConnected && gridP > MIN_POWER; // Đang phát (xuất) điện ra Lưới

const hasPvPower = pvP > MIN_POWER; // Có nguồn điện năng lượng mặt trời (PV)
const hasAuxPower = auxP > MIN_POWER; // Có công suất phát/tiêu thụ ở cổng phụ (AUX)
const hasAcPvPower = !isSmartLoadAux && hasAuxPower; // Nguồn AUX đóng vai trò AC-PV (Microinverter)
const hasLoadPower = loadP > MIN_POWER; // Có tải tiêu thụ nhà thông thường (Load)
const hasEpsPower = epsP > MIN_POWER; // Có tải tiêu thụ quan trọng / dự phòng (EPS)

// Điều kiện hoạt động đặc biệt của AC-PV khi chạy Offgrid hoặc mất lưới
const isAcPvSpecialOffgrid = isGridConnected && 
                             !hasLoadPower && 
                             !isImporting && 
                             (hasPvPower || isNetCharging || isNetDischarging) && 
                             hasAcPvPower && 
                             hasEpsPower;

// =========================================================================
// 3. HIỂN THỊ LUỒNG ĐIỆN PIN, LƯỚI VÀ QUANG ĐIỆN (PV)
// =========================================================================
this.setFlowVisible('flow-bat-charge', isBat1Charging);
this.setFlowVisible('flow-bat-discharge', isBat1Discharging);
this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging);
this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging);
this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);
this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging);

this.setFlowVisible('flow-grid-import', isImporting);
this.setFlowVisible('flow-grid-export', isExporting);

this.setFlowVisible('flow-pv', hasPvPower);

// =========================================================================
// 4. XỬ LÝ ĐIỀU KIỆN VÀ HƯỚNG HIỆU ỨNG MŨI TÊN CỔNG AUX
// =========================================================================
const showAuxFlow = isSmartLoadAux
     ? hasAuxPower
     : (hasAuxPower && (isGridConnected || hasEpsPower || isNetCharging || isAcPvSpecialOffgrid));

this.setFlowVisible('flow-aux', showAuxFlow);

const flowAuxEl = this.getEl('flow-aux');
if (flowAuxEl) {
    const chevrons = flowAuxEl.querySelectorAll('use');
    if (isSmartLoadAux) {
        // Chế độ SmartLoad: Mũi tên hướng lên (cấp điện ra tải AUX)
        const delays = ["0.60s", "0.48s", "0.36s", "0.24s", "0.12s", "0.00s"];
        chevrons.forEach((chv, idx) => {
            chv.setAttribute('href', '#chv-block-u');
            if (delays[idx]) chv.style.animationDelay = delays[idx];
        });
    } else {
        // Chế độ AC-PV: Mũi tên hướng xuống (nhận điện từ Microinverter vào thanh cái)
        const delays = ["0.00s", "0.12s", "0.24s", "0.36s", "0.48s", "0.60s"];
        chevrons.forEach((chv, idx) => {
            chv.setAttribute('href', '#chv-block-d');
            if (delays[idx]) chv.style.animationDelay = delays[idx];
        });
    }
}

// =========================================================================
// 5. HIỂN THỊ LUỒNG ĐIỆN CẤP CHO TẢI THƯỜNG (LOAD) VÀ TẢI DỰ PHÒNG (EPS)
// =========================================================================
this.setFlowVisible('flow-bus-to-load', isGridConnected && hasLoadPower); // Luồng điện từ thanh cái Bus đến Load
this.setFlowVisible('flow-eps', hasEpsPower); // Luồng điện cấp cho cổng EPS

// =========================================================================
// 6. PHÂN TÍCH CÂN BẰNG TẢI VÀ ĐIỀU KIỆN BYPASS LƯỚI
// =========================================================================
const batChargePower = isNetCharging ? netBatPower : 0;
const gridImportPower = isImporting ? Math.abs(gridP) : 0;

const gridToLoadDiff = gridImportPower - loadP;
// Kiểm tra trường hợp Lưới cấp trực tiếp cho Load (Bypass), không đi qua Inverter
const isGridBypass = isGridConnected && 
                     isImporting && 
                     !isNetDischarging && 
                     (!isNetCharging || hasPvPower) &&
                     (gridToLoadDiff >= 0 && gridToLoadDiff <= 5);

const isInvGenerating = hasPvPower || isNetDischarging; // Inverter đang tự phát điện (từ PV hoặc Pin)
const hasAcSourceOnBus = isImporting || hasAcPvPower; // Thanh cái Bus có nguồn AC điện lưới hoặc AC-PV
const inverterNeedsAc = isNetCharging || hasEpsPower; // Inverter đang cần nguồn AC (sạc Pin hoặc nuôi EPS)
const hasAnyLoadOnBus = hasLoadPower || (isSmartLoadAux && hasAuxPower); // Đang có tải trên thanh cái

// Xác định hướng dòng điện thô (chưa tính ưu tiên)
const rawInvToBus = (isGridConnected || hasAnyLoadOnBus) && !isGridBypass && isInvGenerating && (hasAnyLoadOnBus || isExporting); // Inverter -> Bus
const rawBusToInv = hasAcSourceOnBus && inverterNeedsAc && !isGridBypass; // Bus -> Inverter

// Điều kiện ưu tiên: Inverter phát điện ra Bus
const isInvToBusCondition = isGridConnected && 
                             hasLoadPower && 
                             hasPvPower && 
                             (pvP > batChargePower) && 
                             (
                               !isImporting || 
                               (gridImportPower <= loadP && (loadP - gridImportPower) <= 5)
                             );

// Điều kiện ưu tiên: Thanh cái Bus cấp ngược lại vào Inverter
const isBusToInvCondition = isGridConnected && 
                             isImporting && 
                             hasPvPower && 
                             (pvP > batChargePower) && 
                             (gridImportPower > loadP && (gridImportPower - loadP) > 5);

// =========================================================================
// 7. XÁC ĐỊNH HƯỚNG DÒNG ĐIỆN CUỐI CÙNG GIỮA INVERTER VÀ BUS
// =========================================================================
let isInvSupplyingBus = false;
let isBusChargingInv = false;

if (isInvToBusCondition) {
    isInvSupplyingBus = true; // Inverter cấp điện ra Bus
    isBusChargingInv = false;
} else if (isBusToInvCondition) {
    isBusChargingInv = true; // Bus cấp điện/sạc cho Inverter
    isInvSupplyingBus = false;
} else if (rawBusToInv && !rawInvToBus) {
    isBusChargingInv = true;
} else if (rawInvToBus && !rawBusToInv) {
    isInvSupplyingBus = true;
} else if (rawBusToInv && rawInvToBus) {
    // Xử lý khi thỏa mãn cả 2 chiều thô: Phân định theo ưu tiên sạc / phát
    if (!isInvGenerating) {
        isBusChargingInv = true;
    } else if (isNetCharging && (isImporting || hasAcPvPower)) {
        isBusChargingInv = true;
    } else {
        isInvSupplyingBus = true;
    }
}

// Bật/tắt các luồng hiển thị tương ứng
this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus); // Bật luồng Inverter -> Bus
this.setFlowVisible('flow-bus-to-inv', isBusChargingInv); // Bật luồng Bus -> Inverter
