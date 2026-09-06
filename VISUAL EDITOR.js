/* =========================================================
   VISUAL EDITOR
   ========================================================= */
class PowerFlowCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
    } else {
      this._render();
    }
  }

  _render() {
    if (!this.shadowRoot) return;

    if (!this._form) {
      this.shadowRoot.innerHTML = '';
      this._form = document.createElement('ha-form');
      this._form.addEventListener('value-changed', (ev) => this._valueChanged(ev));
      this.shadowRoot.appendChild(this._form);
    }

    const entitySelector = { entity: {} };

    const schema = [
      {
        name: "language",
        label: "Ngôn ngữ / Language",
        selector: {
          select: {
            options: [
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" }
            ]
          }
        }
      },
      { name: "dark_mode", label: "Giao diện tối                              (Dark Mode)", selector: { boolean: {} } },
      { name: "three_phase", label: "Hệ thống điện 3 pha                      (Three_phase)", selector: { boolean: {} } },
      { name: "single_load_mode", label: "Chế độ 1 tải Load/EPS               (single_load_mode)", selector: { boolean: {} } },
      { name: "always_show_ac_pv", label: "Luôn hiển thị Hoà lưới/Máy phát    (always_show_ac_pv)", selector: { boolean: {} } },
      { name: "invert_grid_power", label: "Đảo chiều công suất lưới           (invert_grid_power)", selector: { boolean: {} } },
      { name: "invert_battery_power", label: "Đảo chiều công suất Pin 1       (invert_battery_power)", selector: { boolean: {} } },
      { name: "always_show_battery2", label: "Luôn hiển thị Pin lưu trữ 2     (always_show_battery2)", selector: { boolean: {} } },
      { name: "invert_battery2_power", label: "Đảo chiều công suất Pin 2      (invert_battery2_power)", selector: { boolean: {} } },
      { name: "inverter_image", label: "Bật tùy chỉnh ảnh Biến tần            (Set true to use custom image)", selector: { boolean: {} } },
	  { name: "inverter_icon", label: "Icon Biến tần                          (inverter_icon)", selector: { icon: {} } },
      { name: "inverter_icon", label: "Tùy chỉnh ảnh Biến tần                 (Đường dẫn / URL)    (inverter_image) ", selector: { text: {} } },
      { name: "inverter_x", label: "Tọa độ X Biến tần                         (Inverter X coordinate)(Default: 144)", selector: { number: { min: 0, max: 500, step: 1, mode: "box" } } },
      { name: "inverter_y", label: "Tọa độ Y Biến tần                         (Inverter Y coordinate)(Default: 74)", selector: { number: { min: 0, max: 500, step: 1, mode: "box" } } },
      { name: "inverter_width", label: "Chiều rộng hình ảnh                   (Image width)(Default: 58)", selector: { number: { min: 0, max: 500, step: 1, mode: "box" } } },
      { name: "inverter_height", label: "Chiều cao hình ảnh                   (Image height)(Default: 58)", selector: { number: { min: 0, max: 500, step: 1, mode: "box" } } },

      {
        name: "entities",
        title: "Khai báo Thực thể / Entities",
        type: "expandable",
        schema: [
          // PV DC
          { name: "pv_power", label: "PV - Tổng công suất", selector: entitySelector },
          { name: "pv_daily", label: "PV - Sản lượng hôm nay", selector: entitySelector },
          { name: "pv_total", label: "PV - Tổng sản lượng", selector: entitySelector },
          { name: "pv1_power", label: "PV1 - Công suất", selector: entitySelector },
          { name: "pv1_voltage", label: "PV1 - Điện áp", selector: entitySelector },
          { name: "pv2_power", label: "PV2 - Công suất", selector: entitySelector },
          { name: "pv2_voltage", label: "PV2 - Điện áp", selector: entitySelector },
          { name: "pv3_power", label: "PV3 - Công suất", selector: entitySelector },
          { name: "pv3_voltage", label: "PV3 - Điện áp", selector: entitySelector },
          { name: "pv4_power", label: "PV4 - Công suất", selector: entitySelector },
          { name: "pv4_voltage", label: "PV4 - Điện áp", selector: entitySelector },

          // Hoà lưới/Máy phát
          { name: "ac_pv_power", label: "Hoà lưới/Máy phát - Công suất", selector: entitySelector },
          { name: "ac_pv_voltage", label: "Hoà lưới/Máy phát - Điện áp", selector: entitySelector },
          { name: "ac_pv_frequency", label: "Hoà lưới/Máy phát - Tần số", selector: entitySelector },
          { name: "ac_pv_power_l1", label: "Hoà lưới/Máy phát - Công suất L1", selector: entitySelector },
          { name: "ac_pv_power_l2", label: "Hoà lưới/Máy phát - Công suất L2", selector: entitySelector },
          { name: "ac_pv_power_l3", label: "Hoà lưới/Máy phát - Công suất L3", selector: entitySelector },

          // Grid
          { name: "grid_power", label: "Lưới - Công suất 1 pha", selector: entitySelector },
          { name: "grid_voltage", label: "Lưới - Điện áp", selector: entitySelector },
          { name: "grid_frequency", label: "Lưới - Tần số", selector: entitySelector },
          { name: "grid_buy_daily", label: "Lưới - Nhập hôm nay", selector: entitySelector },
          { name: "grid_buy_total", label: "Lưới - Tổng nhập", selector: entitySelector },
          { name: "grid_sell_daily", label: "Lưới - Phát hôm nay", selector: entitySelector },
          { name: "grid_sell_total", label: "Lưới - Tổng phát", selector: entitySelector },
          { name: "grid_power_l1", label: "Lưới - Công suất L1", selector: entitySelector },
          { name: "grid_power_l2", label: "Lưới - Công suất L2", selector: entitySelector },
          { name: "grid_power_l3", label: "Lưới - Công suất L3", selector: entitySelector },
          { name: "grid_voltage_l1", label: "Lưới - Điện áp L1", selector: entitySelector },

          // Load
          { name: "load_power", label: "Tải - Công suất 1 pha", selector: entitySelector },
          { name: "load_daily", label: "Tải - Tiêu thụ hôm nay", selector: entitySelector },
          { name: "load_total", label: "Tải - Tổng tiêu thụ", selector: entitySelector },
          { name: "load_power_l1", label: "Tải - Công suất L1", selector: entitySelector },
          { name: "load_power_l2", label: "Tải - Công suất L2", selector: entitySelector },
          { name: "load_power_l3", label: "Tải - Công suất L3", selector: entitySelector },

          // EPS
          { name: "eps_power", label: "EPS - Công suất 1 pha", selector: entitySelector },
          { name: "eps_voltage", label: "EPS - Điện áp", selector: entitySelector },
          { name: "eps_frequency", label: "EPS - Tần số", selector: entitySelector },
          { name: "eps_power_l1", label: "EPS - Công suất L1", selector: entitySelector },
          { name: "eps_power_l2", label: "EPS - Công suất L2", selector: entitySelector },
          { name: "eps_power_l3", label: "EPS - Công suất L3", selector: entitySelector },

          // Battery 1
          { name: "battery_power", label: "Pin 1 - Công suất", selector: entitySelector },
          { name: "battery_voltage", label: "Pin 1 - Điện áp", selector: entitySelector },
          { name: "battery_soc", label: "Pin 1 - Dung lượng SOC (%)", selector: entitySelector },
          { name: "battery_charge_daily", label: "Pin Lưu Trữ - Nạp hôm nay", selector: entitySelector },
          { name: "battery_charge_total", label: "Pin Lưu Trữ - Tổng nạp", selector: entitySelector },
          { name: "battery_discharge_daily", label: "Pin Lưu Trữ - Xả hôm nay", selector: entitySelector },
          { name: "battery_discharge_total", label: "Pin Lưu Trữ - Tổng xả", selector: entitySelector },

          // Battery 2
          { name: "battery2_power", label: "Pin 2 - Công suất", selector: entitySelector },
          { name: "battery2_voltage", label: "Pin 2 - Điện áp", selector: entitySelector },
          { name: "battery2_soc", label: "Pin 2 - Dung lượng SOC (%)", selector: entitySelector }
        ]
      }
    ];

    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = schema;
    this._form.computeLabel = (s) => s.label || s.name;
  }

  _valueChanged(ev) {
    const newConfig = ev.detail.value;
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

customElements.define('power-flow-card-inverter-editor', PowerFlowCardEditor);
customElements.define('power-flow-card-inverter', PowerFlowCardInverter);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "power-flow-card-inverter",
  name: "Power Flow Card Inverter",
  description: "Sơ đồ luồng năng lượng cho Inverter Hybrid (1 Pha / 3 Pha)",
  configurable: true
});