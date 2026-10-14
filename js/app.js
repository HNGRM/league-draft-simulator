import { CHAMPIONS } from './champions.js';
import { DRAFT_SEQUENCE } from './draftRules.js';

const ROLE_CONFIG = {
  물리딜러: { name: '물리딜러', color: '#ee4b5e' },
  마법딜러: { name: '마법딜러', color: '#299bf5' },
  탱커: { name: '탱커', color: '#b87e45' },
  버퍼: { name: '버퍼', color: '#f4bf2c' },
  디버퍼: { name: '디버퍼', color: '#b952ed' },
};

const STYLE_CONFIG = {
  정석방식: { name: '정석방식', color: '#2ec4b6' },
  견제방식: { name: '견제방식', color: '#ff9f1c' },
  돌진방식: { name: '돌진방식', color: '#ff3366' },
  유동적방식: { name: '유동적방식', color: '#4cc9f0' },
};

// [파워커브] 시간대별 가중치 테이블
const POWER_CURVE_CONFIG = {
  초반강력: { early: 3.5, mid: 3.5, late: 1.5 },
  중반강력: { early: 1.5, mid: 4.5, late: 2.5 },
  후반강력: { early: 1.5, mid: 2.5, late: 4.5 },
  중반정체: { early: 3.5, mid: 1.5, late: 3.5 },
  안전지속: { early: 2.5, mid: 2.5, late: 3.5 },
};

// [디테일 패널 칩 전용] 포지션, 역할군, 전투방식, 파워커브 통합 색상 매핑
const DETAIL_COLORS = {
  // 포지션 (역할군 색상과 동일 매칭)
  탑: '#b87e45',
  탑레이너: '#b87e45',
  정글: '#b952ed',
  정글러: '#b952ed',
  미드: '#299bf5',
  미드레이너: '#299bf5',
  바텀: '#ee4b5e',
  바텀레이너: '#ee4b5e',
  서폿: '#f4bf2c',
  서포터: '#f4bf2c',

  // 역할군
  탱커: '#b87e45',
  물리딜러: '#ee4b5e',
  마법딜러: '#299bf5',
  버퍼: '#f4bf2c',
  디버퍼: '#b952ed',

  // 전투방식
  정석방식: '#2ec4b6',
  견제방식: '#ff9f1c',
  돌진방식: '#ff3366',
  유동적방식: '#4cc9f0',

  // 파워커브 (전투방식 색상 공유 + 안전지속 고유색)
  초반강력: '#ff3366',
  중반강력: '#ff9f1c',
  중반정체: '#2ec4b6',
  후반강력: '#4cc9f0',
  안전지속: '#4361ee',
};

// ----------------------------------------------------
// [티어 생성] 앱 초기화 시 랜덤 티어 부여 (S, A, B, C, D)
// ----------------------------------------------------
function initTiers() {
  const total = CHAMPIONS.length;
  const sCount = Math.floor(total * (Math.random() * (0.12 - 0.05) + 0.05));
  const aCount = Math.floor(total * (Math.random() * (0.3 - 0.2) + 0.2));
  const cCount = Math.floor(total * (Math.random() * (0.3 - 0.2) + 0.2));
  const dCount = Math.floor(total * (Math.random() * (0.12 - 0.05) + 0.05));
  const bCount = total - (sCount + aCount + cCount + dCount);

  const tiers = [
    ...Array(sCount).fill('S'),
    ...Array(aCount).fill('A'),
    ...Array(bCount).fill('B'),
    ...Array(cCount).fill('C'),
    ...Array(dCount).fill('D'),
  ];

  for (let i = tiers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  }

  CHAMPIONS.forEach((champ, index) => {
    champ.tier = tiers[index];
    champ.tierIcon = `./portraits/${tiers[index]}tier.png`;
  });
}

