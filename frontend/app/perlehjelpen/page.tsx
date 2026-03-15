"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Perlehjelpen() {
  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF" }}>
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-semibold text-left text-dark-purple mb-4 leading-tight max-w-xl">
              Perlehjelpen - for et vellykket perlebilde
            </h1>
            <p className="text-left text-base text-gray-700 mb-8 max-w-xl">
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
            { num: "2", label: "Stryking", color: "var(--success)", href: "#steg-2" },
            { num: "3", label: "Montering", color: "var(--dark-purple)", href: "#steg-3" },
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

        {/* ── STEG 1: Slik starter du ── */}
        <section id="steg-1" className="pl-4">
          <SectionHeader num="01" subtitle="Steg én" title="Slik starter du" accentColor="var(--primary)" />

          <p className="text-sm leading-relaxed mt-6 mb-8 text-app-secondary">
            Det er gøy og enkelt å perle etter mønster og å se motivet sakte, men sikkert stige frem på brettene. Det er fascinerende hvordan motivet kan se pixelert og rotete ut på nært hold mens det perles, men blir et fantastisk kunstverk når det er ferdig og betraktes på avstand!
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            <InfoCard accent="primary">
              <h3 className="text-lg font-semibold mb-3 text-app-primary">Brett for brett — eller samlet</h3>
              <p className="text-sm leading-relaxed mb-4 text-app-secondary">
                Du velger selv om du vil pusle sammen alle brettene før du begynner å perle, etterhvert som du perler, eller fullføre hvert brett separat og sette dem sammen til slutt rett før du stryker motivet.
              </p>
              <div className="rounded-xl p-4" style={{ background: "rgba(240,90,65,0.06)", border: "1px solid rgba(240,90,65,0.15)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-primary">Tips</p>
                <p className="text-sm leading-relaxed text-app-secondary">
                  Perler du brett for brett, er det lurt å notere brettnummeret fra oppskriften (f.eks. A1) før du legger det bort. Da blir det enkelt å finne riktig plass senere.
                </p>
              </div>
            </InfoCard>

            <InfoCard accent="success">
              <h3 className="text-lg font-semibold mb-3 text-app-primary">Å perle etter mønster</h3>
              <p className="text-sm leading-relaxed mb-4 text-app-secondary">
                Legg perlebrettet direkte over mønsterutskriften. Tallene i mønsteret viser hvilken perlefarge du skal bruke. Noen liker å perle én farge om gangen på hvert brett, andre liker å perle rad for rad. You do you!
              </p>
              <div className="rounded-xl p-4" style={{ background: "rgba(240,90,65,0.06)", border: "1px solid rgba(240,90,65,0.2)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-primary">Viktig!</p>
                <p className="text-sm leading-relaxed text-app-secondary">
                  Pass på at de små vingene/tennene på kanten av brettet peker <strong>nedover og mot høyre</strong>, slik det står i oppskriften — ellers får du ikke puslet dem riktig sammen til slutt.
                </p>
              </div>
            </InfoCard>
          </div>
        </section>

{/* ── STEG 2: Slik stryker du kunstverket ditt ── */}
        <section id="steg-2" className="pl-4">
          <SectionHeader num="02" subtitle="Steg to" title="Slik stryker du kunstverket ditt" accentColor="var(--success)" />

          <p className="text-sm leading-relaxed mt-6 mb-8 text-app-secondary">
            For at perlebildet skal bli stabilt og holde formen, må perlene strykes slik at de smelter lett sammen. Det er helt normalt å måtte prøve seg litt frem — ta det rolig, så går det fint. Barn bør få hjelp av en voksen.
          </p>

          {/* Dette trenger du */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-app-muted">Dette trenger du</p>
            <div className="bg-card rounded-2xl p-6 grid sm:grid-cols-2 gap-3" style={{ border: "1.5px solid var(--border-subtle)" }}>
              {[
                "Strykejern",
                "Bakepapir",
                "Et flatt, varmebestandig underlag",
                "Eventuelt en bok eller plate til avkjøling",
                "Evt. fryse- eller malertape (se Tape-metoden)",
              ].map((item) => (
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

          {/* Sett sammen brettene */}
          <div className="rounded-xl p-4 mb-10" style={{ background: "rgba(240,90,65,0.06)", border: "1px solid rgba(240,90,65,0.15)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-primary">Sett sammen brettene</p>
            <p className="text-sm leading-relaxed text-app-secondary">
              Alle brettene må festes sammen før du begynner å stryke. Hvis du har perlet ett og ett brett, er dette siste frist for å pusle dem sammen. Begynn alltid med brett A1, pusle deretter på A2, og videre til hele rad A er fullført, deretter begynner du på B1, B2 osv.
            </p>
          </div>

          {/* Tape-metoden vs stryk på brettene */}
          <h3 className="text-xl font-semibold mb-3 text-app-primary">Tape-metoden — eller stryk på brettene</h3>
          <p className="text-sm leading-relaxed mb-6 text-app-secondary">
            Vi liker best at fremsiden av motivet er ustrøket slik at perlene er runde, jevne og usmeltet. For å få til dette, men allikevel få et stabilt resultat, må baksiden av motivet smeltes godt sammen. Dersom det er viktig for deg at motivet ikke ender opp speilvendt, må du løfte perlene av brettene og stryke den siden som har vært ned mot brettene — det er her vi bruker tape-metoden. Dersom det er likegyldig for deg hvilken side som ender opp som motivets forside, kan du trygt stryke perlene mens de fremdeles ligger på brettene.
          </p>
          <div className="grid md:grid-cols-2 gap-5 mb-10">
            <InfoCard accent="primary">
              <h4 className="text-base font-semibold mb-3 text-app-primary">Tape-metoden</h4>
              <p className="text-sm leading-relaxed text-app-secondary">
                Dekk hele motivet med maskeringstape eller malertape. Press godt ned slik at alle perlene er skikkelig festet til tapen. Løft hele motivet av brettene og legg det med tape-siden ned på et flatt og varmebestandig underlag. Stryk baksiden mens perlene fremdeles er festet til tapen. Når du har en stabil bakside, snu motivet, ta av tapen og stryk forsiden lett for ekstra styrke.
              </p>
            </InfoCard>
            <InfoCard accent="success">
              <h4 className="text-base font-semibold mb-3 text-app-primary">Stryk på brettene</h4>
              <p className="text-sm leading-relaxed text-app-secondary">
                Begynn med å stryke perlene mens de ligger på brettene. Du trenger ikke et varmebestandig underlag mens du gjør dette, da brettene vil beskytte underlaget. Pass på at du ikke stryker perlene så hardt at tappene på brettet smelter inni perlene. Når motivet er stabilt, løft det av brettene og flytt det til et varmebestandig underlag der du stryker den andre siden lett for ekstra styrke.
              </p>
            </InfoCard>
          </div>

          {/* Stryk forsiktig */}
          <h3 className="text-xl font-semibold mb-6 text-app-primary">Stryk forsiktig</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { num: "1", title: "Bakepapir over motivet", text: "Legg et ark bakepapir over hele motivet. Stryk aldri direkte på perlene.", badge: null },
              { num: "2", title: "Middels varme", text: "Bruk middels varme (bomull / 2 prikker). Ikke bruk damp. For høy varme kan ødelegge formen — test gjerne på et lite område først.", badge: null },
              { num: "3", title: "Press ned, ikke dra", text: "Press strykejernet rett ned. Hold i 5–10 sekunder per område før du flytter rolig videre. Fortsett til perlene er lett smeltet — hullene skal fortsatt være synlige.", badge: "5–10 sek" },
              { num: "4", title: "Avkjøl flatt", text: "La bildet ligge flatt. Legg gjerne en bok eller tung plate oppå. Vent minst 10 minutter før du løfter motivet.", badge: "10 min" },
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

          {/* Slik ser det ut */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-app-muted">Slik ser det ut når du er ferdig å stryke (med bakepapir)</p>
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
                sub="Tette, sammensmeltede perler — hullene er fortsatt synlige"
                bg="linear-gradient(135deg, #EEF5EE 0%, #E4EDE4 100%)"
              >
                <FerdigStroketSvg />
              </IllusPanel>
            </div>
          </div>
        </section>

{/* ── STEG 3: Montering ── */}
        <section id="steg-3" className="pl-4">
          <SectionHeader num="03" subtitle="Steg tre" title="Montering" accentColor="var(--dark-purple)" />

          <p className="text-sm leading-relaxed mt-6 mb-4 text-app-secondary">
            Store motiv blir tunge, så vi anbefaler glass fremfor plast til innramming for å tåle vekten av perlemotivet.
          </p>
          <p className="text-sm leading-relaxed text-app-secondary">
            Når perlene er riktig strøket, sitter de godt sammen og motivet er klart til oppheng eller innramming.
          </p>
        </section>

        {/* ── SUCCESS BANNER ── */}
        <div
          className="rounded-3xl p-12 md:p-16 text-center pl-4"
          style={{ background: "linear-gradient(135deg, var(--lavender-pink) 0%, var(--primary-light-pink) 100%)", border: "1.5px solid var(--primary-dark-pink)" }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-dark-purple">
            Du er ferdig!
          </h2>
          <p className="text-base max-w-lg mx-auto leading-relaxed text-app-secondary">
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
