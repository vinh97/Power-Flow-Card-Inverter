    // =========================================================================
    // 1. XÁC ĐỊNH TRẠNG THÁI HOẠT ĐỘNG VÀ CÔNG SUẤT CỦA CÁC THIẾT BỊ
    // =========================================================================

    // Ngưỡng lọc nhiễu công suất tối thiểu (5W) để loại bỏ sai số cảm biến khi thiết bị ở chế độ chờ
    const MIN_POWER = 5;

    // Trạng thái sạc / xả của khối Pin lưu trữ thứ nhất (Battery 1)
    const isBat1Charging = batP > MIN_POWER;       // Pin 1 đang nhận điện sạc vào (> 5W)
    const isBat1Discharging = batP < -MIN_POWER;   // Pin 1 đang xả điện ra cấp cho tải (< -5W)

    // Trạng thái sạc / xả của khối Pin lưu trữ thứ hai (Battery 2 - nếu có bật hiển thị)
    const isBat2Charging = showBat2 && bat2P > MIN_POWER;     // Pin 2 đang nhận điện sạc vào
    const isBat2Discharging = showBat2 && bat2P < -MIN_POWER; // Pin 2 đang xả điện ra

    // Tổng công suất sạc / xả ròng (Net Power) của toàn bộ hệ thống Pin (Pin 1 + Pin 2)
    const netBatPower = batP + (showBat2 ? bat2P : 0);
    const isNetCharging = netBatPower > MIN_POWER;     // Toàn hệ thống Pin đang nhận điện sạc ròng
    const isNetDischarging = netBatPower < -MIN_POWER; // Toàn hệ thống Pin đang xả điện ròng

    // Trạng thái Mua (Nhập) / Bán (Phát) điện đối với Lưới điện quốc gia (Grid)
    const isImporting = isGridConnected && gridP < -MIN_POWER; // Đang mua (nhập) điện từ Lưới về
    const isExporting = isGridConnected && gridP > MIN_POWER;  // Đang phát (bán) điện dư ra Lưới

    // Xác định sự hiện diện công suất từ nguồn phát (Solar) và tải tiêu thụ (Loads)
    const hasPvPower = pvP > MIN_POWER;             // Dàn tấm pin mặt trời DC (PV) đang phát điện
    const hasAcPvPower = hasAcPvP && acPvP > MIN_POWER; // Inverter phụ hòa lưới AC (AC PV) đang phát điện
    const hasLoadPower = loadP > MIN_POWER;         // Tải tiêu thụ chính (House Load) đang dùng điện
    const hasEpsPower = epsP > MIN_POWER;           // Tải dự phòng khẩn cấp (EPS / Backup Load) đang dùng điện

    // Chế độ đặc biệt: AC PV phát điện khi mất lưới (Off-grid) hoặc không có tải chính tiêu thụ
    const isAcPvSpecialOffgrid = isGridConnected && 
                                 !hasLoadPower && 
                                 !isImporting && 
                                 (hasPvPower || isNetCharging || isNetDischarging) && 
                                 hasAcPvPower && 
                                 hasEpsPower;

    // =========================================================================
    // 2. BẬT / TẮT ĐƯỜNG ĐI HIỂN THỊ CỦA CÁC LUỒNG NĂNG LƯỢNG (SET FLOW VISIBILITY)
    // =========================================================================

    // 2.1. Quản lý luồng điện riêng biệt và luồng tổng của hệ thống Pin lưu trữ
    this.setFlowVisible('flow-bat-charge', isBat1Charging);             // Luồng sạc vào Pin 1
    this.setFlowVisible('flow-bat-discharge', isBat1Discharging);       // Luồng xả ra từ Pin 1
    this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging); // Luồng sạc vào Pin 2
    this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging); // Luồng xả ra từ Pin 2
    this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);       // Trục luồng tổng sạc Pin
    this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging); // Trục luồng tổng xả Pin

    // 2.2. Quản lý luồng giao tiếp với Lưới điện quốc gia
    this.setFlowVisible('flow-grid-import', isImporting); // Mua điện từ Lưới vào Bus AC
    this.setFlowVisible('flow-grid-export', isExporting); // Bán điện dư từ Bus AC ra Lưới

    // 2.3. Quản lý luồng điện từ Nguồn quang điện DC (Solar PV)
    this.setFlowVisible('flow-pv', hasPvPower); // Điện DC từ Tấm Pin mặt trời vào Biến tần

    // 2.4. Quản lý luồng điện từ Nguồn hòa lưới AC (AC PV Inverter)
    const showAcPvFlow = hasAcPvPower && (isGridConnected || hasEpsPower || isNetCharging || isAcPvSpecialOffgrid);
    this.setFlowVisible('flow-ac-pv', showAcPvFlow); // Điện AC từ PV hòa lưới vào Thanh cái Bus AC

    // 2.5. Quản lý luồng điện cấp cho Tải tiêu thụ chính
    this.setFlowVisible('flow-bus-to-load', isGridConnected && hasLoadPower); // Điện từ Bus AC đến Tải nhà

    // 2.6. Quản lý luồng điện cấp cho Tải dự phòng khẩn cấp
    this.setFlowVisible('flow-eps', hasEpsPower); // Điện từ Biến tần / Cổng dự phòng đến Tải EPS

    // =========================================================================
    // 3. TÍNH TOÁN HƯỚNG DÒNG ĐIỆN GIỮA BIẾN TẦN (INVERTER) VÀ THANH CÁI AC (BUS)
    // =========================================================================

    // Công suất sạc pin thực tế và công suất nhập lưới thực tế
    const batChargePower = isNetCharging ? netBatPower : 0;
    const gridImportPower = isImporting ? Math.abs(gridP) : 0;

    // Kiểm tra chế độ Bypass (Điện lưới chạy thẳng sang tải chính, Lưới chỉ bù nhẹ 0-5W chênh lệch)
    const gridToLoadDiff = gridImportPower - loadP;
    const isGridBypass = isGridConnected && 
                         isImporting && 
                         !isNetDischarging && 
                         (!isNetCharging || hasPvPower) &&
                         (gridToLoadDiff >= 0 && gridToLoadDiff <= 5);

    // Xác định Inverter đang đóng vai trò Nguồn phát DC (Có điện từ PV DC hoặc đang xả Pin)
    const isInvGenerating = hasPvPower || isNetDischarging;

    // Xác định đang có Nguồn phát điện AC trên Thanh cái Bus AC (Lưới đang nhập điện hoặc AC PV đang phát)
    const hasAcSourceOnBus = isImporting || hasAcPvPower;

    // Xác định Inverter đang đóng vai trò Tải tiêu thụ AC (Cần nhận điện AC để sạc Pin hoặc nuôi Tải EPS)
    const inverterNeedsAc = isNetCharging || hasEpsPower;

    // Điều kiện thô 1: Luồng điện đi từ Inverter -> Bus AC (Inverter cấp điện ra Thanh cái)
    const rawInvToBus = (isGridConnected || hasLoadPower) && !isGridBypass && isInvGenerating && (hasLoadPower || isExporting);

    // Điều kiện thô 2: Luồng điện đi từ Bus AC -> Inverter (Thanh cái/Lưới/AC PV cấp điện ngược vào Inverter)
    const rawBusToInv = hasAcSourceOnBus && inverterNeedsAc && !isGridBypass;

    // =========================================================================
    // 4. XỬ LÝ KHỬ XUNG ĐỘT LUỒNG ĐIỆN 2 CHIỀU (PRIORITY RESOLUTION)
    // =========================================================================
    let isInvSupplyingBus = false;
    let isBusChargingInv = false;

    if (rawBusToInv && !rawInvToBus) {
      // Chỉ thỏa mãn chiều Bus -> Inverter: Bật mũi tên nhận điện vào Inverter
      isBusChargingInv = true;
    } else if (rawInvToBus && !rawBusToInv) {
      // Chỉ thỏa mãn chiều Inverter -> Bus: Bật mũi tên cấp điện ra Bus AC
      isInvSupplyingBus = true;
    } else if (rawBusToInv && rawInvToBus) {
      // TRƯỜNG HỢP XUNG ĐỘT: Cả 2 chiều đều thỏa mãn điều kiện thô cùng lúc
      if (!isInvGenerating) {
        // Phía DC không phát điện -> Ưu tiên chiều Bus AC -> Inverter
        isBusChargingInv = true;
      } else if (isNetCharging && (isImporting || hasAcPvPower)) {
        // Pin đang sạc và có Nguồn AC cấp điện (Lưới/AC PV) -> Ưu tiên chiều Bus AC -> Inverter (Nạp cho Pin/EPS)
        isBusChargingInv = true;
      } else {
        // Các trường hợp còn lại -> Ưu tiên chiều Inverter -> Bus AC (DC phát ra Thanh cái)
        isInvSupplyingBus = true;
      }
    }

    // Gán trạng thái hiển thị cuối cùng cho các mũi tên hướng dòng điện trên giao diện
    this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus); // Bật/tắt mũi tên hướng Inverter -> Bus AC
    this.setFlowVisible('flow-bus-to-inv', isBusChargingInv);  // Bật/tắt mũi tên hướng Bus AC -> Inverter
