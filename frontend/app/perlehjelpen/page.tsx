"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Perlehjelpen() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 80% 30%, rgba(240,90,65,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 20% 80%, rgba(159,205,129,0.15) 0%, transparent 55%), var(--background)",
        }}
      >
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-semibold text-left text-dark-purple mb-4 leading-tight max-w-xl pl-4">
              Perlehjelpen - for et vellykket perlebilde
            </h1>
            <p className="text-left text-base text-gray-700 mb-8 max-w-xl pl-4">
              Ta det i ditt eget tempo. Her finner du enkel veiledning som gjør
              det smidig å lage et fint perlebilde — selv om du aldri har perlet
              med mønster før.
            </p>
          </div>
        </div>
      </section>

      {/* STEPS NAV */}
      <nav className="pb-10">
        <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-start justify-center gap-0">
          {[
            { num: "1", label: "Start", color: "var(--primary)", href: "#steg-1" },
            { num: "2", label: "Brett", color: "var(--purple)", href: "#steg-2" },
            { num: "3", label: "Stryking", color: "var(--success)", href: "#steg-3" },
            { num: "4", label: "Ferdig!", color: "var(--dark-purple)", href: "#steg-4" },
          ].map((step, i, arr) => (
            <div key={i} className="flex-1 flex flex-col items-center relative max-w-[110px]">
              {i < arr.length - 1 && (
                <div
                  className="absolute top-4 h-0.5"
                  style={{
                    left: "calc(50% + 16px)",
                    width: "calc(100% - 32px)",
                    background: "var(--text-muted)",
                    opacity: 0.4,
                  }}
                />
              )}
              <a
                href={step.href}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-md z-10 transition-opacity hover:opacity-80"
                style={{ background: step.color, color: "white" }}
              >
                {step.num}
              </a>
              <a href={step.href} className="text-xs font-semibold uppercase tracking-wider mt-2 text-center text-app-muted hover:opacity-80 transition-opacity">
                {step.label}
              </a>
            </div>
          ))}
        </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="pb-16">
        <div className="max-w-7xl mx-auto px-4 space-y-20">

        {/* ── STEG 1 ── */}
        <section id="steg-1" className="pl-4">
          <SectionHeader num="01" subtitle="Steg én" title="Slik starter du" accentColor="var(--primary)" />

          <div className="grid md:grid-cols-2 gap-5 mt-8">
            <InfoCard accent="primary">
              <CardIcon bg="rgba(240,90,65,0.1)"></CardIcon>
              <h3 className="text-lg font-semibold mb-2 text-app-primary">
                Legg brettet over mønsteret
              </h3>
              <p className="text-sm leading-relaxed text-app-secondary">
                Plasser perlebrettet direkte over mønsterutskriften din. Tallene i
                mønsteret forteller nøyaktig hvilken farge du skal bruke i hvert hull.
              </p>
            </InfoCard>

            <InfoCard accent="success">
              <CardIcon bg="rgba(159,205,129,0.15)"></CardIcon>
              <h3 className="text-lg font-semibold mb-2 text-app-primary">
                Brett for brett — eller samlet
              </h3>
              <p className="text-sm leading-relaxed mb-3 text-app-secondary">
                Du velger selv: feste brettene fortløpende mens du perler, eller
                fullføre hvert brett separat og sette dem sammen til slutt.
              </p>
              <ul className="space-y-1">
                {[
                  "Perler du brett for brett: noter brettnummeret (f.eks. A1) før du legger det bort",
                  "Fest alle brettene i riktig rekkefølge: A1 → A2 → osv.",
                ].map((item, i) => (
                  <li key={i} className="text-sm pl-5 relative text-app-secondary">
                    <span className="absolute left-0 text-xs text-primary">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </InfoCard>
          </div>

          <CalloutBox type="obs">
            <span className="flex-shrink-0"></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-primary">OBS! Viktig orientering</p>
              <p className="text-sm leading-relaxed text-app-secondary">
                Pass alltid på at <strong>vingene på brettet peker nedover og mot høyre</strong> — ellers kan mønsteret bli speilvendt.
              </p>
            </div>
          </CalloutBox>
        </section>

        <Divider />

        {/* ── STEG 2 ── */}
        <section id="steg-2" className="pl-4">
          <SectionHeader num="02" subtitle="Steg to" title="Sett sammen brettene" accentColor="#C9A96E" />

          <div className="grid md:grid-cols-2 gap-5 mt-8">
            <IllusPanel
              caption="Brett-rekkefølge"
              sub="Begynn alltid med A1, deretter A2, B1, B2 osv."
              bg="linear-gradient(135deg, #F5EEE6 0%, #EDE0D4 100%)"
            >
              <BrettRekkefolgeSvg />
            </IllusPanel>

            <IllusPanel
              caption="Alle brettene koblet"
              sub="Ferdig sammensatt — klart for stryking!"
              bg="linear-gradient(135deg, #EEF5EE 0%, #E0EBE0 100%)"
            >
              <BrettKobletSvg />
            </IllusPanel>
          </div>

          <CalloutBox type="viktig">
            <span className="flex-shrink-0"></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#C9A96E" }}>Viktig!</p>
              <p className="text-sm leading-relaxed text-app-secondary">
                Alle brettene <strong>må</strong> festes godt sammen <strong>før</strong> du begynner å stryke.
                Løse brett kan forskyve seg og ødelegge motivet.
              </p>
            </div>
          </CalloutBox>
        </section>

        <Divider />

        {/* ── STEG 3 ── */}
        <section id="steg-3" className="pl-4">
          <SectionHeader num="03" subtitle="Steg tre" title="Slik stryker du kunstverket ditt" accentColor="var(--success)" />

          <p className="text-sm leading-relaxed mt-4 mb-8 text-app-secondary">
            For at perlebildet skal bli stabilt og holde formen, må perlene strykes slik at de smelter
            forsiktig sammen. Ta deg god tid — det er verdt det!
          </p>

          {/* Du trenger */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-app-muted">Du trenger</p>
            <div className="bg-card rounded-2xl p-6 grid sm:grid-cols-2 gap-3" style={{ border: "1.5px solid var(--border-subtle)" }}>
              {["Strykejern", "Bakepapir", "Flatt, varmebestandig underlag", "Bok eller plate til avkjøling"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm py-1 text-app-secondary" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 text-success"
                    style={{ background: "rgba(159,205,129,0.15)", border: "2px solid var(--border-subtle)" }}
                  >
                    ✓
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Stryke-steg */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: "1", title: "Still inn strykejernet", text: "Bruk middels varme (bomull / 2 prikker). Ikke bruk damp — fuktighet kan påvirke resultatet.", badge: null },
              { num: "2", title: "Dekk perlebildet", text: "Legg et ark bakepapir over hele motivet. Stryk aldri direkte på perlene.", badge: null },
              { num: "3", title: "Stryk forsiktig", text: "Press strykejernet rett ned — ikke dra det. Hold i 5–10 sekunder per område, flytt rolig videre.", badge: "5–10 sek" },
              { num: "4", title: "Avkjøl flatt", text: "La bildet ligge flatt. Legg en bok eller plate oppå og vent minst 10 minutter.", badge: "10 min" },
            ].map((step) => (
              <div
                key={step.num}
                className="relative bg-card rounded-2xl p-6"
                style={{ border: "1.5px solid var(--border-subtle)" }}
              >
                {step.badge && (
                  <span
                    className="absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full text-primary"
                    style={{ background: "rgba(240,90,65,0.08)", border: "1px solid rgba(240,90,65,0.2)" }}
                  >
                    {step.badge}
                  </span>
                )}
                <p className="text-3xl font-bold mb-3 text-primary" style={{ opacity: 0.4 }}>{step.num}</p>
                <h4 className="text-sm font-semibold mb-2 text-app-primary">{step.title}</h4>
                <p className="text-xs leading-relaxed text-app-secondary">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Før/etter illustrasjon */}
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-app-muted">Slik ser det ut</p>
            <div className="grid md:grid-cols-2 gap-5">
              <IllusPanel
                caption="Under stryking"
                sub="Bakepapiret beskytter perlene mot direkte varme"
                bg="linear-gradient(135deg, #F5EEE6 0%, #EDE0D4 100%)"
              >
                <UnderStrykningSvg />
              </IllusPanel>
              <IllusPanel
                caption="Ferdig strøket"
                sub="Tette, sammensmeltede perler — ingen mellomrom"
                bg="linear-gradient(135deg, #EEF5EE 0%, #E4EDE4 100%)"
              >
                <FerdigStroketSvg />
              </IllusPanel>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── STEG 4: TIPS ── */}
        <section id="steg-4" className="pl-4">
          <SectionHeader num="04" subtitle="Husk" title="Viktige tips" accentColor="var(--primary-light)" />

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {[
              { title: "For høy varme", text: "Kan ødelegge formen på perlene. Hold deg til middels varme (bomull / 2 prikker)." },
              { title: "For lav varme", text: "Kan gjøre at perlene løsner og ikke holder seg på plass over tid." },
              { title: "Test først", text: "Er du usikker? Test gjerne på et lite hjørneområde før du stryker over hele bildet." },
              { title: "Barn og strykejern", text: "Barn bør alltid få hjelp av en voksen under strykedelen av prosessen." },
            ].map((tip) => (
              <div
                key={tip.title}
                className="flex gap-4 items-start bg-card rounded-2xl p-5"
                style={{ border: "1.5px solid var(--border-subtle)" }}
              >
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-app-primary">{tip.title}</h4>
                  <p className="text-xs leading-relaxed text-app-secondary">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SUCCESS BANNER ── */}
        <div
          className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden pl-4"
          style={{ background: "linear-gradient(135deg, var(--foreground) 0%, #3D3531 100%)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 20% 50%, rgba(240,90,65,0.15) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 80% 50%, rgba(159,205,129,0.12) 0%, transparent 55%)",
            }}
          />
          <div className="flex justify-center gap-1.5 mb-6 relative">
            {["var(--primary)", "#C9A96E", "var(--success)", "var(--primary-light)", "var(--purple)"].map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ background: color, animation: "confettiBounce 2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <style>{`
            @keyframes confettiBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
          `}</style>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative" style={{ color: "var(--background-secondary)" }}>
            Du er ferdig!
          </h2>
          <p className="text-base font-light max-w-lg mx-auto relative leading-relaxed" style={{ color: "rgba(253,251,249,0.65)" }}>
            Når perlene er riktig strøket, sitter de godt sammen og motivet er
            klart til bruk — til oppheng, innramming eller som en spesiell gave.
          </p>
        </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ── Reusable sub-components ── */

function SectionHeader({ num, subtitle, title, accentColor }: {
  num: string; subtitle: string; title: string; accentColor: string;
}) {
  return (
    <div className="flex items-center gap-5">
      <span className="text-5xl font-bold leading-none select-none text-app-primary" style={{ opacity: 0.1 }}>
        {num}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-app-muted">{subtitle}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-app-primary">{title}</h2>
        <div className="h-0.5 w-10 rounded mt-2" style={{ background: accentColor }} />
      </div>
    </div>
  );
}

function InfoCard({ children, accent }: { children: React.ReactNode; accent: "primary" | "success" }) {
  const topBar = accent === "primary"
    ? "linear-gradient(90deg, var(--primary), var(--primary-light))"
    : "linear-gradient(90deg, var(--success), #C8DBC6)";
  return (
    <div
      className="relative bg-card rounded-2xl p-7"
      style={{ border: "1.5px solid var(--border-subtle)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: topBar }} />
      {children}
    </div>
  );
}

function CardIcon({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: bg }}>
      {children}
    </div>
  );
}

function CalloutBox({ children, type }: { children: React.ReactNode; type: "obs" | "viktig" }) {
  const isObs = type === "obs";
  return (
    <div
      className="flex gap-4 items-start rounded-2xl p-5 mt-5"
      style={{
        background: isObs ? "rgba(240,90,65,0.06)" : "rgba(201,169,110,0.08)",
        border: isObs ? "1.5px solid rgba(240,90,65,0.2)" : "1.5px solid rgba(201,169,110,0.3)",
      }}
    >
      {children}
    </div>
  );
}

function IllusPanel({ children, caption, sub, bg }: {
  children: React.ReactNode; caption: string; sub: string; bg: string;
}) {
  return (
    <div
      className="bg-card rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid var(--border-subtle)" }}
    >
      <div className="h-52 flex items-center justify-center" style={{ background: bg }}>
        {children}
      </div>
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <strong className="block text-sm font-semibold mb-0.5 text-app-primary">{caption}</strong>
        <span className="text-xs text-app-muted">{sub}</span>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-px w-full"
      style={{ background: "linear-gradient(90deg, transparent, var(--border), transparent)" }}
    />
  );
}

/* ── SVG Illustrations ── */

const BEAD_COLORS = ["#F05A41", "#C9A96E", "#9fcd81", "#D4A0A0", "#F05A41", "#9fcd81", "#C9A96E", "#F05A41", "#D4A0A0"];

function BeadGridSvg() {
  const cols = [60, 95, 130, 165, 200, 235, 270];
  const rows = [60, 95, 130, 165, 200, 235, 270];
  const palette = ["hb1","hb2","hb3","hb4","hb5","hb6","hb7"];
  const grid = [
    ["hb5","hb3","hb1","hb2","hb4","hb3","hb1"],
    ["hb2","hb1","hb7","hb3","hb1","hb6","hb4"],
    ["hb4","hb6","hb2","hb1","hb5","hb3","hb2"],
    ["hb3","hb1","hb4","hb7","hb1","hb2","hb3"],
    ["hb1","hb5","hb3","hb2","hb4","hb1","hb6"],
    ["hb6","hb3","hb1","hb5","hb2","hb7","hb1"],
    ["hb3","hb4","hb6","hb1","hb3","hb2","hb5"],
  ];
  return (
    <svg viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg" width="320" height="320">
      <circle cx="170" cy="170" r="160" fill="url(#heroGlow)" opacity="0.5"/>
      <defs>
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2C4B0" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#F2C4B0" stopOpacity="0"/>
        </radialGradient>
        {[["hb1","#F5856A","#C85A3A"],["hb2","#E8C97A","#A07838"],["hb3","#A8C8A6","#527050"],
          ["hb4","#E8B8B8","#A86868"],["hb5","#C8DEFA","#6090C8"],["hb6","#F0E0C0","#C8A870"],
          ["hb7","#D8B8E8","#8858A8"]].map(([id, c1, c2]) => (
          <radialGradient key={id} id={id} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor={c1}/>
            <stop offset="100%" stopColor={c2}/>
          </radialGradient>
        ))}
        <filter id="beadShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#0000001A"/>
        </filter>
      </defs>
      <g filter="url(#beadShadow)">
        {grid.map((row, ri) =>
          row.map((color, ci) => (
            <circle key={`${ri}-${ci}`} cx={cols[ci]} cy={rows[ri]} r="14" fill={`url(#${color})`}/>
          ))
        )}
      </g>
      {cols.map((cx, i) => (
        <circle key={i} cx={cx - 7} cy={53} r="4" fill="white" opacity="0.5"/>
      ))}
      <rect x="38" y="38" width="250" height="250" rx="16" stroke="#C9A96E" strokeWidth="2.5" fill="none" strokeDasharray="6 4" opacity="0.45"/>
      <circle cx="38" cy="38" r="5" fill="#C9A96E" opacity="0.6"/>
      <circle cx="288" cy="38" r="5" fill="#C9A96E" opacity="0.6"/>
      <circle cx="38" cy="288" r="5" fill="#C9A96E" opacity="0.6"/>
      <circle cx="288" cy="288" r="5" fill="#C9A96E" opacity="0.6"/>
      <text x="170" y="322" textAnchor="middle" fontFamily="Quicksand, sans-serif" fontSize="12" fill="#9A8F89" letterSpacing="0.1em">Brett A1</text>
    </svg>
  );
}

function BrettRekkefolgeSvg() {
  const board1 = [[38,50],[55,50],[72,50],[89,50],[106,50],[38,68],[55,68],[72,68],[89,68],[106,68],[38,86],[55,86],[72,86],[89,86],[106,86]];
  const board2 = board1.map(([x,y]) => [x + 140, y]);
  return (
    <svg viewBox="0 0 320 200" width="280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="120" height="130" rx="10" fill="white" stroke="#C9A96E" strokeWidth="1.5"/>
      <rect x="160" y="30" width="120" height="130" rx="10" fill="white" stroke="#9fcd81" strokeWidth="1.5"/>
      {board1.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="7" fill={BEAD_COLORS[i % BEAD_COLORS.length]}/>)}
      {board2.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="7" fill={BEAD_COLORS[(i + 3) % BEAD_COLORS.length]}/>)}
      <text x="80" y="148" textAnchor="middle" fontFamily="Quicksand, sans-serif" fontSize="13" fill="#9A8F89" fontWeight="500">A1</text>
      <text x="220" y="148" textAnchor="middle" fontFamily="Quicksand, sans-serif" fontSize="13" fill="#9A8F89" fontWeight="500">A2</text>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#C9A96E"/>
        </marker>
      </defs>
      <path d="M148 95 L160 95" stroke="#C9A96E" strokeWidth="2" markerEnd="url(#arr)"/>
    </svg>
  );
}

