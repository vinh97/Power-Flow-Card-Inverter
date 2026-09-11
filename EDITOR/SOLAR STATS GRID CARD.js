/**
 * ============================================================================
 * HƯỚNG DẪN CẤU HÌNH YAML TRONG HOME ASSISTANT
 * ============================================================================
 * 1. Đặt file JS này vào thư mục: /config/www/solar-stats-grid-card.js
 * 2. Thêm Resource vào Dashboard (Settings -> Dashboards -> Resources):
 *    - URL: /local/solar-stats-grid-card.js
 *    - Resource Type: JavaScript Module
 * 
 * 3. Ví dụ mẫu cấu hình Card dạng YAML trong Dashboard:
 * 
 * type: custom:solar-stats-grid-card
 * entities:
 *   pv_daily: sensor.solar_daily_energy
 *   pv_total: sensor.solar_total_energy
 *   load_daily: sensor.load_daily_energy
 *   load_total: sensor.load_total_energy
 *   battery_charge_daily: sensor.battery_charge_daily_energy
 *   battery_charge_total: sensor.battery_charge_total_energy
 *   battery_discharge_daily: sensor.battery_discharge_daily_energy
 *   battery_discharge_total: sensor.battery_discharge_total_energy
 *   grid_buy_daily: sensor.grid_import_daily_energy
 *   grid_buy_total: sensor.grid_import_total_energy
 *   grid_sell_daily: sensor.grid_export_daily_energy
 *   grid_sell_total: sensor.grid_export_total_energy
 * ============================================================================
 */

class SolarStatsGridCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Khởi tạo trạng thái mặc định cho các nút Toggle
    this._batToggle = 'discharge'; // Mặc định hiển thị 'Xả Pin' ('charge' hoặc 'discharge')
    this._gridToggle = 'buy';      // Mặc định hiển thị 'Nhập Lưới' ('sell' hoặc 'buy')
    this._hass = null;
    this.config = {};
  }

  // Nhận cấu hình Card từ YAML Dashboard
  setConfig(config) {
    if (!config.entities) {
      throw new Error('Vui lòng khai báo danh sách entities trong cấu hình YAML.');
    }
    this.config = config;
    this.render();
  }

  // Lắng nghe dữ liệu Realtime cập nhật từ Home Assistant
  set hass(hass) {
    this._hass = hass;
    this.updateStatsData();
  }

  // Hàm tiện ích: Lấy giá trị số từ entity Home Assistant
  getState(entityId) {
    if (!this._hass || !entityId || !this._hass.states[entityId]) return 0;
    return parseFloat(this._hass.states[entityId].state) || 0;
  }

  // Hàm tiện ích: Lấy phần tử DOM từ Shadow DOM
  getEl(id) {
    return this.shadowRoot.getElementById(id);
  }

  // Hàm tiện ích: Gán chữ an toàn vào DOM
  setText(id, text) {
    const el = this.getEl(id);
    if (el) el.textContent = text;
  }

  // ==========================================================================
  // PHẦN 1: LOGIC ĐỊNH DẠNG ĐƠN VỊ ĐIỆN NĂNG (ENERGY UNIT FORMATTER)
  // Tự động chuyển kWh -> MWh khi >= 1000 kWh và làm tròn chữ số thập phân
  // ==========================================================================
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

  // ==========================================================================
  // PHẦN 2: LOGIC XỬ LÝ NÚT CHUYỂN ĐỔI TRẠNG THÁI (TOGGLE HANDLERS)
  // Đảo trạng thái hiển thị Nạp/Xả (Pin) và Phát/Nhập (Lưới) khi click nút ⇄
  // ==========================================================================
  attachEventListeners() {
    const btnBat = this.getEl('btn-toggle-bat');
    if (btnBat) {
      btnBat.onclick = (e) => {
        e.stopPropagation();
        this._batToggle = this._batToggle === 'charge' ? 'discharge' : 'charge';
        this.updateStatsData();
      };
    }

    const btnGrid = this.getEl('btn-toggle-grid');
    if (btnGrid) {
      btnGrid.onclick = (e) => {
        e.stopPropagation();
        this._gridToggle = this._gridToggle === 'sell' ? 'buy' : 'sell';
        this.updateStatsData();
      };
    }
  }

  // ==========================================================================
  // PHẦN 3: LOGIC CẬP NHẬT DỮ LIỆU REALTIME (DATA UPDATE)
  // Đọc entity từ cấu hình YAML và cập nhật số liệu/nhãn hiển thị theo thời gian thực
  // ==========================================================================
  updateStatsData() {
    if (!this._hass) return;
    const ent = this.config.entities || {};
    const t = this.getTranslation();

    // 1. Cập nhật Thẻ PV (Sản lượng Mặt Trời)
    this.setEnergyStat('stat-pv-today', this.getState(ent.pv_daily));
    this.setEnergyStat('stat-pv-total', this.getState(ent.pv_total));

    // 2. Cập nhật Thẻ Tải Tiêu Thụ
    this.setEnergyStat('stat-load-today', this.getState(ent.load_daily));
    this.setEnergyStat('stat-load-total', this.getState(ent.load_total));

    // 3. Cập nhật Thẻ Pin (Theo trạng thái Nạp hoặc Xả)
    const isBatCharge = this._batToggle === 'charge';
    this.setText('lbl-bat-title', isBatCharge ? t.bat_charge_title : t.bat_discharge_title);
    this.setText('lbl-bat-today', isBatCharge ? t.charge_today : t.discharge_today);
    this.setText('lbl-bat-total', isBatCharge ? t.total_charge : t.total_discharge);
    this.setEnergyStat('stat-bat-today', this.getState(isBatCharge ? ent.battery_charge_daily : ent.battery_discharge_daily));
    this.setEnergyStat('stat-bat-total', this.getState(isBatCharge ? ent.battery_charge_total : ent.battery_discharge_total));

    // 4. Cập nhật Thẻ Lưới Điện (Theo trạng thái Phát hoặc Nhập)
    const isGridSell = this._gridToggle === 'sell';
    this.setText('lbl-grid-title', isGridSell ? t.grid_export_title : t.grid_import_title);
    this.setText('lbl-grid-today', isGridSell ? t.export_today : t.import_today);
    this.setText('lbl-grid-total', isGridSell ? t.total_export : t.total_import);
    this.setEnergyStat('stat-grid-today', this.getState(isGridSell ? ent.grid_sell_daily : ent.grid_buy_daily));
    this.setEnergyStat('stat-grid-total', this.getState(isGridSell ? ent.grid_sell_total : ent.grid_buy_total));
  }

  // Danh mục từ điển ngôn ngữ hiển thị
  getTranslation() {
    return {
      pv_yield: 'Quang Điện',
      pv_today: 'Hôm nay',
      pv_total: 'Tổng cộng',
      bat_charge_title: 'Sạc Pin',
      bat_discharge_title: 'Xả Pin',
      charge_today: 'Nạp hôm nay',
      discharge_today: 'Xả hôm nay',
      total_charge: 'Tổng nạp',
      total_discharge: 'Tổng xả',
      grid_import_title: 'Nhập Lưới',
      grid_export_title: 'Phát Lưới',
      import_today: 'Mua hôm nay',
      export_today: 'Bán hôm nay',
      total_import: 'Tổng mua',
      total_export: 'Tổng bán',
      load_consumption: 'Tải Tiêu Thụ',
      load_today: 'Hôm nay',
      load_total: 'Tổng cộng'
    };
  }

  // ==========================================================================
  // PHẦN 4 & 5: DỰNG CẤU TRÚC HTML VÀ ĐỊNH KIỂU CSS (RENDER TEMPLATE)
  // ==========================================================================
  render() {
    const t = this.getTranslation();

    this.shadowRoot.innerHTML = `
      <!-- PHẦN 5: ĐỊNH KIỂU CSS STYLES -->
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 4px;
        }
        .stat-card {
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .card-header {
          padding: 2px 6px;
          font-size: 11px;
          color: #ffffff;
          font-weight: 800;
          white-space: nowrap;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-title { display: flex; align-items: center; gap: 3px; }
        .bg-pv { background: #0284c7; }
        .bg-bat { background: #ec4899; }
        .bg-grid { background: #f97316; }
        .bg-load { background: #10b981; }

        .toggle-btn {
          cursor: pointer;
          user-select: none;
          font-size: 12px;
          padding: 0 2px;
          transition: transform 0.2s;
        }
        .toggle-btn:hover { transform: scale(1.2); }

        .card-body-row {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 3px 6px;
          text-align: left;
        }
        .stat-row-item { display: flex; flex-direction: column; align-items: flex-start; }
        .stat-value { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.0; }
        .stat-value.highlight-orange { color: #f97316; }
        .stat-value .unit { font-size: 10px; font-weight: 700; color: #64748b; margin-left: 1px; text-transform: none; }
        .stat-label { font-size: 9.5px; color: #64748b; font-weight: 600; text-transform: uppercase; }

        /* Hỗ trợ Giao diện Tối (Dark Mode) */
        @media (prefers-color-scheme: dark) {
          .stat-card { background: #1e293b; border-color: #334155; }
          .stat-value { color: #f8fafc; }
          .stat-label, .stat-value .unit { color: #94a3b8; }
        }
      </style>

      <!-- PHẦN 4: CẤU TRÚC GIAO DIỆN HTML TEMPLATE -->
      <div class="stats-grid">
        <!-- Thẻ 1: PV -->
        <div class="stat-card">
          <div class="card-header bg-pv">
            <div class="header-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
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

        <!-- Thẻ 2: Pin -->
        <div class="stat-card">
          <div class="card-header bg-bat">
            <div class="header-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/></svg>
              <span id="lbl-bat-title">${t.bat_discharge_title}</span>
            </div>
            <span class="toggle-btn" id="btn-toggle-bat" title="Chuyển đổi Nạp/Xả">⇄</span>
          </div>
          <div class="card-body-row">
            <div class="stat-row-item">
              <div class="stat-value" id="stat-bat-today">0.00 <span class="unit">kWh</span></div>
              <div class="stat-label" id="lbl-bat-today">${t.discharge_today}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-value highlight-orange" id="stat-bat-total">0.00 <span class="unit">kWh</span></div>
              <div class="stat-label" id="lbl-bat-total">${t.total_discharge}</div>
            </div>
          </div>
        </div>

        <!-- Thẻ 3: Điện lưới -->
        <div class="stat-card">
          <div class="card-header bg-grid">
            <div class="header-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 10.5V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5M12 14v8M12 2v4M8 2v4M16 2v4"/></svg>
              <span id="lbl-grid-title">${t.grid_import_title}</span>
            </div>
            <span class="toggle-btn" id="btn-toggle-grid" title="Chuyển đổi Phát/Nhập">⇄</span>
          </div>
          <div class="card-body-row">
            <div class="stat-row-item">
              <div class="stat-value" id="stat-grid-today">0.00 <span class="unit">kWh</span></div>
              <div class="stat-label" id="lbl-grid-today">${t.import_today}</div>
            </div>
            <div class="stat-row-item">
              <div class="stat-value highlight-orange" id="stat-grid-total">0.00 <span class="unit">kWh</span></div>
              <div class="stat-label" id="lbl-grid-total">${t.total_import}</div>
            </div>
          </div>
        </div>

        <!-- Thẻ 4: Tiêu thụ -->
        <div class="stat-card">
          <div class="card-header bg-load">
            <div class="header-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
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
    `;

    // Khởi tạo lại sự kiện và cập nhật giá trị số liệu ban đầu
    this.attachEventListeners();
    this.updateStatsData();
  }
}

// Đăng ký Custom Element với trình duyệt / Home Assistant
customElements.define('solar-stats-grid-card', SolarStatsGridCard);