// 상태 변수
let currentTurnIndex = 0;
let selectedChampion = null;
const bannedIds = new Set();
const pickedIds = new Set();
const currentFilters = {
  tier: '전체',
  position: '전체',
  role: '전체',
  style: '전체',
  powerCurve: '전체',
  search: '',
};
const bluePickedChamps = [null, null, null, null, null];
const redPickedChamps = [null, null, null, null, null];
let isSwapPhase = false;
let swapSource = null;

// DOM 캐싱
const gridEl = document.getElementById('championGrid');
const phaseBadgeEl = document.getElementById('phaseBadge');
const statusTitleEl = document.getElementById('statusTitle');
const confirmBtn = document.getElementById('confirmBtn');

// 디테일 패널 헤더 칩 DOM 요소 캐싱
const detailTierIcon = document.getElementById('detailTierIcon');
const detailChampName = document.getElementById('detailChampName');
const detailPosChips = document.getElementById('detailPosChips');
const detailRoleChips = document.getElementById('detailRoleChips');
const detailStyleChips = document.getElementById('detailStyleChips');
const detailCurveChips = document.getElementById('detailCurveChips');

// 챔피언 상세 정보 뱃지 & 칩 렌더러
function renderChampionDetail(champ) {
  if (!champ) {
    if (detailTierIcon) detailTierIcon.src = './portraits/Qtier.png';
    if (detailChampName) detailChampName.textContent = '[이름]';
    if (detailPosChips) detailPosChips.innerHTML = '';
    if (detailRoleChips) detailRoleChips.innerHTML = '';
    if (detailStyleChips) detailStyleChips.innerHTML = '';
    if (detailCurveChips) detailCurveChips.innerHTML = '';
    return;
  }

  if (detailTierIcon) detailTierIcon.src = champ.tierIcon;
  if (detailChampName) detailChampName.textContent = champ.nameKr;

  if (detailPosChips) {
    detailPosChips.innerHTML = champ.positions
      .map(
        (pos) =>
          `<span class="info-chip" style="background:${DETAIL_COLORS[pos] || '#485c7b'}">${pos}</span>`,
      )
      .join('');
  }

  if (detailRoleChips) {
    detailRoleChips.innerHTML = champ.roles
      .map(
        (role) =>
          `<span class="info-chip" style="background:${DETAIL_COLORS[role] || '#485c7b'}">${role}</span>`,
      )
      .join('');
  }

  if (detailStyleChips) {
    const styleColor = DETAIL_COLORS[champ.style] || '#485c7b';
    detailStyleChips.innerHTML = `<span class="info-chip" style="background:${styleColor}">${champ.style}</span>`;
  }

  if (detailCurveChips) {
    const curveColor = DETAIL_COLORS[champ.powerCurve] || '#485c7b';
    detailCurveChips.innerHTML = `<span class="info-chip" style="background:${curveColor}">${champ.powerCurve}</span>`;
  }
}

function adjustColorBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `rgb(${R}, ${G}, ${B})`;
}

// ----------------------------------------------------
// [전투역할군 / 전투방식 공통 3D 파이 차트 엔진]
// ----------------------------------------------------
function calcTeamRoleWeights(pickedArray) {
  const weights = { 물리딜러: 0, 마법딜러: 0, 탱커: 0, 버퍼: 0, 디버퍼: 0 };
  let totalWeight = 0;
  pickedArray.forEach((champ) => {
    if (!champ) return;
    if (champ.roles.length === 1) {
      weights[champ.roles[0]] += 2;
      totalWeight += 2;
    } else if (champ.roles.length >= 2) {
      champ.roles.forEach((r) => {
        weights[r] += 1;
      });
      totalWeight += champ.roles.length;
    }
  });
  return { weights, totalWeight };
}

function calcTeamStyleWeights(pickedArray) {
  const weights = { 정석방식: 0, 견제방식: 0, 돌진방식: 0, 유동적방식: 0 };
  let totalWeight = 0;
  pickedArray.forEach((champ) => {
    if (!champ) return;
    weights[champ.style] += 1;
    totalWeight += 1;
  });
  return { weights, totalWeight };
}