function BrettKobletSvg() {
  const quads = [
    { x: 30, y: 20, stroke: "#9fcd81", label: "A1", lx: 85, ly: 86 },
    { x: 150, y: 20, stroke: "#9fcd81", label: "A2", lx: 205, ly: 86 },
    { x: 30, y: 105, stroke: "#C9A96E", label: "B1", lx: 85, ly: 170 },
    { x: 150, y: 105, stroke: "#C9A96E", label: "B2", lx: 205, ly: 170 },
  ];
  const dots = [
    [50,38],[63,38],[76,38],[89,38],[50,53],[63,53],[76,53],[89,53],
    [170,38],[183,38],[196,38],[209,38],[170,53],[183,53],[196,53],[209,53],
    [50,123],[63,123],[76,123],[89,123],[50,138],[63,138],[76,138],[89,138],
    [170,123],[183,123],[196,123],[209,123],[170,138],[183,138],[196,138],[209,138],
  ];
  return (
    <svg viewBox="0 0 320 200" width="280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {quads.map((q, i) => (
        <rect key={i} x={q.x} y={q.y} width="110" height="75" rx="8" fill="white" stroke={q.stroke} strokeWidth="1.5"/>
      ))}
      {dots.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="5" fill={BEAD_COLORS[i % BEAD_COLORS.length]}/>)}
      {quads.map((q, i) => (
        <text key={i} x={q.lx} y={q.ly} textAnchor="middle" fontFamily="Quicksand, sans-serif" fontSize="11" fill="#9A8F89">{q.label}</text>
      ))}
      <line x1="140" y1="57" x2="150" y2="57" stroke="#C9A96E" strokeWidth="2" strokeDasharray="3 2"/>
      <line x1="85" y1="95" x2="85" y2="105" stroke="#C9A96E" strokeWidth="2" strokeDasharray="3 2"/>
      <line x1="205" y1="95" x2="205" y2="105" stroke="#C9A96E" strokeWidth="2" strokeDasharray="3 2"/>
      <line x1="140" y1="142" x2="150" y2="142" stroke="#C9A96E" strokeWidth="2" strokeDasharray="3 2"/>
    </svg>
  );
}

