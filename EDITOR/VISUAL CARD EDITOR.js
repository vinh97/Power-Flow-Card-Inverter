/* ==================================================================== */
/*                    VISUAL CARD EDITOR COMPONENT                      */
/* ==================================================================== */

class PowerFlowCardEditor extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._config = {}; this._hass = null; }

    setConfig(config) { this._config = config || {}; this._render(); }

    set hass(hass) {
        this._hass = hass;
        if (this._form) { this._form.hass = hass; } else { this._render(); }
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
            { name: "language", label: "Ngôn ngữ / Language", selector: { select: { options: [{ value: "vi", label: "Tiếng Việt" }, { value: "en", label: "English" }] } } },

            //----CẤU HÌNH CHUNG -----
            { name: "dark_mode", label: "Giao diện tối (Dark mode)", selector: { boolean: {} } },
            { name: "three_phase", label: "Hệ thống điện 3 pha (Three phase)", selector: { boolean: {} } },
            { name: "single_load_mode", label: "Chế độ 1 tải Load/EPS (Single load mode)", selector: { boolean: {} } },
            { name: "invert_grid_power", label: "Đảo chiều công suất lưới (Invert grid power)", selector: { boolean: {} } },
            { name: "invert_battery_power", label: "Đảo chiều công suất Pin 1 (Invert battery power)", selector: { boolean: {} } },
            { name: "always_show_battery2", label: "Luôn hiển thị Pin lưu trữ 2 (Always show battery2)", selector: { boolean: {} } },
            { name: "invert_battery2_power", label: "Đảo chiều công suất Pin 2 (Invert battery2 power)", selector: { boolean: {} } },
            { name: "always_show_aux", label: "Luôn hiển thị cổng AUX(Always display the AUX port) ", selector: { boolean: {} } },
            { name: "invert_aux_power", label: "Đảo chiều công suất cổng AUX(Invert aux power) ", selector: { boolean: {} } },
            { name: "smart_load_aux", label: "AUX là Tải tiêu thụ(AUX is power consumption) ", selector: { boolean: {} } },

            // --- Biến tần (Inverter) ---
            { name: "inverter_image", label: "Bật tùy chỉnh ảnh Biến tần (Set true to use custom image)", selector: { boolean: {} } },
            { name: "inverter_icon", label: "Icon Biến tần (Inverter icon)", selector: { icon: {} } },
            { name: "inverter_icon", label: "Tùy chỉnh ảnh Biến tần (Đường dẫn / URL-Inverter image)", selector: { text: {} } },
            { name: "inverter_x", label: "Tọa độ X Biến tần (Inverter X coordinate-Default: 132)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "inverter_y", label: "Tọa độ Y Biến tần (Inverter Y coordinate-Default: 78)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "inverter_width", label: "Chiều rộng hình ảnh (Image width-Default: 75)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "inverter_height", label: "Chiều cao hình ảnh (Image height-Default: 75)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },

            // --- Điện mặt trời (PV) ---
            { name: "pv_image", label: "Bật tùy chỉnh ảnh PV (Set true to use custom image)", selector: { boolean: {} } },
            { name: "pv_icon", label: "Icon PV (PV icon)", selector: { icon: {} } },
            { name: "pv_icon", label: "Tùy chỉnh ảnh PV (Đường dẫn / URL-PV image)", selector: { text: {} } },
            { name: "pv_x", label: "Tọa độ X PV (PV X coordinate-Default: 138)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "pv_y", label: "Tọa độ Y PV (PV Y coordinate-Default: -56)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "pv_width", label: "Chiều rộng hình ảnh (Image width-Default: 50)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "pv_height", label: "Chiều cao hình ảnh (Image height-Default: 50)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },

            // --- Tải tiêu thụ nhà (Load) ---
            { name: "load_image", label: "Bật tùy chỉnh ảnh Tiêu Thụ (Set true to use custom image)", selector: { boolean: {} } },
            { name: "load_icon", label: "Icon Tiêu Thụ (load icon)", selector: { icon: {} } },
            { name: "load_icon", label: "Tùy chỉnh ảnh Tiêu Thụ (Đường dẫn / URL-load image)", selector: { text: {} } },
            { name: "load_x", label: "Tọa độ X Tiêu Thụ (load X coordinate-Default: 100)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "load_y", label: "Tọa độ Y Tiêu Thụ (load Y coordinate-Default: 92)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "load_width", label: "Chiều rộng hình ảnh (Image width-Default: 0)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "load_height", label: "Chiều cao hình ảnh (Image height-Default: 0)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },

            // --- Tải dự phòng (EPS / Backup Load) ---
            { name: "eps_image", label: "Bật tùy chỉnh ảnh UPS (Set true to use custom image)", selector: { boolean: {} } },
            { name: "eps_icon", label: "Icon Biến tần (UPS icon)", selector: { icon: {} } },
            { name: "eps_icon", label: "Tùy chỉnh ảnh Biến tần (Đường dẫn / URL-UPS image)", selector: { text: {} } },
            { name: "eps_x", label: "Tọa độ X Biến tần (UPS X coordinate-Default: 0)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "eps_y", label: "Tọa độ Y Biến tần (UPS Y coordinate-Default: 0)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "eps_width", label: "Chiều rộng hình ảnh (Image width-Default: 50)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "eps_height", label: "Chiều cao hình ảnh (Image height-Default: 50)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },

            // --- Tải phụ / Smart Load (AUX) ---
            { name: "aux_image", label: "Bật tùy chỉnh ảnh AUX (Set true to use custom image)", selector: { boolean: {} } },
            { name: "aux_icon", label: "Icon AUX (AUX icon)", selector: { icon: {} } },
            { name: "aux_icon", label: "Tùy chỉnh ảnh AUX (Đường dẫn / URL-AUX image)", selector: { text: {} } },
            { name: "aux_x", label: "Tọa độ X AUX (AUX X coordinate-Default: 274)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "aux_y", label: "Tọa độ Y AUX (AUX Y coordinate-Default: -58)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "aux_width", label: "Chiều rộng hình ảnh (Image width-Default: 44)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },
            { name: "aux_height", label: "Chiều cao hình ảnh (Image height-Default: 46)", selector: { number: { min: -800, max: 800, step: 1, mode: "box" } } },

            {
                name: "entities",
                title: "Khai báo Thực thể / Entities",
                type: "expandable",
                schema: [
                    // --- Thông tin Biến tần (Inverter) ---
                    { name: "inverter_power", label: "Biến tần Công suất - Inverter Power", selector: entitySelector },
                    { name: "inverter_current", label: "Biến tần Dòng điện - Inverter Current", selector: entitySelector },
                    { name: "inverter_voltage", label: "Biến tần Điện áp - Inverter Voltage", selector: entitySelector },
                    { name: "inverter_temp", label: "Biến tần Nhiệt độ - Inverter Temperature", selector: entitySelector },

                    // --- Tổng Pin lưu trữ (Battery 1 + 2) ---
                    { name: "battery1_battery2_power", label: "Tổng Pin Công suất - Total Battery Power", selector: entitySelector },
                    { name: "battery1_battery2_current", label: "Tổng Pin Dòng điện - Total Battery Current", selector: entitySelector },

                    // --- Điện mặt trời (Solar PV 1-4 & Tổng) ---
                    { name: "pv_power", label: "PV Tổng công suất - PV Total Power", selector: entitySelector },
                    { name: "pv1_power", label: "PV1 Công suất - PV1 Power Output", selector: entitySelector },
                    { name: "pv1_voltage", label: "PV1 Điện áp - PV1 Voltage", selector: entitySelector },
                    { name: "pv1_current", label: "PV1 Dòng điện - PV1 Current", selector: entitySelector },
                    { name: "pv2_power", label: "PV2 Công suất - PV2 Power Capacity", selector: entitySelector },
                    { name: "pv2_voltage", label: "PV2 Điện áp - PV2 Voltage", selector: entitySelector },
                    { name: "pv2_current", label: "PV2 Dòng điện - PV2 Current", selector: entitySelector },
                    { name: "pv3_power", label: "PV3 Công suất - PV3 Power Capacity", selector: entitySelector },
                    { name: "pv3_voltage", label: "PV3 Điện áp - PV3 Voltage", selector: entitySelector },
                    { name: "pv3_current", label: "PV3 Dòng điện - PV3 Current", selector: entitySelector },
                    { name: "pv4_power", label: "PV4 Công suất - PV4 Power Capacity", selector: entitySelector },
                    { name: "pv4_voltage", label: "PV4 Điện áp - PV4 Voltage", selector: entitySelector },
                    { name: "pv4_current", label: "PV4 Dòng điện - PV4 Current", selector: entitySelector },

                    // --- Điện lưới (Grid 1 Pha & 3 Pha) ---
                    { name: "grid_power", label: "Lưới Công suất 1 pha - Grid Single-phase Power", selector: entitySelector },
                    { name: "grid_voltage", label: "Lưới Điện áp - Grid Voltage", selector: entitySelector },
                    { name: "grid_frequency", label: "Lưới Tần số - Grid Frequency", selector: entitySelector },
                    { name: "grid_current", label: "Lưới Dòng điện - Grid Current", selector: entitySelector },
                    { name: "grid_power_l1", label: "Lưới Công suất L1 - Grid L1 Power", selector: entitySelector },
                    { name: "grid_power_l2", label: "Lưới Công suất L2 - Grid L2 Power", selector: entitySelector },
                    { name: "grid_power_l3", label: "Lưới Công suất L3 - Grid L3 Power", selector: entitySelector },
                    { name: "grid_voltage_l1", label: "Lưới Điện áp L1 - Grid L1 Voltage", selector: entitySelector },
                    { name: "grid_voltage_l2", label: "Lưới Điện áp L2 - Grid L2 Voltage", selector: entitySelector },
                    { name: "grid_voltage_l3", label: "Lưới Điện áp L3 - Grid L3 Voltage", selector: entitySelector },
                    { name: "grid_frequency_l1", label: "Lưới Tần số L1 - Grid L1 Frequency", selector: entitySelector },
                    { name: "grid_frequency_l2", label: "Lưới Tần số L2 - Grid L2 Frequency", selector: entitySelector },
                    { name: "grid_frequency_l3", label: "Lưới Tần số L3 - Grid L3 Frequency", selector: entitySelector },
                    { name: "grid_current_l1", label: "Lưới Dòng điện L1 - Grid L1 Current", selector: entitySelector },
                    { name: "grid_current_l2", label: "Lưới Dòng điện L2 - Grid L2 Current", selector: entitySelector },
                    { name: "grid_current_l3", label: "Lưới Dòng điện L3 - Grid L3 Current", selector: entitySelector },

                    // --- Tải tiêu thụ nhà (Load 1 Pha & 3 Pha) ---
                    { name: "load_power", label: "Tải Công suất 1 pha - Load Single-phase Power", selector: entitySelector },
                    { name: "load_voltage", label: "Tải Điện áp - Load Voltage", selector: entitySelector },
                    { name: "load_frequency", label: "Tải Tần số - Load Frequency", selector: entitySelector },
                    { name: "load_current", label: "Tải Dòng điện - Load Current", selector: entitySelector },
                    { name: "load_power_l1", label: "Tải Công suất L1 - Load L1 Power", selector: entitySelector },
                    { name: "load_power_l2", label: "Tải Công suất L2 - Load L2 Power", selector: entitySelector },
                    { name: "load_power_l3", label: "Tải Công suất L3 - Load L3 Power", selector: entitySelector },
                    { name: "load_voltage_l1", label: "Tải Điện áp L1 - Load L1 Voltage", selector: entitySelector },
                    { name: "load_voltage_l2", label: "Tải Điện áp L2 - Load L2 Voltage", selector: entitySelector },
                    { name: "load_voltage_l3", label: "Tải Điện áp L3 - Load L3 Voltage", selector: entitySelector },
                    { name: "load_current_l1", label: "Tải Dòng điện L1 - Load L1 Current", selector: entitySelector },
                    { name: "load_current_l2", label: "Tải Dòng điện L2 - Load L2 Current", selector: entitySelector },
                    { name: "load_current_l3", label: "Tải Dòng điện L3 - Load L3 Current", selector: entitySelector },

                    // --- Tải dự phòng (EPS / Backup Load 1 Pha & 3 Pha) ---
                    { name: "eps_power", label: "UPS Công suất 1 pha - UPS Single-phase Power", selector: entitySelector },
                    { name: "eps_voltage", label: "UPS Điện áp - UPS Voltage", selector: entitySelector },
                    { name: "eps_frequency", label: "UPS Tần số - UPS Frequency", selector: entitySelector },
                    { name: "eps_current", label: "UPS Dòng điện - UPS Current", selector: entitySelector },
                    { name: "eps_power_l1", label: "UPS Công suất L1 - UPS L1 Power", selector: entitySelector },
                    { name: "eps_power_l2", label: "UPS Công suất L2 - UPS L2 Power", selector: entitySelector },
                    { name: "eps_power_l3", label: "UPS Công suất L3 - UPS L3 Power", selector: entitySelector },
                    { name: "eps_voltage_l1", label: "UPS Điện áp L1 - UPS L1 Voltage", selector: entitySelector },
                    { name: "eps_voltage_l2", label: "UPS Điện áp L2 - UPS L2 Voltage", selector: entitySelector },
                    { name: "eps_voltage_l3", label: "UPS Điện áp L3 - UPS L3 Voltage", selector: entitySelector },
                    { name: "eps_frequency_l1", label: "UPS Tần số L1 - UPS L1 Frequency", selector: entitySelector },
                    { name: "eps_frequency_l2", label: "UPS Tần số L2 - UPS L2 Frequency", selector: entitySelector },
                    { name: "eps_frequency_l3", label: "UPS Tần số L3 - UPS L3 Frequency", selector: entitySelector },
                    { name: "eps_current_l1", label: "UPS Dòng điện L1 - UPS L1 Current", selector: entitySelector },
                    { name: "eps_current_l2", label: "UPS Dòng điện L2 - UPS L2 Current", selector: entitySelector },
                    { name: "eps_current_l3", label: "UPS Dòng điện L3 - UPS L3 Current", selector: entitySelector },

                    // --- Tải phụ / Smart Load (AUX 1 Pha & 3 Pha) ---
                    { name: "aux_power", label: "Tải phụ Công suất 1 pha - AUX Single-phase Power", selector: entitySelector },
                    { name: "aux_voltage", label: "Tải phụ Điện áp - AUX Voltage", selector: entitySelector },
                    { name: "aux_frequency", label: "Tải phụ Tần số - AUX Frequency", selector: entitySelector },
                    { name: "aux_current", label: "Tải phụ Dòng điện - AUX Current", selector: entitySelector },
                    { name: "aux_power_l1", label: "Tải phụ Công suất L1 - AUX L1 Power", selector: entitySelector },
                    { name: "aux_power_l2", label: "Tải phụ Công suất L2 - AUX L2 Power", selector: entitySelector },
                    { name: "aux_power_l3", label: "Tải phụ Công suất L3 - AUX L3 Power", selector: entitySelector },
                    { name: "aux_voltage_l1", label: "Tải phụ Điện áp L1 - AUX L1 Voltage", selector: entitySelector },
                    { name: "aux_voltage_l2", label: "Tải phụ Điện áp L2 - AUX L2 Voltage", selector: entitySelector },
                    { name: "aux_voltage_l3", label: "Tải phụ Điện áp L3 - AUX L3 Voltage", selector: entitySelector },
                    { name: "aux_frequency_l1", label: "Tải phụ Tần số L1 - AUX L1 Frequency", selector: entitySelector },
                    { name: "aux_frequency_l2", label: "Tải phụ Tần số L2 - AUX L2 Frequency", selector: entitySelector },
                    { name: "aux_frequency_l3", label: "Tải phụ Tần số L3 - AUX L3 Frequency", selector: entitySelector },
                    { name: "aux_current_l1", label: "Tải phụ Dòng điện L1 - AUX L1 Current", selector: entitySelector },
                    { name: "aux_current_l2", label: "Tải phụ Dòng điện L2 - AUX L2 Current", selector: entitySelector },
                    { name: "aux_current_l3", label: "Tải phụ Dòng điện L3 - AUX L3 Current", selector: entitySelector },

                    // --- Pin lưu trữ 1 (Battery 1) ---
                    { name: "battery_power", label: "Pin 1 Công suất - Battery 1 Power", selector: entitySelector },
                    { name: "battery_voltage", label: "Pin 1 Điện áp - Battery 1 Voltage", selector: entitySelector },
                    { name: "battery_soc", label: "Pin 1 Dung lượng SOC (%) - Battery 1 SOC (%)", selector: entitySelector },
                    { name: "battery_current", label: "Pin 1 Dòng điện - Battery 1 Current", selector: entitySelector },
                    { name: "battery_temp", label: "Pin 1 Nhiệt độ - Battery 1 Temp", selector: entitySelector },

                    // --- Pin lưu trữ 2 (Battery 2) ---
                    { name: "battery2_power", label: "Pin 2 Công suất - Battery 2 Power", selector: entitySelector },
                    { name: "battery2_voltage", label: "Pin 2 Điện áp - Battery 2 Voltage", selector: entitySelector },
                    { name: "battery2_soc", label: "Pin 2 Dung lượng SOC (%) - Battery 2 SOC (%)", selector: entitySelector },
                    { name: "battery2_current", label: "Pin 2 Dòng điện - Battery 2 Current", selector: entitySelector },
                    { name: "battery2_temp", label: "Pin 2 Nhiệt độ - Battery 2 Temp", selector: entitySelector },

                    // --- Bảng Thống Kê Sản Lượng & Tiêu Thụ ---
                    { name: "pv_daily", label: "PV Sản lượng hôm nay - PV Today's Production", selector: entitySelector },
                    { name: "pv_total", label: "PV Tổng sản lượng - PV Total Production", selector: entitySelector },
                    { name: "grid_buy_daily", label: "Lưới Nhập hôm nay - Grid Import Today", selector: entitySelector },
                    { name: "grid_buy_total", label: "Lưới Tổng nhập - Grid Total Import", selector: entitySelector },
                    { name: "grid_sell_daily", label: "Lưới Phát hôm nay - Grid Export Today", selector: entitySelector },
                    { name: "grid_sell_total", label: "Lưới Tổng phát - Grid Total Export", selector: entitySelector },
                    { name: "load_daily", label: "Tải Tiêu thụ hôm nay - Load Consumption Today", selector: entitySelector },
                    { name: "load_total", label: "Tải Tổng tiêu thụ - Load Total Consumption", selector: entitySelector },
                    { name: "battery_charge_daily", label: "Pin Lưu Trữ Nạp hôm nay - Battery Charge Today", selector: entitySelector },
                    { name: "battery_charge_total", label: "Pin Lưu Trữ Tổng nạp - Battery Total Charge", selector: entitySelector },
                    { name: "battery_discharge_daily", label: "Pin Lưu Trữ Xả hôm nay - Battery Discharge Today", selector: entitySelector },
                    { name: "battery_discharge_total", label: "Pin Lưu Trữ Tổng xả - Battery Total Discharge", selector: entitySelector }
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
        const event = new CustomEvent("config-changed", { detail: { config: newConfig }, bubbles: true, composed: true });
        this.dispatchEvent(event);
    }
}

customElements.define('power-flow-card-inverter-editor', PowerFlowCardEditor);
customElements.define('power-flow-card-inverter', PowerFlowCardInverter);

window.customCards = window.customCards || [];
window.customCards.push({ type: "power-flow-card-inverter", name: "Power Flow Card Inverter", description: "Sơ đồ luồng năng lượng cho Inverter Hybrid (1 Pha / 3 Pha)", configurable: true });