function renderGeneric3DPieChart(
  svgId,
  legendId,
  pickedArray,
  configMap,
  weightCalcFn,
) {
  const svg = document.getElementById(svgId);
  const legend = document.getElementById(legendId);
  if (!svg || !legend) return;

  svg.innerHTML = '';
  legend.innerHTML = '';

  const { weights, totalWeight } = weightCalcFn(pickedArray);
  const rx = 120,
    ry = 70,
    depth = 30,
    centerY = -10;

  const dropShadow = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'ellipse',
  );
  dropShadow.setAttribute('cx', '0');
  dropShadow.setAttribute('cy', (centerY + depth + 12).toString());
  dropShadow.setAttribute('rx', (rx + 8).toString());
  dropShadow.setAttribute('ry', (ry + 4).toString());
  dropShadow.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
  dropShadow.setAttribute('filter', 'blur(6px)');
  svg.appendChild(dropShadow);

  if (totalWeight === 0) {
    const baseGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g',
    );
    const sideWall = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    sideWall.setAttribute(
      'd',
      `M ${-rx} ${centerY} A ${rx} ${ry} 0 0 0 ${rx} ${centerY} v ${depth} A ${rx} ${ry} 0 0 1 ${-rx} ${centerY + depth} Z`,
    );
    sideWall.setAttribute('fill', '#0e141e');
    sideWall.setAttribute('stroke', '#1f2a3a');
    sideWall.setAttribute('stroke-width', '1.2');
    baseGroup.appendChild(sideWall);

    const topCap = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'ellipse',
    );
    topCap.setAttribute('cx', '0');
    topCap.setAttribute('cy', centerY.toString());
    topCap.setAttribute('rx', rx.toString());
    topCap.setAttribute('ry', ry.toString());
    topCap.setAttribute('fill', '#16202e');
    topCap.setAttribute('stroke', '#2c3b52');
    topCap.setAttribute('stroke-width', '1.5');
    baseGroup.appendChild(topCap);
    svg.appendChild(baseGroup);

    Object.keys(configMap).forEach((name) => {
      const cfg = configMap[name];
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<div class="legend-left"><span class="legend-dot" style="background:${cfg.color}; color:${cfg.color}"></span><span>${name}</span></div><span class="legend-pct">0%</span>`;
      legend.appendChild(item);
    });
    return;
  }

  const activeSlices = [];
  let currentAngle = -Math.PI / 2;
  Object.keys(weights).forEach((name) => {
    if (weights[name] <= 0) return;
    const sweepAngle = (weights[name] / totalWeight) * 2 * Math.PI;
    activeSlices.push({
      name,
      color: configMap[name].color,
      startAngle: currentAngle,
      endAngle: currentAngle + sweepAngle,
    });
    currentAngle += sweepAngle;
  });

  const sidesGroup = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'g',
  );
  if (activeSlices.length === 1) {
    const sideWall = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    sideWall.setAttribute(
      'd',
      `M ${-rx} ${centerY} A ${rx} ${ry} 0 0 0 ${rx} ${centerY} v ${depth} A ${rx} ${ry} 0 0 1 ${-rx} ${centerY + depth} Z`,
    );
    sideWall.setAttribute(
      'fill',
      adjustColorBrightness(activeSlices[0].color, -38),
    );
    sideWall.setAttribute('stroke', '#090d14');
    sidesGroup.appendChild(sideWall);
  } else {
    activeSlices.forEach((s) => {
      const subSteps = 30,
        pointsTop = [],
        pointsBottom = [];
      for (let i = 0; i <= subSteps; i++) {
        const theta =
          s.startAngle + (s.endAngle - s.startAngle) * (i / subSteps);
        if (Math.sin(theta) >= -0.01) {
          const px = rx * Math.cos(theta);
          const py = centerY + ry * Math.sin(theta);
          pointsTop.push({ x: px, y: py });
          pointsBottom.push({ x: px, y: py + depth });
        }
      }
      if (pointsTop.length >= 2) {
        let pathD = `M ${pointsTop[0].x} ${pointsTop[0].y} `;
        for (let i = 1; i < pointsTop.length; i++)
          pathD += `L ${pointsTop[i].x} ${pointsTop[i].y} `;
        for (let i = pointsBottom.length - 1; i >= 0; i--)
          pathD += `L ${pointsBottom[i].x} ${pointsBottom[i].y} `;
        pathD += 'Z';
        const sideMesh = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path',
        );
        sideMesh.setAttribute('d', pathD);
        sideMesh.setAttribute('fill', adjustColorBrightness(s.color, -36));
        sideMesh.setAttribute('stroke', '#090d14');
        sidesGroup.appendChild(sideMesh);
      }
    });
  }
  svg.appendChild(sidesGroup);

  const topGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  if (activeSlices.length === 1) {
    const topCap = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'ellipse',
    );
    topCap.setAttribute('cx', '0');
    topCap.setAttribute('cy', centerY.toString());
    topCap.setAttribute('rx', rx.toString());
    topCap.setAttribute('ry', ry.toString());
    topCap.setAttribute('fill', activeSlices[0].color);
    topCap.setAttribute('stroke', '#0a0f17');
    topGroup.appendChild(topCap);
  } else {
    activeSlices.forEach((s) => {
      const x1 = rx * Math.cos(s.startAngle),
        y1 = centerY + ry * Math.sin(s.startAngle);
      const x2 = rx * Math.cos(s.endAngle),
        y2 = centerY + ry * Math.sin(s.endAngle);
      const largeArc = s.endAngle - s.startAngle > Math.PI ? 1 : 0;
      const d = `M 0 ${centerY} L ${x1} ${y1} A ${rx} ${ry} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path',
      );
      path.setAttribute('d', d);
      path.setAttribute('fill', s.color);
      path.setAttribute('stroke', '#0a0f17');
      topGroup.appendChild(path);
    });
  }
  svg.appendChild(topGroup);

  Object.keys(configMap).forEach((name) => {
    const cfg = configMap[name];
    const pct =
      totalWeight > 0 ? Math.round((weights[name] / totalWeight) * 100) : 0;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<div class="legend-left"><span class="legend-dot" style="background:${cfg.color}; color:${cfg.color}"></span><span>${name}</span></div><span class="legend-pct">${pct}%</span>`;
    legend.appendChild(item);
  });
}

// ----------------------------------------------------
// [파워커브] 팀별 평균 화력 산출 및 동적 꺾은선 차트 엔진
// ----------------------------------------------------
function calcTeamPowerCurve(pickedArray) {
  let earlySum = 0,
    midSum = 0,
    lateSum = 0,
    count = 0;

  pickedArray.forEach((champ) => {
    if (!champ) return;
    const cfg = POWER_CURVE_CONFIG[champ.powerCurve];
    if (cfg) {
      earlySum += cfg.early;
      midSum += cfg.mid;
      lateSum += cfg.late;
      count += 1;
    }
  });

  // 픽이 0명일 때는 Y축 최저 기준점인 1.5로 초기화
  if (count === 0) {
    return { early: 1.5, mid: 1.5, late: 1.5, count: 0 };
  }

  return {
    early: parseFloat((earlySum / count).toFixed(1)),
    mid: parseFloat((midSum / count).toFixed(1)),
    late: parseFloat((lateSum / count).toFixed(1)),
    count,
  };
}

function renderPowerCurveChart() {
  const svg = document.getElementById('powerCurveLineChart');
  const summaryBox = document.getElementById('curveSummaryBox');
  if (!svg || !summaryBox) return;

  svg.innerHTML = '';
  summaryBox.innerHTML = '';

  const blueCurve = calcTeamPowerCurve(bluePickedChamps);
  const redCurve = calcTeamPowerCurve(redPickedChamps);

  // SVG 좌표계
  const padLeft = 45,
    padRight = 35,
    padTop = 25,
    padBottom = 35;
  const chartW = 600 - padLeft - padRight;
  const chartH = 200 - padTop - padBottom;

  const xPoints = [padLeft, padLeft + chartW / 2, padLeft + chartW];

  // [핵심 변경] Y축 변환 (1.5점 ~ 4.5점 범위로 압축하여 변화폭을 극대화)
  const minY = 1.5;
  const maxY = 4.5;
  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padTop + chartH - ((clamped - minY) / (maxY - minY)) * chartH;
  };

  // 1. 그라데이션 필터
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4daafc" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4daafc" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff5263" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ff5263" stop-opacity="0.0"/>
    </linearGradient>
  `;
  svg.appendChild(defs);

  // 2. 배경 그리드 (1.5, 2.5, 3.5, 4.5 4개 핵심 구간 표시)
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const yTicks = [1.5, 2.5, 3.5, 4.5];

  yTicks.forEach((score) => {
    const y = getY(score);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (padLeft - 5).toString());
    line.setAttribute('y1', y.toString());
    line.setAttribute('x2', (padLeft + chartW).toString());
    line.setAttribute('y2', y.toString());
    line.setAttribute('stroke', score === 1.5 ? '#3b4d66' : '#1a2433');
    line.setAttribute('stroke-width', score === 1.5 ? '1.5' : '1');
    if (score > 1.5 && score < 4.5)
      line.setAttribute('stroke-dasharray', '3 4');
    gridGroup.appendChild(line);

    const label = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text',
    );
    label.setAttribute('x', (padLeft - 10).toString());
    label.setAttribute('y', y.toString());
    label.setAttribute('class', 'curve-y-label');
    label.textContent = score.toFixed(1);
    gridGroup.appendChild(label);
  });

  const stages = ['초반', '중반', '후반'];
  xPoints.forEach((x, idx) => {
    const vLine = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line',
    );
    vLine.setAttribute('x1', x.toString());
    vLine.setAttribute('y1', padTop.toString());
    vLine.setAttribute('x2', x.toString());
    vLine.setAttribute('y2', (padTop + chartH).toString());
    vLine.setAttribute('stroke', '#223145');
    vLine.setAttribute('stroke-dasharray', '2 3');
    gridGroup.appendChild(vLine);

    const xLabel = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'text',
    );
    xLabel.setAttribute('x', x.toString());
    xLabel.setAttribute('y', (padTop + chartH + 20).toString());
    xLabel.setAttribute('class', 'curve-axis-label');
    xLabel.textContent = stages[idx];
    gridGroup.appendChild(xLabel);
  });
  svg.appendChild(gridGroup);

  // 3. 차트 라인 렌더링 함수
  function drawLineCurve(teamData, color, areaGradId, labelClass, isRed) {
    const coords = [
      { x: xPoints[0], y: getY(teamData.early), val: teamData.early },
      { x: xPoints[1], y: getY(teamData.mid), val: teamData.mid },
      { x: xPoints[2], y: getY(teamData.late), val: teamData.late },
    ];

    const linePath = `M ${coords[0].x} ${coords[0].y} L ${coords[1].x} ${coords[1].y} L ${coords[2].x} ${coords[2].y}`;
    const areaPath = `${linePath} L ${xPoints[2]} ${getY(minY)} L ${xPoints[0]} ${getY(minY)} Z`;

    const areaEl = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    areaEl.setAttribute('d', areaPath);
    areaEl.setAttribute('fill', `url(#${areaGradId})`);
    svg.appendChild(areaEl);

    const lineEl = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path',
    );
    lineEl.setAttribute('d', linePath);
    lineEl.setAttribute('fill', 'none');
    lineEl.setAttribute('stroke', color);
    lineEl.setAttribute('stroke-width', '3.2');
    lineEl.setAttribute('filter', `drop-shadow(0 0 6px ${color})`);
    svg.appendChild(lineEl);

    const pointsGroup = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g',
    );
    coords.forEach((pt) => {
      const dot = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      dot.setAttribute('cx', pt.x.toString());
      dot.setAttribute('cy', pt.y.toString());
      dot.setAttribute('r', '5');
      dot.setAttribute('fill', '#101622');
      dot.setAttribute('stroke', color);
      dot.setAttribute('stroke-width', '2');
      pointsGroup.appendChild(dot);

      const txt = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
      txt.setAttribute('x', pt.x.toString());
      txt.setAttribute('y', (isRed ? pt.y + 17 : pt.y - 11).toString());
      txt.setAttribute('class', `point-label ${labelClass}`);
      txt.textContent = teamData.count > 0 ? pt.val.toFixed(1) : '-';
      pointsGroup.appendChild(txt);
    });
    svg.appendChild(pointsGroup);
  }

  drawLineCurve(blueCurve, '#4daafc', 'blueGrad', 'blue', false);
  drawLineCurve(redCurve, '#ff5263', 'redGrad', 'red', true);

  // 4. 우측 요약 수치 카드 렌더링
  const stageData = [
    {
      title: '초반 단계',
      bVal: blueCurve.early,
      rVal: redCurve.early,
      bCnt: blueCurve.count,
      rCnt: redCurve.count,
    },
    {
      title: '중반 단계',
      bVal: blueCurve.mid,
      rVal: redCurve.mid,
      bCnt: blueCurve.count,
      rCnt: redCurve.count,
    },
    {
      title: '후반 단계',
      bVal: blueCurve.late,
      rVal: redCurve.late,
      bCnt: blueCurve.count,
      rCnt: redCurve.count,
    },
  ];

  stageData.forEach((st) => {
    const card = document.createElement('div');
    card.className = 'stage-card';
    const bDisplay = st.bCnt > 0 ? st.bVal.toFixed(1) : '-';
    const rDisplay = st.rCnt > 0 ? st.rVal.toFixed(1) : '-';

    card.innerHTML = `
      <div class="stage-title">${st.title}</div>
      <div class="stage-scores">
        <span class="score-blue">${bDisplay}</span>
        <span class="score-vs">VS</span>
        <span class="score-red">${rDisplay}</span>
      </div>
    `;
    summaryBox.appendChild(card);
  });
}

