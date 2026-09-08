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
    
    // PV hòa lưới (AC PV) hiển thị khi có lưới HOẶC khi mất lưới mà có tải EPS / Sạc Pin
    const showAcPvFlow = hasAcPvPower && (isGridConnected || hasEpsPower || isNetCharging);
    this.setFlowVisible('flow-ac-pv', showAcPvFlow);
    
    this.setFlowVisible('flow-bus-to-load', hasLoadPower);
    this.setFlowVisible('flow-eps', hasEpsPower);

    // --- CHUYỂN ĐỔI GIỮA INVERTER VÀ THANH CÁI AC (BUS) ---
    // 1. Bus cấp điện ngược lại Inverter (Sạc pin từ lưới/AC PV hoặc AC PV cấp EPS offgrid)
    const isAcPvOffgridSupply = !isGridConnected && hasAcPvPower && (hasEpsPower || isNetCharging);
    const isBusChargingInv = ((isImporting || hasAcPvPower) && isNetCharging) || isAcPvOffgridSupply;

    // 2. Inverter đẩy điện ra Bus: Đồng bộ loại trừ triệt để với BusChargingInv
    const isInvSupplyingBus = !isBusChargingInv && (isGridConnected || hasLoadPower) && (hasPvPower || isNetDischarging) && (hasLoadPower || isExporting);

    this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus);
    this.setFlowVisible('flow-bus-to-inv', isBusChargingInv);
