# Ví dụ cấu hình Switch / Card YAML trong Home Assistant:

type: custom:power-flow-card-inverter
single_load_mode: true   # true: Gộp chung Tải tiêu thụ & EPS theo trạng thái lưới
                         # false: Hiển thị riêng biệt 2 cổng Tải chính và EPS

// --- XỬ LÝ LOGIC SINGLE LOAD MODE ---

// 1. Kiểm tra trạng thái kích hoạt từ file YAML hoặc entities
const singleLoadMode = this.config?.single_load_mode !== undefined
  ? isTrue(this.config.single_load_mode)
  : (ent?.single_load_mode !== undefined ? isTrue(ent.single_load_mode) : false);

// 2. Chuyển đổi và gán công suất theo trạng thái Điện lưới (isGridConnected)
if (singleLoadMode) {
  // Lấy giá trị công suất tải cao nhất hiện tại giữa Load và EPS
  const activeP = Math.max(loadP, epsP);
  const activeL1 = Math.max(loadL1, epsL1);
  const activeL2 = Math.max(loadL2, epsL2);
  const activeL3 = Math.max(loadL3, epsL3);

  if (isGridConnected) {
    // Có lưới: Dồn toàn bộ công suất tiêu thụ về cổng Tải chính (Load)
    loadP = activeP;
    loadL1 = activeL1;
    loadL2 = activeL2;
    loadL3 = activeL3;

    // Tắt hiển thị công suất cổng Dự phòng (EPS)
    epsP = 0;
    epsL1 = 0;
    epsL2 = 0;
    epsL3 = 0;
  } else {
    // Mất lưới: Dồn toàn bộ công suất tiêu thụ về cổng Tải dự phòng (EPS)
    epsP = activeP;
    epsL1 = activeL1;
    epsL2 = activeL2;
    epsL3 = activeL3;

    // Tắt hiển thị công suất cổng Tải chính (Load)
    loadP = 0;
    loadL1 = 0;
    loadL2 = 0;
    loadL3 = 0;
  }
}