// 전체 차트 갱신 트리거
function updateAllCharts() {
  renderGeneric3DPieChart(
    'blueRolePie',
    'blueRoleLegend',
    bluePickedChamps,
    ROLE_CONFIG,
    calcTeamRoleWeights,
  );
  renderGeneric3DPieChart(
    'redRolePie',
    'redRoleLegend',
    redPickedChamps,
    ROLE_CONFIG,
    calcTeamRoleWeights,
  );
  renderGeneric3DPieChart(
    'blueStylePie',
    'blueStyleLegend',
    bluePickedChamps,
    STYLE_CONFIG,
    calcTeamStyleWeights,
  );
  renderGeneric3DPieChart(
    'redStylePie',
    'redStyleLegend',
    redPickedChamps,
    STYLE_CONFIG,
    calcTeamStyleWeights,
  );
  renderPowerCurveChart();
}

// ----------------------------------------------------
// UI 제어 및 이벤트 (기존과 동일)
// ----------------------------------------------------
function renderChampionGrid() {
  gridEl.innerHTML = '';
  const filtered = CHAMPIONS.filter((champ) => {
    return (
      (currentFilters.tier === '전체' || champ.tier === currentFilters.tier) &&
      (currentFilters.position === '전체' ||
        champ.positions.includes(currentFilters.position)) &&
      (currentFilters.role === '전체' ||
        champ.roles.includes(currentFilters.role)) &&
      (currentFilters.style === '전체' ||
        champ.style === currentFilters.style) &&
      (currentFilters.powerCurve === '전체' ||
        champ.powerCurve === currentFilters.powerCurve) &&
      (champ.nameKr.includes(currentFilters.search) ||
        champ.id.toLowerCase().includes(currentFilters.search.toLowerCase()))
    );
  });

  filtered.sort((a, b) => a.nameKr.localeCompare(b.nameKr, 'ko'));

  filtered.forEach((champ) => {
    const card = document.createElement('div');
    const isUsed = bannedIds.has(champ.id) || pickedIds.has(champ.id);
    const isSelected = selectedChampion && selectedChampion.id === champ.id;
    card.className = `champ-card ${isUsed ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`;
    card.innerHTML = `<div class="c-img-wrapper"><img class="tier-badge" src="${champ.tierIcon}" alt="${champ.tier} Tier" /><img src="${champ.portrait}" alt="${champ.nameKr}" loading="lazy" /></div><div class="c-name" title="${champ.nameKr}">${champ.nameKr}</div>`;

    card.addEventListener('mouseenter', () => {
      renderChampionDetail(champ);
    });
    if (!isUsed && !isSwapPhase) {
      card.addEventListener('click', () => {
        selectedChampion = champ;
        renderChampionDetail(champ);
        confirmBtn.disabled = false;
        renderChampionGrid();
      });
    }
    gridEl.appendChild(card);
  });
}

