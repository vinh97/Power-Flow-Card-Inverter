const MIN_POWER = 5;

// Xác định trạng thái Pin
const isBat1Charging = batP > MIN_POWER;
const isBat1Discharging = batP < -MIN_POWER;
const isBat2Charging = showBat2 && bat2P > MIN_POWER;
const isBat2Discharging = showBat2 && bat2P < -MIN_POWER;

const netBatPower = batP + (showBat2 ? bat2P : 0);
const isNetCharging = netBatPower > MIN_POWER;
const isNetDischarging = netBatPower < -MIN_POWER;

// Xác định trạng thái Lưới
const isImporting = isGridConnected && gridP < -MIN_POWER;
const isExporting = isGridConnected && gridP > MIN_POWER;

// Xác định các nguồn công suất
const hasPvPower = pvP > MIN_POWER;
const hasAcPvPower = hasAcPvP && acPvP > MIN_POWER;
const hasLoadPower = loadP > MIN_POWER;
const hasEpsPower = epsP > MIN_POWER;

// Trường hợp đặc biệt AC PV khi mất lưới
const isAcPvSpecialOffgrid = isGridConnected && 
                             !hasLoadPower && 
                             !isImporting && 
                             (hasPvPower || isNetCharging || isNetDischarging) && 
                             hasAcPvPower && 
                             hasEpsPower;

// Điều khiển hiển thị luồng đơn lẻ
this.setFlowVisible('flow-bat-charge', isBat1Charging);
this.setFlowVisible('flow-bat-discharge', isBat1Discharging);
this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging);
this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging);
this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);
this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging);

this.setFlowVisible('flow-grid-import', isImporting);
this.setFlowVisible('flow-grid-export', isExporting);

this.setFlowVisible('flow-pv', hasPvPower);

const showAcPvFlow = hasAcPvPower && (isGridConnected || hasEpsPower || isNetCharging || isAcPvSpecialOffgrid);
this.setFlowVisible('flow-ac-pv', showAcPvFlow);

this.setFlowVisible('flow-bus-to-load', isGridConnected && hasLoadPower);
this.setFlowVisible('flow-eps', hasEpsPower);

const batChargePower = isNetCharging ? netBatPower : 0;
const gridImportPower = isImporting ? Math.abs(gridP) : 0;

// 1. Chế độ Ưu tiên lưu trữ (Storage Priority Mode)
const isLoadPriorityInvToBus = isGridConnected && 
                               (batChargePower < totalPvPower) && 
                               (gridImportPower < loadP);

// 2. Chế độ Ưu tiên tải (Load Priority Mode)
const isStoragePriorityInvToBus = isGridConnected && 
                                  hasPvPower && 
                                  isNetCharging && 
                                  (!isImporting || gridImportPower === 0) && 
                                  hasLoadPower;

// 3. Chế độ Bypass Lưới -> Tiêu thụ
const isGridBypass = isGridConnected && 
                     isImporting && 
                     (gridImportPower >= loadP || Math.abs(gridImportPower - loadP) <= 5) && 
                     !isNetCharging && 
                     !isNetDischarging && 
                     !hasPvPower && 
                     !hasAcPvPower;

// Luồng giữa Biến tần (Inverter) và Bus AC
const isInvSupplyingBus = !isGridBypass && (isLoadPriorityInvToBus || isStoragePriorityInvToBus);
const isAcPvOffgridSupply = !isGridConnected && hasAcPvPower && (hasEpsPower || isNetCharging);
const isBusChargingInv = !isGridBypass && (((isImporting || hasAcPvPower) && isNetCharging) || isAcPvOffgridSupply || isAcPvSpecialOffgrid);

this.setFlowVisible('flow-inv-to-bus', isInvSupplyingBus);
this.setFlowVisible('flow-bus-to-inv', isBusChargingInv);