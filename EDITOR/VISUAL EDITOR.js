/* ==================================================================== */
/*                    VISUAL CARD EDITOR COMPONENT                      */
/* ==================================================================== */

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
      { name: "dark_mode", label: "Giao diện tối                              (Dark mode)", selector: { boolean: {} } },
      { name: "three_phase", label: "Hệ thống điện 3 pha                      (Three phase)", selector: { boolean: {} } },
      { name: "single_load_mode", label: "Chế độ 1 tải Load/EPS               (Single load mode)", selector: { boolean: {} } },
      { name: "always_show_ac_pv", label: "Luôn hiển thị Hoà lưới/Máy phát    (Always show Draw/Generator)", selector: { boolean: {} } },
      { name: "invert_grid_power", label: "Đảo chiều công suất lưới           (Invert grid power)", selector: { boolean: {} } },
      { name: "invert_battery_power", label: "Đảo chiều công suất Pin 1       (Invert battery power)", selector: { boolean: {} } },
      { name: "always_show_battery2", label: "Luôn hiển thị Pin lưu trữ 2     (Always show battery2)", selector: { boolean: {} } },
      { name: "invert_battery2_power", label: "Đảo chiều công suất Pin 2      (Invert battery2 power)", selector: { boolean: {} } },
      { name: "inverter_image", label: "Bật tùy chỉnh ảnh Biến tần            (Set true to use custom image)", selector: { boolean: {} } },
	  { name: "inverter_icon", label: "Icon Biến tần                          (Inverter icon)", selector: { icon: {} } },
      { name: "inverter_icon", label: "Tùy chỉnh ảnh Biến tần                 (Đường dẫn / URL-Inverter image) ", selector: { text: {} } },
      { name: "inverter_x", label: "Tọa độ X Biến tần                         (Inverter X coordinate-Default: 136)", selector: { number: { min: 0, max: 800, step: 1, mode: "box" } } },
      { name: "inverter_y", label: "Tọa độ Y Biến tần                         (Inverter Y coordinate-Default: 68)", selector: { number: { min: 0, max: 800, step: 1, mode: "box" } } },
      { name: "inverter_width", label: "Chiều rộng hình ảnh                   (Image width-Default: 75)", selector: { number: { min: 0, max: 800, step: 1, mode: "box" } } },
      { name: "inverter_height", label: "Chiều cao hình ảnh                   (Image height-Default: 75)", selector: { number: { min: 0, max: 800, step: 1, mode: "box" } } },

      {
        name: "entities",
        title: "Khai báo Thực thể / Entities",
        type: "expandable",
        schema: [
          // PV DC
{ name: "pv_power", label: "PV Tổng công suất - PV Total Power", selector: entitySelector },
{ name: "pv_daily", label: "PV Sản lượng hôm nay - PV Today's Production", selector: entitySelector },
{ name: "pv_total", label: "PV Tổng sản lượng - PV Total Production", selector: entitySelector },
{ name: "pv1_power", label: "PV1 Công suất - PV1 Power Output", selector: entitySelector },
{ name: "pv1_voltage", label: "PV1 Điện áp - PV1 Voltage", selector: entitySelector },
{ name: "pv2_power", label: "PV2 Công suất - PV2 Power Capacity", selector: entitySelector },
{ name: "pv2_voltage", label: "PV2 Điện áp - PV2 Voltage", selector: entitySelector },
{ name: "pv3_power", label: "PV3 Công suất - PV3 Power Capacity", selector: entitySelector },
{ name: "pv3_voltage", label: "PV3 Điện áp - PV3 Voltage", selector: entitySelector },
{ name: "pv4_power", label: "PV4 Công suất - PV4 Power Capacity", selector: entitySelector },
{ name: "pv4_voltage", label: "PV4 Điện áp - PV4 Voltage", selector: entitySelector },

// Hoà lưới/Máy phát
{ name: "ac_pv_power", label: "Hoà lưới/Máy phát Công suất - AC PV/Generator Power", selector: entitySelector },
{ name: "ac_pv_voltage", label: "Hoà lưới/Máy phát Điện áp - AC PV/Generator Voltage", selector: entitySelector },
{ name: "ac_pv_frequency", label: "Hoà lưới/Máy phát Tần số - AC PV/Generator Frequency", selector: entitySelector },
{ name: "ac_pv_power_l1", label: "Hoà lưới/Máy phát Công suất L1 - AC PV/Generator L1 Power", selector: entitySelector },
{ name: "ac_pv_power_l2", label: "Hoà lưới/Máy phát Công suất L2 - AC PV/Generator L2 Power", selector: entitySelector },
{ name: "ac_pv_power_l3", label: "Hoà lưới/Máy phát Công suất L3 - AC PV/Generator L3 Power", selector: entitySelector },

// Grid
{ name: "grid_power", label: "Lưới Công suất 1 pha - Grid Single-phase Power", selector: entitySelector },
{ name: "grid_voltage", label: "Lưới Điện áp - Grid Voltage", selector: entitySelector },
{ name: "grid_frequency", label: "Lưới Tần số - Grid Frequency", selector: entitySelector },
{ name: "grid_buy_daily", label: "Lưới Nhập hôm nay - Grid Import Today", selector: entitySelector },
{ name: "grid_buy_total", label: "Lưới Tổng nhập - Grid Total Import", selector: entitySelector },
{ name: "grid_sell_daily", label: "Lưới Phát hôm nay - Grid Export Today", selector: entitySelector },
{ name: "grid_sell_total", label: "Lưới Tổng phát - Grid Total Export", selector: entitySelector },
{ name: "grid_power_l1", label: "Lưới Công suất L1 - Grid L1 Power", selector: entitySelector },
{ name: "grid_power_l2", label: "Lưới Công suất L2 - Grid L2 Power", selector: entitySelector },
{ name: "grid_power_l3", label: "Lưới Công suất L3 - Grid L3 Power", selector: entitySelector },
{ name: "grid_voltage_l1", label: "Lưới Điện áp L1 - Grid L1 Voltage", selector: entitySelector },

// Load
{ name: "load_power", label: "Tải Công suất 1 pha - Load Single-phase Power", selector: entitySelector },
{ name: "load_daily", label: "Tải Tiêu thụ hôm nay - Load Consumption Today", selector: entitySelector },
{ name: "load_total", label: "Tải Tổng tiêu thụ - Load Total Consumption", selector: entitySelector },
{ name: "load_power_l1", label: "Tải Công suất L1 - Load L1 Power", selector: entitySelector },
{ name: "load_power_l2", label: "Tải Công suất L2 - Load L2 Power", selector: entitySelector },
{ name: "load_power_l3", label: "Tải Công suất L3 - Load L3 Power", selector: entitySelector },

// EPS
{ name: "eps_power", label: "UPS Công suất 1 pha - UPS Single-phase Power", selector: entitySelector },
{ name: "eps_voltage", label: "UPS Điện áp - UPS Voltage", selector: entitySelector },
{ name: "eps_frequency", label: "UPS Tần số - UPS Frequency", selector: entitySelector },
{ name: "eps_power_l1", label: "UPS Công suất L1 - UPS L1 Power", selector: entitySelector },
{ name: "eps_power_l2", label: "UPS Công suất L2 - UPS L2 Power", selector: entitySelector },
{ name: "eps_power_l3", label: "UPS Công suất L3 - UPS L3 Power", selector: entitySelector },

// Battery 1
{ name: "battery_power", label: "Pin 1 Công suất - Battery 1 Power", selector: entitySelector },
{ name: "battery_voltage", label: "Pin 1 Điện áp - Battery 1 Voltage", selector: entitySelector },
{ name: "battery_soc", label: "Pin 1 Dung lượng SOC (%) - Battery 1 SOC (%)", selector: entitySelector },
{ name: "battery_charge_daily", label: "Pin Lưu Trữ Nạp hôm nay - Battery Charge Today", selector: entitySelector },
{ name: "battery_charge_total", label: "Pin Lưu Trữ Tổng nạp - Battery Total Charge", selector: entitySelector },
{ name: "battery_discharge_daily", label: "Pin Lưu Trữ Xả hôm nay - Battery Discharge Today", selector: entitySelector },
{ name: "battery_discharge_total", label: "Pin Lưu Trữ Tổng xả - Battery Total Discharge", selector: entitySelector },

// Battery 2
{ name: "battery2_power", label: "Pin 2 Công suất - Battery 2 Power", selector: entitySelector },
{ name: "battery2_voltage", label: "Pin 2 Điện áp - Battery 2 Voltage", selector: entitySelector },
{ name: "battery2_soc", label: "Pin 2 Dung lượng SOC (%) - Battery 2 SOC (%)", selector: entitySelector },
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
