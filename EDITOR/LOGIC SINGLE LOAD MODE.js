// ==========================================
// LOGIC XỬ LÝ CHẾ ĐỘ SINGLE LOAD MODE
// ==========================================

// 1. Lấy trạng thái cấu hình single_load_mode từ file YAML (mặc định false)
const singleLoadMode = this.config?.single_load_mode !== undefined
  ? isTrue(this.config.single_load_mode)
  : (ent?.single_load_mode !== undefined ? isTrue(ent.single_load_mode) : false);

/* 
 * GIẢI THÍCH CHẾ ĐỘ SINGLE LOAD MODE:
 * 
 * - single_load_mode: false (Mặc định)
 *   Tải chính (Load) và Tải dự phòng (EPS) hiển thị độc lập riêng biệt 2 cổng.
 * 
 * - single_load_mode: true
 *   Gộp 2 cổng Load và EPS làm 1 tải duy nhất.
 *   + Khi CÓ LƯỚI (On-grid): Công suất dồn hết về cổng Load, ẩn cổng EPS (EPS = 0).
 *   + Khi MẤT LƯỚI (Off-grid): Công suất dồn hết về cổng EPS, ẩn cổng Load (Load = 0).
 */

if (singleLoadMode) {
  // Lấy giá trị công suất lớn nhất hiện tại giữa 2 cổng Load và EPS
  const activeP = Math.max(loadP, epsP);
  const activeL1 = Math.max(loadL1, epsL1);
  const activeL2 = Math.max(loadL2, epsL2);
  const activeL3 = Math.max(loadL3, epsL3);

  if (isGridConnected) {
    // TRƯỜNG HỢP CÓ LƯỚI: Chuyển toàn bộ tải về Tải chính (Load)
    loadP = activeP;
    loadL1 = activeL1;
    loadL2 = activeL2;
    loadL3 = activeL3;

    epsP = 0;
    epsL1 = 0;
    epsL2 = 0;
    epsL3 = 0;
  } else {
    // TRƯỜNG HỢP MẤT LƯỚI: Chuyển toàn bộ tải về Tải dự phòng (EPS)
    epsP = activeP;
    epsL1 = activeL1;
    epsL2 = activeL2;
    epsL3 = activeL3;

    loadP = 0;
    loadL1 = 0;
    loadL2 = 0;
    loadL3 = 0;
  }
}