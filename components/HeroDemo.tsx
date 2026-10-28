'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import styles from './HeroDemo.module.css';

/* ────────────────────────────────────────────────────────────────
 * HeroDemo — auto-playing product walkthrough for the landing hero.
 * A fake browser window cycles through scenes (register → competition
 * → AI analysis → published). Each scene is a pure function of the
 * elapsed time `t`, and a fake cursor glides to `data-demo-target`
 * elements so visitors see the forms being filled in.
 * ──────────────────────────────────────────────────────────────── */

type SceneId = 'register' | 'competition' | 'ai' | 'published';

interface CursorKey {
  /** ms into the scene when the cursor starts moving to the target */
  at: number;
  target: string;
  /** play a click ripple once the cursor arrives */
  click?: boolean;
}

interface SceneDef {
  id: SceneId;
  duration: number;
  url: string;
  cursor: CursorKey[];
}

const TICK = 50;
const CURSOR_TRAVEL = 450;

const SCENES: SceneDef[] = [
  {
    id: 'register',
    duration: 9000,
    url: 'plaziia.com/registro',
    cursor: [
      { at: 100, target: 'colonia', click: true },
      { at: 1700, target: 'tipo', click: true },
      { at: 2400, target: 'tipo-option', click: true },
      { at: 3200, target: 'm2', click: true },
      { at: 4000, target: 'renta', click: true },
      { at: 5200, target: 'publish', click: true },
    ],
  },
  {
    id: 'competition',
    duration: 8000,
    url: 'plaziia.com/mis-propiedades/analisis',
    cursor: [
      { at: 3200, target: 'pin-0' },
      { at: 5000, target: 'insight' },
    ],
  },
  {
    id: 'ai',
    duration: 8500,
    url: 'plaziia.com/mis-propiedades/analisis',
    cursor: [{ at: 3600, target: 'rec-0' }],
  },
  {
    id: 'published',
    duration: 7500,
    url: 'plaziia.com/propiedades',
    cursor: [
      { at: 600, target: 'listing' },
      { at: 2600, target: 'views' },
    ],
  },
];

const TAB_KEYS: Record<SceneId, 'tabRegister' | 'tabCompetition' | 'tabAi' | 'tabPublished'> = {
  register: 'tabRegister',
  competition: 'tabCompetition',
  ai: 'tabAi',
  published: 'tabPublished',
};

/* ── timing helpers ── */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const progress = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const typed = (text: string, t: number, start: number, end: number) =>
  text.slice(0, Math.round(text.length * progress(t, start, end)));
const countUp = (n: number, t: number, start: number, end: number) =>
  Math.round(n * easeOut(progress(t, start, end)));

function activeCursorIndex(keys: CursorKey[], t: number) {
  let idx = -1;
  keys.forEach((k, i) => {
    if (t >= k.at) idx = i;
  });
  return idx;
}

/* ── prefers-reduced-motion ── */
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/* ════════════════════════════════════════════════════════════════ */

