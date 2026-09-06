const TRANSLATIONS = {
  vi: {
    pv_yield: "SẢN LƯỢNG PV",
    pv_today: "Sản lượng hôm nay",
    pv_total: "Tổng sản lượng",

    bat_charge_title: "Pin nạp",
    bat_discharge_title: "Pin xả",
    charge_today: "Nạp hôm nay",
    discharge_today: "Xả hôm nay",
    total_charge: "Tổng nạp",
    total_discharge: "Tổng xả",

    grid_import_title: "Nhập lưới",
    grid_export_title: "Phát lên lưới",
    import_today: "Nhập hôm nay",
    export_today: "Phát hôm nay",
    total_import: "Tổng nhập",
    total_export: "Tổng phát",

    load_consumption: "TIÊU THỤ",
    load_today: "Tiêu thụ hôm nay",
    load_total: "Tổng tiêu thụ",

    today: "HÔM NAY",
    total: "TỔNG",
    pv_power_lbl: "CÔNG SUẤT PV",
    backup_power: "CÔNG SUẤT DỰ PHÒNG",
    standby_mode: "CHẾ ĐỘ CHỜ",
    consumption: "TIÊU THỤ",
    bat_charging: "ĐANG SẠC",
    bat_discharging: "ĐANG XẢ",
    bat_full: "PIN ĐẦY",
    bat_standby: "PIN CHỜ",
    bat_low: "PIN YẾU",
    grid_offline: "MẤT LƯỚI",
    grid_exporting: "ĐẨY LƯỚI",
    grid_importing: "LẤY LƯỚI",
    grid_ongrid: "HÒA LƯỚI"
  },
  en: {
    pv_yield: "SOLAR PV",
    pv_today: "Today's Yield",
    pv_total: "Total Yield",

    bat_charge_title: "Battery Charge",
    bat_discharge_title: "Battery Discharge",
    charge_today: "Charged Today",
    discharge_today: "Discharged Today",
    total_charge: "Total Charged",
    total_discharge: "Total Discharged",

    grid_import_title: "Grid Import",
    grid_export_title: "Grid Export",
    import_today: "Imported Today",
    export_today: "Exported Today",
    total_import: "Total Imported",
    total_export: "Total Exported",

    load_consumption: "LOAD POWER",
    load_today: "Today's Load",
    load_total: "Total Load",

    today: "TODAY",
    total: "TOTAL",
    pv_power_lbl: "PV POWER",
    backup_power: "BACKUP POWER",
    standby_mode: "STANDBY MODE",
    consumption: "CONSUMPTION",
    bat_charging: "CHARGING",
    bat_discharging: "DISCHARGING",
    bat_full: "FULL",
    bat_standby: "STANDBY",
    bat_low: "LOW",
    grid_offline: "OFF-GRID",
    grid_exporting: "EXPORTING",
    grid_importing: "IMPORTING",
    grid_ongrid: "ON-GRID"
  }
};