function updateTurnUI() {
  document
    .querySelectorAll('.current-turn')
    .forEach((el) => el.classList.remove('current-turn'));
  if (currentTurnIndex >= DRAFT_SEQUENCE.length) {
    startSwapPhase();
    return;
  }

  const turn = DRAFT_SEQUENCE[currentTurnIndex];
  phaseBadgeEl.className = `phase-badge ${turn.team}`;
  phaseBadgeEl.textContent = `${turn.team === 'blue' ? '블루팀' : '레드팀'} [${turn.action === 'ban' ? '금지' : '선택'}]`;
  statusTitleEl.textContent = turn.label;

  const activeSlotId = `${turn.team}-${turn.action}-${turn.slotIndex}`;
  const activeSlotEl = document.getElementById(activeSlotId);
  if (activeSlotEl) activeSlotEl.classList.add('current-turn');

  selectedChampion = null;
  confirmBtn.disabled = true;
  renderChampionGrid();
  updateAllCharts();
}

function renderPickSlot(team, slotIndex, champ) {
  const slotEl = document.getElementById(`${team}-pick-${slotIndex}`);
  if (!slotEl) return;
  if (champ) {
    slotEl.innerHTML = `<div class="slot-icon"><img src="${champ.portrait}" alt="${champ.nameKr}" /></div><div class="slot-info"><h4>${champ.nameKr}</h4><p>${champ.roles.join('/')} · ${champ.style}</p></div>`;
    slotEl.onmouseenter = () => {
      renderChampionDetail(champ);
    };
    slotEl.style.cursor = 'pointer';
  }
}

