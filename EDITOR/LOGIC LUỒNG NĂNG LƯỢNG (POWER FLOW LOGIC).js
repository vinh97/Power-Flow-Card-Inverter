    // Ngưỡng công suất tối thiểu (Watts) để kích hoạt chuyển động mũi tên
    const MIN_POWER = 5;

    // 1. Trạng thái Sạc / Xả Pin
    const isBat1Charging = batP > MIN_POWER;
    const isBat1Discharging = batP < -MIN_POWER;
    const isBat2Charging = showBat2 && bat2P > MIN_POWER;
    const isBat2Discharging = showBat2 && bat2P < -MIN_POWER;

    // Tính tổng công suất ròng của Pin để đồng bộ luồng trục chính (Trunk)
    const netBatPower = batP + (showBat2 ? bat2P : 0);
    const isNetCharging = netBatPower > MIN_POWER;
    const isNetDischarging = netBatPower < -MIN_POWER;

    // 2. Trạng thái Lấy / Đẩy Lưới
    const isImporting = isGridConnected && gridP < -MIN_POWER;
    const isExporting = isGridConnected && gridP > MIN_POWER;

    // 3. Trạng thái PV và Tải Tiêu Thụ
    const hasPvPower = pvP > MIN_POWER;
    const hasAcPvPower = hasAcPvP && acPvP > MIN_POWER;
    const hasLoadPower = loadP > MIN_POWER;
    const hasEpsPower = epsP > MIN_POWER;

    // --- ĐIỀU KIỆN BỔ SUNG: CHẾ ĐỘ AC PV OFFGRID NỐI LƯỚI ---
    // (Có lưới + Không tải tiêu thụ + Không lấy lưới + Có PV/Pin nạp xả + Có AC PV + Có EPS)
    const isAcPvSpecialOffgrid = isGridConnected && 
                                 !hasLoadPower && 
                                 !isImporting && 
                                 (hasPvPower || isNetCharging || isNetDischarging) && 
                                 hasAcPvPower && 
                                 hasEpsPower;

    // --- CẶP MŨI TÊN PIN ---
    this.setFlowVisible('flow-bat-charge', isBat1Charging);
    this.setFlowVisible('flow-bat-discharge', isBat1Discharging);
    this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging);
    this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging);
    this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);
    this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging);

    // --- CẶP MŨI TÊN LƯỚI ---
    this.setFlowVisible('flow-grid-import', isImporting);
    this.setFlowVisible('flow-grid-export', isExporting);

    // --- CẶP MŨI TÊN TẢI & EPS & PV ---
    this.setFlowVisible('flow-pv', hasPvPower);
    
    // Mũi tên PV hòa lưới (AC PV)
    const showAcPvFlow = hasAcPvPower && (isGridConnected || hasEpsPower || isNetCharging || isAcPvSpecialOffgrid);
    this.setFlowVisible('flow-ac-pv', showAcPvFlow);
    
    this.setFlowVisible('flow-bus-to-load', hasLoadPower);
    this.setFlowVisible('flow-eps', hasEpsPower);

    // --- CHUYỂN ĐỔI GIỮA INVERTER VÀ THANH CÁI AC (BUS) ---
    // 1. Bus cấp điện ngược lại Inverter (Bật khi có AC PV Offgrid Nối lưới)
    const isAcPvOffgridSupply = !isGridConnected && hasAcPvPower && (hasEpsPower || isNetCharging);
    const isBusChargingInv = ((isImporting || hasAcPvPower) && isNetCharging) || isAcPvOffgridSupply || isAcPvSpecialOffgrid;

    // 2. Inverter đẩy điện ra Bus (Tự động loại trừ để tránh xung đột ngược chiều)
    const isInvSupplyingBus = !isBusChargingInv && (isGridConnected || hasLoadPower) && (hasPvPower || isNetDischarging) && (hasLoadPower || isExporting);

    this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus);
    this.setFlowVisible('flow-bus-to-inv', isBusChargingInv);
