updateData() {
    if (!this._hass || !this.config || !this.shadowRoot || !this.shadowRoot.querySelector('.app-card')) return;

    // ... (Các đoạn code kiểm tra Dark Mode ở trên) ...

    // Cập nhật hiển thị và tọa độ cho Inverter
    this._updateInverterDisplay();

    // ... (Các đoạn code xử lý PV, Grid, Load phía dưới giữ nguyên) ...
  }
  
  
  
/**
   * =========================================================================
   * LOGIC XỬ LÝ HÌNH ẢNH VÀ VỊ TRÍ BIẾN TẦN (INVERTER)
   * =========================================================================
   * Hàm này đảm nhận toàn bộ việc kiểm tra cấu hình, căn chỉnh tọa độ (x, y),
   * kích thước (width, height) và chuyển đổi giữa đồ họa mặc định (SVG) 
   * hoặc sử dụng hình ảnh biểu tượng tùy chỉnh (Custom Icon/Image).
   */
  _updateInverterDisplay() {
    const isTrue = (val) => val === true || String(val).toLowerCase() === 'true';

    // 1. Đọc giá trị cấu hình inverter_image từ YAML
    const invImgConfig = this.config?.inverter_image;
    const isImgConfigTrue = isTrue(invImgConfig);
    const isImgConfigFalse = invImgConfig === false || String(invImgConfig).toLowerCase() === 'false';
    const isImgConfigStringPath = typeof invImgConfig === 'string' && !isImgConfigTrue && !isImgConfigFalse && invImgConfig.trim() !== '';

    // 2. Xác định đường dẫn hình ảnh custom:
    // - Nếu inverter_image chứa chuỗi đường dẫn trực tiếp -> Dùng đường dẫn đó.
    // - Nếu inverter_image là true -> Lấy từ inverter_icon hoặc custom_inverter_icon.
    const customInvImage = isImgConfigStringPath 
      ? invImgConfig 
      : (this.config?.inverter_icon || this.config?.custom_inverter_icon || '');

    // 3. Điều kiện bật ảnh Custom: Không bị cấm (false) VÀ (đã bật true HOẶC có đường dẫn trực tiếp) VÀ đường dẫn không rỗng
    const useCustomImg = !isImgConfigFalse && (isImgConfigTrue || isImgConfigStringPath) && Boolean(customInvImage && String(customInvImage).trim() !== '');

    // 4. Trích xuất các thẻ DOM tương ứng trong SVG
    const invDefaultG = this.getEl('inv-default-graphics'); // Nhóm đồ họa vẽ mặc định
    const invCustomImg = this.getEl('inv-custom-image');     // Thẻ <image> chứa ảnh custom

    // 5. Lấy tọa độ gốc (X, Y) để đặt khối Inverter trên sơ đồ SVG
    const invX = Number(this.config?.inverter_x ?? 144);
    const invY = Number(this.config?.inverter_y ?? 74);

    // 6. Lấy kích thước Rộng (Width), Cao (Height) và Tọa độ lệch (Custom X, Y)
    const invWidth = Number(this.config?.inverter_width || this.config?.inverter_size || 58);
    const invHeight = Number(this.config?.inverter_height || this.config?.inverter_size || 58);
    const invCustomX = Number(this.config?.inverter_custom_x ?? this.config?.inverter_icon_x ?? 0);
    const invCustomY = Number(this.config?.inverter_custom_y ?? this.config?.inverter_icon_y ?? 0);

    // 7. Di chuyển thẻ chứa Inverter đến vị trí (invX, invY)
    const invGroup = invDefaultG ? invDefaultG.parentElement : null;
    if (invGroup) {
      invGroup.setAttribute('transform', `translate(${invX}, ${invY})`);
    }

    // 8. Tiến hành hiển thị giao diện tùy thuộc vào cấu hình
    if (invDefaultG && invCustomImg) {
      if (useCustomImg) {
        // TRƯỜNG HỢP 1: Dùng hình ảnh tùy chỉnh (Custom PNG/SVG)
        invDefaultG.style.display = 'none';
        invCustomImg.style.display = 'inline';
        invCustomImg.setAttribute('href', customInvImage);
        invCustomImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', customInvImage);
        invCustomImg.setAttribute('width', invWidth);
        invCustomImg.setAttribute('height', invHeight);
        invCustomImg.setAttribute('x', invCustomX);
        invCustomImg.setAttribute('y', invCustomY);
      } else {
        // TRƯỜNG HỢP 2: Dùng đồ họa mặc định (Màn hình LCD + LED)
        invDefaultG.style.display = 'inline';
        invCustomImg.style.display = 'none';
        
        // Co giãn đồ họa SVG gốc (gốc 58x58) theo tỉ lệ invWidth/invHeight thiết lập
        const scaleX = invWidth / 58;
        const scaleY = invHeight / 58;
        invDefaultG.setAttribute('transform', `scale(${scaleX}, ${scaleY})`);
      }
    }
  }
  
  
  type: custom:solar-power-card # Thay bằng name card của bạn
title: Hệ Thống Điện Năng Lượng Mặt Trời

# -----------------------------------------------------------------------------
# CẤU HÌNH HÌNH ẢNH BIẾN TẦN (INVERTER)
# -----------------------------------------------------------------------------
# Cách 1: Sử dụng ảnh custom qua đường dẫn trực tiếp
inverter_image: "/local/community/inverter-solis.png"

# Cách 2: Bật dùng ảnh custom từ biến inverter_icon (Bỏ comment bên dưới nếu dùng)
# inverter_image: true
# inverter_icon: "/local/community/inverter.png"

# Cách 3: Dùng đồ họa vẽ mặc định của Card (Bỏ comment bên dưới nếu dùng)
# inverter_image: false

# -----------------------------------------------------------------------------
# CẤU HÌNH TỌA ĐỘ VÀ KÍCH THƯỚC (PIXEL / UNITS)
# -----------------------------------------------------------------------------
# Tọa độ đặt khối Inverter trên khung vẽ SVG
inverter_x: 144
inverter_y: 74

# Kích thước khung Inverter
inverter_width: 65
inverter_height: 65

# Tọa độ lệch tinh chỉnh riêng cho ảnh Custom (Offset X, Y)
inverter_custom_x: 0
inverter_custom_y: 0

# -----------------------------------------------------------------------------
# CẤU HÌNH THỰC THỂ (ENTITIES)
# -----------------------------------------------------------------------------
entities:
  inverter_power: sensor.inverter_active_power
  grid_power: sensor.grid_power
  pv_power: sensor.pv_power
  load_power: sensor.house_consumption