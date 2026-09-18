// =========================================================================
// 1. CẤU HÌNH NGƯỠNG LỌC NHIỄU & KIỂM TRA TRẠNG THÁI PIN (BATTERY)
// =========================================================================
// Ngưỡng công suất tối thiểu (W) để lọc nhiễu cảm biến khi công suất gần bằng 0
const MIN_POWER = 5; 

// Trạng thái sạc/xả của Pin 1 (Dương: đang sạc, Âm: đang xả)
const isBat1Charging = batP > MIN_POWER; 
const isBat1Discharging = batP < -MIN_POWER; 

// Trạng thái sạc/xả của Pin 2 (Chỉ tính khi cấu hình bật hiển thị Pin 2)
const isBat2Charging = showBat2 && bat2P > MIN_POWER; 
const isBat2Discharging = showBat2 && bat2P < -MIN_POWER; 

// Tổng công suất thực tế của hệ thống Pin (gộp cả 2 khối Pin)
const netBatPower = batP + (showBat2 ? bat2P : 0); 

// Trạng thái tổng của toàn bộ khối Pin (Đang sạc tổng hoặc Đang xả tổng)
const isNetCharging = netBatPower > MIN_POWER; 
const isNetDischarging = netBatPower < -MIN_POWER; 

// =========================================================================
// 2. KIỂM TRA TRẠNG THÁI LƯỚI & CÁC NGUỒN ĐIỆN / TẢI TIÊU THỤ
// =========================================================================
// Kiểm tra trạng thái Lưới: gridP âm là nhập điện lưới, gridP dương là phát ra lưới
const isImporting = isGridConnected && gridP < -MIN_POWER; // Đang lấy (nhập) điện từ Lưới
const isExporting = isGridConnected && gridP > MIN_POWER;  // Đang phát (xuất) điện ra Lưới

// Kiểm tra sự tồn tại của các nguồn năng lượng và tải tiêu thụ trong hệ thống
const hasPvPower = pvP > MIN_POWER;                  // Có nguồn điện mặt trời PV
const hasAuxPower = auxP > MIN_POWER;                // Cổng phụ AUX đang hoạt động
const hasAcPvPower = !isSmartLoadAux && hasAuxPower; // Cổng AUX nhận điện từ Microinverter (AC-PV)
const hasLoadPower = loadP > MIN_POWER;              // Nhà đang dùng tải tiêu thụ chính
const hasEpsPower = epsP > MIN_POWER;                // Cổng tải dự phòng (EPS) đang dùng điện

// Kịch bản đặc biệt: Vẫn ghi nhận điện áp Lưới (isGridConnected) nhưng Rơ-le ngắt Lưới để chạy Off-grid.
// Không nuôi tải chính (!hasLoadPower), không nhập lưới (!isImporting), điện AC-PV dùng sạc Pin/nuôi EPS
const isAcPvSpecialOffgrid = isGridConnected && 
                             !hasLoadPower && 
                             !isImporting && 
                             (hasPvPower || isNetCharging || isNetDischarging) && 
                             hasAcPvPower && 
                             hasEpsPower;

// =========================================================================
// 3. HIỂN THỊ LUỒNG ĐIỆN PIN, LƯỚI VÀ QUANG ĐIỆN (PV)
// =========================================================================
// Kích hoạt đồ họa luồng điện cho từng khối Pin riêng biệt và cáp tổng (Trunk)
this.setFlowVisible('flow-bat-charge', isBat1Charging);
this.setFlowVisible('flow-bat-discharge', isBat1Discharging);
this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging);
this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging);
this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);
this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging);

// Kích hoạt luồng điện Nhập / Xuất Lưới
this.setFlowVisible('flow-grid-import', isImporting);
this.setFlowVisible('flow-grid-export', isExporting);

// Kích hoạt luồng điện từ các tấm pin mặt trời (PV) xuống Inverter
this.setFlowVisible('flow-pv', hasPvPower);

// =========================================================================
// 4. XỬ LÝ ĐIỀU KIỆN VÀ HƯỚNG HIỆU ỨNG MŨI TÊN CỔNG AUX
// =========================================================================
// Bật luồng cổng AUX khi ở chế độ SmartLoad hoặc khi nhận nguồn AC-PV đẩy vào
const showAuxFlow = isSmartLoadAux
     ? hasAuxPower
     : (hasAuxPower && (isGridConnected || hasEpsPower || isNetCharging || isAcPvSpecialOffgrid));

this.setFlowVisible('flow-aux', showAuxFlow);