function UnderStrykningSvg() {
  const positions = [
    [45,40],[68,40],[91,40],[114,40],[137,40],[160,40],[183,40],[206,40],[229,40],
    [45,62],[68,62],[91,62],[114,62],[137,62],[160,62],[183,62],[206,62],[229,62],
  ];
  return (
    <svg viewBox="0 0 280 160" width="260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="15" width="240" height="125" rx="12" fill="white" opacity="0.6" stroke="#E8DDD0" strokeWidth="1"/>
      {positions.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="9" fill={BEAD_COLORS[i % BEAD_COLORS.length]}/>)}
      <rect x="20" y="15" width="240" height="125" rx="12" fill="rgba(255,255,255,0.55)" stroke="#E8DDD0" strokeWidth="1.5" strokeDasharray="6 3"/>
      <text x="140" y="125" textAnchor="middle" fontFamily="Quicksand, sans-serif" fontSize="11" fill="#9A8F89">Bakepapir over perlebildet</text>
    </svg>
  );
}

function FerdigStroketSvg() {
  const positions = [
    [45,40],[67,40],[89,40],[111,40],[133,40],[155,40],[177,40],[199,40],[221,40],[243,40],
    [45,62],[67,62],[89,62],[111,62],[133,62],[155,62],[177,62],[199,62],[221,62],[243,62],
  ];
  return (
    <svg viewBox="0 0 280 160" width="260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="fusedClip">
          <rect x="20" y="15" width="240" height="125" rx="12"/>
        </clipPath>
      </defs>
      <rect x="20" y="15" width="240" height="125" rx="12" fill="white" stroke="#9fcd81" strokeWidth="1.5"/>
      <g clipPath="url(#fusedClip)">
        {positions.map(([cx,cy],i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="12" ry="10" opacity="0.9" fill={BEAD_COLORS[i % BEAD_COLORS.length]}/>
        ))}
      </g>
      <circle cx="245" cy="128" r="16" fill="#9fcd81"/>
      <path d="M237 128 L243 134 L253 121" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="110" y="125" textAnchor="middle" fontFamily="Quicksand, sans-serif" fontSize="11" fill="#6B5F58">Perlene smeltet tett sammen</text>
    </svg>
  );
}
