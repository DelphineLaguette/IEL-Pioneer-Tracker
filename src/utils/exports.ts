import type { TrackerData } from '../types';
import { LEADERS, getLeader } from '../data/leaders';
import { PRINCIPLES, getPrinciple } from '../data/principles';
import { getLatestSP } from '../context/StoreContext';

const NAVY  = '002060';
const CYAN  = '00D0DA';
const PINK  = 'FF51A1';
const WHITE = 'FFFFFF';
const LIGHT = 'EFF6FF';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function today() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function slug() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function exportToExcel(data: TrackerData): Promise<void> {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Pioneer Overview ──
  const overview = LEADERS.map(l => {
    const sp      = getLatestSP(data.startingPoints, l.id);
    const cis     = data.checkIns.filter(c => c.leaderId === l.id);
    const ratings = cis.map(c => c.selfRating).filter(r => r > 0);
    const avg     = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : '-';
    const latest  = [...cis].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )[0];
    const bwCIs   = data.biWeeklyCheckIns.filter(b => b.leaderId === l.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestBW = bwCIs[0];

    return {
      'Leader':                l.name,
      'Team':                  sp?.team || '-',
      'Email':                 sp?.email || '-',
      'Reflection Submitted':  sp ? 'Yes' : 'No',
      'Check-In Count':        cis.length,
      'Avg Self-Rating':       avg,
      'Latest Progress':       latest?.progressVersusLastMonth || '-',
      'Support Needed':        latest?.supportNeeded ? 'Yes' : 'No',
      'Next 30-Day Check-In':  latest?.nextCheckInDate ? fmt(latest.nextCheckInDate) : '-',
      'Bi-Weekly Check-Ins':   bwCIs.length,
      'Next Bi-Weekly':        latestBW?.nextCheckInDate ? fmt(latestBW.nextCheckInDate) : '-',
      'Strongest Principle':   sp?.strongestPrinciple || '-',
      'Main Dev Area':         sp?.mainDevelopmentArea || '-',
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overview), 'Pioneer Overview');

  // ── Sheet 2: 30-Day Check-Ins ──
  const checkIns = [...data.checkIns]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .map(ci => {
      const p = getPrinciple(ci.selectedPrinciple);
      return {
        'Leader':                   getLeader(ci.leaderId)?.name || ci.leaderId,
        'Email':                    ci.email,
        'Team':                     ci.team,
        'Month':                    ci.month,
        'Submitted':                fmt(ci.submittedAt),
        'Principle':                p ? `P${p.number} — ${p.title}` : ci.selectedPrinciple,
        'Why This Principle':       ci.whyThisPrinciple,
        '3 Behaviours':             ci.threeBehaviours,
        'Success Measure':          ci.successMeasure,
        'Accountability Partner':   ci.accountabilityPartner,
        'What Went Well':           ci.whatDidWell,
        'Where Fell Short':         ci.whereFellShort,
        'Concrete Example':         ci.concreteExample,
        'Main Obstacle':            ci.mainObstacle,
        'Feedback — Team':          ci.feedbackFromTeam,
        'Feedback — Manager':       ci.feedbackFromManager,
        'Self Rating':              ci.selfRating,
        'Progress vs Last Month':   ci.progressVersusLastMonth,
        'Support Needed':           ci.supportNeeded ? 'Yes' : 'No',
        'Type of Support':          ci.typeOfSupportNeeded,
        'Focus Next 30 Days':       ci.focusForNext30Days,
        'Next Check-In Date':       ci.nextCheckInDate ? fmt(ci.nextCheckInDate) : '-',
      };
    });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(checkIns), '30-Day Check-Ins');

  // ── Sheet 3: Baseline Reflections ──
  const reflections = LEADERS.flatMap(l => {
    const sps = [...data.startingPoints]
      .filter(s => s.leaderId === l.id)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return sps.map((sp, i) => ({
      'Leader':                 l.name,
      'Version':                i === 0 ? 'Latest' : `v${sps.length - i}`,
      'Submitted':              fmt(sp.submittedAt),
      'Email':                  sp.email,
      'Team':                   sp.team,
      'P1 – Lead w/ Purpose':   sp.leadWithPurpose.rating,
      'P2 – Role Model Values': sp.roleModelValues.rating,
      'P3 – High Standards':    sp.setHighStandards.rating,
      'P4 – Enable Innovation': sp.enableInnovation.rating,
      'P5 – Responsibility':    sp.actWithResponsibility.rating,
      'P6 – Build Trust':       sp.buildTrust.rating,
      'Strongest Principle':    sp.strongestPrinciple,
      'Main Dev Area':          sp.mainDevelopmentArea,
      'Why It Matters':         sp.whyDevelopmentAreaMatters,
      'Leadership Intention':   sp.leadershipIntention,
    }));
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reflections), 'Baseline Reflections');

  // ── Sheet 4: Bi-Weekly Check-Ins ──
  const biWeekly = [...data.biWeeklyCheckIns]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(bw => {
      const p = getPrinciple(bw.principleFocus);
      return {
        'Leader':                  getLeader(bw.leaderId)?.name || bw.leaderId,
        'Week':                    bw.week,
        'Date Recorded':           fmt(bw.createdAt),
        'Key Actions Taken':       bw.keyActionsTaken,
        'What Went Well':          bw.whatWentWell,
        'Challenges':              bw.challenges,
        'Support Needed':          bw.supportNeeded ? 'Yes' : 'No',
        'Type of Support':         bw.typeOfSupportNeeded,
        'Confidence Level':        bw.confidenceLevel,
        'Principle Focus':         p ? `P${p.number} — ${p.shortTitle}` : bw.principleFocus,
        'Status':                  bw.status,
        'Self Rating':             bw.selfRating,
        'Manager Rating':          bw.managerRating || '-',
        'Progress Comment':        bw.overallProgressComment,
        'Next Check-In':           bw.nextCheckInDate ? fmt(bw.nextCheckInDate) : '-',
      };
    });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(biWeekly), 'Bi-Weekly Check-Ins');

  XLSX.writeFile(wb, `IEL-Pioneer-Tracker-${slug()}.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// POWERPOINT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function exportToPowerPoint(data: TrackerData): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 13.33" × 7.5"
  pptx.title  = 'IEL Pioneer Tracker — Progress Report';

  const W = 13.33, H = 7.5;
  const PAD = 0.4;

  // Helper: navy header bar
  function addHeader(slide: ReturnType<typeof pptx.addSlide>, title: string, sub?: string) {
    slide.addShape('rect' as any, { x: 0, y: 0, w: W, h: 0.85, fill: { color: NAVY } });
    slide.addText(title, {
      x: PAD, y: 0.1, w: W - PAD * 2, h: 0.65,
      fontSize: 18, bold: true, color: WHITE, fontFace: 'Calibri', valign: 'middle',
    });
    if (sub) {
      slide.addText(sub, {
        x: PAD, y: 0.55, w: W - PAD * 2, h: 0.35,
        fontSize: 10, color: CYAN, fontFace: 'Calibri', valign: 'middle',
      });
    }
    slide.addShape('rect' as any, { x: 0, y: 0.85, w: W, h: 0.04, fill: { color: CYAN } });
  }

  // ── Slide 1: Title ──────────────────────────────────────────────────────────
  const s1 = pptx.addSlide();
  s1.background = { color: NAVY };
  s1.addShape('ellipse' as any, {
    x: 9, y: -1, w: 4, h: 4,
    fill: { color: CYAN, transparency: 88 }, line: { color: CYAN, transparency: 88 },
  });
  s1.addShape('ellipse' as any, {
    x: 7.5, y: 4.5, w: 2, h: 2,
    fill: { color: PINK, transparency: 88 }, line: { color: PINK, transparency: 88 },
  });
  s1.addText('IEL Pioneer Tracker', {
    x: PAD, y: 2.0, w: 8, h: 1.2,
    fontSize: 36, bold: true, color: WHITE, fontFace: 'Calibri',
  });
  s1.addText('Leadership Progress Report', {
    x: PAD, y: 3.3, w: 8, h: 0.6,
    fontSize: 20, color: CYAN, fontFace: 'Calibri',
  });
  s1.addText(`IBL Energy · Generated ${today()}`, {
    x: PAD, y: 4.1, w: 8, h: 0.4,
    fontSize: 11, color: 'FFFFFF80', fontFace: 'Calibri',
  });
  s1.addShape('rect' as any, { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: CYAN } });

  // ── Slide 2: Programme Overview ─────────────────────────────────────────────
  const completedReflections = LEADERS.filter(l =>
    data.startingPoints.some(s => s.leaderId === l.id),
  ).length;
  const allRatings = data.checkIns.map(c => c.selfRating).filter(r => r > 0);
  const avgRating  = allRatings.length
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : '-';
  const supportCount = data.checkIns.filter(c => c.supportNeeded).length;

  const s2 = pptx.addSlide();
  addHeader(s2, 'Programme Overview', 'IEL Pioneer Tracker');
  const stats = [
    { label: 'Pioneers',       value: String(LEADERS.length),       color: NAVY  },
    { label: 'Reflections',    value: String(completedReflections),  color: '15803d' },
    { label: 'Check-Ins',      value: String(data.checkIns.length),  color: CYAN  },
    { label: 'Avg Rating',     value: `${avgRating}/5`,              color: '1d4ed8' },
    { label: 'Support Flags',  value: String(supportCount),          color: 'be185d' },
  ];
  stats.forEach((s, i) => {
    const x = PAD + i * 2.5;
    s2.addShape('rect' as any, {
      x, y: 1.1, w: 2.3, h: 1.6,
      fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0' },
    });
    s2.addText(s.value, {
      x, y: 1.2, w: 2.3, h: 0.8,
      fontSize: 28, bold: true, color: s.color, fontFace: 'Calibri', align: 'center',
    });
    s2.addText(s.label, {
      x, y: 2.1, w: 2.3, h: 0.4,
      fontSize: 10, color: '6b7280', fontFace: 'Calibri', align: 'center',
    });
  });

  // ── Slide 3: Pioneer Progress Matrix ────────────────────────────────────────
  const s3 = pptx.addSlide();
  addHeader(s3, 'Pioneer Progress Matrix');

  const PROGRESS_LABEL: Record<string, string> = {
    improved: '↑ Improved', same: '→ Same', declined: '↓ Needs improvement',
  };
  const matrixRows: any[][] = [
    [
      { text: 'Leader',       options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Team',         options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Reflection',   options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Check-Ins',    options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Avg Rating',   options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Last Progress',options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      { text: 'Next Check-In',options: { bold: true, color: WHITE, fill: { color: NAVY } } },
    ],
    ...LEADERS.map(l => {
      const sp      = getLatestSP(data.startingPoints, l.id);
      const cis     = data.checkIns.filter(c => c.leaderId === l.id);
      const ratings = cis.map(c => c.selfRating).filter(r => r > 0);
      const avg     = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : '-';
      const latest  = [...cis].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )[0];
      return [
        { text: l.name,      options: { bold: true } },
        { text: sp?.team || '-' },
        { text: sp ? '✓ Done' : 'Pending', options: { color: sp ? '15803d' : '9ca3af' } },
        { text: String(cis.length) },
        { text: `${avg}/5`,  options: { color: NAVY, bold: true } },
        { text: latest ? PROGRESS_LABEL[latest.progressVersusLastMonth] : '-' },
        { text: latest?.nextCheckInDate ? fmt(latest.nextCheckInDate) : '-' },
      ];
    }),
  ];
  s3.addTable(matrixRows, {
    x: PAD, y: 1.05, w: W - PAD * 2,
    border: { pt: 0.5, color: 'E2E8F0' },
    colW: [1.8, 1.5, 1.2, 1.0, 1.1, 2.2, 1.8],
    fontFace: 'Calibri', fontSize: 10,
    rowH: 0.38,
  });

  // ── Slides 4–8: One per leader ───────────────────────────────────────────────
  for (const leader of LEADERS) {
    const sp     = getLatestSP(data.startingPoints, leader.id);
    if (!sp) continue;

    const cis    = [...data.checkIns]
      .filter(c => c.leaderId === leader.id)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const latest = cis[0];

    const sl = pptx.addSlide();
    addHeader(sl, `${leader.name}`, `${sp.team} · ${sp.email}`);

    // Principle ratings (left column)
    sl.addText('Principle Self-Ratings', {
      x: PAD, y: 1.05, w: 5.5, h: 0.3,
      fontSize: 11, bold: true, color: NAVY, fontFace: 'Calibri',
    });
    const principles = [
      { key: 'leadWithPurpose' as const,        label: 'P1 Lead w/ Purpose',   r: sp.leadWithPurpose.rating },
      { key: 'roleModelValues' as const,        label: 'P2 Role Model Values', r: sp.roleModelValues.rating },
      { key: 'setHighStandards' as const,       label: 'P3 High Standards',    r: sp.setHighStandards.rating },
      { key: 'enableInnovation' as const,       label: 'P4 Enable Innovation', r: sp.enableInnovation.rating },
      { key: 'actWithResponsibility' as const,  label: 'P5 Responsibility',    r: sp.actWithResponsibility.rating },
      { key: 'buildTrust' as const,             label: 'P6 Build Trust',       r: sp.buildTrust.rating },
    ];
    principles.forEach(({ label, r }, i) => {
      const y = 1.45 + i * 0.7;
      sl.addText(label, { x: PAD, y, w: 2.0, h: 0.3, fontSize: 9, color: '374151', fontFace: 'Calibri', valign: 'middle' });
      sl.addShape('rect' as any, { x: 2.5, y: y + 0.05, w: 3.0, h: 0.22, fill: { color: 'F1F5F9' } });
      sl.addShape('rect' as any, { x: 2.5, y: y + 0.05, w: 3.0 * (r / 5), h: 0.22, fill: { color: CYAN } });
      sl.addText(`${r}/5`, { x: 5.6, y, w: 0.4, h: 0.3, fontSize: 9, bold: true, color: NAVY, fontFace: 'Calibri' });
    });

    // Summary (right column)
    sl.addShape('rect' as any, { x: 6.8, y: 1.05, w: 6.1, h: 2.7, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0' } });
    [
      { label: 'Strongest principle', value: sp.strongestPrinciple, color: CYAN },
      { label: 'Main development area', value: sp.mainDevelopmentArea, color: PINK },
      { label: 'Leadership intention', value: sp.leadershipIntention, color: NAVY },
    ].forEach(({ label, value, color }, i) => {
      if (!value) return;
      sl.addText(label.toUpperCase(), {
        x: 6.95, y: 1.15 + i * 0.8, w: 5.8, h: 0.22,
        fontSize: 7, color: '9ca3af', bold: true, fontFace: 'Calibri',
      });
      sl.addText(value, {
        x: 6.95, y: 1.38 + i * 0.8, w: 5.8, h: 0.4,
        fontSize: 9, color: color, fontFace: 'Calibri',
      });
    });

    // Latest check-in
    if (latest) {
      sl.addText('Latest 30-Day Check-In', {
        x: PAD, y: 4.0, w: W - PAD * 2, h: 0.3,
        fontSize: 11, bold: true, color: NAVY, fontFace: 'Calibri',
      });
      const ciFields = [
        { label: 'Month',           value: latest.month },
        { label: 'Self Rating',     value: `${latest.selfRating}/5` },
        { label: 'Progress',        value: PROGRESS_LABEL[latest.progressVersusLastMonth] },
        { label: 'What went well',  value: latest.whatDidWell },
        { label: 'Next focus',      value: latest.focusForNext30Days },
      ].filter(f => f.value);
      ciFields.forEach(({ label, value }, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        sl.addShape('rect' as any, {
          x: PAD + col * 6.2, y: 4.4 + row * 1.0, w: 6.0, h: 0.85,
          fill: { color: 'EFF6FF' }, line: { color: 'BFDBFE' },
        });
        sl.addText(label.toUpperCase(), {
          x: PAD + col * 6.2 + 0.1, y: 4.45 + row * 1.0, w: 5.8, h: 0.22,
          fontSize: 7, color: '9ca3af', bold: true, fontFace: 'Calibri',
        });
        sl.addText(value, {
          x: PAD + col * 6.2 + 0.1, y: 4.67 + row * 1.0, w: 5.8, h: 0.5,
          fontSize: 9, color: '1e3a5f', fontFace: 'Calibri',
        });
      });
    }
  }

  // ── Slide: Bi-Weekly Check-Ins Summary ──────────────────────────────────────
  if (data.biWeeklyCheckIns.length > 0) {
    const s = pptx.addSlide();
    addHeader(s, 'Bi-Weekly Culture Check-Ins', `${data.biWeeklyCheckIns.length} recorded`);

    const bwRows: any[][] = [
      [
        { text: 'Leader',    options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Week',      options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Principle', options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Status',    options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Self',      options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Manager',   options: { bold: true, color: WHITE, fill: { color: NAVY } } },
        { text: 'Date',      options: { bold: true, color: WHITE, fill: { color: NAVY } } },
      ],
      ...[...data.biWeeklyCheckIns]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 15)
        .map(bw => {
          const p = getPrinciple(bw.principleFocus);
          return [
            { text: getLeader(bw.leaderId)?.name || bw.leaderId, options: { bold: true } },
            { text: `Week ${bw.week}` },
            { text: p ? `P${p.number}` : '-' },
            { text: bw.status.replace('-', ' '), options: {
              color: bw.status === 'on-track' ? '15803d'
                   : bw.status === 'progressing' ? 'a16207' : 'b91c1c',
            }},
            { text: `${bw.selfRating}/5` },
            { text: bw.managerRating > 0 ? `${bw.managerRating}/5` : '-' },
            { text: fmt(bw.createdAt) },
          ];
        }),
    ];
    s.addTable(bwRows, {
      x: PAD, y: 1.05, w: W - PAD * 2,
      border: { pt: 0.5, color: 'E2E8F0' },
      colW: [2.2, 1.0, 1.2, 2.0, 0.9, 1.1, 1.6],
      fontFace: 'Calibri', fontSize: 10,
      rowH: 0.35,
    });
  }

  await pptx.writeFile({ fileName: `IEL-Pioneer-Tracker-${slug()}.pptx` });
}