// Đổi chiều mũi tên hoạt họa trên giao diện tùy thuộc vào chế độ hoạt động của cổng AUX
const flowAuxEl = this.getEl('flow-aux');
if (flowAuxEl) {
    const chevrons = flowAuxEl.querySelectorAll('use');
    if (isSmartLoadAux) {
        // Chế độ SmartLoad: Mũi tên hướng lên (Cấp điện ra cho tải phụ AUX)
        const delays = ["0.60s", "0.48s", "0.36s", "0.24s", "0.12s", "0.00s"];
        chevrons.forEach((chv, idx) => {
            chv.setAttribute('href', '#chv-block-u');
            if (delays[idx]) chv.style.animationDelay = delays[idx];
        });
    } else {
        // Chế độ AC-PV: Mũi tên hướng xuống (Microinverter đẩy điện vào hệ thống)
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
// Hiển thị luồng điện từ Bus AC đến Tải tiêu thụ chính (Chỉ sáng khi có Nối Lưới và Có Tải)
this.setFlowVisible('flow-bus-to-load', isGridConnected && hasLoadPower); 

// Hiển thị luồng điện cấp cho cổng Tải dự phòng EPS
this.setFlowVisible('flow-eps', hasEpsPower); 

// =========================================================================
// 6. PHÂN TÍCH CÂN BẰNG TẢI VÀ ĐIỀU KIỆN BYPASS LƯỚI & HÒA LƯỚI
// =========================================================================
// Công suất Pin đang sạc (W)
const batChargePower = isNetCharging ? netBatPower : 0;

// Công suất lấy từ Lưới (Lấy giá trị tuyệt đối để tính toán)
const gridImportPower = isImporting ? Math.abs(gridP) : 0;

// Hiệu số giữa Công suất lấy từ Lưới và Tải tiêu thụ nhà
const gridToLoadDiff = gridImportPower - loadP;

// Kiểm tra xem trên thanh cái AC Bus có tải nào đang chạy không (Tải chính hoặc SmartLoad)
const hasAnyLoadOnBus = hasLoadPower || (isSmartLoadAux && hasAuxPower);

// Kiểm tra nguồn PV có đủ để tự sạc Pin hay không (Cho phép dung sai 5W để trừ sai số cảm biến)
const isPvEnoughForCharge = hasPvPower && (pvP >= batChargePower - 5);

// ĐIỀU KIỆN BYPASS LƯỚI: Điện Lưới đi thẳng ra nuôi Tải chính (Không đi qua Inverter)
// Yêu cầu: Có Nối Lưới, Có Tải trên Bus, Đang nhập Lưới, Pin không xả,
// và Công suất Lưới nhập khớp với Tải (trong khoảng sai số -5W đến +5W).
const isGridBypass = isGridConnected && 
                     hasAnyLoadOnBus &&
                     isImporting && 
                     !isNetDischarging && 
                     (!isNetCharging || hasPvPower) &&
                     (gridToLoadDiff >= -5 && gridToLoadDiff <= 5);

// Inverter đang tự sinh công suất (Từ PV mặt trời hoặc xả từ Pin)
const isInvGenerating = hasPvPower || isNetDischarging; 

// Thanh cái Bus AC có nguồn cấp bên ngoài (Lưới nhập vào hoặc AC-PV)
const hasAcSourceOnBus = isImporting || hasAcPvPower; 

// Inverter thực sự CẦN nguồn AC từ Bus khi:
// 1. Pin đang sạc mà nguồn PV KHÔNG ĐỦ để tự sạc.
// 2. Hoặc đang phải nuôi cổng dự phòng EPS.
const inverterNeedsAc = (isNetCharging && !isPvEnoughForCharge) || hasEpsPower;

// Xác định hướng dòng điện sơ bộ (Sơ khởi chưa tính thứ tự ưu tiên)
const rawInvToBus = (isGridConnected || hasAnyLoadOnBus) && !isGridBypass && isInvGenerating && (hasAnyLoadOnBus || isExporting);
const rawBusToInv = hasAcSourceOnBus && inverterNeedsAc && !isGridBypass;

// ĐIỀU KIỆN ƯU TIÊN 1: Inverter phát điện ra Bus AC (Bù tải / Bán điện)
// Yêu cầu: Có Nối Lưới, Inverter có nguồn phát, Có Tải hoặc Bán điện,
// PV dư sau khi sạc Pin, và Lưới không gánh toàn bộ tải.
const isInvToBusCondition = isGridConnected && 
                             isInvGenerating && 
                             (hasAnyLoadOnBus || isExporting) && 
                             (!isNetCharging || pvP > batChargePower + 5) &&
                             (isExporting || !isImporting || gridImportPower < loadP - 5);

// ĐIỀU KIỆN ƯU TIÊN 2: Bus AC cấp ngược vào Inverter (Lưới sạc Pin / Nuôi Inverter)
// Yêu cầu: Có Nối Lưới, Lưới đang nhập điện và Inverter đang cần nguồn AC.
const isBusToInvCondition = isGridConnected && 
                             isImporting && 
                             inverterNeedsAc;

// =========================================================================
// 7. XÁC ĐỊNH HƯỚNG DÒNG ĐIỆN CUỐI CÙNG GIỮA INVERTER VÀ BUS AC
// =========================================================================
let isInvSupplyingBus = false;
let isBusChargingInv = false;

// Đánh giá thứ tự ưu tiên để chốt duy nhất 1 trong 2 hướng (hoặc tắt cả hai)
if (isInvToBusCondition) {
    isInvSupplyingBus = true; // Kích hoạt luồng: Inverter -> Bus AC
} else if (isBusToInvCondition) {
    isBusChargingInv = true; // Kích hoạt luồng: Bus AC -> Inverter
} else if (rawBusToInv && !rawInvToBus) {
    isBusChargingInv = true;
} else if (rawInvToBus && !rawBusToInv) {
    isInvSupplyingBus = true;
} else if (rawBusToInv && rawInvToBus) {
    // Xử lý xung đột khi thỏa mãn cả 2 chiều thô: Phân định theo trạng thái PV và Pin
    if (!isInvGenerating) {
        isBusChargingInv = true;
    } else if (isNetCharging && !isPvEnoughForCharge && (isImporting || hasAcPvPower)) {
        isBusChargingInv = true; // Ưu tiên Bus sạc Pin khi nguồn PV bị thiếu
    } else {
        isInvSupplyingBus = true; // Ưu tiên Inverter phát ra Bus khi nguồn PV đủ
    }
}

// Bật/tắt các luồng hiển thị tương ứng trên giao diện SVG/Canvas
this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus); // Mũi tên Inverter -> Bus
this.setFlowVisible('flow-bus-to-inv', isBusChargingInv); // Mũi tên Bus -> Inverter