export default function HeroDemo() {
  const tr = useTranslations('HeroDemo');
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState({ scene: 0, t: 0 });
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const scene = SCENES[state.scene];
  // With reduced motion we render every scene in its finished state.
  const t = reduced ? scene.duration : state.t;
  const cursorIdx = reduced ? -1 : activeCursorIndex(scene.cursor, t);
  const cursorKey = cursorIdx >= 0 ? scene.cursor[cursorIdx] : null;
  const clicking =
    !!cursorKey?.click && t >= cursorKey.at + CURSOR_TRAVEL && t < cursorKey.at + CURSOR_TRAVEL + 350;

  // Only animate while the demo is on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Clock: advance time, roll over to the next scene at the end.
  useEffect(() => {
    if (reduced || !inView) return;
    const id = window.setInterval(() => {
      setState((s) => {
        const next = s.t + TICK;
        if (next >= SCENES[s.scene].duration) return { scene: (s.scene + 1) % SCENES.length, t: 0 };
        return { scene: s.scene, t: next };
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [reduced, inView]);

  // Move the fake cursor to the current target (CSS transition does the glide).
  useEffect(() => {
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (!stage || !cursor) return;
    const targetName = cursorIdx >= 0 ? SCENES[state.scene].cursor[cursorIdx].target : null;

    const place = () => {
      const target = targetName
        ? stage.querySelector<HTMLElement>(`[data-demo-target="${targetName}"]`)
        : null;
      if (!target) {
        cursor.style.opacity = '0';
        return;
      }
      const s = stage.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      const x = r.left - s.left + Math.min(r.width * 0.5, 70);
      const y = r.top - s.top + r.height * 0.55;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      cursor.style.opacity = '1';
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [state.scene, cursorIdx]);

  const isPublished = scene.id !== 'register' || t >= 6500;

  return (
    <div ref={rootRef} className={styles.root}>
      {/* ── Tabs ── */}
      <div className={styles.tabs} role="tablist" aria-label={tr('ariaLabel')}>
        {SCENES.map((s, i) => {
          const active = i === state.scene;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => setState({ scene: i, t: 0 })}
            >
              {tr(TAB_KEYS[s.id])}
              {active && !reduced && (
                <span
                  className={styles.tabProgress}
                  style={{ transform: `scaleX(${state.t / s.duration})` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Browser window ── */}
      <div className={styles.window} aria-hidden="true">
        <div className={styles.chrome}>
          <div className={styles.dots}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.url}>
            <LockIcon />
            {scene.url}
          </div>
          <div className={styles.dotsSpacer} />
        </div>

        <div className={styles.appBar}>
          <div className={styles.appBarTitle}>
            <span className={styles.logoMark}>P</span>
            {tr('appTitle')}
          </div>
          <span className={`${styles.chip} ${isPublished ? styles.chipLive : ''}`}>
            <span className={styles.chipDot} />
            {isPublished ? tr('statusPublished') : tr('statusDraft')}
          </span>
        </div>

        <div ref={stageRef} className={styles.stage}>
          <div key={scene.id} className={styles.scene}>
            {scene.id === 'register' && <RegisterScene t={t} />}
            {scene.id === 'competition' && <CompetitionScene t={t} />}
            {scene.id === 'ai' && <AiScene t={t} />}
            {scene.id === 'published' && <PublishedScene t={t} />}
          </div>

          {!reduced && (
            <div ref={cursorRef} className={styles.cursor}>
              <CursorIcon />
              {clicking && <span key={`${state.scene}-${cursorIdx}`} className={styles.ripple} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ Scenes ════════════════════════ */

function RegisterScene({ t }: { t: number }) {
  const tr = useTranslations('HeroDemo');

  const colonia = typed(tr('valueNeighborhood'), t, 650, 1500);
  const dropdownOpen = t >= 2150 && t < 2900;
  const typeChosen = t >= 2850;
  const m2 = typed('85', t, 3700, 3950);
  const rent = typed(tr('valueRent'), t, 4500, 5000);
  const loading = t >= 5650 && t < 6500;
  const done = t >= 6500;

  let focus: string | null = null;
  if (t >= 550 && t < 1700) focus = 'colonia';
  else if (t >= 2150 && t < 2900) focus = 'tipo';
  else if (t >= 3650 && t < 4000) focus = 'm2';
  else if (t >= 4450 && t < 5200) focus = 'renta';

  const step = done ? 4 : t >= 3100 ? 2 : 1;
  const steps = [tr('step1'), tr('step2'), tr('step3')];

  return (
    <div className={styles.registerLayout}>
      <div className={styles.formCard}>
        <div className={styles.stepper}>
          {steps.map((label, i) => {
            const n = i + 1;
            const state = step > n ? 'done' : step === n ? 'current' : 'todo';
            return (
              <div key={label} className={styles.stepItem} data-state={state}>
                <span className={styles.stepNum}>{state === 'done' ? '✓' : n}</span>
                <span className={styles.stepLabel}>{label}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.formGrid}>
          <Field
            target="colonia"
            label={tr('labelNeighborhood')}
            value={colonia}
            placeholder={tr('phNeighborhood')}
            focused={focus === 'colonia'}
            wide
          />

          <div className={styles.fieldWrap} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.fieldLabel}>{tr('labelType')}</span>
            <div
              data-demo-target="tipo"
              className={`${styles.input} ${styles.select} ${focus === 'tipo' ? styles.inputFocused : ''}`}
            >
              {typeChosen ? (
                <span>{tr('optionRetail')}</span>
              ) : (
                <span className={styles.placeholder}>{tr('placeholderType')}</span>
              )}
              <span className={styles.chevron}>▾</span>
            </div>
            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.option}>{tr('optionOffice')}</div>
                <div
                  data-demo-target="tipo-option"
                  className={`${styles.option} ${t >= 2700 ? styles.optionHover : ''}`}
                >
                  {tr('optionRetail')}
                </div>
                <div className={styles.option}>{tr('optionWarehouse')}</div>
              </div>
            )}
          </div>

          <Field
            target="m2"
            label={tr('labelSize')}
            value={m2}
            placeholder={tr('phSize')}
            suffix="m²"
            focused={focus === 'm2'}
          />
          <Field
            target="renta"
            label={tr('labelRent')}
            value={rent}
            placeholder={tr('phRent')}
            prefix="$"
            focused={focus === 'renta'}
          />
        </div>

        <button
          type="button"
          tabIndex={-1}
          data-demo-target="publish"
          className={`${styles.publishBtn} ${loading ? styles.publishBtnPressed : ''} ${done ? styles.publishBtnDone : ''}`}
        >
          {loading && <span className={styles.spinner} />}
          {done ? `✓ ${tr('published')}` : loading ? tr('publishing') : tr('publish')}
        </button>
      </div>

      {/* Live preview mirrors what is being typed */}
      <div className={styles.previewCard}>
        <span className={styles.previewLabel}>{tr('previewLabel')}</span>
        <div className={styles.previewPhoto}>
          <span className={styles.previewTag}>{colonia || '—'}</span>
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewType}>{typeChosen ? tr('optionRetail') : <Skeleton w="60%" />}</div>
          <div className={styles.previewRow}>
            <span>{m2 ? `${m2} m²` : <Skeleton w={40} />}</span>
            <strong>
              {rent ? (
                <>
                  ${rent} <small>MXN{tr('perMonth')}</small>
                </>
              ) : (
                <Skeleton w={80} />
              )}
            </strong>
          </div>
        </div>
      </div>

      {done && <Toast>{tr('toastPublished')}</Toast>}
    </div>
  );
}

const PINS: { cat: 'cafe' | 'restaurant' | 'pharmacy' | 'gym'; x: number; y: number }[] = [
  { cat: 'cafe', x: 38, y: 34 },
  { cat: 'restaurant', x: 62, y: 28 },
  { cat: 'cafe', x: 70, y: 58 },
  { cat: 'restaurant', x: 31, y: 62 },
  { cat: 'gym', x: 56, y: 72 },
  { cat: 'cafe', x: 44, y: 22 },
  { cat: 'restaurant', x: 73, y: 42 },
  { cat: 'pharmacy', x: 27, y: 44 },
  { cat: 'restaurant', x: 47, y: 79 },
  { cat: 'cafe', x: 64, y: 76 },
];

function CompetitionScene({ t }: { t: number }) {
  const tr = useTranslations('HeroDemo');
  const radius = easeOut(progress(t, 300, 1300));
  const showTooltip = t >= 3650 && t < 4900;
  const insightOn = t >= 5000;

  const stats = [
    { cat: 'cafe', label: tr('catCafe'), n: 18 },
    { cat: 'restaurant', label: tr('catRestaurant'), n: 31 },
    { cat: 'gym', label: tr('catGym'), n: 2 },
    { cat: 'pharmacy', label: tr('catPharmacy'), n: 1 },
  ] as const;

  return (
    <div className={styles.compLayout}>
      <div className={styles.map}>
        <div className={styles.mapStreets} />
        <div className={styles.mapAvenue} />
        <div className={styles.radius} style={{ transform: `translate(-50%, -50%) scale(${radius})` }} />
        <span className={styles.radiusLabel} style={{ opacity: radius }}>
          {tr('radiusLabel')}
        </span>
        <div className={styles.centerPin}>
          <span />
        </div>
        {PINS.map((p, i) => {
          const visible = t >= 1300 + i * 140;
          return (
            <div
              key={i}
              data-demo-target={`pin-${i}`}
              className={`${styles.pin} ${visible ? styles.pinVisible : ''}`}
              data-cat={p.cat}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {i === 0 && showTooltip && <span className={styles.pinTooltip}>{tr('pinTooltip')}</span>}
            </div>
          );
        })}
      </div>

      <div className={styles.compSide}>
        <span className={styles.sideTitle}>{tr('competitionTitle')}</span>
        {stats.map((s) => (
          <div key={s.cat} className={styles.statRow}>
            <span className={styles.statDot} data-cat={s.cat} />
            <span className={styles.statLabel}>{s.label}</span>
            <strong>{countUp(s.n, t, 1500, 3000)}</strong>
          </div>
        ))}
        <div data-demo-target="insight" className={`${styles.insight} ${insightOn ? styles.insightOn : ''}`}>
          <span className={styles.insightIcon}>↗</span>
          {tr('insight')}
        </div>
      </div>
    </div>
  );
}

function AiScene({ t }: { t: number }) {
  const tr = useTranslations('HeroDemo');
  const scan = progress(t, 200, 1600);
  const analyzed = t >= 1700;

  const recs = [
    { name: tr('rec1'), reason: tr('rec1Reason'), score: 92 },
    { name: tr('rec2'), reason: tr('rec2Reason'), score: 84 },
    { name: tr('rec3'), reason: tr('rec3Reason'), score: 77 },
  ];
  const summary = typed(tr('aiSummary'), t, 4600, 7000);
  const typingSummary = t >= 4600 && t < 7000;

  return (
    <div className={styles.aiLayout}>
      <div className={styles.aiHeader}>
        <span className={styles.aiBadge}>✦ IA</span>
        <span className={styles.aiStatus}>
          {analyzed ? `✓ ${tr('analyzed', { count: 52 })}` : tr('analyzing', { count: 52 })}
        </span>
        <div className={styles.scanBar}>
          <span style={{ transform: `scaleX(${scan})` }} />
        </div>
      </div>

      <span className={styles.sideTitle}>{tr('aiTitle')}</span>
      <div className={styles.recList}>
        {recs.map((r, i) => {
          const start = 1700 + i * 350;
          const visible = t >= start;
          const fill = easeOut(progress(t, start + 200, start + 1100));
          return (
            <div
              key={r.name}
              data-demo-target={`rec-${i}`}
              className={`${styles.rec} ${visible ? styles.recVisible : ''} ${i === 0 && t >= 4050 ? styles.recTop : ''}`}
            >
              <span className={styles.recRank}>{i + 1}</span>
              <div className={styles.recBody}>
                <div className={styles.recHead}>
                  <strong>{r.name}</strong>
                  <span className={styles.recScore}>{Math.round(r.score * fill)}</span>
                </div>
                <div className={styles.recBar}>
                  <span style={{ transform: `scaleX(${(r.score / 100) * fill})` }} />
                </div>
                <span className={styles.recReason}>{r.reason}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.aiSummary}>
        {summary}
        {typingSummary && <span className={styles.caret} />}
      </p>
    </div>
  );
}

function PublishedScene({ t }: { t: number }) {
  const tr = useTranslations('HeroDemo');
  const views = countUp(128, t, 700, 3600);

  return (
    <div className={styles.pubLayout}>
      <div data-demo-target="listing" className={styles.listing}>
        <div className={styles.listingPhoto}>
          <span className={styles.newBadge}>{tr('listingNew')}</span>
          <span className={styles.previewTag}>{tr('valueNeighborhood')}</span>
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewType}>{tr('optionRetail')}</div>
          <div className={styles.previewRow}>
            <span>85 m²</span>
            <strong>
              ${tr('valueRent')} <small>MXN{tr('perMonth')}</small>
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.pubStats}>
        <div data-demo-target="views" className={styles.pubStat}>
          <span className={styles.pubStatLabel}>{tr('views')}</span>
          <strong className={styles.pubStatValue}>{views}</strong>
          <Sparkline p={progress(t, 700, 3600)} />
        </div>
        <div className={styles.pubStat}>
          <span className={styles.pubStatLabel}>{tr('status')}</span>
          <strong className={styles.pubStatValue} style={{ color: 'var(--success)', fontSize: 20 }}>
            ● {tr('statusActive')}
          </strong>
          <span className={styles.pubStatHint}>{tr('freeMonth')}</span>
        </div>
      </div>

      {t >= 3900 && <Toast>{tr('toastSearch')}</Toast>}
    </div>
  );
}

/* ════════════════════════ Pieces ════════════════════════ */

function Field({
  target,
  label,
  value,
  placeholder,
  focused,
  prefix,
  suffix,
  wide,
}: {
  target: string;
  label: string;
  value: string;
  placeholder: string;
  focused: boolean;
  prefix?: string;
  suffix?: string;
  wide?: boolean;
}) {
  return (
    <div className={styles.fieldWrap} style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <span className={styles.fieldLabel}>{label}</span>
      <div data-demo-target={target} className={`${styles.input} ${focused ? styles.inputFocused : ''}`}>
        {prefix && <span className={styles.affix}>{prefix}</span>}
        {value ? <span>{value}</span> : !focused && <span className={styles.placeholder}>{placeholder}</span>}
        {focused && <span className={styles.caret} />}
        {suffix && <span className={`${styles.affix} ${styles.suffix}`}>{suffix}</span>}
      </div>
    </div>
  );
}

function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.toast}>
      <span className={styles.toastIcon}>✓</span>
      {children}
    </div>
  );
}

function Skeleton({ w }: { w: number | string }) {
  return <span className={styles.skeleton} style={{ width: w }} />;
}

function Sparkline({ p }: { p: number }) {
  const clipId = useId();
  const pts = [8, 12, 10, 18, 16, 26, 24, 34, 40, 46];
  const max = 48;
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${40 - (v / max) * 36}`).join(' ');
  return (
    <svg className={styles.sparkline} viewBox="0 0 100 40" preserveAspectRatio="none">
      <clipPath id={clipId}>
        <rect x="-2" y="-2" width={p * 104} height="44" />
      </clipPath>
      <polyline points={d} clipPath={`url(#${clipId})`} />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CursorIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" className={styles.cursorIcon}>
      <path
        d="M2 1.5 L2 17.5 L6.4 13.6 L9.4 20.2 L12.4 18.9 L9.5 12.4 L15.5 12.4 Z"
        fill="oklch(0.18 0.04 260)"
        stroke="white"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