class PowerFlowCardInverter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._batToggle = 'discharge';
    this._gridToggle = 'buy';
  }

  getTranslation() {
    const lang = (this.config?.language || this.config?.lang || 'vi').toLowerCase();
    return TRANSLATIONS[lang] || TRANSLATIONS.vi;
  }

  setConfig(config) {
    if (!config || !config.entities) {
      throw new Error("Vui lòng cấu hình danh sách entities!");
    }
    this.config = config;
    this.render();
  }

  connectedCallback() {}
  disconnectedCallback() {}

  set hass(hass) {
    this._hass = hass;
    this.updateData();
  }

  getEl(id) {
    return this.shadowRoot ? this.shadowRoot.getElementById(id) : null;
  }

  setDisplay(id, visible) {
    const el = typeof id === 'string' ? this.getEl(id) : id;
    if (el) el.style.display = visible ? 'inline' : 'none';
  }

  setText(id, text) {
    const el = this.getEl(id);
    if (el) el.textContent = text;
  }

  setPower(id, val) {
    const el = this.getEl(id);
    if (!el) return;
    const num = Number(val) || 0;
    const absNum = Math.abs(num);
    const unitEl = el.nextElementSibling;
    
    if (absNum >= 9999) {
      const kw = num / 1000;
      const absKw = Math.abs(kw);
      let formatted = '';
      if (absKw >= 1000) formatted = kw.toFixed(0);
      else formatted = kw.toFixed(1);
      
      el.textContent = formatted;
      if (unitEl) unitEl.textContent = ' kW';
    } else {
      el.textContent = Math.round(num);
      if (unitEl) unitEl.textContent = ' W';
    }
  }

  setEnergyStat(id, val) {
    const el = this.getEl(id);
    if (!el) return;
    const num = Number(val) || 0;
    const absNum = Math.abs(num);

    let formatted = '';
    let unit = 'kWh';

    if (absNum >= 1000) {
      const mwh = num / 1000;
      const absMwh = Math.abs(mwh);
      if (absMwh >= 1000) formatted = mwh.toFixed(0);
      else if (absMwh >= 100) formatted = mwh.toFixed(1);
      else formatted = mwh.toFixed(2);
      unit = 'MWh';
    } else {
      if (absNum >= 100) formatted = num.toFixed(1);
      else formatted = num.toFixed(2);
      unit = 'kWh';
    }

    el.innerHTML = `${formatted} <span class="unit">${unit}</span>`;
  }

  getState(entityId, defaultVal = 0) {
    if (!entityId || !this._hass || !this._hass.states[entityId]) return defaultVal;
    const val = parseFloat(this._hass.states[entityId].state);
    return isNaN(val) ? defaultVal : val;
  }

  setFlowVisible(id, visible) {
    this.setDisplay(id, visible);
  }

  alignTextStack(elements, centerY, lineHeight = 12, baselineOffset = 3.5, gapIndex = -1, gapAmount = 0) {
    const visible = elements.filter(el => el && el.style.display !== 'none');
    const numLines = visible.length;
    if (numLines === 0) return;

    const hasGap = gapIndex >= 0 && gapIndex < numLines - 1;
    const totalHeight = ((numLines - 1) * lineHeight) + (hasGap ? gapAmount : 0);
    const startY = centerY - totalHeight / 2 + baselineOffset;

    let currentY = startY;
    visible.forEach((el, idx) => {
      el.setAttribute('y', currentY);
      currentY += lineHeight;
      if (idx === gapIndex) {
        currentY += gapAmount;
      }
    });
  }

  updateData() {
    if (!this._hass || !this.config || !this.shadowRoot || !this.shadowRoot.querySelector('.app-card')) return;

    const ent = this.config.entities;
    const isTrue = (val) => val === true || String(val).toLowerCase() === 'true';
    const t = this.getTranslation();

    const isDarkMode = isTrue(this.config?.dark_mode) || isTrue(this.config?.dark_theme) || isTrue(this.config?.dark);
    const appCard = this.shadowRoot.querySelector('.app-card');
    if (appCard) {
      if (isDarkMode) appCard.classList.add('dark-mode');
      else appCard.classList.remove('dark-mode');
    }

    const useCustomImg = isTrue(this.config?.inverter_image);
    const customInvImage = this.config?.inverter_icon || this.config?.custom_inverter_icon || (typeof this.config?.inverter_image === 'string' ? this.config.inverter_image : '');

    const invDefaultG = this.getEl('inv-default-graphics');
    const invCustomImg = this.getEl('inv-custom-image');

    const invX = Number(this.config?.inverter_x ?? 144);
    const invY = Number(this.config?.inverter_y ?? 74);

    const invWidth = Number(this.config?.inverter_width || this.config?.inverter_size || 58);
    const invHeight = Number(this.config?.inverter_height || this.config?.inverter_size || 58);
    const invCustomX = Number(this.config?.inverter_custom_x ?? this.config?.inverter_icon_x ?? 0);
    const invCustomY = Number(this.config?.inverter_custom_y ?? this.config?.inverter_icon_y ?? 0);

    const invGroup = invDefaultG ? invDefaultG.parentElement : null;
    if (invGroup) {
      invGroup.setAttribute('transform', `translate(${invX}, ${invY})`);
    }

    if (invDefaultG && invCustomImg) {
      if (useCustomImg && customInvImage && String(customInvImage).trim() !== '') {
        invDefaultG.style.display = 'none';
        invCustomImg.style.display = 'inline';
        invCustomImg.setAttribute('href', customInvImage);
        invCustomImg.setAttribute('width', invWidth);
        invCustomImg.setAttribute('height', invHeight);
        invCustomImg.setAttribute('x', invCustomX);
        invCustomImg.setAttribute('y', invCustomY);
      } else {
        invDefaultG.style.display = 'inline';
        invCustomImg.style.display = 'none';
      }
    }

    const configThreePhase = this.config?.three_phase ?? ent?.three_phase;
    const isThreePhase = configThreePhase !== undefined
      ? isTrue(configThreePhase)
      : Boolean(ent?.load_power_l1 || ent?.grid_power_l1 || ent?.eps_power_l1 || ent?.ac_pv_power_l1);

    const singleLoadMode = this.config?.single_load_mode !== undefined
      ? isTrue(this.config.single_load_mode)
      : (ent?.single_load_mode !== undefined ? isTrue(ent.single_load_mode) : false);

    let latestDate = null;
    if (ent) {
      Object.values(ent).forEach(eId => {
        if (typeof eId === 'string' && this._hass?.states[eId]?.last_updated) {
          const d = new Date(this._hass.states[eId].last_updated);
          if (!latestDate || d > latestDate) latestDate = d;
        }
      });
    }

    if (latestDate) {
      const timeFormatted = [
        latestDate.getHours(),
        latestDate.getMinutes(),
        latestDate.getSeconds()
      ].map(n => String(n).padStart(2, '0')).join(':');
      this.setText('inv-lcd-time', timeFormatted);
    }

    let pvP = 0;
    const activePvGroups = [];

    [1, 2, 3, 4].forEach(i => {
      const pId = ent[`pv${i}_power`];
      const vId = ent[`pv${i}_voltage`];

      const hasP = Boolean(pId && this._hass?.states[pId] !== undefined);
      const hasV = Boolean(vId && this._hass?.states[vId] !== undefined);

      const pVal = hasP ? Math.abs(Math.round(this.getState(pId))) : 0;
      const vVal = hasV ? this.getState(vId, 0) : 0;

      if (hasP) pvP += pVal;

      const showP = hasP && (pVal > 0 || vVal > 0 || !hasV);
      const showV = hasV && (vVal > 0 || pVal > 0 || !hasP);

      this.setDisplay(`line-pv${i}-v`, showV);
      this.setDisplay(`line-pv${i}-p`, showP);

      if (showV) this.setText(`txt-pv${i}-v`, vVal.toFixed(1));
      if (showP) this.setPower(`txt-pv${i}-p`, pVal);

      const lineV = this.getEl(`line-pv${i}-v`);
      const lineP = this.getEl(`line-pv${i}-p`);
      if (lineV) lineV.setAttribute('x', '26');
      if (lineP) lineP.setAttribute('x', showV ? '88' : '26');

      const grp = this.getEl(`grp-pv${i}`);
      if (grp) {
        if (showP || showV) {
          grp.style.display = 'inline';
          activePvGroups.push(grp);
        } else {
          grp.style.display = 'none';
        }
      }
    });

    if (pvP === 0 && ent.pv_power && this._hass?.states[ent.pv_power] !== undefined) {
      pvP = Math.abs(Math.round(this.getState(ent.pv_power, 0)));
    }

    const totalPvPower = (ent.pv_power && this._hass?.states[ent.pv_power] !== undefined)
      ? Math.abs(Math.round(this.getState(ent.pv_power, 0)))
      : pvP;
    this.setPower('txt-pv-total-p', totalPvPower);
    this.setText('lbl-pv-total-sub', t.pv_power_lbl);

    const grpTotal = this.getEl('grp-pv-total');
    const showTotalPv = totalPvPower > 0 || activePvGroups.length > 0;
    this.setDisplay('grp-pv-total', showTotalPv);

    const numStrings = activePvGroups.length;
    const hasTotal = showTotalPv && grpTotal;

    if (numStrings > 0 || hasTotal) {
      const lineSpacing = 16;
      const pvTotalGap = 22;
      const iconY = -56;
      const pvIconBaseY = iconY + 49;

      const pvIconGroup = this.getEl('grp-pv-icon');
      if (pvIconGroup) {
        pvIconGroup.setAttribute('transform', `translate(138, ${iconY}) scale(0.57)`);
      }

      if (hasTotal) {
        grpTotal.setAttribute('transform', `translate(0, ${pvIconBaseY})`);
      }

      if (numStrings > 0) {
        const lastRowY = hasTotal ? (pvIconBaseY - pvTotalGap) : pvIconBaseY;
        activePvGroups.forEach((grp, idx) => {
          const grpY = lastRowY - (numStrings - 1 - idx) * lineSpacing;
          grp.setAttribute('transform', `translate(0, ${grpY})`);
        });
      }
    }

    const alwaysShowAcPv = isTrue(this.config?.always_show_ac_pv) || isTrue(this.config?.show_ac_pv) || isTrue(ent?.always_show_ac_pv);
    let acPvP = 0;
    let acPvL1 = 0, acPvL2 = 0, acPvL3 = 0;

    const hasAcPv3PhaseEntities = Boolean(ent.ac_pv_power_l1 || ent.ac_pv_power_l2 || ent.ac_pv_power_l3);

    if (isThreePhase) {
      acPvL1 = Math.abs(Math.round(this.getState(ent.ac_pv_power_l1, 0)));
      acPvL2 = Math.abs(Math.round(this.getState(ent.ac_pv_power_l2, 0)));
      acPvL3 = Math.abs(Math.round(this.getState(ent.ac_pv_power_l3, 0)));

      acPvP = hasAcPv3PhaseEntities
        ? (acPvL1 + acPvL2 + acPvL3)
        : Math.abs(Math.round(this.getState(ent.ac_pv_power, 0)));

      this.setPower('txt-ac-pv-l1', acPvL1);
      this.setPower('txt-ac-pv-l2', acPvL2);
      this.setPower('txt-ac-pv-l3', acPvL3);
      this.setPower('txt-ac-pv-p', acPvP);
    } else {
      acPvP = Math.abs(Math.round(this.getState(ent.ac_pv_power, 0)));
      this.setPower('txt-ac-pv-p', acPvP);
    }

    const acPvV = this.getState(ent.ac_pv_voltage, 0.0);
    const acPvF = this.getState(ent.ac_pv_frequency, 0.0);

    const hasAcPvP = Boolean((ent.ac_pv_power || ent.ac_pv_power_l1 || ent.ac_pv_power_l2 || ent.ac_pv_power_l3) && acPvP > 0);
    const hasAcPvV = Boolean(ent.ac_pv_voltage && this._hass?.states[ent.ac_pv_voltage] !== undefined);
    const hasAcPvF = hasAcPvV && Boolean(ent.ac_pv_frequency && this._hass?.states[ent.ac_pv_frequency] !== undefined);

    this.setDisplay('grp-pv-ac', alwaysShowAcPv || hasAcPvP);

    const showAcPvV = hasAcPvV && acPvV > 0;
    const showAcPvF = hasAcPvF && acPvF > 0;

    if (showAcPvV) this.setText('txt-ac-pv-v', acPvV.toFixed(1));
    if (showAcPvF) this.setText('txt-ac-pv-f', acPvF.toFixed(2));

    const acPvElements = [];

    const showAcPvL1 = Boolean(ent.ac_pv_power_l1 && acPvL1 > 0);
    const showAcPvL2 = Boolean(ent.ac_pv_power_l2 && acPvL2 > 0);
    const showAcPvL3 = Boolean(ent.ac_pv_power_l3 && acPvL3 > 0);

    const showAcPv3Phase = isThreePhase && hasAcPv3PhaseEntities && (showAcPvL1 || showAcPvL2 || showAcPvL3);

    if (showAcPv3Phase) {
      this.setDisplay('line-ac-pv-1p', false);
      this.setDisplay('line-ac-pv-l1', showAcPvL1);
      this.setDisplay('line-ac-pv-l2', showAcPvL2);
      this.setDisplay('line-ac-pv-l3', showAcPvL3);

      if (showAcPvL1) acPvElements.push(this.getEl('line-ac-pv-l1'));
      if (showAcPvL2) acPvElements.push(this.getEl('line-ac-pv-l2'));
      if (showAcPvL3) acPvElements.push(this.getEl('line-ac-pv-l3'));
    } else {
      this.setDisplay('line-ac-pv-1p', true);
      this.setDisplay('line-ac-pv-l1', false);
      this.setDisplay('line-ac-pv-l2', false);
      this.setDisplay('line-ac-pv-l3', false);
      acPvElements.push(this.getEl('line-ac-pv-1p'));
    }

    this.setDisplay('line-ac-pv-v', showAcPvV);
    if (showAcPvV) acPvElements.push(this.getEl('line-ac-pv-v'));

    this.setDisplay('line-ac-pv-f', showAcPvF);
    if (showAcPvF) acPvElements.push(this.getEl('line-ac-pv-f'));

    this.alignTextStack(acPvElements, -32.5, 12, 3.5);

    let gridP = 0;
    let rawGridV = 0.0;
    let rawGridF = 0.0;

    const gridPowerElements = [];
    const gridInfoElements = [];

    let gridL1 = 0, gridL2 = 0, gridL3 = 0;
    const invertGrid = isTrue(this.config?.invert_grid_power) || isTrue(ent?.invert_grid_power);

    if (isThreePhase) {
      gridL1 = Math.round(this.getState(ent.grid_power_l1, 0));
      gridL2 = Math.round(this.getState(ent.grid_power_l2, 0));
      gridL3 = Math.round(this.getState(ent.grid_power_l3, 0));

      if (invertGrid) {
        gridL1 = -gridL1;
        gridL2 = -gridL2;
        gridL3 = -gridL3;
      }

      gridP = (ent.grid_power_l1 || ent.grid_power_l2 || ent.grid_power_l3)
        ? (gridL1 + gridL2 + gridL3)
        : Math.round(this.getState(ent.grid_power, 0));

      if (invertGrid && !(ent.grid_power_l1 || ent.grid_power_l2 || ent.grid_power_l3)) {
        gridP = -gridP;
      }

      rawGridV = this.getState(ent.grid_voltage_l1, this.getState(ent.grid_voltage, 0.0));
      rawGridF = this.getState(ent.grid_frequency_l1, this.getState(ent.grid_frequency, 0.0));
    } else {
      gridP = Math.round(this.getState(ent.grid_power, 0));
      if (invertGrid) gridP = -gridP;

      rawGridV = this.getState(ent.grid_voltage, 0.0);
      rawGridF = this.getState(ent.grid_frequency, 0.0);
    }

    const hasGridVoltConfig = Boolean(ent.grid_voltage || ent.grid_voltage_l1);
    const isGridConnected = hasGridVoltConfig ? (rawGridV > 50) : true;

    if (!isGridConnected) {
      gridP = 0;
      if (isThreePhase) {
        this.setPower('txt-grid-l1', 0);
        this.setPower('txt-grid-l2', 0);
        this.setPower('txt-grid-l3', 0);
      } else {
        this.setPower('txt-grid-p', 0);
      }
    } else {
      if (isThreePhase) {
        this.setPower('txt-grid-l1', Math.abs(gridL1));
        this.setPower('txt-grid-l2', Math.abs(gridL2));
        this.setPower('txt-grid-l3', Math.abs(gridL3));
      } else {
        this.setPower('txt-grid-p', Math.abs(gridP));
      }
    }

    const gridV = isGridConnected ? rawGridV : 0.0;
    const gridF = isGridConnected ? rawGridF : 0.0;

    this.setText('txt-grid-v', gridV.toFixed(1));
    this.setText('txt-grid-f', gridF.toFixed(2));

    const showGridV = isGridConnected && gridV > 0;
    const showGridF = isGridConnected && gridF > 0;

    if (isThreePhase) {
      this.setDisplay('line-grid-1p', false);
      this.setDisplay('line-grid-l1', true);
      this.setDisplay('line-grid-l2', true);
      this.setDisplay('line-grid-l3', true);
      gridPowerElements.push(this.getEl('line-grid-l1'), this.getEl('line-grid-l2'), this.getEl('line-grid-l3'));
    } else {
      this.setDisplay('line-grid-1p', true);
      this.setDisplay('line-grid-l1', false);
      this.setDisplay('line-grid-l2', false);
      this.setDisplay('line-grid-l3', false);
      gridPowerElements.push(this.getEl('line-grid-1p'));
    }

    if (isThreePhase) {
      this.alignTextStack(gridPowerElements, 18, 12, 3.5);
    } else {
      this.alignTextStack(gridPowerElements, 26, 12, 3.5);
    }

    this.setDisplay('line-grid-v', showGridV);
    if (showGridV) gridInfoElements.push(this.getEl('line-grid-v'));

    this.setDisplay('line-grid-f', showGridF);
    if (showGridF) gridInfoElements.push(this.getEl('line-grid-f'));

    this.alignTextStack(gridInfoElements, 108, 12, 3.5);

    let loadP = 0, loadL1 = 0, loadL2 = 0, loadL3 = 0;
    let epsP = 0, epsL1 = 0, epsL2 = 0, epsL3 = 0;

    if (isThreePhase) {
      loadL1 = Math.abs(Math.round(this.getState(ent.load_power_l1, 0)));
      loadL2 = Math.abs(Math.round(this.getState(ent.load_power_l2, 0)));
      loadL3 = Math.abs(Math.round(this.getState(ent.load_power_l3, 0)));
      loadP = (ent.load_power_l1 || ent.load_power_l2 || ent.load_power_l3)
        ? (loadL1 + loadL2 + loadL3)
        : Math.abs(Math.round(this.getState(ent.load_power, 0)));

      epsL1 = Math.abs(Math.round(this.getState(ent.eps_power_l1, 0)));
      epsL2 = Math.abs(Math.round(this.getState(ent.eps_power_l2, 0)));
      epsL3 = Math.abs(Math.round(this.getState(ent.eps_power_l3, 0)));
      epsP = (ent.eps_power_l1 || ent.eps_power_l2 || ent.eps_power_l3)
        ? (epsL1 + epsL2 + epsL3)
        : Math.abs(Math.round(this.getState(ent.eps_power, 0)));
    } else {
      loadP = Math.abs(Math.round(this.getState(ent.load_power, 0)));
      epsP = Math.abs(Math.round(this.getState(ent.eps_power, 0)));
    }

    if (singleLoadMode) {
      if (!isGridConnected) {
        if (loadP > 0 || (loadL1 + loadL2 + loadL3) > 0) {
          epsP = loadP;
          epsL1 = loadL1;
          epsL2 = loadL2;
          epsL3 = loadL3;
        }
        loadP = 0;
        loadL1 = 0;
        loadL2 = 0;
        loadL3 = 0;
      } else {
        epsP = 0;
        epsL1 = 0;
        epsL2 = 0;
        epsL3 = 0;
      }
    } else {
      if (!isGridConnected && epsP === 0 && (loadP > 0 || (loadL1 + loadL2 + loadL3) > 0)) {
        epsP = loadP;
        epsL1 = loadL1;
        epsL2 = loadL2;
        epsL3 = loadL3;
        loadP = 0;
        loadL1 = 0;
        loadL2 = 0;
        loadL3 = 0;
      }
    }

    if (isThreePhase) {
      this.setPower('txt-load-l1', loadL1);
      this.setPower('txt-load-l2', loadL2);
      this.setPower('txt-load-l3', loadL3);
    } else {
      this.setPower('txt-load-p', loadP);
    }

    const loadElements = [];
    if (isThreePhase) {
      this.setDisplay('line-load-1p', false);
      this.setDisplay('line-load-l1', true);
      this.setDisplay('line-load-l2', true);
      this.setDisplay('line-load-l3', true);
      loadElements.push(this.getEl('line-load-l1'), this.getEl('line-load-l2'), this.getEl('line-load-l3'));
    } else {
      this.setDisplay('line-load-1p', true);
      this.setDisplay('line-load-l1', false);
      this.setDisplay('line-load-l2', false);
      this.setDisplay('line-load-l3', false);
      loadElements.push(this.getEl('line-load-1p'));
    }
    loadElements.push(this.getEl('lbl-load-sub'));
    const loadGapIndex = loadElements.length - 2;
    this.alignTextStack(loadElements, 27, 12, 3.5, loadGapIndex, 5);

    if (isThreePhase) {
      this.setPower('txt-eps-l1', epsL1);
      this.setPower('txt-eps-l2', epsL2);
      this.setPower('txt-eps-l3', epsL3);
    } else {
      this.setPower('txt-eps-p', epsP);
    }

    const hasEpsV = Boolean(ent.eps_voltage && this._hass?.states[ent.eps_voltage] !== undefined);
    const hasEpsF = hasEpsV && Boolean(ent.eps_frequency && this._hass?.states[ent.eps_frequency] !== undefined);

    const epsV = hasEpsV ? this.getState(ent.eps_voltage, 0.0) : 0;
    const epsF = hasEpsF ? this.getState(ent.eps_frequency, 0.0) : 0;

    const showEpsV = !isThreePhase && hasEpsV && epsV > 0;
    const showEpsF = !isThreePhase && hasEpsF && epsF > 0;

    if (showEpsV) this.setText('txt-eps-v', epsV.toFixed(1));
    if (showEpsF) this.setText('txt-eps-f', epsF.toFixed(2));

    const epsElements = [];
    if (isThreePhase) {
      this.setDisplay('line-eps-1p', false);
      this.setDisplay('line-eps-l1', true);
      this.setDisplay('line-eps-l2', true);
      this.setDisplay('line-eps-l3', true);
      epsElements.push(this.getEl('line-eps-l1'), this.getEl('line-eps-l2'), this.getEl('line-eps-l3'));
    } else {
      this.setDisplay('line-eps-1p', true);
      this.setDisplay('line-eps-l1', false);
      this.setDisplay('line-eps-l2', false);
      this.setDisplay('line-eps-l3', false);
      epsElements.push(this.getEl('line-eps-1p'));
    }

    this.setDisplay('line-eps-v', showEpsV);
    if (showEpsV) epsElements.push(this.getEl('line-eps-v'));

    this.setDisplay('line-eps-f', showEpsF);
    if (showEpsF) epsElements.push(this.getEl('line-eps-f'));

    this.alignTextStack(epsElements, 28, 12, 3.5);

    const showStandby = isGridConnected && (epsP === 0);
    this.setDisplay('lbl-eps-standby', showStandby);

    let batP = Math.round(this.getState(ent.battery_power, 0));
    const batV = this.getState(ent.battery_voltage, 0);
    const soc = Math.round(this.getState(ent.battery_soc, 0));

    const invertBat = isTrue(this.config?.invert_battery_power) || isTrue(ent?.invert_battery_power);
    if (invertBat) batP = -batP;

    const isCharging = batP > 5;
    const isDischarging = batP < -5;

    this.setPower('txt-bat-p', Math.abs(batP));
    this.setText('txt-bat-v', batV.toFixed(1));

    const lblBatMode = this.getEl('lbl-bat-mode');
    if (lblBatMode) {
      if (isCharging) lblBatMode.textContent = t.bat_charging;
      else if (isDischarging) lblBatMode.textContent = t.bat_discharging;
      else {
        if (soc >= 100) lblBatMode.textContent = t.bat_full;
        else if (soc >= 20) lblBatMode.textContent = t.bat_standby;
        else lblBatMode.textContent = t.bat_low;
      }
    }

    const showBatV = batV > 0;
    this.setDisplay('line-bat-v', showBatV);

    const batElements = [
      this.getEl('line-bat-p'),
      this.getEl('lbl-bat-mode'),
      ...(showBatV ? [this.getEl('line-bat-v')] : []),
      this.getEl('line-bat-soc')
    ];

    this.alignTextStack(batElements, 80, 12, 3.5);

    const batFill = this.getEl('bat-fill');
    const maxH = 43.0;
    const h = Math.max(1, (soc / 100) * maxH);
    if (batFill) {
      batFill.setAttribute('height', h);
      batFill.setAttribute('y', 7 + (maxH - h));
    }

    let batColor = '#16a34a';
    if (soc <= 20) batColor = '#dc2626';
    else if (soc <= 40) batColor = '#ea580c';

    this.setText('txt-soc-val', soc);
    const txtSoc = this.getEl('txt-soc-val');
    if (txtSoc) txtSoc.setAttribute('fill', batColor);
    if (batFill) batFill.setAttribute('fill', batColor);

    const hasBat2Entities = Boolean(
      (ent.battery2_power || ent.battery2_soc || ent.battery2_voltage) &&
      (this._hass?.states[ent.battery2_power] !== undefined || this._hass?.states[ent.battery2_soc] !== undefined)
    );
    const alwaysShowBat2 = isTrue(this.config?.always_show_battery2) || isTrue(ent?.always_show_battery2);
    const showBat2 = alwaysShowBat2 || hasBat2Entities;

    let bat2P = 0;
    let isCharging2 = false;
    let isDischarging2 = false;

    this.setDisplay('grp-bat2', showBat2);

    if (showBat2) {
      bat2P = Math.round(this.getState(ent.battery2_power, 0));
      const bat2V = this.getState(ent.battery2_voltage, 0);
      const soc2 = Math.round(this.getState(ent.battery2_soc, 0));

      const invertBat2 = isTrue(this.config?.invert_battery2_power) || isTrue(ent?.invert_battery2_power);
      if (invertBat2) bat2P = -bat2P;

      isCharging2 = bat2P > 5;
      isDischarging2 = bat2P < -5;

      this.setPower('txt-bat2-p', Math.abs(bat2P));
      this.setText('txt-bat2-v', bat2V.toFixed(1));

      const lblBat2Mode = this.getEl('lbl-bat2-mode');
      if (lblBat2Mode) {
        if (isCharging2) lblBat2Mode.textContent = t.bat_charging;
        else if (isDischarging2) lblBat2Mode.textContent = t.bat_discharging;
        else {
          if (soc2 >= 100) lblBat2Mode.textContent = t.bat_full;
          else if (soc2 >= 20) lblBat2Mode.textContent = t.bat_standby;
          else lblBat2Mode.textContent = t.bat_low;
        }
      }

      const showBat2V = bat2V > 0;
      this.setDisplay('line-bat2-v', showBat2V);

      const bat2Elements = [
        this.getEl('line-bat2-p'),
        this.getEl('lbl-bat2-mode'),
        ...(showBat2V ? [this.getEl('line-bat2-v')] : []),
        this.getEl('line-bat2-soc')
      ];

      this.alignTextStack(bat2Elements, 80, 12, 3.5);

      const bat2Fill = this.getEl('bat2-fill');
      const h2 = Math.max(1, (soc2 / 100) * maxH);
      if (bat2Fill) {
        bat2Fill.setAttribute('height', h2);
        bat2Fill.setAttribute('y', 7 + (maxH - h2));
      }

      let bat2Color = '#16a34a';
      if (soc2 <= 20) bat2Color = '#dc2626';
      else if (soc2 <= 40) bat2Color = '#ea580c';

      this.setText('txt-soc2-val', soc2);
      const txtSoc2 = this.getEl('txt-soc2-val');
      if (txtSoc2) txtSoc2.setAttribute('fill', bat2Color);
      if (bat2Fill) bat2Fill.setAttribute('fill', bat2Color);
    }

    this.setEnergyStat('stat-pv-today', this.getState(ent.pv_daily));
    this.setEnergyStat('stat-pv-total', this.getState(ent.pv_total));
    this.setEnergyStat('stat-load-today', this.getState(ent.load_daily));
    this.setEnergyStat('stat-load-total', this.getState(ent.load_total));

    const isBatCharge = this._batToggle === 'charge';
    this.setText('lbl-bat-title', isBatCharge ? t.bat_charge_title : t.bat_discharge_title);
    this.setText('lbl-bat-today', isBatCharge ? t.charge_today : t.discharge_today);
    this.setText('lbl-bat-total', isBatCharge ? t.total_charge : t.total_discharge);
    this.setEnergyStat('stat-bat-today', this.getState(isBatCharge ? ent.battery_charge_daily : ent.battery_discharge_daily));
    this.setEnergyStat('stat-bat-total', this.getState(isBatCharge ? ent.battery_charge_total : ent.battery_discharge_total));

    const isGridSell = this._gridToggle === 'sell';
    this.setText('lbl-grid-title', isGridSell ? t.grid_export_title : t.grid_import_title);
    this.setText('lbl-grid-today', isGridSell ? t.export_today : t.import_today);
    this.setText('lbl-grid-total', isGridSell ? t.total_export : t.total_import);
    this.setEnergyStat('stat-grid-today', this.getState(isGridSell ? ent.grid_sell_daily : ent.grid_buy_daily));
    this.setEnergyStat('stat-grid-total', this.getState(isGridSell ? ent.grid_sell_total : ent.grid_buy_total));

    const MIN_POWER = 5;
    const GRID_TOLERANCE = 150;

    const hasPvPower = pvP > MIN_POWER;
    const hasAcPvPower = hasAcPvP && acPvP > MIN_POWER;
    const hasLoadPower = loadP > MIN_POWER;
    const hasEpsPower = epsP > MIN_POWER;

    const isBat1Charging = batP > MIN_POWER;
    const isBat1Discharging = batP < -MIN_POWER;
    const isBat2Charging = showBat2 && bat2P > MIN_POWER;
    const isBat2Discharging = showBat2 && bat2P < -MIN_POWER;

    const activeBat1P = (isBat1Charging || isBat1Discharging) ? batP : 0;
    const activeBat2P = (showBat2 && (isBat2Charging || isBat2Discharging)) ? bat2P : 0;
    const netBatP = activeBat1P + activeBat2P;

    const isNetCharging = netBatP > MIN_POWER;
    const isNetDischarging = netBatP < -MIN_POWER;
    const batChargePower = isNetCharging ? netBatP : 0;
    const batDischargePower = isNetDischarging ? Math.abs(netBatP) : 0;

    const isExporting = isGridConnected && gridP > MIN_POWER;
    const isImporting = isGridConnected && gridP < -MIN_POWER;

    this.setFlowVisible('flow-bat-charge', isBat1Charging);
    this.setFlowVisible('flow-bat-discharge', isBat1Discharging);
    this.setFlowVisible('flow-bat2-charge', showBat2 && isBat2Charging);
    this.setFlowVisible('flow-bat2-discharge', showBat2 && isBat2Discharging);
    this.setFlowVisible('flow-bat-trunk-charge', isNetCharging);
    this.setFlowVisible('flow-bat-trunk-discharge', isNetDischarging);

    this.setFlowVisible('flow-pv', hasPvPower);

    const showAcPvFlow = hasAcPvPower && (
      isGridConnected 
        ? (hasLoadPower || hasEpsPower || isNetCharging || isExporting)
        : (hasEpsPower || isNetCharging)
    );
    this.setFlowVisible('flow-ac-pv', showAcPvFlow);

    this.setFlowVisible('flow-bus-to-load', isGridConnected && hasLoadPower);
    this.setFlowVisible('flow-eps', hasEpsPower);

    this.setFlowVisible('flow-grid-import', isImporting);
    this.setFlowVisible('flow-grid-export', isExporting);

    const invNetAcPower = pvP + batDischargePower - batChargePower - epsP;
    const hasAcSource = isImporting || hasAcPvPower;

    if (isGridConnected) {
      const isInvSupplyingAc = invNetAcPower > MIN_POWER && (hasLoadPower || isExporting);
      const isGridOrAcPvChargingBat = isNetCharging && ((pvP + GRID_TOLERANCE) < batChargePower) && hasAcSource;
      const isBusChargingInv = (invNetAcPower < -MIN_POWER || isGridOrAcPvChargingBat) && hasAcSource;

      this.setFlowVisible('flow-inv-to-bus', isInvSupplyingAc);
      this.setFlowVisible('flow-bus-to-inv', isBusChargingInv);
    } else {
      this.setFlowVisible('flow-inv-to-bus', false);
      const isAcPvToInvOffGrid = hasAcPvPower && (isNetCharging || hasEpsPower);
      this.setFlowVisible('flow-bus-to-inv', isAcPvToInvOffGrid);
    }

    const loadIconColor = isGridConnected ? '#52b788' : (hasLoadPower ? '#e11d48' : '#94a3b8');
    const loadIcons = this.shadowRoot.querySelectorAll('#icon-load .load-icon-color');
    loadIcons.forEach(icon => icon.setAttribute('fill', loadIconColor));
    const loadStrokes = this.shadowRoot.querySelectorAll('#icon-load .load-icon-stroke');
    loadStrokes.forEach(icon => icon.setAttribute('stroke', loadIconColor));

    const invLed = this.getEl('inv-led');
    if (invLed) invLed.setAttribute('fill', isGridConnected ? '#16a34a' : '#dc2626');

    const acNode = this.getEl('ac-bus-node');
    if (acNode) acNode.setAttribute('fill', isGridConnected ? '#16a34a' : '#0284c7');

    const lblGridMode = this.getEl('lbl-grid-mode');
    const pill = this.getEl('sys-status-pill');
    const pillTxt = this.getEl('sys-status-text');

    if (pill) pill.className = 'status-pill';

    if (!isGridConnected) {
      if (lblGridMode) { lblGridMode.textContent = t.grid_offline; lblGridMode.style.fill = "#dc2626"; }
      if (pill) pill.classList.add('offline');
      if (pillTxt) pillTxt.textContent = t.grid_offline;
    } else if (isExporting) {
      if (lblGridMode) { lblGridMode.textContent = t.grid_exporting; lblGridMode.style.fill = "#0284c7"; }
      if (pill) pill.classList.add('exporting');
      if (pillTxt) pillTxt.textContent = t.grid_exporting;
    } else if (isImporting) {
      if (lblGridMode) { lblGridMode.textContent = t.grid_importing; lblGridMode.style.fill = "#d97706"; }
      if (pill) pill.classList.add('importing');
      if (pillTxt) pillTxt.textContent = t.grid_importing;
    } else {
      if (lblGridMode) { lblGridMode.textContent = t.grid_ongrid; lblGridMode.style.fill = "#16a34a"; }
      if (pill) pill.classList.add('ongrid');
      if (pillTxt) pillTxt.textContent = t.grid_ongrid;
    }
  }

  render() {
    const t = this.getTranslation();
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; box-sizing: border-box; -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        
        .app-card { width: 100%; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: all 0.3s ease; }
        
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 4px; }
        .stat-card { background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; overflow: hidden; transition: all 0.3s ease; }
        
        .card-header { padding: 2px 6px; font-size: 11px; color: #ffffff; font-weight: 800; white-space: nowrap; letter-spacing: 0.3px; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
        .card-header svg { width: 12px; height: 12px; }
        .header-title { display: flex; align-items: center; gap: 3px; }
        .bg-pv { background: #0284c7; } .bg-bat { background: #ec4899; } .bg-grid { background: #f97316; } .bg-load { background: #10b981; } 
        
        .toggle-btn { cursor: pointer; user-select: none; font-size: 12px; padding: 0 2px; transition: transform 0.2s; }
        .toggle-btn:hover { transform: scale(1.2); }

        .card-body-row { display: flex; flex-direction: column; gap: 1px; padding: 3px 6px; text-align: left; }
        .stat-row-item { display: flex; flex-direction: column; align-items: flex-start; }
        .stat-value { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.0; }
        .stat-value.highlight-orange { color: #f97316; }
        .stat-value .unit { font-size: 10px; font-weight: 700; color: #64748b; margin-left: 1px; text-transform: none; }
        .stat-label { font-size: 9.5px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 0px; }

        .diagram-card { background: #ffffff; padding: 8px 4px 6px 4px; border-radius: 10px; border: 1px solid #e2e8f0; position: relative; transition: all 0.3s ease; }
        
        .status-pill { position: absolute; right: 4px; top: 4px; width: fit-content; white-space: nowrap; background: #f8fafc; color: #334155; font-size: 9.5px; padding: 1.5px 6px; border-radius: 8px; font-weight: 800; display: inline-flex; align-items: center; gap: 3px; z-index: 10; pointer-events: none; border: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.3px; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }
        .status-pill.ongrid { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; } .status-pill.ongrid .status-dot { background: #16a34a; }
        .status-pill.offline { background: #fef2f2; color: #b91c1c; border-color: #fecaca; } .status-pill.offline .status-dot { background: #dc2626; }
        .status-pill.exporting { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; } .status-pill.exporting .status-dot { background: #0284c7; }
        .status-pill.importing { background: #fffbe6; color: #b45309; border-color: #fde68a; } .status-pill.importing .status-dot { background: #d97706; }
        
        .diagram-svg { width: 100%; height: auto; aspect-ratio: 420 / 450; display: block; overflow: visible; }
        .svg-txt-bold { font-size: 12.5px; font-weight: 800; fill: #0f172a; }
        .svg-txt-sub  { font-size: 9.5px; fill: #475569; font-weight: 700; }
        .highlight-val { font-size: 11.5px; font-weight: 800; fill: #0f172a; }
        .highlight-freq { font-size: 11.5px; font-weight: 800; fill: #0f172a; }
        .unit-lbl { font-size: 9.5px; font-weight: 700; fill: #64748b; }
        .chv-block { fill: #eab308; stroke: #fef08a; stroke-width: 0.5; animation: block-wave 1.2s infinite ease-in-out; }
        @keyframes block-wave { 0% { fill: #fef08a; opacity: 0.2; } 50% { fill: #eab308; opacity: 1; } 100% { fill: #fef08a; opacity: 0.2; } }

        .app-card.dark-mode { background: #0f172a; border-color: #1e293b; }
        .dark-mode .stat-card { background: #1e293b; border-color: #334155; }
        .dark-mode .diagram-card { background: #1e293b; border-color: #334155; }
        
        .dark-mode .stat-value, 
        .dark-mode .svg-txt-bold, 
        .dark-mode .highlight-val, 
        .dark-mode .highlight-freq { color: #f8fafc; fill: #f8fafc; }
        
        .dark-mode .stat-label,
        .dark-mode .stat-value .unit, 
        .dark-mode .svg-txt-sub, 
        .dark-mode .unit-lbl { color: #94a3b8; fill: #94a3b8; }

        .dark-mode .svg-bg-card { fill: #0f172a !important; }
        .dark-mode .svg-inv-bg { fill: #ffffff !important; stroke: #334155 !important; }
        .dark-mode .svg-stroke-dark { stroke: #94a3b8 !important; }

        .dark-mode .status-pill.ongrid { background: #064e3b; color: #4ade80; border-color: #047857; }
        .dark-mode .status-pill.offline { background: #450a0a; color: #f87171; border-color: #991b1b; }
        .dark-mode .status-pill.exporting { background: #0c4a6e; color: #38bdf8; border-color: #0369a1; }
        .dark-mode .status-pill.importing { background: #451a03; color: #fbbf24; border-color: #b45309; }
      </style>

      <ha-card>
        <div class="app-card">
          <div class="stats-grid">
            <!-- Thẻ 1: PV -->
            <div class="stat-card">
              <div class="card-header bg-pv">
                <div class="header-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
                  <span>${t.pv_yield}</span>
                </div>
              </div>
              <div class="card-body-row">
                <div class="stat-row-item">
                  <div class="stat-value" id="stat-pv-today">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label">${t.pv_today}</div>
                </div>
                <div class="stat-row-item">
                  <div class="stat-value highlight-orange" id="stat-pv-total">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label">${t.pv_total}</div>
                </div>
              </div>
            </div>

            <!-- Thẻ 2: Pin nạp / Pin xả -->
            <div class="stat-card">
              <div class="card-header bg-bat">
                <div class="header-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"></rect><line x1="22" x2="22" y1="11" y2="13"></line></svg>
                  <span id="lbl-bat-title">${this._batToggle === 'charge' ? t.bat_charge_title : t.bat_discharge_title}</span>
                </div>
                <span class="toggle-btn" id="btn-toggle-bat" title="Chuyển đổi Nạp/Xả">⇄</span>
              </div>
              <div class="card-body-row">
                <div class="stat-row-item">
                  <div class="stat-value" id="stat-bat-today">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label" id="lbl-bat-today">${this._batToggle === 'charge' ? t.charge_today : t.discharge_today}</div>
                </div>
                <div class="stat-row-item">
                  <div class="stat-value highlight-orange" id="stat-bat-total">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label" id="lbl-bat-total">${this._batToggle === 'charge' ? t.total_charge : t.total_discharge}</div>
                </div>
              </div>
            </div>

            <!-- Thẻ 3: Phát lên lưới / Nhập lưới -->
            <div class="stat-card">
              <div class="card-header bg-grid">
                <div class="header-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"></path><path d="M12 14v8"></path><path d="M12 2v4"></path><path d="M8 2v4"></path><path d="M16 2v4"></path></svg>
                  <span id="lbl-grid-title">${this._gridToggle === 'sell' ? t.grid_export_title : t.grid_import_title}</span>
                </div>
                <span class="toggle-btn" id="btn-toggle-grid" title="Chuyển đổi Phát/Nhập">⇄</span>
              </div>
              <div class="card-body-row">
                <div class="stat-row-item">
                  <div class="stat-value" id="stat-grid-today">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label" id="lbl-grid-today">${this._gridToggle === 'sell' ? t.export_today : t.import_today}</div>
                </div>
                <div class="stat-row-item">
                  <div class="stat-value highlight-orange" id="stat-grid-total">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label" id="lbl-grid-total">${this._gridToggle === 'sell' ? t.total_export : t.total_import}</div>
                </div>
              </div>
            </div>

            <!-- Thẻ 4: Tiêu thụ -->
            <div class="stat-card">
              <div class="card-header bg-load">
                <div class="header-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  <span>${t.load_consumption}</span>
                </div>
              </div>
              <div class="card-body-row">
                <div class="stat-row-item">
                  <div class="stat-value" id="stat-load-today">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label">${t.load_today}</div>
                </div>
                <div class="stat-row-item">
                  <div class="stat-value highlight-orange" id="stat-load-total">0.00 <span class="unit">kWh</span></div>
                  <div class="stat-label">${t.load_total}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="diagram-card">
            <div class="status-pill ongrid" id="sys-status-pill">
              <span class="status-dot"></span> <span id="sys-status-text">${t.grid_ongrid}</span>
            </div>

            <svg class="diagram-svg" viewBox="0 -95 420 450">
              <defs>
                <path id="chv-block-r" d="M 0,0 L 8.5,0 L 12,5 L 8.5,10 L 0,10 L 3.5,5 Z"/>
                <path id="chv-block-l" d="M 12,0 L 3.5,0 L 0,5 L 3.5,10 L 12,10 L 8.5,5 Z"/>
                <path id="chv-block-d" d="M 0,0 L 5,3.5 L 10,0 L 10,8.5 L 5,12 L 0,8.5 Z"/>
                <path id="chv-block-u" d="M 5,0 L 10,3.5 L 10,12 L 5,8.5 L 0,12 L 0,3.5 Z"/>
              </defs>

              <g id="flow-pv">
                <use href="#chv-block-d" x="168" y="-4"  class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-d" x="168" y="12"  class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-d" x="168" y="28"  class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-d" x="168" y="44"  class="chv-block" style="animation-delay: 0.36s;" />
              </g>

              <g id="flow-ac-pv">
                <use href="#chv-block-d" x="291" y="4"   class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-d" x="291" y="20"  class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-d" x="291" y="36"  class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-d" x="291" y="52"  class="chv-block" style="animation-delay: 0.36s;" />
                <use href="#chv-block-d" x="291" y="68"  class="chv-block" style="animation-delay: 0.48s;" />
                <use href="#chv-block-d" x="291" y="84"  class="chv-block" style="animation-delay: 0.60s;" />
              </g>

              <g id="flow-eps">
                <use href="#chv-block-d" x="168" y="154" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-d" x="168" y="170" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-d" x="168" y="186" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-d" x="168" y="202" class="chv-block" style="animation-delay: 0.36s;" />
              </g>

              <g id="flow-bus-to-load">
                <use href="#chv-block-d" x="291" y="112" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-d" x="291" y="127" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-d" x="291" y="142" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-d" x="291" y="157" class="chv-block" style="animation-delay: 0.48s;" />
                <use href="#chv-block-d" x="291" y="172" class="chv-block" style="animation-delay: 0.48s;" />
                <use href="#chv-block-d" x="291" y="187" class="chv-block" style="animation-delay: 0.60s;" />
                <use href="#chv-block-d" x="291" y="202" class="chv-block" style="animation-delay: 0.72s;" />
              </g>

              <g id="flow-bat-discharge">
                <use href="#chv-block-r" x="42" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-r" x="56" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-r" x="70" y="98" class="chv-block" style="animation-delay: 0.24s;" />
              </g>

              <g id="flow-bat-charge">
                <use href="#chv-block-l" x="70" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-l" x="56" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-l" x="42" y="98" class="chv-block" style="animation-delay: 0.24s;" />
              </g>

              <g id="flow-bat2-discharge">
                <use href="#chv-block-r" x="42" y="222" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-r" x="56" y="222" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-r" x="70" y="222" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-u" x="80" y="207" class="chv-block" style="animation-delay: 0.36s;" />
                <use href="#chv-block-u" x="80" y="191" class="chv-block" style="animation-delay: 0.48s;" />
                <use href="#chv-block-u" x="80" y="175" class="chv-block" style="animation-delay: 0.60s;" />
                <use href="#chv-block-u" x="80" y="159" class="chv-block" style="animation-delay: 0.72s;" />
                <use href="#chv-block-u" x="80" y="143" class="chv-block" style="animation-delay: 0.84s;" />
                <use href="#chv-block-u" x="80" y="127" class="chv-block" style="animation-delay: 0.96s;" />
                <use href="#chv-block-u" x="80" y="111" class="chv-block" style="animation-delay: 1.08s;" />
              </g>

              <g id="flow-bat2-charge">
                <use href="#chv-block-d" x="80" y="111" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-d" x="80" y="127" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-d" x="80" y="143" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-d" x="80" y="159" class="chv-block" style="animation-delay: 0.36s;" />
                <use href="#chv-block-d" x="80" y="175" class="chv-block" style="animation-delay: 0.48s;" />
                <use href="#chv-block-d" x="80" y="191" class="chv-block" style="animation-delay: 0.60s;" />
                <use href="#chv-block-d" x="80" y="207" class="chv-block" style="animation-delay: 0.72s;" />
                <use href="#chv-block-l" x="70" y="222" class="chv-block" style="animation-delay: 0.84s;" />
                <use href="#chv-block-l" x="56" y="222" class="chv-block" style="animation-delay: 0.96s;" />
                <use href="#chv-block-l" x="42" y="222" class="chv-block" style="animation-delay: 1.08s;" />
              </g>

              <g id="flow-bat-trunk-discharge">
                <use href="#chv-block-r" x="86" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-r" x="100" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-r" x="114" y="98" class="chv-block" style="animation-delay: 0.24s;" />
              </g>

              <g id="flow-bat-trunk-charge">
                <use href="#chv-block-l" x="114" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-l" x="100" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-l" x="86" y="98" class="chv-block" style="animation-delay: 0.24s;" />
              </g>

              <g id="flow-inv-to-bus">
                <use href="#chv-block-r" x="220" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-r" x="234" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-r" x="248" y="98" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-r" x="262" y="98" class="chv-block" style="animation-delay: 0.36s;" />
                <use href="#chv-block-r" x="276" y="98" class="chv-block" style="animation-delay: 0.48s;" />
              </g>

              <g id="flow-bus-to-inv">
                <use href="#chv-block-l" x="276" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-l" x="262" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-l" x="248" y="98" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-l" x="234" y="98" class="chv-block" style="animation-delay: 0.36s;" />
                <use href="#chv-block-l" x="220" y="98" class="chv-block" style="animation-delay: 0.48s;" />
              </g>

              <g id="flow-grid-import">
                <use href="#chv-block-l" x="346" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-l" x="332" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-l" x="318" y="98" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-l" x="304" y="98" class="chv-block" style="animation-delay: 0.36s;" />
              </g>

              <g id="flow-grid-export">
                <use href="#chv-block-r" x="304" y="98" class="chv-block" style="animation-delay: 0.00s;" />
                <use href="#chv-block-r" x="318" y="98" class="chv-block" style="animation-delay: 0.12s;" />
                <use href="#chv-block-r" x="332" y="98" class="chv-block" style="animation-delay: 0.24s;" />
                <use href="#chv-block-r" x="346" y="98" class="chv-block" style="animation-delay: 0.48s;" />
              </g>

              <circle id="ac-bus-node" cx="296" cy="103" r="5" fill="#16a34a" stroke="#ffffff" stroke-width="1.5"/>

              <!-- Khối PV DC -->
              <g id="grp-pv" transform="translate(4, -12)">
                <g id="grp-pv1">
                  <text id="lbl-pv1" x="0" y="0" class="svg-txt-sub" text-anchor="start">PV1</text>
                  <text id="line-pv1-v" x="26" y="0" text-anchor="start"><tspan id="txt-pv1-v" class="svg-txt-bold">0.0</tspan><tspan class="unit-lbl" dx="3"> V</tspan></text>
                  <text id="line-pv1-p" x="88" y="0" text-anchor="start"><tspan id="txt-pv1-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                </g>
                <g id="grp-pv2">
                  <text id="lbl-pv2" x="0" y="0" class="svg-txt-sub" text-anchor="start">PV2</text>
                  <text id="line-pv2-v" x="26" y="0" text-anchor="start"><tspan id="txt-pv2-v" class="svg-txt-bold">0.0</tspan><tspan class="unit-lbl" dx="3"> V</tspan></text>
                  <text id="line-pv2-p" x="88" y="0" text-anchor="start"><tspan id="txt-pv2-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                </g>
                <g id="grp-pv3">
                  <text id="lbl-pv3" x="0" y="0" class="svg-txt-sub" text-anchor="start">PV3</text>
                  <text id="line-pv3-v" x="26" y="0" text-anchor="start"><tspan id="txt-pv3-v" class="svg-txt-bold">0.0</tspan><tspan class="unit-lbl" dx="3"> V</tspan></text>
                  <text id="line-pv3-p" x="88" y="0" text-anchor="start"><tspan id="txt-pv3-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                </g>
                <g id="grp-pv4">
                  <text id="lbl-pv4" x="0" y="0" class="svg-txt-sub" text-anchor="start">PV4</text>
                  <text id="line-pv4-v" x="26" y="0" text-anchor="start"><tspan id="txt-pv4-v" class="svg-txt-bold">0.0</tspan><tspan class="unit-lbl" dx="3"> V</tspan></text>
                  <text id="line-pv4-p" x="88" y="0" text-anchor="start"><tspan id="txt-pv4-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                </g>

                <g id="grp-pv-total">
                  <text id="lbl-pv-total-sub" x="0" y="0" class="svg-txt-sub" text-anchor="start">${t.pv_power_lbl}</text>
                  <text id="line-pv-total-p" x="88" y="0" text-anchor="start">
                    <tspan id="txt-pv-total-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan>
                  </text>
                </g>

                <g id="grp-pv-icon" transform="translate(138, -56) scale(0.57)">
                  <g stroke="#52b788" stroke-width="4.5" stroke-linecap="round" fill="none">
                    <circle cx="34" cy="34" r="14" />
                    <line x1="34" y1="12" x2="34" y2="5" />
                    <line x1="18" y1="18" x2="13" y2="13" />
                    <line x1="12" y1="34" x2="5" y2="34" />
                    <line x1="18" y1="50" x2="13" y2="55" />
                    <line x1="50" y1="18" x2="55" y2="13" />
                    <line x1="56" y1="34" x2="63" y2="34" />
                  </g>
                  <polygon points="32,42 86,42 96,86 18,86" fill="#52b788" stroke="#52b788" stroke-width="4" stroke-linejoin="round"/>
                  <g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.9">
                    <line x1="28.5" y1="53" x2="88.5" y2="53" />
                    <line x1="25" y1="64" x2="91" y2="64" />
                    <line x1="21.5" y1="75" x2="93.5" y2="75" />
                    <line x1="45.5" y1="42" x2="37.5" y2="86" />
                    <line x1="59" y1="42" x2="57" y2="86" />
                    <line x1="72.5" y1="42" x2="76.5" y2="86" />
                  </g>
                </g>
              </g>

              <!-- Khối PV AC -->
              <g id="grp-pv-ac">
                <text id="line-ac-pv-1p" x="320" y="0" text-anchor="start"><tspan id="txt-ac-pv-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-ac-pv-l1" x="320" y="0" text-anchor="start" style="display:none;"><tspan id="txt-ac-pv-l1" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-ac-pv-l2" x="320" y="0" text-anchor="start" style="display:none;"><tspan id="txt-ac-pv-l2" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-ac-pv-l3" x="320" y="0" text-anchor="start" style="display:none;"><tspan id="txt-ac-pv-l3" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-ac-pv-v" x="320" y="0" text-anchor="start"><tspan id="txt-ac-pv-v" class="highlight-val">0.0</tspan><tspan class="unit-lbl" dx="3"> V</tspan></text>
                <text id="line-ac-pv-f" x="320" y="0" text-anchor="start"><tspan id="txt-ac-pv-f" class="highlight-freq">0.00</tspan><tspan class="unit-lbl" dx="3"> Hz</tspan></text>

                <g transform="translate(274, -58) scale(0.925)">
                  <rect class="svg-bg-card" x="0" y="0" width="44" height="49" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.8" stroke-dasharray="3.5,3"/>
                  <g transform="translate(-5, -1)">
                    <g fill="#10b981">
                      <polygon points="18,5 42,5 36,11 12,11" />
                      <polygon points="18,12 42,12 36,18 12,18" />
                    </g>
                    <g>
                      <rect class="svg-bg-card" x="9" y="24" width="36" height="22" rx="4" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
                      <line x1="11" y1="43" x2="43" y2="27" stroke="#cbd5e1" stroke-width="1.2"/>
                      <line class="svg-stroke-dark" x1="13" y1="29" x2="21" y2="29" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
                      <line class="svg-stroke-dark" x1="13" y1="33" x2="21" y2="33" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
                      <path class="svg-stroke-dark" d="M 31 35 Q 33.5 33, 36 35 T 41 35" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
                      <path class="svg-stroke-dark" d="M 31 39 Q 33.5 37, 36 39 T 41 39" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
                    </g>
                  </g>
                </g>
              </g>

              <!-- Khối Pin Lưu Trữ 1 -->
              <g id="grp-bat1" transform="translate(5, 72)">
                <rect x="11" y="1" width="10" height="4" rx="1.5" fill="#16a34a"/>
                <rect class="svg-bg-card" x="2" y="5" width="28" height="48" rx="4" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
                <rect id="bat-fill" x="4" y="7" width="24" height="43" rx="1.5" fill="#16a34a"/>

                <text id="line-bat-p" x="0" y="0" text-anchor="start"><tspan id="txt-bat-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="lbl-bat-mode" x="0" y="0" class="svg-txt-sub" text-anchor="start">${t.bat_standby}</text>
                <text id="line-bat-v" x="0" y="0" text-anchor="start"><tspan id="txt-bat-v" class="highlight-val">0.0</tspan><tspan class="unit-lbl" dx="3"> V</tspan></text>
                <text id="line-bat-soc" x="0" y="0" text-anchor="start"><tspan id="txt-soc-val" font-size="13px" font-weight="bold" fill="#16a34a">0</tspan><tspan class="unit-lbl" dx="1" fill="#16a34a">%</tspan></text>
              </g>

              <!-- Khối Pin Lưu Trữ 2 -->
              <g id="grp-bat2" transform="translate(5, 196)" style="display: none;">
                <rect x="11" y="1" width="10" height="4" rx="1.5" fill="#16a34a"/>
                <rect class="svg-bg-card" x="2" y="5" width="28" height="48" rx="4" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
                <rect id="bat2-fill" x="4" y="7" width="24" height="43" rx="1.5" fill="#16a34a"/>

                <text id="line-bat2-p" x="0" y="0" text-anchor="start"><tspan id="txt-bat2-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="lbl-bat2-mode" x="0" y="0" class="svg-txt-sub" text-anchor="start">${t.bat_standby}</text>
                <text id="line-bat2-v" x="0" y="0" text-anchor="start"><tspan id="txt-bat2-v" class="highlight-val">0.0</tspan><tspan class="unit-lbl" dx="3"> V</tspan></text>
                <text id="line-bat2-soc" x="0" y="0" text-anchor="start"><tspan id="txt-soc2-val" font-size="13px" font-weight="bold" fill="#16a34a">0</tspan><tspan class="unit-lbl" dx="1" fill="#16a34a">%</tspan></text>
              </g>

              <!-- Khối Inverter -->
              <g transform="translate(144, 74)">
                <g id="inv-default-graphics">
                  <rect class="svg-inv-bg" x="0" y="0" width="58" height="58" rx="6" fill="#ffffff" stroke="#334155" stroke-width="2"/>
                  <circle cx="10" cy="10" r="3.5" fill="#16a34a" id="inv-led"/>
                  <rect x="11" y="18" width="36" height="22" rx="2" fill="#0f172a"/>
                  <rect x="13" y="20" width="32" height="18" rx="1" fill="#020617"/>
                  <text id="inv-lcd-time" x="29" y="32" font-size="7.5" font-weight="bold" fill="#16a34a" font-family="monospace" text-anchor="middle">00:00:00</text>
                </g>
                <image id="inv-custom-image" x="0" y="0" width="58" height="58" preserveAspectRatio="xMidYMid meet" style="display: none;" />
              </g>

              <!-- Khối Điện Lưới -->
              <g id="grp-grid" transform="translate(374, 32.5)">
                <text id="line-grid-1p" x="21" y="0" text-anchor="middle"><tspan id="txt-grid-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-grid-l1" x="21" y="0" text-anchor="middle" style="display:none;"><tspan id="txt-grid-l1" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-grid-l2" x="21" y="0" text-anchor="middle" style="display:none;"><tspan id="txt-grid-l2" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-grid-l3" x="21" y="0" text-anchor="middle" style="display:none;"><tspan id="txt-grid-l3" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>

                <svg x="-9" y="38" width="65" height="65" viewBox="0 0 500 600">
                  <g fill="#61C68C" stroke="#61C68C" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M 250 40 L 140 550 M 250 40 L 360 550" fill="none" stroke-width="22" />
                    <path d="M 242 80 L 258 80 M 250 40 L 258 80 M 250 40 L 242 80" fill="none" stroke-width="3" />
                    <path d="M 235 120 L 265 120 M 242 80 L 265 120 M 258 80 L 235 120" fill="none" stroke-width="4.5" />
                    <path d="M 228 160 L 272 160 M 235 120 L 272 160 M 265 120 L 228 160" fill="none" stroke-width="6" />
                    <path d="M 220 205 L 280 205 M 228 160 L 280 205 M 272 160 L 220 205" fill="none" stroke-width="7.5" />
                    <path d="M 212 250 L 288 250 M 220 205 L 288 250 M 280 205 L 212 250" fill="none" stroke-width="9" />
                    <path d="M 200 305 L 300 305 M 212 250 L 300 305 M 288 250 L 200 305" fill="none" stroke-width="10.5" />
                    <path d="M 186 365 L 314 365 M 200 305 L 314 365 M 300 305 L 186 365" fill="none" stroke-width="12" />
                    <path d="M 170 430 L 330 430 M 186 365 L 330 430 M 314 365 L 170 430" fill="none" stroke-width="13.5" />
                    <path d="M 152 490 L 348 490 M 170 430 L 348 490 M 330 430 L 152 490 M 152 490 L 360 550 M 348 490 L 140 550" fill="none" stroke-width="15" />
                    <path d="M 228 160 L 145 190 Q 138 193 145 200 L 220 205 Z" stroke-width="3" />
                    <path d="M 272 160 L 355 190 Q 362 193 355 200 L 280 205 Z" stroke-width="3" />
                    <path d="M 152 202 A 12 12 0 0 0 176 202" fill="none" stroke-width="4.5" />
                    <path d="M 152 210 A 12 12 0 0 0 176 210" fill="none" stroke-width="4.5" />
                    <path d="M 152 218 A 12 12 0 0 0 176 218" fill="none" stroke-width="4.5" />
                    <path d="M 324 202 A 12 12 0 0 0 348 202" fill="none" stroke-width="4.5" />
                    <path d="M 324 210 A 12 12 0 0 0 348 210" fill="none" stroke-width="4.5" />
                    <path d="M 324 218 A 12 12 0 0 0 348 218" fill="none" stroke-width="4.5" />
                    <path d="M 212 250 L 68 280 Q 60 283 68 295 L 200 305 Z M 140 265 L 140 295" stroke-width="3" />
                    <path d="M 288 250 L 432 280 Q 440 283 432 295 L 300 305 Z M 360 265 L 360 295" stroke-width="3" />
                    <path d="M 95 292 A 12 12 0 0 0 119 292" fill="none" stroke-width="4.5" />
                    <path d="M 95 300 A 12 12 0 0 0 119 300" fill="none" stroke-width="4.5" />
                    <path d="M 95 308 A 12 12 0 0 0 119 308" fill="none" stroke-width="4.5" />
                    <path d="M 100 310 Q 130 350 160 310" fill="none" stroke-width="4.5" />
                    <path d="M 381 292 A 12 12 0 0 0 405 292" fill="none" stroke-width="4.5" />
                    <path d="M 381 300 A 12 12 0 0 0 405 300" fill="none" stroke-width="4.5" />
                    <path d="M 381 308 A 12 12 0 0 0 405 308" fill="none" stroke-width="4.5" />
                    <path d="M 340 310 Q 370 350 400 310" fill="none" stroke-width="4.5" />
                  </g>
                </svg>

                <text id="line-grid-v" x="21" y="0" text-anchor="middle"><tspan id="txt-grid-v" class="highlight-val">0.0</tspan><tspan class="unit-lbl" dx="1">Vac</tspan></text>
                <text id="line-grid-f" x="21" y="0" text-anchor="middle"><tspan id="txt-grid-f" class="highlight-freq">0.00</tspan><tspan class="unit-lbl" dx="1">Hz</tspan></text>
              </g>

              <!-- Khối EPS -->
              <g id="grp-eps" transform="translate(154, 232)">
                <svg id="icon-eps" x="0" y="0" width="56" height="56" viewBox="0 0 60 60">
                  <g stroke="#52b788" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="8" y="8" width="23" height="12" rx="3"/>
                    <text x="19.5" y="16.5" font-size="7.5" font-weight="bold" fill="#52b788" stroke="none" text-anchor="middle" font-family="sans-serif">UPS</text>

                    <circle cx="43" cy="23" r="9"/>
                    <line x1="40" y1="19" x2="40" y2="27" stroke-width="2.5"/>
                    <line x1="46" y1="19" x2="46" y2="27" stroke-width="2.5"/>

                    <path d="M 8 20 C 12 28, 10 38, 12 43 L 24 43"/>

                    <path d="M 23 37 C 23 37, 32 34, 35 43 C 36 48, 30 52, 24 50 Z" fill="#52b788"/>
                    <line x1="31" y1="34" x2="35" y2="30" stroke-width="2.5"/>
                    <line x1="36" y1="39" x2="40" y2="35" stroke-width="2.5"/>
                  </g>
                </svg>

                <text id="line-eps-1p" x="52" y="0"><tspan id="txt-eps-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-eps-l1" x="52" y="0" style="display:none;"><tspan id="txt-eps-l1" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-eps-l2" x="52" y="0" style="display:none;"><tspan id="txt-eps-l2" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-eps-l3" x="52" y="0" style="display:none;"><tspan id="txt-eps-l3" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>

                <text id="line-eps-v" x="52" y="0"><tspan id="txt-eps-v" class="highlight-val">0.0</tspan><tspan class="unit-lbl" dx="1">Vac</tspan></text>
                <text id="line-eps-f" x="52" y="0"><tspan id="txt-eps-f" class="highlight-freq">0.00</tspan><tspan class="unit-lbl" dx="3"> Hz</tspan></text>

                <text x="0" y="64" id="lbl-eps-sub" class="svg-txt-sub">${t.backup_power}</text>
                <text x="0" y="75" id="lbl-eps-standby" style="font-size: 9px; fill: #16a34a; font-weight: 800; display: none;">${t.standby_mode}</text>
              </g>

              <!-- Khối tiêu thụ -->
              <g transform="translate(273, 232)">
                <svg id="icon-load" x="0" y="0" width="54" height="54" viewBox="0 0 100 100">
                  <rect class="load-icon-color" x="27" y="14" width="10" height="20" rx="1" fill="#52b788"/>
                  <path class="load-icon-stroke" d="M 10 50 L 50 21 L 90 50" fill="none" stroke="#52b788" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path class="load-icon-color" d="M 50 29.5 L 82 52.5 L 82 85 C 82 86.5 80.5 88 79 88 L 21 88 C 19.5 88 18 86.5 18 85 L 18 52.5 Z" fill="#52b788"/>
                  <polygon points="52,45.5 42,60.5 49.5,60.5 46.5,78.5 58,59.5 50.5,59.5" fill="#ffffff"/>
                </svg>

                <text id="line-load-1p" x="56" y="0"><tspan id="txt-load-p" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-load-l1" x="56" y="0" style="display:none;"><tspan id="txt-load-l1" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-load-l2" x="56" y="0" style="display:none;"><tspan id="txt-load-l2" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>
                <text id="line-load-l3" x="56" y="0" style="display:none;"><tspan id="txt-load-l3" class="svg-txt-bold">0</tspan><tspan class="unit-lbl" dx="3"> W</tspan></text>

                <text id="lbl-load-sub" x="56" y="0" class="svg-txt-sub">${t.consumption}</text>
              </g>
            </svg>
          </div>
        </div>
      </ha-card>
    `;

    const batBtn = this.shadowRoot.getElementById('btn-toggle-bat');
    if (batBtn) {
      batBtn.onclick = (e) => {
        e.stopPropagation();
        this._batToggle = this._batToggle === 'charge' ? 'discharge' : 'charge';
        this.updateData();
      };
    }

    const gridBtn = this.shadowRoot.getElementById('btn-toggle-grid');
    if (gridBtn) {
      gridBtn.onclick = (e) => {
        e.stopPropagation();
        this._gridToggle = this._gridToggle === 'sell' ? 'buy' : 'sell';
        this.updateData();
      };
    }

    this.updateData();
  }

  getCardSize() {
    return 5;
  }
}

customElements.define('power-flow-card-inverter', PowerFlowCardInverter);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "power-flow-card-inverter",
  name: "Power Flow Card Inverter",
  description: "Sơ đồ luồng năng lượng cho Inverter Hybrid (1 Pha / 3 Pha)"
});