function startSwapPhase() {
  isSwapPhase = true;
  document.body.classList.add('swap-ready');
  phaseBadgeEl.className = 'phase-badge swap';
  phaseBadgeEl.textContent = '스왑 단계';
  statusTitleEl.textContent = '포지션 라벨을 클릭해 챔피언을 교환하세요';
  confirmBtn.disabled = true;
  setupPositionLabels();
  renderChampionGrid();
  updateAllCharts();
}

function setupPositionLabels() {
  document.querySelectorAll('.pick-row').forEach((row, index) => {
    const label = row.querySelector('.pos-label');
    if (!label) return;
    const isBlue = index < 5,
      team = isBlue ? 'blue' : 'red',
      slotIndex = isBlue ? index : index - 5;
    const rawPosText = label.textContent.replace('⇄', '').trim();
    label.innerHTML = `<span class="pos-swap-icon">⇄</span><span class="pos-text">${rawPosText}</span>`;
    label.onclick = () => handlePosLabelClick(team, slotIndex, label);
  });
}

function handlePosLabelClick(team, slotIndex, clickedLabelEl) {
  if (!isSwapPhase) return;
  if (
    swapSource &&
    swapSource.team === team &&
    swapSource.slotIndex === slotIndex
  ) {
    clearSwapHighlights();
    swapSource = null;
    statusTitleEl.textContent = '스왑 취소: 포지션 라벨을 다시 선택하세요';
    return;
  }
  if (!swapSource) {
    swapSource = { team, slotIndex, element: clickedLabelEl };
    applySwapHighlights(team, slotIndex);
    statusTitleEl.textContent = `${team === 'blue' ? '블루팀' : '레드팀'} 맞바꿀 두 번째 포지션을 누르세요`;
    return;
  }
  if (swapSource.team === team && swapSource.slotIndex !== slotIndex) {
    const list = team === 'blue' ? bluePickedChamps : redPickedChamps;
    const src = swapSource.slotIndex,
      tgt = slotIndex;
    [list[src], list[tgt]] = [list[tgt], list[src]];
    renderPickSlot(team, src, list[src]);
    renderPickSlot(team, tgt, list[tgt]);
    statusTitleEl.textContent = `스왑 완료: [${list[src]?.nameKr || ''}] ⇄ [${list[tgt]?.nameKr || ''}]`;
    clearSwapHighlights();
    swapSource = null;
    updateAllCharts();
  }
}

