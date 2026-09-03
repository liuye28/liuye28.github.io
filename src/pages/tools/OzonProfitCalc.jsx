import React, { useState, useMemo, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import './ToolsCommon.css';

const STORAGE_KEY_RATE = 'ozon_calc_cny_rub_rate';

/**
 * Ozon 跨境利润与保本定价计算器
 */
export default function OzonProfitCalc() {
  // 输入表单参数
  const [purchaseCost, setPurchaseCost] = useState(45); // 采购进价 (RMB)
  const [weightGrams, setWeightGrams] = useState(350); // 包裹重量 (克)
  const [domesticFee, setDomesticFee] = useState(3); // 国内贴单/打包费 (RMB)
  const [freightPerKg, setFreightPerKg] = useState(65); // 跨境干线运费 (RMB/kg)
  const [regFee, setRegFee] = useState(15); // 跨境末端/挂号费 (RMB)
  const [commissionRate, setCommissionRate] = useState(15); // Ozon 佣金比例 (%)
  const [lossRate, setLossRate] = useState(3); // 退款/损耗储备率 (%)
  const [targetMargin, setTargetMargin] = useState(25); // 目标毛利率 (%)

  // 汇率 (1 人民币 = X 俄罗斯卢布 RUB)
  const [exchangeRate, setExchangeRate] = useState(() => {
    return Number(localStorage.getItem(STORAGE_KEY_RATE)) || 12.8;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RATE, exchangeRate.toString());
  }, [exchangeRate]);

  // 核心核算模型
  const result = useMemo(() => {
    const cost = Number(purchaseCost) || 0;
    const weight = Number(weightGrams) || 0;
    const domestic = Number(domesticFee) || 0;
    const fRate = Number(freightPerKg) || 0;
    const reg = Number(regFee) || 0;
    const commPct = (Number(commissionRate) || 0) / 100;
    const lossPct = (Number(lossRate) || 0) / 100;
    const marginPct = (Number(targetMargin) || 0) / 100;
    const rate = Number(exchangeRate) || 12.8;

    // 1. 国际物流干线 + 挂号费用 (RMB)
    const internationalLogistics = (weight / 1000) * fRate + reg;

    // 2. 基础硬成本 (RMB)
    const baseHardCost = cost + domestic + internationalLogistics;

    // 3. 考虑退货损耗后的综合成本 (RMB)
    const totalCost = baseHardCost * (1 + lossPct);

    // 4. 保本售价 (RMB 与 RUB)
    // 公式: 售价 * (1 - 平台扣点) = 总成本 => 保本价 = 总成本 / (1 - 平台扣点)
    const breakEvenCny = commPct < 1 ? totalCost / (1 - commPct) : 0;
    const breakEvenRub = Math.round(breakEvenCny * rate);

    // 5. 目标建议零售价 (RMB 与 RUB)
    // 公式: 售价 * (1 - 平台扣点 - 目标利润率) = 总成本
    const netDivisor = 1 - commPct - marginPct;
    let retailPriceCny = 0;
    let retailPriceRub = 0;
    let netProfitCny = 0;

    if (netDivisor > 0) {
      retailPriceCny = totalCost / netDivisor;
      retailPriceRub = Math.round(retailPriceCny * rate);
      netProfitCny = retailPriceCny * marginPct;
    }

    // 费用占比分布
    const platformFeeCny = retailPriceCny * commPct;

    return {
      internationalLogistics: internationalLogistics.toFixed(2),
      totalCost: totalCost.toFixed(2),
      breakEvenCny: breakEvenCny.toFixed(2),
      breakEvenRub,
      retailPriceCny: retailPriceCny.toFixed(2),
      retailPriceRub,
      netProfitCny: netProfitCny.toFixed(2),
      platformFeeCny: platformFeeCny.toFixed(2),
      costShare: retailPriceCny > 0 ? Math.round((cost / retailPriceCny) * 100) : 0,
      shippingShare: retailPriceCny > 0 ? Math.round((internationalLogistics / retailPriceCny) * 100) : 0,
      commShare: retailPriceCny > 0 ? Math.round((platformFeeCny / retailPriceCny) * 100) : 0,
      profitShare: retailPriceCny > 0 ? Math.round((netProfitCny / retailPriceCny) * 100) : 0,
    };
  }, [purchaseCost, weightGrams, domesticFee, freightPerKg, regFee, commissionRate, lossRate, targetMargin, exchangeRate]);

  return (
    <ToolLayout
      title="Ozon 跨境利润与保本定价计算器"
      desc="精确核算国内采购、跨境干线国际运费、Ozon 平台佣金与退货损耗，科学推算建议零售价（卢布）与保本底线"
    >
      {/* 顶部汇率状态条 */}
      <section className="tool-section">
        <div className="tool-section-title">
          <span>当前结算汇率基准</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>本地自动记忆保存</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>1 人民币 (CNY) ≈</span>
          <input
            type="number"
            step="0.1"
            className="apple-input"
            style={{ width: '100px', fontWeight: 600 }}
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
          />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>俄罗斯卢布 (RUB)</span>
          <button
            type="button"
            className="apple-btn apple-btn-secondary apple-btn-sm"
            onClick={() => setExchangeRate(12.8)}
          >
            重置为参考汇率 12.8
          </button>
        </div>
      </section>

      {/* 双栏：左侧输入参数，右侧计算看板 */}
      <div className="tool-grid-2col">
        {/* 左侧：成本与费率录入 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>成本与费率参数</span>
          </div>

          <div className="tool-form-group">
            <label className="tool-form-label">商品采购进价 (¥ RMB)</label>
            <input
              type="number"
              className="apple-input"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="tool-form-group">
            <div>
              <label className="tool-form-label">包裹实重/计费重 (克 g)</label>
              <input
                type="number"
                className="apple-input"
                value={weightGrams}
                onChange={(e) => setWeightGrams(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="tool-form-label">国内打包贴单费 (¥ RMB)</label>
              <input
                type="number"
                className="apple-input"
                value={domesticFee}
                onChange={(e) => setDomesticFee(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="tool-form-group">
            <div>
              <label className="tool-form-label">干线运费 (¥ RMB/kg)</label>
              <input
                type="number"
                className="apple-input"
                value={freightPerKg}
                onChange={(e) => setFreightPerKg(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="tool-form-label">末端/挂号费 (¥ RMB)</label>
              <input
                type="number"
                className="apple-input"
                value={regFee}
                onChange={(e) => setRegFee(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }} className="tool-form-group">
            <div>
              <label className="tool-form-label">Ozon 类目佣金 (%)</label>
              <input
                type="number"
                className="apple-input"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="tool-form-label">损耗储备率 (%)</label>
              <input
                type="number"
                className="apple-input"
                value={lossRate}
                onChange={(e) => setLossRate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="tool-form-label">目标毛利率 (%)</label>
              <input
                type="number"
                className="apple-input"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* 右侧：定价核算看板 */}
        <section className="tool-section">
          <div className="tool-section-title">
            <span>核算建议结果</span>
          </div>

          {/* 建议零售价核心高亮卡片 */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--accent-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-focus)',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Ozon 建议卢布售价 (含目标利润 {targetMargin}%)
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-color)', fontFamily: 'var(--font-sans)' }}>
              {result.retailPriceRub.toLocaleString()} <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>₽ (RUB)</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              折合人民币约 ¥ {result.retailPriceCny} · 单单净赚 ¥ {result.netProfitCny}
            </div>
          </div>

          {/* 细分指标 */}
          <div className="tool-result-item">
            <span className="tool-result-label">保本售价 (底线)</span>
            <span className="tool-result-value" style={{ color: '#ff9500' }}>
              {result.breakEvenRub.toLocaleString()} ₽ (约 ¥ {result.breakEvenCny})
            </span>
          </div>

          <div className="tool-result-item">
            <span className="tool-result-label">跨境国际物流</span>
            <span className="tool-result-value">¥ {result.internationalLogistics}</span>
          </div>

          <div className="tool-result-item">
            <span className="tool-result-label">综合落地成本</span>
            <span className="tool-result-value">¥ {result.totalCost}</span>
          </div>

          <div className="tool-result-item">
            <span className="tool-result-label">Ozon 平台扣点</span>
            <span className="tool-result-value">¥ {result.platformFeeCny}</span>
          </div>

          {/* 费用构成比例条 */}
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              售价结构分解 (采购 {result.costShare}% · 物流 {result.shippingShare}% · 平台 {result.commShare}% · 利润 {result.profitShare}%)
            </div>
            <div style={{
              display: 'flex',
              height: '10px',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface-secondary)'
            }}>
              <div style={{ width: `${result.costShare}%`, backgroundColor: '#32ade6' }} title="采购成本" />
              <div style={{ width: `${result.shippingShare}%`, backgroundColor: '#af52de' }} title="跨境运费" />
              <div style={{ width: `${result.commShare}%`, backgroundColor: '#ff9f0a' }} title="平台佣金" />
              <div style={{ width: `${result.profitShare}%`, backgroundColor: '#34c759' }} title="纯利润" />
            </div>
          </div>
        </section>
      </div>
    </ToolLayout>
  );
}