function applySwapHighlights(team, selectedSlotIndex) {
  clearSwapHighlights();
  document.querySelectorAll('.pick-row').forEach((row, index) => {
    const label = row.querySelector('.pos-label');
    const currentTeam = index < 5 ? 'blue' : 'red';
    const slotIndex = index < 5 ? index : index - 5;
    if (currentTeam === team)
      label.classList.add(
        slotIndex === selectedSlotIndex ? 'swap-source' : 'swap-target',
      );
  });
}

function clearSwapHighlights() {
  document
    .querySelectorAll('.pos-label')
    .forEach((label) => label.classList.remove('swap-source', 'swap-target'));
}

confirmBtn.addEventListener('click', () => {
  if (!selectedChampion || currentTurnIndex >= DRAFT_SEQUENCE.length) return;
  const currentChamp = selectedChampion,
    turn = DRAFT_SEQUENCE[currentTurnIndex];
  const slotEl = document.getElementById(
    `${turn.team}-${turn.action}-${turn.slotIndex}`,
  );

  if (turn.action === 'ban') {
    bannedIds.add(currentChamp.id);
    slotEl.classList.add('banned-filled');
    slotEl.innerHTML = `<img src="${currentChamp.portrait}" alt="${currentChamp.nameKr}" /><div class="ban-cross">✕</div>`;
    slotEl.title = `${currentChamp.nameKr} (밴)`;
    slotEl.onmouseenter = () => {
      renderChampionDetail(currentChamp);
    };
    slotEl.style.cursor = 'pointer';
  } else {
    pickedIds.add(currentChamp.id);
    if (turn.team === 'blue') bluePickedChamps[turn.slotIndex] = currentChamp;
    else redPickedChamps[turn.slotIndex] = currentChamp;
    renderPickSlot(turn.team, turn.slotIndex, currentChamp);
    updateAllCharts();
  }
  currentTurnIndex++;
  updateTurnUI();
});

['tier', 'pos', 'role', 'style', 'curve'].forEach((prefix) => {
  document.getElementById(`${prefix}Select`).addEventListener('change', (e) => {
    currentFilters[
      prefix === 'pos' ? 'position' : prefix === 'curve' ? 'powerCurve' : prefix
    ] = e.target.value;
    renderChampionGrid();
  });
});
searchInput.addEventListener('input', (e) => {
  currentFilters.search = e.target.value.trim();
  renderChampionGrid();
});
clearFiltersBtn.addEventListener('click', () => {
  ['tier', 'pos', 'role', 'style', 'curve'].forEach((prefix) => {
    document.getElementById(`${prefix}Select`).value = '전체';
  });
  searchInput.value = '';
  Object.keys(currentFilters).forEach(
    (k) => (currentFilters[k] = k === 'search' ? '' : '전체'),
  );
  renderChampionGrid();
});

document
  .getElementById('resetBtn')
  .addEventListener('click', () => location.reload());

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach((b) => b.classList.remove('active'));
    tabPanes.forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document
      .getElementById(btn.getAttribute('data-tab'))
      .classList.add('active');
  });
});

initTiers();
renderChampionDetail(null);
updateTurnUI();
updateAllCharts();
