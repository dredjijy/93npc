import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   STORAGE  — localStorage wrapper with JSON serialization
═══════════════════════════════════════════════════════════════════ */
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k)     => { try { localStorage.removeItem(k); } catch {} },
};

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const GENRES    = ["Action","Adventure","Action-Adventure","RPG","MMORPG","FPS","TPS","Strategy","RTS","Simulation","Survival","Horror","Puzzle","Platformer","Racing","Sports","Fighting","Battle Royale","Sandbox","Open World","Exploration","Narrative","Visual Novel","Arcade","Roguelike","Tower Defense","Hack and Slash","Card Game","Music","Party Game","Casual","Indie","Stealth","Shooter","Sci-Fi","Fantasy","Zombie","Mystery"];
const MODES     = ["Solo","Multiplayer","Co-op","Competitive","PvP","PvE","Online","Local","Cross-platform"];
const PLATFORMS = ["PC","Mobile","Android","iOS","Browser","Console","PlayStation","Xbox","Nintendo","Steam Deck"];
const PRICES    = ["Free","Paid","Free to Play","Demo","Early Access"];
const STATUSES  = ["Released","In Development","Early Access","Coming Soon","Beta","Alpha"];
const PLANS = {
  free:   {
    id:"free",    label:"Free",       price:0,    color:"#9CA3AF",
    games:1,      boost:1.0,          badge:null,
    images:1,     videos:0,           studioPage:false, priorityReview:false,
    perks:["1 game","1 cover image","Standard placement","Community access"],
  },
  creator_plus: {
    id:"creator_plus", label:"Creator+", price:5.99, color:"#FF6B2B",
    games:999,    boost:1.4,          badge:"Creator+",
    images:6,     videos:2,           studioPage:true, priorityReview:true,
    perks:[
      "Unlimited games","6 images per game","2 video trailers",
      "Verified creator badge","Better visibility",
      "Studio page (banner, logo, links)",
      "Full game analytics","Priority admin review",
      "Forum: post & reply","Highlighted posts",
    ],
  },
};

// Helper: is this user subscribed to Creator+ ?
const isCreatorPlus = user => user && (user.plan === "creator_plus" || ["admin","moderator"].includes(user.role));

const VSTYLES   = ["2D","3D","Pixel Art","Low Poly","Realistic","Anime","Retro","Top-down","Side-scroller"];
const SHAPES    = ["rings","planet","sword","mountain","pixelart","castle","crosshair","orb","road","starburst","grid","aurora","wave","diamond"];
const ACCENTS   = ["#FF4D6D","#4a8aee","#ff6b35","#34d399","#e94560","#ffd700","#ff2244","#c084fc","#00aaff","#fbbf24","#888","#38bdf8","#a78bfa","#f472b6"];
const BG_PAIRS  = [["#050918","#1a0533"],["#030c1e","#000510"],["#150520","#2a0a10"],["#051a08","#0a2a10"],["#0d0d1a","#0d0d2a"],["#101820","#1a2830"],["#150505","#1a0a0a"],["#080015","#0a0218"],["#0a0a1a","#000a20"],["#080820","#000508"],["#080808","#111111"],["#040c18","#081828"],["#0d0819","#1a0d2e"],["#0f0a00","#1a1000"]];

function pickVisual(idx) {
  return { accent: ACCENTS[idx % ACCENTS.length], bg: BG_PAIRS[idx % BG_PAIRS.length], shape: SHAPES[idx % SHAPES.length] };
}

/* ═══════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════ */
const Icon = ({ n, s = 20, style: st }) => {
  const paths = {
    home:    <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></>,
    grid:    <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    book:    <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
    users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    user:    <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    cog:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    out:     <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    bell:    <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    heart:   <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>,
    play:    <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none"/>,
    cL:      <polyline points="15,18 9,12 15,6"/>,
    cR:      <polyline points="9,18 15,12 9,6"/>,
    plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    star:    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor" stroke="none"/>,
    x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    send:    <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></>,
    check:   <polyline points="20,6 9,17 4,12"/>,
    shield:  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    upload:  <><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>,
    zap:     <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>,
    lock:    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    menu:    <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    trash:   <><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    globe:   <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    img:     <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></>,
    link:    <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink:0, display:"block" }}>
      {paths[n] || null}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   GAME COVER SVG — generated, no network required
═══════════════════════════════════════════════════════════════════ */
let _cid = 0;
function Cover({ game, style: st, className }) {
  // If creator uploaded a real image, show it instead of generated SVG
  if (game?.coverImage) {
    return (
      <img
        src={game.coverImage}
        alt={game.title || ""}
        className={className}
        style={{ display:"block", width:"100%", height:"100%", objectFit:"cover", ...st }}
      />
    );
  }
  const { accent: ac = "#FF4D6D", bg = ["#0d0d1a","#1a1a2e"], shape = "rings", title = "" } = game || {};
  const idRef = useRef(null);
  if (!idRef.current) idRef.current = `g${++_cid}`;
  const uid = idRef.current;

  const shapes = {
    rings:     <><circle cx="200" cy="112" r="84" fill="none" stroke={ac} strokeWidth="1.5" opacity=".26"/><circle cx="200" cy="112" r="55" fill="none" stroke={ac} strokeWidth="1" opacity=".18"/><circle cx="200" cy="112" r="27" fill={ac} opacity=".11"/><polygon points="200,64 231,118 169,118" fill={ac} opacity=".88"/><line x1="0" y1="170" x2="400" y2="170" stroke={ac} strokeWidth=".8" opacity=".2"/></>,
    planet:    <><circle cx="200" cy="108" r="60" fill={ac} opacity=".15"/><circle cx="200" cy="108" r="38" fill={ac} opacity=".28"/><circle cx="200" cy="108" r="17" fill={ac} opacity=".7"/><ellipse cx="200" cy="108" rx="114" ry="19" fill="none" stroke={ac} strokeWidth="1.2" opacity=".26"/><circle cx="94" cy="54" r="7" fill="#fff" opacity=".45"/><circle cx="316" cy="44" r="4" fill="#fff" opacity=".3"/></>,
    sword:     <><line x1="200" y1="28" x2="200" y2="188" stroke={ac} strokeWidth="2.5" opacity=".62"/><polygon points="200,28 220,92 180,92" fill={ac} opacity=".84"/><line x1="154" y1="132" x2="246" y2="132" stroke={ac} strokeWidth="3.5" opacity=".48"/><circle cx="200" cy="163" r="10" fill={ac} opacity=".38"/></>,
    mountain:  <><polygon points="0,196 104,78 210,136 310,48 400,116 400,225 0,225" fill={ac} opacity=".08"/><polygon points="0,210 80,138 190,170 288,88 400,145 400,225 0,225" fill={ac} opacity=".13"/><circle cx="325" cy="54" r="28" fill="#ffdd44" opacity=".06"/></>,
    pixelart:  <><rect x="130" y="56" width="140" height="110" fill="#1a1a2e" rx="4"/><rect x="142" y="66" width="116" height="90" fill="#16213e" rx="2"/><rect x="178" y="83" width="44" height="44" fill={ac} rx="3"/><rect x="148" y="107" width="16" height="16" fill="#0f3460"/><rect x="236" y="107" width="16" height="16" fill="#0f3460"/><rect x="184" y="63" width="32" height="10" fill={ac} opacity=".44"/></>,
    castle:    <><polygon points="200,37 248,109 240,182 160,182 152,109" fill="none" stroke={ac} strokeWidth="1.8" opacity=".52"/><rect x="182" y="113" width="36" height="51" fill={ac} opacity=".08"/><rect x="172" y="177" width="56" height="10" fill={ac} opacity=".2"/></>,
    crosshair: <><line x1="200" y1="18" x2="200" y2="206" stroke={ac} strokeWidth="1" opacity=".16"/><line x1="18" y1="112" x2="382" y2="112" stroke={ac} strokeWidth="1" opacity=".16"/><circle cx="200" cy="112" r="72" fill="none" stroke={ac} strokeWidth="1.5" opacity=".36"/><circle cx="200" cy="112" r="42" fill="none" stroke={ac} strokeWidth="1" opacity=".26"/><circle cx="200" cy="112" r="7" fill={ac} opacity=".84"/></>,
    orb:       <><circle cx="200" cy="108" r="70" fill="none" stroke={ac} strokeWidth="1" opacity=".26"/><circle cx="200" cy="108" r="44" fill="none" stroke={ac} strokeWidth=".8" opacity=".18"/><circle cx="200" cy="108" r="22" fill={ac} opacity=".15"/><circle cx="200" cy="108" r="9" fill={ac} opacity=".72"/></>,
    road:      <><polygon points="0,196 130,80 290,100 400,58 400,225 0,225" fill="#0a1a30" opacity=".52"/><line x1="200" y1="225" x2="200" y2="78" stroke={ac} strokeWidth="2" opacity=".16" strokeDasharray="14 9"/><rect x="164" y="86" width="72" height="32" rx="9" fill={ac} opacity=".56"/></>,
    starburst: <><circle cx="200" cy="108" r="48" fill={ac} opacity=".1"/><circle cx="200" cy="108" r="28" fill={ac} opacity=".26"/><circle cx="200" cy="108" r="11" fill={ac} opacity=".7"/>{[0,45,90,135,180,225,270,315].map(a=><line key={a} x1={200+42*Math.cos(a*Math.PI/180)} y1={108+42*Math.sin(a*Math.PI/180)} x2={200+63*Math.cos(a*Math.PI/180)} y2={108+63*Math.sin(a*Math.PI/180)} stroke={ac} strokeWidth="1.8" opacity=".36"/>)}</>,
    grid:      <>{[80,120,160,200,240,280,320].map(x=><line key={"x"+x} x1={x} y1="38" x2={x} y2="188" stroke="#555" strokeWidth=".5" opacity=".32"/>)}{[70,105,140,175].map(y=><line key={"y"+y} x1="38" y1={y} x2="362" y2={y} stroke="#555" strokeWidth=".5" opacity=".32"/>)}<circle cx="200" cy="112" r="50" fill="none" stroke="#666" strokeWidth="1.2" opacity=".42" strokeDasharray="7 4"/><circle cx="200" cy="112" r="8" fill="#888" opacity=".52"/></>,
    aurora:    <><ellipse cx="200" cy="82" rx="180" ry="49" fill="none" stroke={ac} strokeWidth="1" opacity=".17"/><ellipse cx="200" cy="82" rx="120" ry="33" fill="none" stroke={ac} strokeWidth="1" opacity=".13"/><ellipse cx="200" cy="82" rx="60" ry="16" fill={ac} opacity=".08"/><circle cx="200" cy="82" r="14" fill={ac} opacity=".58"/><polygon points="138,188 200,122 262,188" fill="#065a7a" opacity=".36"/></>,
    wave:      <><path d="M0,140 C66,100 133,180 200,140 C266,100 333,180 400,140" fill="none" stroke={ac} strokeWidth="2" opacity=".4"/><path d="M0,160 C66,120 133,200 200,160 C266,120 333,200 400,160" fill="none" stroke={ac} strokeWidth="1.2" opacity=".25"/><circle cx="200" cy="112" r="35" fill={ac} opacity=".14"/><circle cx="200" cy="112" r="16" fill={ac} opacity=".5"/></>,
    diamond:   <><polygon points="200,40 320,112 200,185 80,112" fill="none" stroke={ac} strokeWidth="1.8" opacity=".5"/><polygon points="200,70 280,112 200,155 120,112" fill={ac} opacity=".1"/><polygon points="200,100 230,112 200,124 170,112" fill={ac} opacity=".7"/></>,
  };

  return (
    <svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...st }}
      preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg[0]}/>
          <stop offset="100%" stopColor={bg[1]}/>
        </linearGradient>
        <radialGradient id={uid+"v"} cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor="#000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000" stopOpacity=".52"/>
        </radialGradient>
      </defs>
      <rect width="400" height="225" fill={`url(#${uid})`}/>
      {shapes[shape] || shapes.rings}
      <rect width="400" height="225" fill={`url(#${uid}v)`}/>
      <text x="200" y="216" textAnchor="middle" fontFamily="monospace" fontSize="8.5"
        fill={ac} opacity=".38" letterSpacing="2.5">{(title||"").toUpperCase()}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════════ */
const GDER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#E8ECF0;
  --bg2:#EEF1F5;
  --sl:#FFFFFF;
  --card:#FFFFFF;
  --card2:#F0F3F7;
  --bdr:#D1D9E6;
  --p:#FF4D6D;
  --ph:#FF6B85;
  --p2:#4CAF50;
  --p3:#FF9800;
  --p4:#2196F3;
  --txt:#2D3436;
  --t2:#636E72;
  --t3:#B2BEC3;
  --r:18px;
  --hh:62px;
  --bnh:66px;
  --sbw:230px;
  --shadow:6px 6px 18px rgba(166,180,200,.55),-6px -6px 18px rgba(255,255,255,.85);
  --shadow-sm:3px 3px 8px rgba(166,180,200,.5),-3px -3px 8px rgba(255,255,255,.8);
  --shadow-in:inset 3px 3px 8px rgba(166,180,200,.55),inset -3px -3px 8px rgba(255,255,255,.85);
  --fd:'Poppins',sans-serif;
  --fb:'Nunito',sans-serif;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--txt);font-family:var(--fb);overflow:hidden;height:100dvh}
input,select,textarea,button{font-family:var(--fb)}
a{color:inherit;text-decoration:none}
.shell{display:flex;height:100dvh;width:100vw;overflow:hidden}

/* ── SIDEBAR ── */
.sb{
  width:var(--sbw);min-width:var(--sbw);flex-shrink:0;
  background:var(--sl);
  box-shadow:4px 0 20px rgba(166,180,200,.4);
  display:flex;flex-direction:column;height:100dvh;
  transition:width .22s,min-width .22s;
  position:relative;z-index:200;overflow:hidden;
}
.sb.mini{width:66px;min-width:66px}
.sb.mini .sb-lbl,.sb.mini .sb-promo,.sb.mini .sb-logo-t{display:none!important}
.sb.mini .sb-item{justify-content:center;padding:13px 0}
.sb.mini .sb-logo{justify-content:center;padding:20px 0}
.sb-logo{display:flex;align-items:center;gap:10px;padding:20px 16px 16px;border-bottom:1px solid var(--bdr);flex-shrink:0;cursor:pointer;user-select:none}
.sb-logo-icon{
  width:38px;height:38px;
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  border-radius:10px;display:flex;align-items:center;justify-content:center;
  flex-shrink:0;box-shadow:0 2px 8px rgba(255,77,109,.25);
}
.sb-logo-t{font-family:var(--fd);font-size:20px;font-weight:800;letter-spacing:1.5px;color:var(--txt);white-space:nowrap}
.sb-nav{flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;overflow-x:hidden}
.sb-nav::-webkit-scrollbar{width:0}
.sb-item{
  display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:14px;
  cursor:pointer;transition:all .18s;color:var(--t2);
  white-space:nowrap;font-weight:600;font-size:13px;
}
.sb-item:hover{background:var(--bg2);color:var(--txt)}
.sb-item.on{
  background:var(--bg);
  color:var(--p);
  box-shadow:var(--shadow-sm);
  font-weight:700;
}
.sb-item.on svg{stroke:var(--p)}
.sb-lbl{font-size:13px;font-weight:600}
.sb-div{height:1px;background:var(--bdr);margin:8px 10px}
.sb-promo{
  margin:10px 10px 8px;
  background:linear-gradient(135deg,#fff5f7,#fff0f8);
  border-radius:16px;padding:16px;
  border:1.5px solid rgba(255,77,109,.18);
  flex-shrink:0;position:relative;overflow:hidden;
  box-shadow:var(--shadow-sm);
}
.sb-promo::before{content:'';position:absolute;top:-15px;right:-15px;width:60px;height:60px;background:rgba(255,77,109,.12);border-radius:50%;filter:blur(12px)}
.promo-badge{background:linear-gradient(90deg,var(--p),#FF8FA3);color:#fff;font-size:9px;font-weight:700;padding:3px 8px;border-radius:20px;display:inline-block;margin-bottom:6px;letter-spacing:.8px}
.promo-t{font-family:var(--fd);font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px}
.promo-d{font-size:10px;color:var(--t2);margin-bottom:10px;line-height:1.5}
.promo-btn{
  background:linear-gradient(90deg,var(--p),#FF8FA3);color:#fff;border:none;
  padding:7px 0;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;
  width:100%;transition:opacity .2s;font-family:var(--fd);letter-spacing:.5px;
  box-shadow:0 4px 12px rgba(255,77,109,.3);
}
.promo-btn:hover{opacity:.88}
.sb-toggle{width:100%;padding:10px;border:none;background:none;color:var(--t2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:color .2s;border-top:1px solid var(--bdr);flex-shrink:0}
.sb-toggle:hover{color:var(--txt)}
.sb-overlay{display:none;position:fixed;inset:0;background:rgba(45,52,54,.3);z-index:190;backdrop-filter:blur(3px)}

/* ── MAIN ── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.hdr{
  height:var(--hh);background:var(--sl);
  box-shadow:0 2px 12px rgba(166,180,200,.35);
  display:flex;align-items:center;padding:0 18px;gap:10px;flex-shrink:0;z-index:100;
}
.hdr-ham{display:none;width:38px;height:38px;background:var(--bg);border:none;border-radius:12px;align-items:center;justify-content:center;color:var(--t2);cursor:pointer;flex-shrink:0;box-shadow:var(--shadow-sm)}
.hdr-search{
  flex:1;max-width:460px;
  background:var(--bg);
  border:none;
  border-radius:22px;padding:0 14px;height:38px;
  display:flex;align-items:center;gap:8px;
  transition:all .2s;
  box-shadow:var(--shadow-in);
}
.hdr-search:focus-within{box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2)}
.hdr-search input{background:none;border:none;outline:none;color:var(--txt);font-size:13px;flex:1;min-width:0;font-weight:500}
.hdr-search input::placeholder{color:var(--t3)}
.hdr-r{display:flex;align-items:center;gap:8px;margin-left:auto}
.hdr-ico{
  width:38px;height:38px;background:var(--bg);border:none;
  border-radius:12px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .18s;color:var(--t2);position:relative;
  box-shadow:var(--shadow-sm);
}
.hdr-ico:hover{color:var(--p)}
.hdr-ico svg{stroke:var(--t2);transition:stroke .18s}
.hdr-ico:hover svg{stroke:var(--p)}
.nb{position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;background:var(--p);border-radius:50%;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;color:#fff;border:2px solid var(--sl);padding:0 2px}
.av-sm{
  width:38px;height:38px;border-radius:12px;cursor:pointer;
  background:linear-gradient(135deg,var(--p),#FF8FA3);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-weight:800;font-size:15px;color:#fff;
  transition:all .18s;flex-shrink:0;
  box-shadow:3px 3px 10px rgba(255,77,109,.35);
}
.av-sm:hover{box-shadow:4px 4px 14px rgba(255,77,109,.45)}
.content{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--bdr) transparent;background:var(--bg)}
.content::-webkit-scrollbar{width:5px}
.content::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}
.pg{padding:20px 22px;animation:fadeUp .22s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

/* ── BOTTOM NAV ── */
.bn{
  display:none;height:var(--bnh);
  background:var(--sl);
  box-shadow:0 -2px 12px rgba(166,180,200,.35);
  flex-direction:row;align-items:stretch;flex-shrink:0;
}
.bn-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);transition:all .16s;position:relative;padding:6px 0}
.bn-item.on{color:var(--p)}
.bn-item.on .bn-ico-wrap{background:var(--bg);box-shadow:var(--shadow-sm);border-radius:12px;padding:4px 10px}
.bn-lbl{font-size:9px;font-weight:700;letter-spacing:.3px}
.bn-ico-wrap{padding:4px 10px;transition:all .18s}

/* ── BUTTONS ── */
.btn-r{
  background:linear-gradient(135deg,var(--p),#FF6B85);color:#fff;border:none;
  padding:10px 20px;border-radius:14px;font-size:13px;font-weight:700;
  cursor:pointer;display:flex;align-items:center;gap:7px;
  transition:all .18s;font-family:var(--fd);letter-spacing:.3px;
  white-space:nowrap;flex-shrink:0;
  box-shadow:4px 4px 12px rgba(255,77,109,.35);
}
.btn-r:hover{box-shadow:5px 5px 16px rgba(255,77,109,.45);transform:translateY(-1px)}
.btn-r:active{transform:translateY(0);box-shadow:2px 2px 8px rgba(255,77,109,.3)}
.btn-o{
  background:var(--bg);color:var(--txt);border:none;
  padding:10px 20px;border-radius:14px;font-size:13px;font-weight:700;
  cursor:pointer;transition:all .18s;font-family:var(--fd);white-space:nowrap;
  box-shadow:var(--shadow-sm);
}
.btn-o:hover{box-shadow:var(--shadow)}
.btn-sm{padding:8px 14px;font-size:12px;border-radius:12px}
.ghost{background:none;border:none;color:var(--t2);cursor:pointer;display:flex;align-items:center;gap:5px;transition:color .18s;font-size:13px;padding:0}
.ghost:hover{color:var(--p)}
.btn-danger{background:var(--bg);color:#e74c3c;border:none;padding:8px 14px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;font-family:var(--fd);box-shadow:var(--shadow-sm)}
.btn-danger:hover{box-shadow:var(--shadow)}

/* ── SECTION ── */
.sec-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.sec-t{font-family:var(--fd);font-size:17px;font-weight:700;color:var(--txt);letter-spacing:.2px}
.div{height:1px;background:var(--bdr);margin:22px 0}
.pg-t{font-family:var(--fd);font-size:clamp(19px,4vw,26px);font-weight:800;margin-bottom:5px;color:var(--txt)}
.pg-s{font-size:13px;color:var(--t2);margin-bottom:20px;font-weight:500}

/* ── BANNER ── */
.banner{
  border-radius:22px;overflow:hidden;position:relative;
  aspect-ratio:21/9;min-height:180px;max-height:400px;margin-bottom:28px;
  box-shadow:var(--shadow);cursor:pointer;
}
.banner-img{position:absolute;inset:0;width:100%;height:100%;transition:transform .55s}
.banner:hover .banner-img{transform:scale(1.03)}
.banner-grad{position:absolute;inset:0;background:linear-gradient(115deg,rgba(45,52,54,.88) 0%,rgba(45,52,54,.52) 45%,transparent 100%)}
.banner-body{position:absolute;bottom:0;left:0;padding:clamp(16px,3vw,30px) clamp(18px,3.5vw,36px);max-width:540px}
.banner-badge{display:inline-flex;align-items:center;gap:4px;background:var(--p);color:#fff;font-size:9px;font-weight:700;padding:4px 10px;border-radius:20px;margin-bottom:9px;letter-spacing:.8px;font-family:var(--fd)}
.banner-title{font-family:var(--fd);font-size:clamp(20px,3.8vw,38px);font-weight:800;color:#fff;line-height:1.1;margin-bottom:7px}
.banner-desc{font-size:clamp(11px,1.4vw,13px);color:rgba(255,255,255,.8);margin-bottom:16px;line-height:1.5}
.banner-btns{display:flex;gap:10px;flex-wrap:wrap}

/* ── CAROUSEL ── */
.car{position:relative;margin-bottom:28px}
.car-wrap{overflow:hidden}
.car-track{display:flex;gap:14px;transition:transform .42s cubic-bezier(.4,0,.2,1);cursor:grab;user-select:none}
.car-track.drag{cursor:grabbing;transition:none}
.car-btn{
  position:absolute;top:38%;transform:translateY(-50%);width:40px;height:40px;
  background:var(--sl);border:none;border-radius:50%;
  display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;
  color:var(--t2);transition:all .18s;box-shadow:var(--shadow);
}
.car-btn:hover{color:var(--p)}
.car-btn.L{left:-20px}.car-btn.R{right:-20px}
.car-dots{display:flex;justify-content:center;gap:6px;margin-top:14px}
.car-dot{width:6px;height:6px;border-radius:3px;background:var(--bdr);cursor:pointer;transition:all .28s}
.car-dot.on{width:22px;background:var(--p)}

/* ── GAME CARD ── */
.gc{
  background:var(--card);border:none;border-radius:20px;
  overflow:hidden;cursor:pointer;transition:all .22s;flex-shrink:0;
  box-shadow:var(--shadow);
}
.gc:hover{transform:translateY(-4px);box-shadow:8px 8px 24px rgba(166,180,200,.65),-4px -4px 14px rgba(255,255,255,.9)}
.gc:active{transform:translateY(0);box-shadow:var(--shadow-sm)}
.gc-cover{width:100%;aspect-ratio:16/9;display:block;overflow:hidden}
.gc-body{padding:13px}
.gc-title{font-family:var(--fd);font-size:14px;font-weight:700;color:var(--txt);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gc-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.tag{font-size:9px;font-weight:700;padding:3px 8px;border-radius:8px;border:none;letter-spacing:.2px}
.tA{background:rgba(99,102,241,.12);color:#6366F1}
.tB{background:rgba(16,185,129,.12);color:#059669}
.tC{background:rgba(255,77,109,.12);color:var(--p)}
.tD{background:rgba(245,158,11,.12);color:#D97706}
.tE{background:rgba(14,165,233,.12);color:#0284C7}
.gc-foot{display:flex;align-items:center;gap:7px}
.fav-btn{
  width:32px;height:32px;border-radius:10px;
  background:var(--bg);border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  color:var(--t2);transition:all .18s;flex-shrink:0;
  box-shadow:var(--shadow-sm);
}
.fav-btn:hover{color:var(--p)}
.fav-btn.on{background:rgba(255,77,109,.1);color:var(--p)}
.fav-btn.on svg{fill:var(--p)}
.view-btn{
  flex:1;background:var(--bg);color:var(--p);border:none;
  padding:7px 12px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;
  transition:all .18s;font-family:var(--fd);
  box-shadow:var(--shadow-sm);
}
.view-btn:hover{background:var(--p);color:#fff;box-shadow:3px 3px 10px rgba(255,77,109,.3)}

/* ── GRID ── */
.gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}

/* ── FILTERS ── */
.fp{background:var(--card);border:none;border-radius:18px;padding:16px;margin-bottom:20px;box-shadow:var(--shadow-sm)}
.fr{display:flex;flex-wrap:wrap;gap:9px;align-items:flex-end}
.fg{display:flex;flex-direction:column;gap:5px;flex:1;min-width:115px}
.fl{font-size:9.5px;font-weight:700;color:var(--t2);letter-spacing:.8px;text-transform:uppercase}
.fsel{
  background:var(--bg);border:none;color:var(--txt);padding:8px 11px;
  border-radius:11px;font-size:12px;cursor:pointer;outline:none;transition:all .18s;
  appearance:none;-webkit-appearance:none;width:100%;font-weight:500;
  box-shadow:var(--shadow-in);
}
.fsel:focus{box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2)}
.f-inp{
  background:var(--bg);border:none;color:var(--txt);padding:8px 12px;
  border-radius:11px;font-size:12px;outline:none;transition:all .18s;
  flex:2;min-width:150px;font-weight:500;
  box-shadow:var(--shadow-in);
}
.f-inp:focus{box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2)}
.f-inp::placeholder{color:var(--t3)}
.clr{
  background:var(--bg);color:var(--p);border:none;
  padding:8px 13px;border-radius:11px;font-size:12px;font-weight:700;cursor:pointer;
  transition:all .18s;font-family:var(--fd);white-space:nowrap;
  box-shadow:var(--shadow-sm);
}
.clr:hover{background:var(--p);color:#fff}

/* ── MODAL ── */
.mo-bg{position:fixed;inset:0;background:rgba(45,52,54,.28);backdrop-filter:blur(6px);z-index:500;display:flex;align-items:flex-end;justify-content:center;animation:fadeUp .18s ease;padding:0}
.mo{
  background:var(--card);border:none;width:100%;max-width:560px;max-height:92dvh;
  overflow-y:auto;padding:24px;border-radius:24px 24px 0 0;animation:slideUp .26s ease;
  scrollbar-width:thin;scrollbar-color:var(--bdr) transparent;
  box-shadow:0 -8px 40px rgba(166,180,200,.4);
}
.mo::-webkit-scrollbar{width:4px}
.mo::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
.mo-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.mo-t{font-family:var(--fd);font-size:20px;font-weight:800;color:var(--txt)}
.mo-x{
  width:34px;height:34px;background:var(--bg);border:none;border-radius:11px;
  cursor:pointer;color:var(--t2);display:flex;align-items:center;justify-content:center;
  transition:all .18s;box-shadow:var(--shadow-sm);
}
.mo-x:hover{color:var(--txt);box-shadow:var(--shadow)}

/* ── FORM ── */
.fm-g{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
.fm-l{font-size:10px;font-weight:700;color:var(--t2);letter-spacing:.5px;text-transform:uppercase}
.fm-i{
  background:var(--bg);border:none;color:var(--txt);padding:11px 14px;
  border-radius:13px;font-size:13px;outline:none;transition:all .2s;width:100%;
  font-weight:500;box-shadow:var(--shadow-in);
}
.fm-i:focus{box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2)}
.fm-i::placeholder{color:var(--t3)}
.fm-s{
  background:var(--bg);border:none;color:var(--txt);padding:11px 14px;
  border-radius:13px;font-size:13px;outline:none;transition:all .2s;width:100%;
  appearance:none;-webkit-appearance:none;cursor:pointer;font-weight:500;
  box-shadow:var(--shadow-in);
}
.fm-s:focus{box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2)}
.fm-ta{
  background:var(--bg);border:none;color:var(--txt);padding:11px 14px;
  border-radius:13px;font-size:13px;outline:none;transition:all .2s;width:100%;
  resize:vertical;min-height:80px;font-weight:500;
  box-shadow:var(--shadow-in);
}
.fm-ta:focus{box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2)}
.fm-ta::placeholder{color:var(--t3)}
.fm-r{display:flex;gap:12px;flex-wrap:wrap}
.fm-r .fm-g{flex:1;min-width:130px}
.fm-sub{
  width:100%;background:linear-gradient(135deg,var(--p),#FF6B85);color:#fff;border:none;
  padding:13px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;
  transition:all .2s;font-family:var(--fd);letter-spacing:.5px;margin-top:4px;
  box-shadow:4px 4px 14px rgba(255,77,109,.35);
}
.fm-sub:hover{box-shadow:5px 5px 18px rgba(255,77,109,.45);transform:translateY(-1px)}
.fm-sub:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.err{color:#e74c3c;font-size:12px;margin-bottom:10px;padding:9px 13px;background:rgba(231,76,60,.08);border-radius:10px;font-weight:600}

/* ── AUTH ── */
.auth-wrap{
  min-height:100dvh;
  background:linear-gradient(135deg,#E8ECF0 0%,#EEF1F5 50%,#E4EBF5 100%);
  display:flex;align-items:center;justify-content:center;padding:20px;
}
.auth-card{
  background:var(--card);border:none;border-radius:26px;
  padding:clamp(24px,5vw,40px);width:100%;max-width:400px;
  box-shadow:var(--shadow);
}
.auth-logo{text-align:center;margin-bottom:24px}
.auth-t{font-family:var(--fd);font-size:24px;font-weight:800;text-align:center;margin-bottom:4px;color:var(--txt)}
.auth-s{font-size:13px;color:var(--t2);text-align:center;margin-bottom:24px;font-weight:500}
.type-row{display:flex;gap:10px;margin-bottom:18px}
.type-btn{
  flex:1;padding:12px;border-radius:14px;border:none;
  background:var(--bg);color:var(--t2);cursor:pointer;text-align:center;
  transition:all .2s;box-shadow:var(--shadow-sm);
}
.type-btn.sel{
  background:rgba(255,77,109,.08);color:var(--p);
  box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2);
}
.type-ico{font-size:22px;margin-bottom:4px}
.type-lbl{font-size:12px;font-weight:700;font-family:var(--fd);letter-spacing:.3px}
.auth-btn{
  width:100%;background:linear-gradient(135deg,var(--p),#FF6B85);color:#fff;border:none;
  padding:13px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;
  transition:all .2s;font-family:var(--fd);letter-spacing:.5px;margin-bottom:14px;
  box-shadow:4px 4px 14px rgba(255,77,109,.35);
}
.auth-btn:hover{box-shadow:5px 5px 18px rgba(255,77,109,.45);transform:translateY(-1px)}
.auth-sw{text-align:center;font-size:13px;color:var(--t2);font-weight:500}
.auth-lk{color:var(--p);cursor:pointer;font-weight:700}
.auth-lk:hover{text-decoration:underline}

/* ── PROFILE ── */
.prof-hdr{
  background:var(--card);border:none;border-radius:22px;
  padding:24px;margin-bottom:20px;display:flex;align-items:center;gap:20px;
  position:relative;overflow:hidden;flex-wrap:wrap;
  box-shadow:var(--shadow);
}
.av-lg{
  width:70px;height:70px;border-radius:18px;display:flex;align-items:center;
  justify-content:center;color:#fff;font-family:var(--fd);font-size:26px;font-weight:800;
  flex-shrink:0;background:linear-gradient(135deg,var(--p),#FF8FA3);
  box-shadow:4px 4px 14px rgba(255,77,109,.35);
}
.pf-u{font-family:var(--fd);font-size:21px;font-weight:800;color:var(--txt)}
.pf-r{font-size:11px;color:var(--p);font-weight:700;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px}
.pf-stats{display:flex;gap:20px;flex-wrap:wrap}
.ps-v{font-family:var(--fd);font-size:18px;font-weight:800;color:var(--txt)}
.ps-l{font-size:10px;color:var(--t2);font-weight:600}

/* ── STAT CARDS ── */
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:13px;margin-bottom:24px}
.sc{
  background:var(--card);border:none;border-radius:16px;padding:16px;text-align:center;
  box-shadow:var(--shadow-sm);transition:box-shadow .18s;
}
.sc:hover{box-shadow:var(--shadow)}
.sc-n{font-family:var(--fd);font-size:22px;font-weight:800;color:var(--p)}
.sc-l{font-size:10px;color:var(--t2);margin-top:3px;font-weight:600}

/* ── TABS ── */
.tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.tab{
  padding:9px 18px;border-radius:12px;border:none;
  background:var(--card);color:var(--t2);font-size:12px;font-weight:700;
  cursor:pointer;transition:all .18s;font-family:var(--fd);
  box-shadow:var(--shadow-sm);
}
.tab.on{
  background:var(--bg);color:var(--p);
  box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.18);
}

/* ── GROUPS ── */
.g-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:24px}
.grp{
  background:var(--card);border:none;border-radius:20px;padding:18px;
  transition:all .2s;cursor:pointer;box-shadow:var(--shadow-sm);
}
.grp:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
.grp-name{font-family:var(--fd);font-size:15px;font-weight:700;margin-bottom:6px;color:var(--txt)}
.grp-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px}
.grp-desc{font-size:12px;color:var(--t2);margin-bottom:14px;line-height:1.6;font-weight:500}
.grp-ft{display:flex;align-items:center;justify-content:space-between}
.grp-pl{font-size:11px;color:var(--t2);font-weight:600}
.join{
  background:linear-gradient(135deg,var(--p),#FF6B85);color:#fff;border:none;
  padding:7px 16px;border-radius:10px;font-size:11px;font-weight:700;
  cursor:pointer;transition:all .18s;font-family:var(--fd);
  box-shadow:2px 2px 8px rgba(255,77,109,.3);
}
.join:hover{box-shadow:3px 3px 12px rgba(255,77,109,.4)}
.join.ok{
  background:var(--bg);color:#059669;border:none;
  box-shadow:var(--shadow-sm);
}
.join.ok:hover{box-shadow:var(--shadow)}

/* ── CHAT ── */
.chat{
  display:flex;flex-direction:column;height:380px;
  background:var(--card);border:none;border-radius:20px;overflow:hidden;
  margin-top:16px;box-shadow:var(--shadow-sm);
}
.chat-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--bdr) transparent;background:var(--bg2)}
.chat-msgs::-webkit-scrollbar{width:4px}
.chat-msgs::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
.chat-msg{display:flex;gap:9px}
.chat-av{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0;font-family:var(--fd)}
.chat-bbl{flex:1}
.chat-meta{display:flex;gap:7px;align-items:baseline;margin-bottom:3px}
.chat-u{font-size:12px;font-weight:700;font-family:var(--fd);color:var(--txt)}
.chat-tm{font-size:10px;color:var(--t2)}
.chat-txt{font-size:12px;color:var(--txt);background:var(--card);padding:9px 13px;border-radius:13px;border-top-left-radius:4px;line-height:1.5;display:inline-block;max-width:100%;box-shadow:var(--shadow-sm);font-weight:500}
.chat-own .chat-txt{background:rgba(255,77,109,.1);color:var(--p)}
.chat-typing{font-size:10px;color:var(--t2);font-style:italic;padding:2px 16px}
.chat-ia{border-top:1px solid var(--bdr);padding:13px 16px;display:flex;gap:8px;align-items:center;background:var(--card)}
.chat-in{
  flex:1;background:var(--bg);border:none;color:var(--txt);
  padding:9px 13px;border-radius:12px;font-size:12px;outline:none;
  transition:all .18s;min-width:0;font-weight:500;
  box-shadow:var(--shadow-in);
}
.chat-in:focus{box-shadow:var(--shadow-in),0 0 0 2px rgba(255,77,109,.2)}
.chat-in::placeholder{color:var(--t3)}
.chat-snd{
  width:38px;height:38px;
  background:linear-gradient(135deg,var(--p),#FF6B85);border:none;
  border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;
  color:#fff;transition:all .18s;flex-shrink:0;
  box-shadow:3px 3px 10px rgba(255,77,109,.3);
}
.chat-snd:hover{box-shadow:4px 4px 14px rgba(255,77,109,.4)}

/* ── CREATOR / ADMIN ── */
.cr-hdr{
  background:var(--card);border:none;border-radius:22px;padding:24px;
  margin-bottom:24px;display:flex;align-items:center;gap:18px;
  position:relative;overflow:hidden;flex-wrap:wrap;
  box-shadow:var(--shadow);
}
.stu-logo{
  width:62px;height:62px;
  background:linear-gradient(135deg,#2563EB,#60A5FA);
  border-radius:18px;display:flex;align-items:center;justify-content:center;
  font-family:var(--fd);font-size:24px;font-weight:800;color:#fff;
  box-shadow:4px 4px 14px rgba(37,99,235,.3);flex-shrink:0;
}
.stu-name{font-family:var(--fd);font-size:21px;font-weight:800;color:var(--txt)}
.stu-plan{font-size:11px;color:var(--t2);margin-top:3px;font-weight:500}
.ac{
  background:var(--card);border:none;border-radius:16px;padding:15px;
  display:flex;gap:13px;align-items:flex-start;transition:all .2s;
  box-shadow:var(--shadow-sm);
}
.ac:hover{box-shadow:var(--shadow)}
.ac-th{width:86px;height:54px;border-radius:11px;overflow:hidden;flex-shrink:0;display:block}
.ac-t{font-family:var(--fd);font-size:14px;font-weight:700;margin-bottom:3px;color:var(--txt)}
.ac-m{font-size:11px;color:var(--t2);margin-bottom:7px;font-weight:500}
.ac-acts{display:flex;gap:7px;flex-wrap:wrap;margin-left:auto;flex-shrink:0}
.ok{background:rgba(16,185,129,.12);color:#059669;border:none;padding:7px 12px;border-radius:9px;font-size:10px;font-weight:700;cursor:pointer;transition:all .18s;font-family:var(--fd);box-shadow:var(--shadow-sm)}
.ok:hover{box-shadow:var(--shadow)}
.rej{background:rgba(255,77,109,.12);color:var(--p);border:none;padding:7px 12px;border-radius:9px;font-size:10px;font-weight:700;cursor:pointer;transition:all .18s;font-family:var(--fd);box-shadow:var(--shadow-sm)}
.rej:hover{box-shadow:var(--shadow)}
.feat{background:rgba(245,158,11,.12);color:#D97706;border:none;padding:7px 12px;border-radius:9px;font-size:10px;font-weight:700;cursor:pointer;transition:all .18s;font-family:var(--fd);box-shadow:var(--shadow-sm)}
.feat:hover{box-shadow:var(--shadow)}
.pend{display:inline-flex;align-items:center;gap:3px;background:rgba(245,158,11,.12);color:#D97706;border:none;padding:3px 9px;border-radius:20px;font-size:9px;font-weight:700;font-family:var(--fd)}
.appr{display:inline-flex;align-items:center;gap:3px;background:rgba(16,185,129,.12);color:#059669;border:none;padding:3px 9px;border-radius:20px;font-size:9px;font-weight:700;font-family:var(--fd)}

/* ── SETTINGS ── */
.ss{background:var(--card);border:none;border-radius:18px;padding:20px;margin-bottom:16px;box-shadow:var(--shadow-sm)}
.ss-t{font-family:var(--fd);font-size:14px;font-weight:800;color:var(--txt);margin-bottom:14px;padding-bottom:11px;border-bottom:1px solid var(--bdr)}
.ss-r{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--bdr)}
.ss-r:last-child{border-bottom:none}
.ss-l{font-size:13px;font-weight:600;color:var(--txt)}
.ss-v{font-size:11px;color:var(--t2);font-weight:500}
.tog{
  width:44px;height:24px;background:var(--bdr);border-radius:12px;cursor:pointer;
  position:relative;transition:background .26s;border:none;flex-shrink:0;
  box-shadow:var(--shadow-in);
}
.tog.on{background:var(--p)}
.tog::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform .26s;box-shadow:1px 1px 4px rgba(0,0,0,.2)}
.tog.on::after{transform:translateX(20px)}

/* ── GAME MODAL ── */
.gm-cover{width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;margin-bottom:16px;display:block;box-shadow:var(--shadow-sm)}
.gm-t{font-family:var(--fd);font-size:22px;font-weight:800;margin-bottom:7px;color:var(--txt)}
.gm-d{font-size:13px;color:var(--t2);margin-bottom:14px;line-height:1.7;font-weight:500}
.gm-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:15px}
.rat{display:flex;align-items:center;gap:5px;margin-bottom:14px;flex-wrap:wrap}
.rat-c{font-size:11px;color:var(--t2);font-weight:500}
.up-area{
  border:2px dashed var(--bdr);border-radius:14px;padding:28px;text-align:center;
  cursor:pointer;transition:all .18s;color:var(--t2);background:var(--bg);
}
.up-area:hover{border-color:var(--p);color:var(--p)}
.up-t{font-size:12px;font-weight:700;margin-bottom:2px;font-family:var(--fd);margin-top:8px}
.up-s{font-size:10px}

/* ── TOAST ── */
.toast{
  position:fixed;bottom:calc(var(--bnh) + 16px);left:50%;transform:translateX(-50%);
  background:var(--card);border:none;color:var(--txt);padding:12px 18px;
  border-radius:16px;font-size:13px;font-weight:600;z-index:999;
  display:flex;align-items:center;gap:9px;
  box-shadow:var(--shadow);
  animation:slideUp .26s ease;white-space:nowrap;max-width:calc(100vw - 28px);
}
.toast.err-toast{}
.toast-ico{width:22px;height:22px;border-radius:50%;background:rgba(16,185,129,.15);display:flex;align-items:center;justify-content:center;color:#059669;flex-shrink:0}
.toast.err-toast .toast-ico{background:rgba(255,77,109,.15);color:var(--p)}

/* ── EMPTY ── */
.empty{text-align:center;padding:48px 20px;color:var(--t2)}
.empty-i{font-size:42px;margin-bottom:10px}
.empty-t{font-size:15px;font-weight:700;margin-bottom:5px;font-family:var(--fd);color:var(--txt)}
.empty-s{font-size:12px;font-weight:500}

/* ── NOTIFICATION PANEL ── */
.notif-panel{
  position:absolute;top:calc(var(--hh) - 2px);right:12px;width:300px;
  background:var(--card);border:none;border-radius:18px;
  box-shadow:var(--shadow);z-index:300;overflow:hidden;animation:slideUp .2s ease;
}
.notif-h{padding:14px 17px;border-bottom:1px solid var(--bdr);font-family:var(--fd);font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:space-between;color:var(--txt)}
.notif-item{padding:13px 17px;border-bottom:1px solid var(--bdr);display:flex;gap:11px;align-items:flex-start;cursor:pointer;transition:background .15s}
.notif-item:hover{background:var(--bg2)}
.notif-item:last-child{border-bottom:none}
.notif-dot{width:9px;height:9px;background:var(--p);border-radius:50%;flex-shrink:0;margin-top:4px;box-shadow:0 0 6px rgba(255,77,109,.5)}
.notif-msg{font-size:12px;color:var(--txt);line-height:1.4;margin-bottom:2px;font-weight:600}
.notif-time{font-size:10px;color:var(--t2);font-weight:500}

/* ── SEARCH DROPDOWN ── */
.search-drop{
  position:absolute;top:calc(var(--hh) - 2px);left:50%;transform:translateX(-50%);
  width:460px;max-width:calc(100vw - 28px);
  background:var(--card);border:none;border-radius:18px;
  box-shadow:var(--shadow);z-index:300;overflow:hidden;animation:slideUp .2s ease;
}
.s-item{padding:11px 17px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:background .15s}
.s-item:hover{background:var(--bg2)}
.s-thumb{width:50px;height:32px;border-radius:8px;overflow:hidden;flex-shrink:0;box-shadow:var(--shadow-sm)}
.s-title{font-size:13px;font-weight:700;font-family:var(--fd);color:var(--txt)}
.s-sub{font-size:10px;color:var(--t2);font-weight:500}

/* ── FIND PLAYERS ── */
.fp-card{background:var(--card);border:none;border-radius:15px;padding:12px 17px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow-sm);transition:box-shadow .18s}
.fp-card:hover{box-shadow:var(--shadow)}
.fp-av{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-family:var(--fd);font-size:17px;font-weight:800;color:#fff;flex-shrink:0}
.fp-n{font-family:var(--fd);font-size:13px;font-weight:700;color:var(--txt)}
.fp-g{font-size:11px;color:var(--t2);font-weight:500}
.fp-m{margin-left:auto;background:var(--bg);color:#6366F1;border:none;padding:6px 13px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;transition:all .18s;font-family:var(--fd);box-shadow:var(--shadow-sm)}
.fp-m:hover{box-shadow:var(--shadow)}

/* ── RESPONSIVE ── */
@media(min-width:1280px){.gg{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}
@media(max-width:1024px){:root{--sbw:200px}.banner-desc{display:none}}
@media(min-width:769px){.toast{bottom:22px;left:auto;right:22px;transform:none}.mo-bg{align-items:center;padding:20px}.mo{border-radius:24px;max-height:88dvh}}
@media(max-width:768px){
  :root{--sbw:265px}
  .sb{position:fixed;left:0;top:0;bottom:0;height:100dvh;transform:translateX(-100%);z-index:300;width:var(--sbw)!important;min-width:var(--sbw)!important;transition:transform .24s}
  .sb.mob-open{transform:translateX(0);box-shadow:8px 0 40px rgba(166,180,200,.5)}
  .sb-overlay{display:block}
  .sb-toggle{display:none}
  .hdr-ham{display:flex}
  .bn{display:flex}
  .pg{padding:14px 15px}
  .banner{border-radius:16px;margin-bottom:20px}
  .banner-btns .btn-o{display:none}
  .gg{grid-template-columns:repeat(2,1fr);gap:10px}
  .gc-body{padding:10px}
  .gc-title{font-size:12px}
  .prof-hdr{flex-direction:column;text-align:center}
  .pf-stats{justify-content:center}
  .cr-hdr{gap:13px}
  .ac{flex-direction:column}
  .ac-th{width:100%;height:125px}
  .ac-acts{margin-left:0;width:100%}
  .fr{flex-direction:column}
  .fm-r{flex-direction:column}
  .g-grid{grid-template-columns:1fr}
  .chat{height:300px}
  .sg{grid-template-columns:repeat(2,1fr)}
  .car-btn{display:none}
  .search-drop{width:calc(100vw - 28px)}
  .notif-panel{width:calc(100vw - 28px);right:14px}
}
@media(max-width:480px){.gg{grid-template-columns:repeat(2,1fr);gap:8px}.hdr{padding:0 11px;gap:8px}.hdr-search{max-width:none}.banner{aspect-ratio:4/3;min-height:160px}.banner-title{font-size:19px}}
/* ── FORUM ── */
.forum-cat{background:var(--card);border-radius:16px;padding:14px 18px;cursor:pointer;transition:all .2s;box-shadow:var(--shadow-sm);border:1.5px solid var(--bdr);display:flex;align-items:center;gap:14px}
.forum-cat:hover{box-shadow:var(--shadow);transform:translateY(-2px)}
.forum-cat.sel{border-color:var(--p);background:rgba(255,77,109,.04)}
.fc-ico{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
.fc-name{font-family:var(--fd);font-size:15px;font-weight:800;color:var(--txt);margin-bottom:2px}
.fc-desc{font-size:11px;color:var(--t2);font-weight:500}
.fc-count{margin-left:auto;font-family:var(--fd);font-size:13px;font-weight:700;color:var(--t2);text-align:right;flex-shrink:0}
.fpost{background:var(--card);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow-sm);border:1.5px solid var(--bdr);cursor:pointer;transition:all .2s}
.fpost:hover{box-shadow:var(--shadow);border-color:var(--p)}
.fpost-title{font-family:var(--fd);font-size:15px;font-weight:800;color:var(--txt);margin-bottom:5px;line-height:1.3}
.fpost-meta{font-size:11px;color:var(--t2);display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.fpost-body{font-size:13px;color:var(--t2);line-height:1.6;margin:9px 0;font-weight:500}
.fpost-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}
.forum-reply{background:var(--bg);border-radius:13px;padding:13px 15px;margin-bottom:9px;box-shadow:var(--shadow-sm)}
.forum-reply.op{border-left:3px solid var(--p);background:rgba(255,77,109,.03)}
.fr-meta{font-size:11px;color:var(--t2);margin-bottom:5px;display:flex;gap:8px;align-items:center}
.fr-body{font-size:13px;color:var(--txt);line-height:1.6;white-space:pre-wrap}
.badge-plan{font-size:8px;font-weight:800;padding:2px 6px;border-radius:8px;color:#fff;letter-spacing:.4px}

`

/* ═══════════════════════════════════════════════════════════════════
   CAROUSEL
═══════════════════════════════════════════════════════════════════ */
function Carousel({ games, favs, toggleFav, onView }) {
  const getVis = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 480) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1100) return 3;
    return 4;
  };
  const [idx, setIdx]   = useState(0);
  const [drag, setDrag] = useState(false);
  const [sx, setSx]     = useState(0);
  const [hov, setHov]   = useState(false);
  const [vis, setVis]   = useState(() => getVis());
  const timerRef        = useRef(null);

  useEffect(() => {
    const h = () => setVis(getVis());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const max  = Math.max(0, games.length - vis);
  const next = useCallback(() => setIdx(i => i >= max ? 0 : i + 1), [max]);
  const prev = useCallback(() => setIdx(i => i <= 0 ? max : i - 1), [max]);

  useEffect(() => {
    if (hov || games.length <= vis) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [hov, next, games.length, vis]);

  if (!games.length) return null;
  const cw = `calc((100% - ${(vis - 1) * 12}px) / ${vis})`;
  const startD = x => { setDrag(true); setSx(x); };
  const endD   = x => {
    if (!drag) return;
    setDrag(false);
    const d = sx - x;
    if (d > 35) next(); else if (d < -35) prev();
  };

  return (
    <div className="car"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setDrag(false); }}>
      <button className="car-btn L" onClick={prev}><Icon n="cL" s={15}/></button>
      <div className="car-wrap">
        <div className={`car-track${drag ? " drag" : ""}`}
          style={{ transform: `translateX(calc(-${idx} * (${cw} + 12px)))` }}
          onMouseDown={e => startD(e.clientX)}
          onMouseUp={e => endD(e.clientX)}
          onTouchStart={e => startD(e.touches[0].clientX)}
          onTouchEnd={e => endD(e.changedTouches[0].clientX)}>
          {games.map(g => (
            <div key={g.id} style={{ width: cw, minWidth: cw }}>
              <GameCard g={g} fav={favs.includes(g.id)} toggleFav={toggleFav} onView={onView}/>
            </div>
          ))}
        </div>
      </div>
      <button className="car-btn R" onClick={next}><Icon n="cR" s={15}/></button>
      {max > 0 && (
        <div className="car-dots">
          {Array.from({ length: max + 1 }).map((_, i) => (
            <div key={i} className={`car-dot${idx === i ? " on" : ""}`} onClick={() => setIdx(i)}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME CARD
═══════════════════════════════════════════════════════════════════ */
function GameCard({ g, fav, toggleFav, onView }) {
  return (
    <div className="gc" onClick={() => onView(g)}>
      <div className="gc-cover"><Cover game={g} style={{ width: "100%", height: "100%" }}/></div>
      <div className="gc-body">
        <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:5 }}>
          <div className="gc-title" style={{ marginBottom:0, flex:1 }}>{g.title}</div>
          {g.creatorPlan && PLANS[g.creatorPlan]?.badge && (
            <span style={{ fontSize:8,fontWeight:800,padding:"1px 5px",borderRadius:6,background:PLANS[g.creatorPlan].color,color:"#fff",flexShrink:0 }}>
              {PLANS[g.creatorPlan].badge}
            </span>
          )}
        </div>
        <div className="gc-tags">
          <span className="tag tA">{g.genre}</span>
          <span className="tag tB">{g.platform}</span>
          <span className="tag tC">{g.price}</span>
        </div>
        <div className="gc-foot" onClick={e => e.stopPropagation()}>
          <button className={`fav-btn${fav ? " on" : ""}`} onClick={() => toggleFav(g.id)}>
            <Icon n="heart" s={14}/>
          </button>
          <button className="view-btn" onClick={() => onView(g)}>View</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGES
═══════════════════════════════════════════════════════════════════ */

/* ── Rotating Featured Banner ── */
function FeaturedBanner({ games, onView, onPlay }) {
  const [idx, setIdx]     = useState(0);
  const [hov, setHov]     = useState(false);
  const [prev, setPrev]   = useState(null);  // for slide-out animation
  const [dir, setDir]     = useState(1);     // 1=forward, -1=backward
  const timerRef          = useRef(null);

  // games already sorted by featuredSlot
  const total = games.length;

  const goTo = useCallback((next, direction) => {
    setDir(direction);
    setPrev(idx);
    setIdx(next);
    setTimeout(() => setPrev(null), 450);
  }, [idx]);

  const advance = useCallback(() => {
    goTo((idx + 1) % total, 1);
  }, [idx, total, goTo]);

  const back = useCallback(() => {
    goTo((idx - 1 + total) % total, -1);
  }, [idx, total, goTo]);

  useEffect(() => {
    if (hov || total <= 1) return;
    timerRef.current = setInterval(advance, 5000);
    return () => clearInterval(timerRef.current);
  }, [hov, advance, total]);

  if (!total) return null;
  const g = games[idx];

  return (
    <div
      style={{ position:"relative", borderRadius:20, overflow:"hidden",
        aspectRatio:"21/9", minHeight:190, maxHeight:420, marginBottom:28,
        boxShadow:"var(--shadow)", cursor:"pointer" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView(g)}>

      {/* Slides */}
      {games.map((game, i) => {
        const isActive  = i === idx;
        const isPrev    = i === prev;
        const slideIn   = isActive  ? (dir > 0 ? "translateX(100%)" : "translateX(-100%)") : null;
        const slideOut  = isPrev    ? (dir > 0 ? "translateX(-100%)": "translateX(100%)") : null;
        if (!isActive && !isPrev) return null;
        return (
          <div key={game.id} style={{
            position:"absolute", inset:0, width:"100%", height:"100%",
            transition: isActive ? "transform .45s cubic-bezier(.4,0,.2,1)" : "transform .45s cubic-bezier(.4,0,.2,1)",
            transform: isActive ? "translateX(0)" : (slideOut || "translateX(0)"),
            animation: isActive ? `slideInBanner${dir > 0 ? "R" : "L"} .45s cubic-bezier(.4,0,.2,1)` : undefined,
          }}>
            <Cover game={game} style={{ width:"100%", height:"100%", display:"block" }}/>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(115deg,rgba(10,10,20,.92) 0%,rgba(10,10,20,.55) 45%,transparent 100%)" }}/>
          </div>
        );
      })}

      {/* Content overlay */}
      <div style={{ position:"absolute", bottom:0, left:0, padding:"clamp(16px,3vw,30px) clamp(18px,3.5vw,36px)", maxWidth:540, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9, flexWrap:"wrap" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"var(--p)", color:"#fff", fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20, letterSpacing:".8px", fontFamily:"var(--fd)" }}>
            <Icon n="star" s={8}/> FEATURED
          </div>
          {g.creatorPlan && PLANS[g.creatorPlan]?.badge && (
            <span style={{ fontSize:9, fontWeight:800, padding:"3px 9px", borderRadius:20, background:PLANS[g.creatorPlan].color, color:"#fff", letterSpacing:.5 }}>
              {PLANS[g.creatorPlan].badge}
            </span>
          )}
          <span style={{ fontSize:9, fontWeight:700, padding:"3px 9px", borderRadius:20, background:"rgba(255,255,255,.15)", color:"#fff", backdropFilter:"blur(4px)" }}>
            {g.genre}
          </span>
        </div>
        <div style={{ fontFamily:"var(--fd)", fontSize:"clamp(20px,3.8vw,40px)", fontWeight:800, color:"#fff", lineHeight:1.1, marginBottom:7, textShadow:"0 2px 12px rgba(0,0,0,.4)" }}>
          {g.title}
        </div>
        <div style={{ fontSize:"clamp(11px,1.4vw,13px)", color:"rgba(255,255,255,.78)", marginBottom:16, lineHeight:1.5, display:"var(--desc-display,block)" }}>
          {g.desc}
        </div>
        <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
          <button className="btn-r" onClick={e => { e.stopPropagation(); onPlay(g); }}>
            <Icon n="play" s={12}/>Play Now
          </button>
          <button className="btn-o" onClick={e => { e.stopPropagation(); onView(g); }}>Details</button>
        </div>
      </div>

      {/* Slot indicator top-right */}
      <div style={{ position:"absolute", top:12, right:14, background:"rgba(0,0,0,.4)", backdropFilter:"blur(6px)", borderRadius:10, padding:"4px 10px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,.7)", zIndex:10 }}>
        {idx + 1} / {total}
      </div>

      {/* Prev / Next arrows */}
      {total > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); back(); }}
            style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,.15)", backdropFilter:"blur(8px)", border:"1.5px solid rgba(255,255,255,.25)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", transition:"all .18s", zIndex:10 }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.28)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.15)"}>
            <Icon n="cL" s={16}/>
          </button>
          <button onClick={e => { e.stopPropagation(); advance(); }}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,.15)", backdropFilter:"blur(8px)", border:"1.5px solid rgba(255,255,255,.25)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", transition:"all .18s", zIndex:10 }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.28)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.15)"}>
            <Icon n="cR" s={16}/>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", display:"flex", gap:6, zIndex:10 }}>
          {games.map((_, i) => (
            <div key={i} onClick={e => { e.stopPropagation(); goTo(i, i > idx ? 1 : -1); }}
              style={{ width: i === idx ? 22 : 7, height:7, borderRadius:4, background: i === idx ? "#fff" : "rgba(255,255,255,.35)", cursor:"pointer", transition:"all .3s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }}/>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideInBannerR { from { transform:translateX(100%) } to { transform:translateX(0) } }
        @keyframes slideInBannerL { from { transform:translateX(-100%) } to { transform:translateX(0) } }
      `}</style>
    </div>
  );
}

function HomePage({ games, favs, toggleFav, onView, onPlay, go }) {
  const approved = games.filter(g => g.approvalStatus === "approved");

  // Featured: games with featuredSlot set, sorted by slot number
  const featuredGames = approved
    .filter(g => g.featured && g.featuredSlot)
    .sort((a, b) => (a.featuredSlot || 99) - (b.featuredSlot || 99));

  // Fallback: if no slots assigned but some are featured, use them in any order
  const legacyFeat = approved.filter(g => g.featured && !g.featuredSlot);
  const allFeatured = [...featuredGames, ...legacyFeat].slice(0, 5);

  // Boosted score: plays × plan boost multiplier (Studio always tops)
  const popular = approved
    .filter(g => g.plays > 0 || (g.boostScore || 1) > 1)
    .sort((a, b) => {
      const scoreA = (a.plays || 0) * (a.boostScore || 1);
      const scoreB = (b.plays || 0) * (b.boostScore || 1);
      const baseA  = (PLANS[a.creatorPlan || "free"].id === "studio" ? 10000 : 0) + scoreA;
      const baseB  = (PLANS[b.creatorPlan || "free"].id === "studio" ? 10000 : 0) + scoreB;
      return baseB - baseA;
    }).slice(0, 8);

  const newest = [...approved].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  if (!approved.length) return (
    <div className="pg">
      <div className="empty" style={{ paddingTop: 80 }}>
        <div className="empty-i">🎮</div>
        <div className="empty-t">No games yet</div>
        <div className="empty-s">Be the first creator to publish a game!</div>
        <button className="btn-r btn-sm" style={{ margin:"18px auto 0", justifyContent:"center" }} onClick={() => go("all-games")}>Browse All</button>
      </div>
    </div>
  );

  return (
    <div className="pg">
      {/* Rotating Featured Banners */}
      {allFeatured.length > 0
        ? <FeaturedBanner games={allFeatured} onView={onView} onPlay={onPlay}/>
        : approved[0] && (
          <FeaturedBanner games={[approved[0]]} onView={onView} onPlay={onPlay}/>
        )
      }

      {popular.length > 0 && (<><div className="sec-h"><div className="sec-t">🔥 Popular</div></div><Carousel games={popular} favs={favs} toggleFav={toggleFav} onView={onView}/><div className="div"/></>)}
      {newest.length > 0 && (<><div className="sec-h"><div className="sec-t">✨ New Arrivals</div></div><Carousel games={newest} favs={favs} toggleFav={toggleFav} onView={onView}/></>)}
    </div>
  );
}

function RecentPage({ games, favs, toggleFav, onView }) {
  const approved = games.filter(g => g.approvalStatus === "approved");
  const byC = [...approved].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  const byU = [...approved].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);
  return (
    <div className="pg">
      <div className="pg-t">Recent Games</div>
      <div className="pg-s">Freshly added & recently updated</div>
      {byC.length === 0 ? (
        <div className="empty"><div className="empty-i">🕐</div><div className="empty-t">No games yet</div></div>
      ) : (
        <>
          <div className="sec-h"><div className="sec-t">🆕 Recently Added</div></div>
          <div className="gg" style={{ marginBottom: 24 }}>
            {byC.map(g => <GameCard key={g.id} g={g} fav={favs.includes(g.id)} toggleFav={toggleFav} onView={onView}/>)}
          </div>
          {byU.length > 0 && (<><div className="sec-h"><div className="sec-t">🔄 Recently Updated</div></div><div className="gg">{byU.map(g => <GameCard key={g.id} g={g} fav={favs.includes(g.id)} toggleFav={toggleFav} onView={onView}/>)}</div></>)}
        </>
      )}
    </div>
  );
}

function AllGamesPage({ games, favs, toggleFav, onView }) {
  const [f, setF] = useState({ s: "", genre: "", mode: "", platform: "", price: "", status: "", style: "" });
  const approved  = useMemo(() => games.filter(g => g.approvalStatus === "approved"), [games]);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const clr = () => setF({ s: "", genre: "", mode: "", platform: "", price: "", status: "", style: "" });
  const ac  = Object.values(f).filter(Boolean).length;

  const list = useMemo(() => approved.filter(g => {
    const q = f.s.toLowerCase();
    if (q && !g.title.toLowerCase().includes(q) && !g.genre.toLowerCase().includes(q) && !g.desc.toLowerCase().includes(q)) return false;
    if (f.genre    && g.genre    !== f.genre)    return false;
    if (f.mode     && g.mode     !== f.mode)     return false;
    if (f.platform && g.platform !== f.platform) return false;
    if (f.price    && g.price    !== f.price)    return false;
    if (f.status   && g.status   !== f.status)   return false;
    if (f.style    && g.style    !== f.style)    return false;
    return true;
  }), [approved, f]);

  return (
    <div className="pg">
      <div className="pg-t">All Games</div>
      <div className="pg-s">Browse the complete library</div>
      <div className="fp">
        <div className="fr" style={{ marginBottom: 9 }}>
          <input className="f-inp" placeholder="🔍 Search by title, genre, description…" value={f.s} onChange={e => set("s", e.target.value)} style={{ flex: 2 }}/>
          {ac > 0 && <button className="clr" onClick={clr}>Clear ({ac})</button>}
        </div>
        <div className="fr">
          {[["genre","GENRE",GENRES],["mode","MODE",MODES],["platform","PLATFORM",PLATFORMS],["price","PRICE",PRICES],["status","STATUS",STATUSES],["style","STYLE",VSTYLES]].map(([k,l,opts]) => (
            <div className="fg" key={k}>
              <label className="fl">{l}</label>
              <select className="fsel" value={f[k]} onChange={e => set(k, e.target.value)}>
                <option value="">All</option>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12, fontSize: 11, color: "var(--t2)", fontWeight: 700 }}>{list.length} game{list.length !== 1 ? "s" : ""} found</div>
      {list.length === 0
        ? <div className="empty"><div className="empty-i">🎮</div><div className="empty-t">No games found</div><div className="empty-s">Adjust your filters</div></div>
        : <div className="gg">{list.map(g => <GameCard key={g.id} g={g} fav={favs.includes(g.id)} toggleFav={toggleFav} onView={onView}/>)}</div>
      }
    </div>
  );
}

function LibraryPage({ games, favs, played, toggleFav, onView }) {
  const [tab, setTab] = useState("fav");
  const approved = games.filter(g => g.approvalStatus === "approved");
  const fl = approved.filter(g => favs.includes(g.id));
  const pl = approved.filter(g => played.includes(g.id));
  const list = tab === "fav" ? fl : pl;
  return (
    <div className="pg">
      <div className="pg-t">My Library</div>
      <div className="pg-s">Your saved and played games</div>
      <div className="tabs">
        <button className={`tab${tab === "fav" ? " on" : ""}`} onClick={() => setTab("fav")}>❤️ Favorites ({fl.length})</button>
        <button className={`tab${tab === "played" ? " on" : ""}`} onClick={() => setTab("played")}>🎮 Played ({pl.length})</button>
      </div>
      {list.length === 0
        ? <div className="empty"><div className="empty-i">{tab === "fav" ? "💔" : "🎮"}</div><div className="empty-t">{tab === "fav" ? "No favorites yet" : "No games played yet"}</div><div className="empty-s">{tab === "fav" ? "Heart a game to save it here" : "Click Play on any game to track it"}</div></div>
        : <div className="gg">{list.map(g => <GameCard key={g.id} g={g} fav={favs.includes(g.id)} toggleFav={toggleFav} onView={onView}/>)}</div>
      }
    </div>
  );
}

/* ── Emoji Picker ── */
const EMOJI_CATS = {
  "😀 Smileys": ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔","😕","🙃","🤑","😲","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","🤠","🥳","😷","🤒","🤕","🤧","🥴","🤢","🤮"],
  "👋 Gestures": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🙏","✍","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","👀","👁","👅","👄","🫀","🫁","🦷","🦴"],
  "❤️ Hearts":  ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️"],
  "🎮 Gaming":  ["🎮","🕹️","👾","🎯","🎲","🃏","🎴","🀄","🎰","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎫","🎟️","🎪","🤹","🎭","🎨","🖼️","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🏹","🛡️","⚔️","🗡️","🔫","💣","🧨","🪓","🔪","🗺️"],
  "🔥 Popular": ["🔥","💯","✨","⭐","🌟","💫","⚡","🎉","🎊","🎈","🎀","🎁","🏖️","🚀","👑","💎","🦄","🍕","🍔","🍟","🌮","🌯","🥗","🍜","🍱","🍣","🍦","🎂","🍰","🧁","🍫","🍬","🍭","🥤","🧋","☕","🍺","🍻","🥂","🍷","🍸","🍹","💊","🧪","🔮","🎱","💸","💰","🤑"],
};

function EmojiPicker({ onSelect, onClose }) {
  const [cat, setCat] = useState(Object.keys(EMOJI_CATS)[0]);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position:"absolute", bottom:"calc(100% + 8px)", left:0,
      background:"var(--card)", borderRadius:16,
      boxShadow:"var(--shadow)", zIndex:200,
      width: 300, maxWidth:"calc(100vw - 32px)",
      overflow:"hidden", animation:"slideUp .2s ease",
    }}>
      {/* Category tabs */}
      <div style={{ display:"flex", overflowX:"auto", padding:"8px 8px 0", gap:4, scrollbarWidth:"none" }}>
        {Object.keys(EMOJI_CATS).map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            flexShrink:0, padding:"5px 10px", borderRadius:10, border:"none", cursor:"pointer",
            background: cat === c ? "rgba(255,77,109,.12)" : "var(--bg)",
            color: cat === c ? "var(--p)" : "var(--t2)",
            fontSize:11, fontWeight:700,
            boxShadow: cat === c ? "var(--shadow-in)" : "var(--shadow-sm)",
            transition:"all .15s",
          }}>
            {c.split(" ")[0]}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:2, padding:10, maxHeight:200, overflowY:"auto" }}>
        {EMOJI_CATS[cat].map(e => (
          <button key={e} onClick={() => onSelect(e)} style={{
            background:"none", border:"none", fontSize:22, cursor:"pointer",
            padding:"4px 2px", borderRadius:8, lineHeight:1,
            transition:"transform .1s",
          }}
          onMouseEnter={el => el.currentTarget.style.transform="scale(1.3)"}
          onMouseLeave={el => el.currentTarget.style.transform="scale(1)"}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

function GroupsPage({ groups, setGroups, joined, setJoined, user, showToast, games }) {
  const [sel, setSel]             = useState(null);
  const [msgs, setMsgs]           = useState(() => LS.get("gder_chat", {}));
  const [chatInp, setChatInp]     = useState("");
  const [typing, setTyping]       = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showFind, setShowFind]   = useState(false);
  const [gsearch, setGsearch]     = useState("");
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const chatRef   = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [scrollTrigger, sel]);

  const toggleJoin = id => {
    const next = joined.includes(id) ? joined.filter(g => g !== id) : [...joined, id];
    setJoined(next);
    LS.set("gder_joined", next);
    showToast(joined.includes(id) ? "Left group" : "Joined group!");
  };

  const sendMsg = () => {
    if (!chatInp.trim() || !sel) return;
    const key  = `g${sel}`;
    const msg  = { id: Date.now(), uid: user.id, user: user.username, text: chatInp.trim(), time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }), av: user.username.slice(0, 2).toUpperCase() };
    const next = { ...msgs, [key]: [...(msgs[key] || []), msg] };
    setMsgs(next);
    LS.set("gder_chat", next);
    setChatInp("");
    setScrollTrigger(t => t + 1);
    setTyping(true);
    setTimeout(() => setTyping(false), 2000);
  };

  const insertEmoji = emoji => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? chatInp.length;
      const end   = input.selectionEnd   ?? chatInp.length;
      const next  = chatInp.slice(0, start) + emoji + chatInp.slice(end);
      setChatInp(next);
      // Restore cursor position after emoji
      setTimeout(() => {
        input.focus();
        const pos = start + emoji.length;
        input.setSelectionRange(pos, pos);
      }, 0);
    } else {
      setChatInp(p => p + emoji);
    }
  };

  const myGroup = groups.find(g => g.creatorId === user.id);

  const createGroup = form => {
    if (myGroup) {
      showToast("You already own a group — dissolve it first to create a new one", true);
      return;
    }
    const vis = pickVisual(groups.length);
    const ng  = { ...form, id: Date.now(), members: 1, creatorId: user.id, ...vis };
    const next = [...groups, ng];
    setGroups(next);
    LS.set("gder_groups", next);
    setShowCreate(false);
    showToast("Group created!");
  };

  const deleteGroup = (e, id) => {
    e.stopPropagation();
    // Direct action — button label is the confirmation
    const next = groups.filter(g => g.id !== id);
    setGroups(next);
    LS.set("gder_groups", next);
    // Remove all members from joined list
    const nextJoined = joined.filter(j => j !== id);
    setJoined(nextJoined);
    LS.set("gder_joined", nextJoined);
    // Clear chat history
    const allChats = LS.get("gder_chat", {});
    delete allChats[`g${id}`];
    LS.set("gder_chat", allChats);
    if (sel === id) setSel(null);
    showToast("Group dissolved");
  };

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(gsearch.toLowerCase()) ||
    (g.game || "").toLowerCase().includes(gsearch.toLowerCase())
  );

  const selGrp = groups.find(g => g.id === sel);

  return (
    <div className="pg">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
        <div className="pg-t" style={{ marginBottom: 0 }}>Groups</div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="btn-o btn-sm" onClick={() => setShowFind(!showFind)}>🔍 Find Players</button>
          {myGroup
            ? <button className="btn-o btn-sm" style={{ color:"var(--t2)", cursor:"default" }} title="Dissolve your current group first">🔒 1 group max</button>
            : <button className="btn-r btn-sm" onClick={() => setShowCreate(true)}><Icon n="plus" s={12}/>Create</button>
          }
        </div>
      </div>
      <div className="pg-s">Join communities & find players</div>

      {showFind && <FindPlayersPanel user={user} games={games.filter(g => g.approvalStatus === "approved")} showToast={showToast}/>}

      <input className="f-inp" placeholder="Search groups…" value={gsearch} onChange={e => setGsearch(e.target.value)} style={{ width: "100%", marginBottom: 14 }}/>

      {filtered.length === 0 ? (
        <div className="empty"><div className="empty-i">👥</div><div className="empty-t">No groups yet</div><div className="empty-s">Create the first one!</div></div>
      ) : (
        <div className="g-grid">
          {filtered.map(g => (
            <div className="grp" key={g.id} onClick={() => setSel(g.id === sel ? null : g.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `hsl(${(g.id * 47) % 360},48%,28%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🎮</div>
                <div className="grp-name" style={{ marginBottom: 0, flex: 1 }}>{g.name}</div>
                {g.vis === "private" && <Icon n="lock" s={12}/>}
                {g.creatorId === user.id && (
                  <button
                    onClick={e => deleteGroup(e, g.id)}
                    style={{
                      fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:8,
                      background:"rgba(239,68,68,.1)", color:"#ef4444",
                      border:"1px solid rgba(239,68,68,.22)", cursor:"pointer",
                      flexShrink:0, fontFamily:"var(--fd)",
                      transition:"background .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,.2)"}
                    onMouseLeave={e => e.currentTarget.style.background="rgba(239,68,68,.1)"}
                    title="Dissolve this group">
                    Dissolve
                  </button>
                )}
              </div>
              <div className="grp-tags">
                {g.game && <span className="tag tA">{g.game}</span>}
                {g.platform && <span className="tag tB">{g.platform}</span>}
              </div>
              <div className="grp-desc">{g.desc}</div>
              <div className="grp-ft">
                <div className="grp-pl">👥 {g.members + (joined.includes(g.id) ? 1 : 0)} · {g.playersNeeded} needed</div>
                {joined.includes(g.id) ? (
                  <button
                    className="join ok"
                    onClick={e => { e.stopPropagation(); toggleJoin(g.id); }}
                    style={{ background:"rgba(239,68,68,.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,.25)" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,.22)"}
                    onMouseLeave={e => e.currentTarget.style.background="rgba(239,68,68,.1)"}>
                    🚪 Leave
                  </button>
                ) : (
                  <button className="join" onClick={e => { e.stopPropagation(); toggleJoin(g.id); }}>
                    Join
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sel && selGrp && (
        <>
          <div className="sec-h">
            <div className="sec-t">💬 {selGrp.name}</div>
            <button className="ghost" onClick={() => setSel(null)}><Icon n="x" s={15}/></button>
          </div>
          <div className="chat">
            <div className="chat-msgs" ref={chatRef}>
              {(msgs[`g${sel}`] || []).length === 0 && (
                <div style={{ textAlign: "center", color: "var(--t2)", fontSize: 12, padding: "20px 0" }}>No messages yet. Say hello! 👋</div>
              )}
              {(msgs[`g${sel}`] || []).map(m => (
                <div className={`chat-msg${m.uid === user.id ? " chat-own" : ""}`} key={m.id}>
                  <div className="chat-av" style={{ background: `hsl(${m.user.charCodeAt(0) * 13 % 360},50%,35%)` }}>{m.av}</div>
                  <div className="chat-bbl">
                    <div className="chat-meta"><span className="chat-u">{m.user}</span><span className="chat-tm">{m.time}</span></div>
                    <div className="chat-txt">{m.text}</div>
                  </div>
                </div>
              ))}
              {typing && <div className="chat-typing">Someone is typing…</div>}
            </div>
            <div className="chat-ia" style={{ position:"relative" }}>
              {showEmoji && (
                <EmojiPicker
                  onSelect={e => { insertEmoji(e); }}
                  onClose={() => setShowEmoji(false)}
                />
              )}
              <button
                onClick={() => setShowEmoji(v => !v)}
                style={{
                  width:36, height:36, borderRadius:10, border:"none",
                  background: showEmoji ? "rgba(255,77,109,.12)" : "var(--bg)",
                  cursor:"pointer", fontSize:20, display:"flex", alignItems:"center",
                  justifyContent:"center", flexShrink:0,
                  boxShadow:"var(--shadow-sm)", transition:"all .15s",
                  color: showEmoji ? "var(--p)" : "var(--t2)",
                }}
                title="Emoji">
                😊
              </button>
              <input
                ref={inputRef}
                className="chat-in"
                placeholder="Type a message…"
                value={chatInp}
                onChange={e => setChatInp(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              />
              <button className="chat-snd" onClick={sendMsg}><Icon n="send" s={14}/></button>
            </div>
          </div>
        </>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={createGroup} games={games.filter(g => g.approvalStatus === "approved")}/>}
    </div>
  );
}

function FindPlayersPanel({ user, games, showToast }) {
  const [form, setForm]     = useState(() => {
    // Pre-fill from existing lookup if any
    const saved = LS.get("gder_lookups", []).find(l => l.userId === user.id);
    return saved
      ? { game: saved.game, platform: saved.platform, players: saved.players, desc: saved.desc }
      : { game: "", platform: "", players: 2, desc: "" };
  });
  const [lookups, setLookups] = useState(() => LS.get("gder_lookups", []));
  const [active,  setActive]  = useState(() => !!LS.get("gder_lookups", []).find(l => l.userId === user.id));

  // Save lookup instantly on any field change
  const update = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (next.game) {
      const entry  = { ...next, id: Date.now(), userId: user.id, username: user.username, ts: Date.now() };
      const nextAll = [entry, ...LS.get("gder_lookups", []).filter(l => l.userId !== user.id)];
      setLookups(nextAll);
      LS.set("gder_lookups", nextAll);
      setActive(true);
    }
  };

  const retract = () => {
    const nextAll = LS.get("gder_lookups", []).filter(l => l.userId !== user.id);
    setLookups(nextAll);
    LS.set("gder_lookups", nextAll);
    setActive(false);
    setForm({ game: "", platform: "", players: 2, desc: "" });
    showToast("Lookup removed");
  };

  const recent = lookups.filter(l => l.userId !== user.id && Date.now() - l.ts < 86400000);
  const myEntry = lookups.find(l => l.userId === user.id);
  const colors  = ["#6366F1","#8B5CF6","#EC4899","#f59e0b","#10b981","#3b82f6"];

  return (
    <div style={{ background:"var(--card)", borderRadius:16, padding:18, marginBottom:18, boxShadow:"var(--shadow-sm)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:700, color:"var(--txt)" }}>
          🔍 Find Players
          {active && <span style={{ marginLeft:8, fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, background:"rgba(16,185,129,.12)", color:"#10b981" }}>LIVE</span>}
        </div>
        {active && (
          <button onClick={retract} style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:8, background:"rgba(239,68,68,.1)", color:"#ef4444", border:"none", cursor:"pointer", fontFamily:"var(--fd)" }}>
            Remove
          </button>
        )}
      </div>

      <div className="fm-r">
        <div className="fm-g">
          <label className="fm-l">GAME {!form.game && <span style={{color:"var(--p)"}}>*</span>}</label>
          <input
            className="fm-i"
            placeholder="Type a game name…"
            value={form.game}
            onChange={e => update("game", e.target.value)}
            style={{ borderColor: active ? "rgba(16,185,129,.4)" : undefined }}
          />
        </div>
        <div className="fm-g">
          <label className="fm-l">PLATFORM</label>
          <select className="fm-s" value={form.platform} onChange={e => update("platform", e.target.value)}>
            <option value="">Any</option>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="fm-g">
          <label className="fm-l">PLAYERS NEEDED</label>
          <input className="fm-i" type="number" min={1} max={20} value={form.players}
            onChange={e => update("players", +e.target.value)}/>
        </div>
      </div>

      <div className="fm-g">
        <label className="fm-l">MESSAGE <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></label>
        <textarea className="fm-ta"
          placeholder="Tell players about yourself… Changes are saved instantly."
          value={form.desc}
          onChange={e => update("desc", e.target.value)}
          style={{ minHeight:52 }}
        />
      </div>

      {!form.game && (
        <div style={{ fontSize:11, color:"var(--t2)", marginTop:4 }}>
          💡 Enter a game name — your lookup posts <strong>instantly</strong> and stays live for 24h
        </div>
      )}

      {/* My current lookup preview */}
      {myEntry && (
        <div style={{ marginTop:10, padding:"9px 12px", background:"rgba(16,185,129,.06)", borderRadius:10, border:"1.5px solid rgba(16,185,129,.2)", fontSize:12, color:"var(--t2)" }}>
          ✓ Your lookup is live: <strong style={{color:"var(--txt)"}}>{myEntry.game}</strong> · {myEntry.platform || "Any platform"} · {myEntry.players} needed
        </div>
      )}

      {/* Other players looking */}
      {recent.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontFamily:"var(--fd)", fontSize:12, fontWeight:700, color:"var(--t2)", marginBottom:9, textTransform:"uppercase", letterSpacing:.5 }}>
            Looking for group ({recent.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recent.map((l, i) => (
              <div className="fp-card" key={l.id}>
                <div className="fp-av" style={{ background:colors[i % colors.length] }}>{l.username.slice(0,2).toUpperCase()}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="fp-n">{l.username}</div>
                  <div className="fp-g">{l.game} · {l.platform || "Any"} · {l.players} needed</div>
                  {l.desc && <div style={{ fontSize:11, color:"var(--t2)", marginTop:2 }}>{l.desc}</div>}
                </div>
                <button className="fp-m" onClick={() => showToast("Messaging feature coming soon!")}>Message</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreate, games }) {
  const [f, setF]         = useState({ name: "", game: "", platform: "", playersNeeded: 4, desc: "", vis: "public" });
  const [gameSugg, setGameSugg] = useState([]);
  const h = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Filter suggestions as user types
  const onGameInput = val => {
    h("game", val);
    if (val.trim().length < 1) { setGameSugg([]); return; }
    const q = val.toLowerCase();
    setGameSugg(games.filter(g => g.title.toLowerCase().includes(q)).slice(0, 5));
  };

  return (
    <div className="mo-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo">
        <div className="mo-h"><div className="mo-t">Create Group</div><button className="mo-x" onClick={onClose}><Icon n="x" s={14}/></button></div>

        <div className="fm-g"><label className="fm-l">GROUP NAME *</label><input className="fm-i" placeholder="Name your crew…" value={f.name} onChange={e => h("name", e.target.value)}/></div>

        {/* Free text game field with autocomplete */}
        <div className="fm-g" style={{ position:"relative" }}>
          <label className="fm-l">GAME <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0 }}>(93NPC game or any other)</span></label>
          <input
            className="fm-i"
            placeholder="e.g. Minecraft, Fortnite, My 93NPC Game…"
            value={f.game}
            onChange={e => onGameInput(e.target.value)}
            autoComplete="off"
          />
          {gameSugg.length > 0 && (
            <div style={{
              position:"absolute", top:"100%", left:0, right:0, zIndex:50,
              background:"var(--card)", borderRadius:12,
              boxShadow:"var(--shadow)", overflow:"hidden", marginTop:4,
            }}>
              {gameSugg.map(g => (
                <div key={g.id}
                  onClick={() => { h("game", g.title); setGameSugg([]); }}
                  style={{
                    padding:"9px 14px", cursor:"pointer", display:"flex",
                    alignItems:"center", gap:10, fontSize:13,
                    color:"var(--txt)", transition:"background .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--bg2)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <div style={{ width:32, height:20, borderRadius:5, overflow:"hidden", flexShrink:0 }}>
                    <Cover game={g} style={{ width:"100%", height:"100%" }}/>
                  </div>
                  <span style={{ fontWeight:600 }}>{g.title}</span>
                  <span style={{ fontSize:10, color:"var(--t2)", marginLeft:"auto" }}>{g.genre}</span>
                </div>
              ))}
              <div style={{ padding:"7px 14px", fontSize:11, color:"var(--t2)", borderTop:"1px solid var(--bdr)" }}>
                Or keep typing any game name…
              </div>
            </div>
          )}
        </div>

        <div className="fm-r">
          <div className="fm-g">
            <label className="fm-l">PLATFORM</label>
            <select className="fm-s" value={f.platform} onChange={e => h("platform", e.target.value)}>
              <option value="">Any</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="fm-g">
            <label className="fm-l">PLAYERS NEEDED</label>
            <input className="fm-i" type="number" min={1} max={50} value={f.playersNeeded} onChange={e => h("playersNeeded", +e.target.value)}/>
          </div>
        </div>
        <div className="fm-g"><label className="fm-l">DESCRIPTION</label><textarea className="fm-ta" placeholder="What's your group about?" value={f.desc} onChange={e => h("desc", e.target.value)}/></div>
        <div className="fm-g">
          <label className="fm-l">VISIBILITY</label>
          <div className="type-row">
            {[["public","🌐"],["private","🔒"]].map(([v, ic]) => (
              <div key={v} className={`type-btn${f.vis === v ? " sel" : ""}`} onClick={() => h("vis", v)}>
                <div className="type-ico">{ic}</div>
                <div className="type-lbl">{v.charAt(0).toUpperCase() + v.slice(1)}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="fm-sub" disabled={!f.name} onClick={() => f.name && onCreate(f)}>Create Group</button>
      </div>
    </div>
  );
}

function ProfilePage({ user, setUser, favs, played, games, showToast }) {
  const [editing,  setEditing]  = useState(false);
  const [un,       setUn]       = useState(user.username);
  const [bio,      setBio]      = useState(user.bio || "");
  const [showContact, setShowContact] = useState(false);

  const save = () => {
    if (!un.trim()) return;
    const u = { ...user, username: un.trim(), bio: bio.trim() };
    setUser(u);
    LS.set("gder_user", u);
    setEditing(false);
    showToast("Profile updated!");
  };

  const approved = games.filter(g => g.approvalStatus === "approved");
  const fl = approved.filter(g => favs.includes(g.id));
  const pl = approved.filter(g => played.includes(g.id));
  const myGames = games.filter(g => g.creatorId === user.id);

  return (
    <div className="pg">
      <div className="prof-hdr">
        <div className="av-lg">{user.username[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          {editing ? (
            <>
              <div className="fm-g" style={{ marginBottom: 8 }}>
                <label className="fm-l">USERNAME</label>
                <input className="fm-i" value={un} onChange={e => setUn(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}/>
              </div>
              <div className="fm-g" style={{ marginBottom: 8 }}>
                <label className="fm-l">BIO</label>
                <input className="fm-i" value={bio} onChange={e => setBio(e.target.value)} placeholder="A short bio…"/>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-r btn-sm" onClick={save}>Save</button>
                <button className="btn-o btn-sm" onClick={() => { setEditing(false); setUn(user.username); setBio(user.bio || ""); }}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="pf-u">{user.username}</div>
              <div className="pf-r">{user.role.toUpperCase()}</div>
              {user.bio && <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 8 }}>{user.bio}</div>}
              <div style={{ fontSize: 11, color: "var(--t2)", marginBottom: 10 }}>{user.email}</div>
              <div className="pf-stats">
                <div><div className="ps-v">{fl.length}</div><div className="ps-l">Favorites</div></div>
                <div><div className="ps-v">{pl.length}</div><div className="ps-l">Played</div></div>
                {user.role === "creator" && <div><div className="ps-v">{myGames.length}</div><div className="ps-l">Published</div></div>}
              </div>
            </>
          )}
        </div>
        {!editing && (
          <div style={{ display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
            <button className="btn-o btn-sm" onClick={() => setEditing(true)}><Icon n="edit" s={12}/> Edit</button>
            <button className="btn-o btn-sm" style={{ fontSize:11 }} onClick={() => setShowContact(true)}>✉️ Contact</button>
          </div>
        )}
      </div>

      <div className="sg">
        <div className="sc"><div className="sc-n">{pl.length * 3}h</div><div className="sc-l">Hours Played</div></div>
        <div className="sc"><div className="sc-n">{fl.length}</div><div className="sc-l">Favorites</div></div>
        <div className="sc"><div className="sc-n">{new Date(user.createdAt).toLocaleDateString("en",{month:"short",year:"numeric"})}</div><div className="sc-l">Member Since</div></div>
        {user.role === "creator" && <div className="sc"><div className="sc-n">{myGames.filter(g=>g.approvalStatus==="approved").reduce((a,g)=>a+g.plays,0).toLocaleString()}</div><div className="sc-l">Total Plays</div></div>}
      </div>

      {fl.length > 0 && (
        <>
          <div className="sec-h"><div className="sec-t">❤️ Favorites</div></div>
          <div className="gg" style={{ marginBottom: 24 }}>
            {fl.slice(0, 4).map(g => (
              <div key={g.id} className="gc">
                <div className="gc-cover"><Cover game={g} style={{ width: "100%", height: "100%" }}/></div>
                <div className="gc-body"><div className="gc-title">{g.title}</div><div className="gc-tags"><span className="tag tA">{g.genre}</span></div></div>
              </div>
            ))}
          </div>
        </>
      )}

      {showContact && (
        <ContactModal user={user} onClose={() => setShowContact(false)} showToast={showToast}/>
      )}
    </div>
  );
}

/* ── Contact Modal ── */
function ContactModal({ user, onClose, showToast }) {
  const SUBJECTS = [
    "Report a problem",
    "Appeal a rejected game",
    "Account issue",
    "Inappropriate content",
    "Request verification",
    "Billing / Premium plan",
    "Other",
  ];
  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const send = () => {
    if (!subject)          return showToast("Please select a subject", true);
    if (!message.trim())   return showToast("Please write a message", true);
    if (message.trim().length < 20) return showToast("Message too short (min 20 characters)", true);
    setLoading(true);
    // Save to localStorage (→ replace with DB.createContactMessage() once on Supabase)
    const tickets = LS.get("gder_contact", []);
    tickets.push({
      id:        Date.now(),
      userId:    user.id,
      username:  user.username,
      email:     user.email,
      subject,
      message:   message.trim(),
      status:    "open",
      date:      new Date().toLocaleDateString("en", { day:"numeric", month:"short", year:"numeric" }),
      createdAt: new Date().toISOString(),
    });
    LS.set("gder_contact", tickets);
    setTimeout(() => { setLoading(false); setSent(true); }, 700);
  };

  return (
    <div className="mo-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo" style={{ maxWidth: 500 }}>
        <div className="mo-h">
          <div className="mo-t">✉️ Contact Support</div>
          <button className="mo-x" onClick={onClose}><Icon n="x" s={14}/></button>
        </div>

        {sent ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:48, marginBottom:14 }}>✅</div>
            <div style={{ fontFamily:"var(--fd)", fontSize:20, fontWeight:800, color:"var(--txt)", marginBottom:8 }}>
              Message Sent!
            </div>
            <div style={{ fontSize:13, color:"var(--t2)", lineHeight:1.6, marginBottom:24 }}>
              Our team will get back to you as soon as possible.<br/>
              Replies will be sent to <strong style={{color:"var(--txt)"}}>{user.email}</strong>
            </div>
            <button className="btn-r" style={{ margin:"0 auto", justifyContent:"center" }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Sender info */}
            <div style={{
              display:"flex", alignItems:"center", gap:11, padding:"11px 14px",
              background:"var(--bg)", borderRadius:12, marginBottom:18,
              boxShadow:"var(--shadow-in)",
            }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,var(--p),#FF8FA3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--fd)", fontWeight:800, fontSize:16, color:"#fff", flexShrink:0 }}>
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--txt)" }}>{user.username}</div>
                <div style={{ fontSize:11, color:"var(--t2)" }}>{user.email}</div>
              </div>
              <div style={{ marginLeft:"auto" }}>
                <span style={{ fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, background:"var(--p)", color:"#fff" }}>
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Subject */}
            <div className="fm-g">
              <label className="fm-l">SUBJECT *</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {SUBJECTS.map(s => (
                  <button key={s} onClick={() => setSubject(s)} style={{
                    padding:"6px 12px", borderRadius:20, border:"none", cursor:"pointer",
                    fontSize:11, fontWeight:700, transition:"all .15s",
                    background: subject === s ? "var(--p)"   : "var(--bg)",
                    color:      subject === s ? "#fff"        : "var(--t2)",
                    boxShadow:  subject === s ? "0 3px 10px rgba(255,77,109,.28)" : "var(--shadow-sm)",
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="fm-g" style={{ marginTop:14 }}>
              <label className="fm-l">MESSAGE * <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(min 20 characters)</span></label>
              <textarea
                className="fm-ta"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue or question in detail…"
                style={{ minHeight:110 }}
              />
              <div style={{ fontSize:10, color: message.length < 20 && message.length > 0 ? "var(--p)" : "var(--t2)", textAlign:"right", marginTop:3 }}>
                {message.length} characters{message.length > 0 && message.length < 20 ? ` — ${20 - message.length} more needed` : ""}
              </div>
            </div>

            <div style={{ fontSize:11, color:"var(--t2)", marginBottom:14, padding:"9px 12px", background:"var(--bg)", borderRadius:9, lineHeight:1.5 }}>
              📬 Your message will be reviewed by our admin or moderation team. Average response time: 24–48h.
            </div>

            <button className="fm-sub" disabled={loading || !subject || message.trim().length < 20} onClick={send}>
              {loading ? "Sending…" : "Send Message"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SettingsPage({ user, setUser, showToast, onLogout }) {
  const [pw,      setPw]      = useState({ cur: "", n: "", c: "" });
  const [tog,     setTog]     = useState(() => LS.get("gder_prefs", { notifs: true, sound: true, priv: false }));
  const [confirmCreator, setConfirmCreator] = useState(false);
  const [confirmPlayer,  setConfirmPlayer]  = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  const t = k => {
    const next = { ...tog, [k]: !tog[k] };
    setTog(next);
    LS.set("gder_prefs", next);
    showToast("Setting updated");
  };

  const changePw = () => {
    if (!pw.cur || !pw.n || !pw.c) return showToast("Fill all password fields", true);
    if (pw.cur !== user.password) return showToast("Current password incorrect", true);
    if (pw.n.length < 6) return showToast("New password must be 6+ characters", true);
    if (pw.n !== pw.c) return showToast("New passwords don't match", true);
    const u = { ...user, password: pw.n };
    setUser(u);
    LS.set("gder_user", u);
    const users = LS.get("gder_users", []);
    LS.set("gder_users", users.map(x => x.id === u.id ? u : x));
    setPw({ cur: "", n: "", c: "" });
    showToast("Password changed!");
  };

  const deleteAccount = () => {
    const users = LS.get("gder_users", []).filter(x => x.id !== user.id);
    LS.set("gder_users", users);
    LS.del("gder_user");
    onLogout();
  };

  const becomeCreator = () => {
    const u = { ...user, role: "creator", plan: "free" };
    setUser(u);
    LS.set("gder_user", u);
    const users = LS.get("gder_users", []);
    LS.set("gder_users", users.map(x => x.id === u.id ? u : x));
    setConfirmCreator(false);
    showToast("🎉 Creator activated! Go to Studio → upgrade to Creator+ to unlock all features.");
  };

  const becomePlayer = () => {
    const u = { ...user, role: "player" };
    setUser(u);
    LS.set("gder_user", u);
    const users = LS.get("gder_users", []);
    LS.set("gder_users", users.map(x => x.id === u.id ? u : x));
    setConfirmPlayer(false);
    showToast("Switched to Player account.");
  };

  return (
    <div className="pg">
      <div className="pg-t">Settings</div>
      <div className="pg-s">Manage your account & preferences</div>

      {/* Account type switch */}
      <div className="ss" style={{ borderColor: user.role === "creator" ? "rgba(99,102,241,.25)" : "rgba(255,77,109,.2)", background: user.role === "creator" ? "rgba(99,102,241,.04)" : "rgba(255,77,109,.03)" }}>
        <div className="ss-t" style={{ color: user.role === "creator" ? "#6366F1" : "var(--p)" }}>
          {user.role === "creator" ? "🛠️ Creator Account" : "🎮 Player Account"}
        </div>
        <div className="ss-r" style={{ border:"none", paddingBottom:0 }}>
          <div style={{ flex:1 }}>
            <div className="ss-l">{user.role === "creator" ? "You are a Creator" : user.role === "moderator" ? "You are a Moderator" : user.role === "admin" ? "You are an Admin" : "Become a Creator"}</div>
            <div className="ss-v">
              {user.role === "creator"
                ? "Publish games, manage your studio, earn visibility boosts"
                : "Free to activate — publish your own games on 93NPC"}
            </div>
          </div>
          {user.role === "player" ? (
            confirmCreator ? (
              <div style={{ display:"flex", flexDirection:"column", gap:7, alignItems:"flex-end" }}>
                <div style={{ fontSize:11, color:"var(--t2)", textAlign:"right", maxWidth:180 }}>
                  You'll keep all your data and can still play games.
                </div>
                <div style={{ display:"flex", gap:7 }}>
                  <button className="btn-o btn-sm" style={{ fontSize:11 }} onClick={() => setConfirmCreator(false)}>Cancel</button>
                  <button className="btn-r btn-sm" onClick={becomeCreator}>✓ Confirm</button>
                </div>
              </div>
            ) : (
              <button className="btn-r btn-sm" style={{ flexShrink:0 }} onClick={() => setConfirmCreator(true)}>
                🛠️ Activate
              </button>
            )
          ) : (
            confirmPlayer ? (
              <div style={{ display:"flex", flexDirection:"column", gap:7, alignItems:"flex-end" }}>
                <div style={{ fontSize:11, color:"var(--t2)", textAlign:"right", maxWidth:180 }}>
                  Your published games will remain visible.
                </div>
                <div style={{ display:"flex", gap:7 }}>
                  <button className="btn-o btn-sm" style={{ fontSize:11 }} onClick={() => setConfirmPlayer(false)}>Cancel</button>
                  <button className="btn-o btn-sm" style={{ fontSize:11, color:"#ef4444" }} onClick={becomePlayer}>✓ Switch</button>
                </div>
              </div>
            ) : (
              <button className="btn-o btn-sm" style={{ flexShrink:0, fontSize:11 }} onClick={() => setConfirmPlayer(true)}>
                Switch to Player
              </button>
            )
          )}
        </div>
        {user.role === "creator" && (
          <div style={{ marginTop:10, padding:"8px 12px", background: isCreatorPlus(user) ? "rgba(255,107,43,.08)" : "rgba(99,102,241,.08)", borderRadius:10, fontSize:11, color: isCreatorPlus(user) ? "#FF6B2B" : "#6366F1", fontWeight:600 }}>
            {isCreatorPlus(user)
              ? `✓ Creator+ actif · Jeux illimités · 6 images · 2 vidéos · Forum illimité`
              : `✓ Compte créateur (plan gratuit) · 1 jeu · Upgrade pour Creator+`
            }
          </div>
        )}
      </div>

      <div className="ss">
        <div className="ss-t">🔐 Change Password</div>
        <div className="fm-g"><label className="fm-l">CURRENT PASSWORD</label><input className="fm-i" type="password" value={pw.cur} onChange={e => setPw({...pw,cur:e.target.value})} placeholder="Current password"/></div>
        <div className="fm-r">
          <div className="fm-g"><label className="fm-l">NEW PASSWORD</label><input className="fm-i" type="password" value={pw.n} onChange={e => setPw({...pw,n:e.target.value})} placeholder="New password"/></div>
          <div className="fm-g"><label className="fm-l">CONFIRM</label><input className="fm-i" type="password" value={pw.c} onChange={e => setPw({...pw,c:e.target.value})} placeholder="Confirm new"/></div>
        </div>
        <button className="btn-r btn-sm" onClick={changePw}>Update Password</button>
      </div>
      <div className="ss">
        <div className="ss-t">🔔 Preferences</div>
        {[{k:"notifs",l:"Notifications",v:"Get alerts for games & groups"},{k:"sound",l:"Sound Effects",v:"Play UI sounds"},{k:"priv",l:"Private Profile",v:"Hide profile from others"}].map(s => (
          <div className="ss-r" key={s.k}>
            <div><div className="ss-l">{s.l}</div><div className="ss-v">{s.v}</div></div>
            <button className={`tog${tog[s.k] ? " on" : ""}`} onClick={() => t(s.k)}/>
          </div>
        ))}
      </div>
      <div className="ss" style={{ borderColor: "rgba(239,68,68,.28)" }}>
        <div className="ss-t" style={{ color: "#EF4444" }}>⚠️ Danger Zone</div>
        <div className="ss-r">
          <div><div className="ss-l">Delete Account</div><div className="ss-v">Permanently remove all your data</div></div>
          {confirmDelete ? (
            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
              <span style={{ fontSize:11, color:"#ef4444" }}>Sure?</span>
              <button className="btn-o btn-sm" style={{ fontSize:11 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={deleteAccount}>Delete</button>
            </div>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Premium upgrade modal ── */
function PremiumModal({ user, setUser, onClose, showToast }) {
  const [loading, setLoading] = useState(false);
  const already = isCreatorPlus(user);
  const plan = PLANS.creator_plus;

  const upgrade = () => {
    if (already) return onClose();
    setLoading(true);
    setTimeout(() => {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1); // annual
      const u = { ...user, plan: "creator_plus", planExpiry: expiry.toISOString(), role: user.role === "player" ? "creator" : user.role };
      setUser(u);
      LS.set("gder_user", u);
      const users = LS.get("gder_users", []);
      LS.set("gder_users", users.map(x => x.id === u.id ? u : x));
      setLoading(false);
      onClose();
      showToast("🎉 Creator+ activated! Enjoy all features.");
    }, 1200);
  };

  return (
    <div className="mo-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo" style={{ maxWidth: 500 }}>
        <div className="mo-h">
          <div className="mo-t">🟠 Creator+</div>
          <button className="mo-x" onClick={onClose}><Icon n="x" s={14}/></button>
        </div>

        {/* Hero price */}
        <div style={{ textAlign:"center", padding:"20px 0 24px", borderBottom:"1px solid var(--bdr)", marginBottom:20 }}>
          <div style={{ fontSize:42, fontWeight:900, fontFamily:"var(--fd)", color:"#FF6B2B" }}>5,99€</div>
          <div style={{ fontSize:13, color:"var(--t2)", marginTop:4 }}>par mois · sans engagement</div>
          {already && (
            <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,107,43,.12)", color:"#FF6B2B", padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700 }}>
              ✓ Plan actif — renouvellement le {new Date(user.planExpiry || Date.now()).toLocaleDateString("fr",{day:"numeric",month:"long"})}
            </div>
          )}
        </div>

        {/* Features list */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {[
            { icon:"🎮", label:"Jeux illimités", desc:"Publie autant de jeux que tu veux" },
            { icon:"🖼️", label:"6 images par jeu", desc:"Screenshots, artworks, gameplay, maps…" },
            { icon:"🎬", label:"2 vidéos par jeu", desc:"Trailer, gameplay, teaser" },
            { icon:"✅", label:"Badge créateur vérifié", desc:"Visible sur profil, jeux, commentaires, groupes" },
            { icon:"📈", label:"Meilleure visibilité", desc:"+40% boost dans les recommandations" },
            { icon:"🏢", label:"Page studio complète", desc:"Bannière, logo, réseaux sociaux, présentation" },
            { icon:"📊", label:"Statistiques détaillées", desc:"Vues, favoris, clics, joueurs intéressés" },
            { icon:"⚡", label:"Validation prioritaire", desc:"Tes jeux sont vérifiés en priorité par l'admin" },
            { icon:"💬", label:"Forum illimité", desc:"Poster, répondre, annoncer, promouvoir tes jeux" },
          ].map(f => (
            <div key={f.label} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 12px", background:"var(--bg)", borderRadius:12, boxShadow:"var(--shadow-sm)" }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{f.icon}</span>
              <div>
                <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:800, color:"var(--txt)" }}>{f.label}</div>
                <div style={{ fontSize:11, color:"var(--t2)", marginTop:1 }}>{f.desc}</div>
              </div>
              <span style={{ marginLeft:"auto", color:"#10b981", flexShrink:0, fontSize:16 }}>✓</span>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(99,102,241,.08)", borderRadius:12, padding:"10px 14px", fontSize:11, color:"var(--t2)", marginBottom:16, lineHeight:1.6 }}>
          💳 <strong style={{color:"var(--txt)"}}>Demo:</strong> Paiement simulé. Connecter Stripe via Supabase pour la facturation réelle.
        </div>

        <button className="fm-sub" disabled={loading || already} onClick={upgrade}
          style={{ background: already ? undefined : "linear-gradient(135deg,#FF6B2B,#FF8C42)" }}>
          {loading ? "Traitement…" : already ? "✓ Creator+ actif" : "Activer Creator+ — 5,99€/mois"}
        </button>
      </div>
    </div>
  );
}


/* ── Studio Page Editor (Creator+ only) ── */
function StudioPageEditor({ user, setUser, showToast }) {
  const studioKey = `gder_studio_${user.id}`;
  const [studio, setStudio] = useState(() => LS.get(studioKey, {
    name: user.username + "'s Studio",
    bio: "",
    bannerColor: "#FF4D6D",
    links: { twitter:"", itch:"", youtube:"", discord:"", website:"" },
  }));
  const [editing, setEditing] = useState(false);
  const [saved,   setSaved]   = useState(false);

  const saveStudio = () => {
    LS.set(studioKey, studio);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    showToast("Studio page updated!");
    setEditing(false);
  };

  const h = (k, v) => setStudio(p => ({ ...p, [k]: v }));
  const hl = (k, v) => setStudio(p => ({ ...p, links: { ...p.links, [k]: v } }));

  const COLORS = ["#FF4D6D","#6366F1","#F59E0B","#10b981","#3B82F6","#8B5CF6","#EC4899","#0EA5E9","#14B8A6","#F97316"];

  return (
    <div style={{
      background:"var(--card)", borderRadius:18, overflow:"hidden",
      marginBottom:22, boxShadow:"var(--shadow)",
      border:"1.5px solid rgba(255,107,43,.2)",
    }}>
      {/* Studio banner preview */}
      <div style={{ height:80, background:`linear-gradient(135deg,${studio.bannerColor},${studio.bannerColor}88)`, position:"relative", display:"flex", alignItems:"flex-end", padding:"0 18px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"rgba(255,255,255,.2)", border:"2px solid rgba(255,255,255,.4)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--fd)", fontWeight:900, fontSize:22, color:"#fff" }}>
            {studio.name[0]?.toUpperCase()||"?"}
          </div>
          <div>
            <div style={{ fontFamily:"var(--fd)", fontSize:16, fontWeight:800, color:"#fff", textShadow:"0 1px 4px rgba(0,0,0,.3)" }}>{studio.name}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.7)", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ background:"rgba(255,107,43,.9)", fontSize:8, fontWeight:800, padding:"1px 6px", borderRadius:8, color:"#fff" }}>Creator+</span>
              <span>Verified Studio</span>
            </div>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)}
          style={{ position:"absolute", top:10, right:12, background:"rgba(0,0,0,.3)", border:"none", borderRadius:8, padding:"4px 10px", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
          {editing ? "✕ Close" : "✏️ Edit"}
        </button>
      </div>

      {!editing ? (
        /* View mode */
        <div style={{ padding:"14px 18px" }}>
          {studio.bio && <div style={{ fontSize:13, color:"var(--t2)", marginBottom:10, lineHeight:1.6 }}>{studio.bio}</div>}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {Object.entries(studio.links).filter(([,v])=>v).map(([k,v]) => (
              <a key={k} href={v.startsWith("http")?v:`https://${v}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:11, fontWeight:700, padding:"4px 12px", borderRadius:20, background:"var(--bg)", color:"var(--p)", textDecoration:"none", boxShadow:"var(--shadow-sm)" }}>
                {k === "twitter" ? "🐦" : k === "itch" ? "🎮" : k === "youtube" ? "📺" : k === "discord" ? "💬" : "🌐"} {k}
              </a>
            ))}
          </div>
        </div>
      ) : (
        /* Edit mode */
        <div style={{ padding:"16px 18px" }}>
          <div className="fm-g">
            <label className="fm-l">STUDIO NAME</label>
            <input className="fm-i" value={studio.name} onChange={e => h("name", e.target.value)}/>
          </div>
          <div className="fm-g">
            <label className="fm-l">BANNER COLOR</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => h("bannerColor", c)}
                  style={{ width:28, height:28, borderRadius:8, background:c, border: studio.bannerColor===c ? "3px solid var(--txt)" : "2px solid transparent", cursor:"pointer", transition:"all .15s" }}/>
              ))}
            </div>
          </div>
          <div className="fm-g">
            <label className="fm-l">DESCRIPTION</label>
            <textarea className="fm-ta" placeholder="Présente ton studio…" value={studio.bio} onChange={e => h("bio", e.target.value)} style={{ minHeight:70 }}/>
          </div>
          <div className="fm-g">
            <label className="fm-l">RÉSEAUX SOCIAUX</label>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {[["twitter","🐦 Twitter/X"],["itch","🎮 itch.io"],["youtube","📺 YouTube"],["discord","💬 Discord"],["website","🌐 Site web"]].map(([k,label]) => (
                <div key={k} style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--t2)", width:90, flexShrink:0 }}>{label}</span>
                  <input className="fm-i" placeholder={`https://…`} value={studio.links[k]||""} onChange={e => hl(k, e.target.value)} style={{ fontSize:12 }}/>
                </div>
              ))}
            </div>
          </div>
          <button className="btn-r btn-sm" onClick={saveStudio} style={{ width:"100%", justifyContent:"center", background:"linear-gradient(135deg,#FF6B2B,#FF8C42)" }}>
            {saved ? "✓ Saved!" : "Save Studio Page"}
          </button>
        </div>
      )}
    </div>
  );
}


function CreatorPage({ user, setUser, games, setGames, favs, played, showToast }) {
  const [showAdd,     setShowAdd]   = useState(false);
  const [editGame,    setEditGame]  = useState(null);
  const [showPlans,   setShowPlans] = useState(false);
  const plan    = PLANS[user.plan || "free"];
  const mine    = games.filter(g => g.creatorId === user.id);
  const published = mine.filter(g => g.approvalStatus === "approved");
  const pending   = mine.filter(g => g.approvalStatus === "pending");
  const rejected  = mine.filter(g => g.approvalStatus === "rejected");
  const canAdd    = isCreatorPlus(user) ? true : mine.filter(g => g.approvalStatus !== "rejected").length < plan.games;

  // ── Platform-wide stats for creator's games ──
  const myIds       = published.map(g => g.id);
  const totalPlays  = published.reduce((a, g) => a + (g.plays || 0), 0);
  // Favorites: count how many users have favorited my games (from global favs array)
  // favs is the current user's favs — for platform total we read all users' favs
  const allUsers    = LS.get("gder_users", []);
  const allFavs     = LS.get("gder_favs", []);  // current user's favs
  // Count users who played any of creator's games
  const allPlayed   = LS.get("gder_played", []);
  // Since localStorage is per-user, we count creator's games in global played list
  const totalPlayed = myIds.filter(id => allPlayed.includes(id)).length;
  const totalFavs   = myIds.filter(id => allFavs.includes(id)).length;

  // "Currently playing" = plays incremented in the last session (simulate with plays count trend)
  // We track via a hidden timestamp on last play — stored per-game
  const nowMs = Date.now();
  const playingSessions = LS.get("gder_playing", {}); // { gameId: timestamp }
  const currentlyPlaying = myIds.filter(id => {
    const ts = playingSessions[id];
    return ts && (nowMs - ts) < 30 * 60 * 1000; // within last 30 min
  }).length;

  // Per-game stats for the table
  const gameStats = published.map(g => ({
    ...g,
    isFaved:   allFavs.includes(g.id),
    isPlayed:  allPlayed.includes(g.id),
    isPlaying: playingSessions[g.id] && (nowMs - playingSessions[g.id]) < 30 * 60 * 1000,
  }));

  const submitGame = form => {
    const vis = pickVisual(games.length);
    const ng  = {
      ...form,
      id: Date.now(),
      creatorId: user.id,
      creatorName: user.username,
      creatorPlan: user.plan || "free",
      approvalStatus: "pending",
      featured: false,
      featuredSlot: null,
      rating: 0, ratingCount: 0,
      plays: 0,
      boostScore: plan.boost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...vis,
    };
    const next = [...games, ng];
    setGames(next);
    LS.set("gder_games", next);
    setShowAdd(false);
    showToast("Game submitted for review!");
  };

  const updateGame = (id, form) => {
    const next = games.map(g => g.id === id ? { ...g, ...form, updatedAt: new Date().toISOString(), approvalStatus: "pending" } : g);
    setGames(next);
    LS.set("gder_games", next);
    setEditGame(null);
    showToast("Game updated & resubmitted for review");
  };

  const deleteGame = id => {
    // Direct action — button label is the confirmation
    const next = games.filter(g => g.id !== id);
    setGames(next);
    LS.set("gder_games", next);
    showToast("Game deleted");
  };

  const planColor = plan.color;
  const planExpiry = user.planExpiry ? new Date(user.planExpiry).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"}) : null;

  return (
    <div className="pg">
      {/* Studio Header */}
      <div className="cr-hdr">
        <div className="stu-logo" style={{ background: `linear-gradient(135deg,${planColor},${planColor}99)` }}>
          {user.username[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <div className="stu-name">{user.username}'s Studio</div>
            {plan.badge && (
              <span style={{ fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:20,background:planColor,color:"#fff",letterSpacing:.5 }}>
                {plan.badge}
              </span>
            )}
          </div>
          <div className="stu-plan">
            {plan.label} Plan · {published.length}/{isCreatorPlus(user) ? "∞" : plan.games} games published
            {planExpiry && ` · Renews ${planExpiry}`}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
            <div style={{ flex:1,height:4,borderRadius:2,background:"var(--bdr)",overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${Math.min(100,(isCreatorPlus(user) ? 0 : (mine.filter(g=>g.approvalStatus!=="rejected").length/Math.max(plan.games,1))*100))}%`,background:planColor,borderRadius:2,transition:"width .4s" }}/>
            </div>
            <span style={{ fontSize:10,color:"var(--t2)",fontWeight:600,whiteSpace:"nowrap" }}>
              {mine.filter(g=>g.approvalStatus!=="rejected").length}/{isCreatorPlus(user)?"∞":plan.games} slots
            </span>
          </div>
        </div>
        <div style={{ display:"flex",gap:8,flexShrink:0 }}>
          <button className="btn-o btn-sm" onClick={() => setShowPlans(true)}>✦ Plans</button>
          {canAdd
            ? <button className="btn-r btn-sm" onClick={() => setShowAdd(true)}><Icon n="plus" s={13}/>Add Game</button>
            : <button className="btn-sm" style={{background:"var(--bg)",color:"var(--t2)",border:"none",borderRadius:9,padding:"7px 13px",fontSize:12,cursor:"pointer",fontWeight:700}} onClick={() => setShowPlans(true)}>🔒 Upgrade</button>
          }
        </div>
      </div>

      {/* Creator+ upsell / status banner */}
      {!isCreatorPlus(user) ? (
        <div onClick={() => setShowPlans(true)} style={{
          background:"linear-gradient(135deg,rgba(255,107,43,.1),rgba(255,107,43,.05))",
          border:"1.5px dashed rgba(255,107,43,.4)",
          borderRadius:16, padding:"14px 18px", marginBottom:20,
          cursor:"pointer", display:"flex", alignItems:"center", gap:14,
        }}>
          <div style={{ fontSize:28 }}>🟠</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:800, color:"var(--txt)", marginBottom:3 }}>Passe à Creator+ — 5,99€/mois</div>
            <div style={{ fontSize:12, color:"var(--t2)" }}>Jeux illimités · 6 images · 2 vidéos · Studio · Priorité review · Forum</div>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:"#FF6B2B", whiteSpace:"nowrap" }}>Voir l'offre →</div>
        </div>
      ) : (
        <div style={{
          background:"rgba(255,107,43,.06)", border:"1.5px solid rgba(255,107,43,.25)",
          borderRadius:16, padding:"12px 18px", marginBottom:20,
          display:"flex", alignItems:"center", gap:12,
        }}>
          <div style={{ fontSize:22 }}>🟠</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:800, color:"#FF6B2B" }}>Creator+ actif</div>
            <div style={{ fontSize:11, color:"var(--t2)" }}>
              Jeux illimités · 6 images · 2 vidéos · Studio · ×{PLANS.creator_plus.boost} boost
              {user.planExpiry && ` · Renouvellement ${new Date(user.planExpiry).toLocaleDateString("fr",{day:"numeric",month:"short",year:"numeric"})}`}
            </div>
          </div>
          <span style={{ fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20, background:"#FF6B2B", color:"#fff" }}>ACTIF</span>
        </div>
      )}

      {/* ── Studio Page (Creator+ only) ── */}
      {isCreatorPlus(user) && (
        <StudioPageEditor user={user} setUser={setUser} showToast={showToast}/>
      )}

      {/* ── Analytics Dashboard ── */}
      <div className="sg" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))" }}>
        <div className="sc">
          <div className="sc-n">{totalPlays.toLocaleString()}</div>
          <div className="sc-l">▶ Total Plays</div>
        </div>
        <div className="sc">
          <div className="sc-n" style={{ color:"#ef4444" }}>{totalFavs.toLocaleString()}</div>
          <div className="sc-l">❤️ Favorites</div>
        </div>
        <div className="sc">
          <div className="sc-n" style={{ color:"#3B82F6" }}>{totalPlayed.toLocaleString()}</div>
          <div className="sc-l">🎮 Played</div>
        </div>
        <div className="sc">
          <div className="sc-n" style={{ color:"#10b981" }}>{currentlyPlaying}</div>
          <div className="sc-l">🟢 In-Game Now</div>
        </div>
        <div className="sc">
          <div className="sc-n">{published.length}</div>
          <div className="sc-l">✅ Published</div>
        </div>
        <div className="sc">
          <div className="sc-n" style={{ color:planColor }}>{plan.boost > 1 ? `×${plan.boost}` : "×1"}</div>
          <div className="sc-l">⚡ Boost</div>
        </div>
        <div className="sc">
          <div className="sc-n">{pending.length}</div>
          <div className="sc-l">⏳ Pending</div>
        </div>
      </div>

      {/* ── Per-game stats table ── */}
      {published.length > 0 && (
        <div style={{ background:"var(--card)", borderRadius:16, padding:"16px 18px", marginBottom:22, boxShadow:"var(--shadow-sm)" }}>
          <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:800, color:"var(--txt)", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            📊 Game Analytics
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:"1.5px solid var(--bdr)" }}>
                  {["Game","▶ Plays","❤️ Fav","🎮 Played","⭐ Rating","🟢 Playing","Boost"].map(h => (
                    <th key={h} style={{ padding:"6px 10px", textAlign:"left", fontSize:10, fontWeight:700, color:"var(--t2)", whiteSpace:"nowrap", letterSpacing:.4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gameStats.map((g, i) => (
                  <tr key={g.id} style={{ borderBottom:"1px solid var(--bdr)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,.02)" }}>
                    <td style={{ padding:"9px 10px", fontFamily:"var(--fd)", fontWeight:700, color:"var(--txt)", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:28, height:18, borderRadius:4, overflow:"hidden", flexShrink:0 }}>
                          <Cover game={g} style={{ width:"100%", height:"100%" }}/>
                        </div>
                        {g.title}
                      </div>
                    </td>
                    <td style={{ padding:"9px 10px", fontWeight:700, color:"var(--txt)" }}>{(g.plays||0).toLocaleString()}</td>
                    <td style={{ padding:"9px 10px" }}>
                      <span style={{ fontSize:13 }}>{g.isFaved ? "❤️" : "—"}</span>
                    </td>
                    <td style={{ padding:"9px 10px" }}>
                      <span style={{ fontSize:13 }}>{g.isPlayed ? "✅" : "—"}</span>
                    </td>
                    <td style={{ padding:"9px 10px", color:"var(--t2)" }}>
                      {g.rating > 0 ? (
                        <span style={{ display:"flex", alignItems:"center", gap:3 }}>
                          <span style={{ color:"#FCD34D" }}>★</span>
                          {g.rating.toFixed(1)}
                          <span style={{ fontSize:10, color:"var(--t2)" }}>({g.ratingCount||0})</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding:"9px 10px" }}>
                      {g.isPlaying
                        ? <span style={{ fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20, background:"rgba(16,185,129,.12)", color:"#10b981" }}>🟢 Now</span>
                        : <span style={{ fontSize:11, color:"var(--t2)" }}>—</span>
                      }
                    </td>
                    <td style={{ padding:"9px 10px" }}>
                      {(PLANS[g.creatorPlan||"free"]?.boost || 1) > 1 && (
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:8, background:`${PLANS[g.creatorPlan||"free"].color}18`, color:PLANS[g.creatorPlan||"free"].color }}>
                          ×{PLANS[g.creatorPlan||"free"].boost}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Games list */}
      {mine.length === 0 ? (
        <div className="empty">
          <div className="empty-i">🛠️</div>
          <div className="empty-t">No games yet</div>
          <div className="empty-s">Submit your first game to get started</div>
          <button className="btn-r btn-sm" style={{ margin:"16px auto 0",justifyContent:"center" }} onClick={() => setShowAdd(true)}>Add Game</button>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <><div className="sec-h"><div className="sec-t">⏳ Pending Review</div></div>
            <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:20}}>
              {pending.map(g=><CreatorGameCard key={g.id} g={g} plan={plan} onEdit={()=>setEditGame(g)} onDelete={()=>deleteGame(g.id)}/>)}
            </div></>
          )}
          {rejected.length > 0 && (
            <><div className="sec-h"><div className="sec-t">❌ Rejected</div></div>
            <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:20}}>
              {rejected.map(g=><CreatorGameCard key={g.id} g={g} plan={plan} onEdit={()=>setEditGame(g)} onDelete={()=>deleteGame(g.id)}/>)}
            </div></>
          )}
          {published.length > 0 && (
            <><div className="sec-h"><div className="sec-t">✅ Published</div></div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {published.map(g=><CreatorGameCard key={g.id} g={g} plan={plan} onEdit={()=>setEditGame(g)} onDelete={()=>deleteGame(g.id)}/>)}
            </div></>
          )}
        </>
      )}

      {showAdd    && <GameFormModal onClose={() => setShowAdd(false)} onSubmit={submitGame} title="Add New Game" user={user}/>}
      {editGame   && <GameFormModal onClose={() => setEditGame(null)} onSubmit={f => updateGame(editGame.id, f)} title="Edit Game" initial={editGame} user={user}/>}
      {showPlans  && <PremiumModal user={user} setUser={setUser} onClose={() => setShowPlans(false)} showToast={showToast}/>}
    </div>
  );
}

function CreatorGameCard({ g, plan, onEdit, onDelete }) {
  const planInfo    = PLANS[g.creatorPlan || "free"];
  const statusBadge = g.approvalStatus === "approved"
    ? <span className="appr">✓ Approved</span>
    : g.approvalStatus === "rejected"
    ? <span className="pend" style={{color:"var(--p)",borderColor:"rgba(255,77,109,.28)",background:"rgba(255,77,109,.14)"}}>✗ Rejected</span>
    : <span className="pend">⏳ Pending</span>;
  return (
    <div className="ac">
      <div className="ac-th" style={{ position:"relative" }}>
        <Cover game={g} style={{ width: "100%", height: "100%" }}/>
        {planInfo.badge && (
          <span style={{ position:"absolute",top:4,left:4,fontSize:8,fontWeight:800,padding:"1px 6px",borderRadius:8,background:planInfo.color,color:"#fff" }}>
            {planInfo.badge}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ac-t">{g.title}</div>
        <div className="ac-m">{g.genre} · {g.platform} · {g.price}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {statusBadge}
          {g.approvalStatus === "approved" && (
            <>
              <span style={{ fontSize: 10, color: "var(--t2)" }}>▶ {g.plays.toLocaleString()} plays</span>
              {planInfo.boost > 1 && (
                <span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:`${planInfo.color}18`,color:planInfo.color }}>
                  ×{planInfo.boost} boost
                </span>
              )}
            </>
          )}
          {g.rejectionReason && <span style={{ fontSize: 10, color: "var(--t2)" }}>↳ {g.rejectionReason}</span>}
        </div>
      </div>
      <div className="ac-acts">
        <button className="feat" onClick={onEdit}><Icon n="edit" s={11}/> Edit</button>
        <button className="rej" onClick={onDelete}><Icon n="trash" s={11}/> Del</button>
      </div>
    </div>
  );
}

function GameFormModal({ onClose, onSubmit, title, initial, user }) {
  const plus = isCreatorPlus(user);
  const maxImages = plus ? 6 : 1;
  const maxVideos = plus ? 2 : 0;

  const def = {
    title:"", desc:"", genre:"", mode:"", platform:"", price:"Free",
    status:"Released", style:"", releaseDate:"", url:"",
    images: [],        // array of {data: base64, caption: string}
    videos: [],        // array of {url: string, label: string}
    // legacy single cover kept for back-compat
    coverImage: null, coverCaption: "",
  };
  const [f, setF] = useState(initial ? {
    title: initial.title, desc: initial.desc, genre: initial.genre,
    mode: initial.mode, platform: initial.platform, price: initial.price,
    status: initial.status, style: initial.style||"",
    releaseDate: initial.releaseDate||"", url: initial.url||"",
    images: initial.images || (initial.coverImage ? [{data:initial.coverImage,caption:initial.coverCaption||""}] : []),
    videos: initial.videos || [],
    coverImage: initial.coverImage || null,
    coverCaption: initial.coverCaption || "",
  } : def);
  const [err,      setErr]      = useState("");
  const [imgErr,   setImgErr]   = useState("");
  const [vidErr,   setVidErr]   = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const h = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Add image to gallery
  const addImage = (base64, caption="") => {
    if (f.images.length >= maxImages) return setImgErr(`Max ${maxImages} image${maxImages>1?"s":""}`);
    h("images", [...f.images, {data:base64, caption}]);
    // Keep legacy coverImage = first image
    if (f.images.length === 0) h("coverImage", base64);
  };
  const removeImage = idx => {
    const next = f.images.filter((_,i) => i !== idx);
    h("images", next);
    h("coverImage", next[0]?.data || null);
    h("coverCaption", next[0]?.caption || "");
  };
  const updateCaption = (idx, caption) => {
    const next = f.images.map((img,i) => i===idx ? {...img,caption} : img);
    h("images", next);
    if (idx === 0) h("coverCaption", caption);
  };

  // Add video
  const addVideo = () => {
    if (f.videos.length >= maxVideos) return setVidErr(`Max ${maxVideos} videos`);
    h("videos", [...f.videos, {url:"",label:""}]);
  };
  const removeVideo = idx => h("videos", f.videos.filter((_,i)=>i!==idx));
  const updateVideo = (idx, field, val) => h("videos", f.videos.map((v,i)=>i===idx?{...v,[field]:val}:v));

  // Process image file → base64, max 2MB, jpg/png/gif/webp
  const processFile = file => {
    setImgErr("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setImgErr("File must be an image (JPG, PNG, GIF, WebP)");
    if (file.size > 2 * 1024 * 1024) return setImgErr("Image too large — max 2 MB");
    const reader = new FileReader();
    reader.onload = e => h("coverImage", e.target.result);
    reader.onerror = () => setImgErr("Failed to read image");
    reader.readAsDataURL(file);
  };

  const onFileChange = e => processFile(e.target.files[0]);
  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const submit = () => {
    if (!f.title.trim()) return setErr("Title is required");
    if (!f.genre)        return setErr("Genre is required");
    if (!f.platform)     return setErr("Platform is required");
    setErr("");
    onSubmit(f);
  };

  return (
    <div className="mo-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo" style={{ maxWidth: 600 }}>
        <div className="mo-h"><div className="mo-t">{title}</div><button className="mo-x" onClick={onClose}><Icon n="x" s={14}/></button></div>
        {err && <div className="err">{err}</div>}
        <div className="fm-g"><label className="fm-l">GAME TITLE *</label><input className="fm-i" placeholder="Your game's name" value={f.title} onChange={e => h("title", e.target.value)}/></div>
        <div className="fm-g"><label className="fm-l">DESCRIPTION *</label><textarea className="fm-ta" placeholder="Describe your game — what makes it unique?" value={f.desc} onChange={e => h("desc", e.target.value)} style={{ minHeight: 90 }}/></div>
        <div className="fm-r">
          <div className="fm-g"><label className="fm-l">GENRE *</label><select className="fm-s" value={f.genre} onChange={e => h("genre", e.target.value)}><option value="">Select</option>{GENRES.map(g=><option key={g}>{g}</option>)}</select></div>
          <div className="fm-g"><label className="fm-l">GAME MODE</label><select className="fm-s" value={f.mode} onChange={e => h("mode", e.target.value)}><option value="">Select</option>{MODES.map(g=><option key={g}>{g}</option>)}</select></div>
        </div>
        <div className="fm-r">
          <div className="fm-g"><label className="fm-l">PLATFORM *</label><select className="fm-s" value={f.platform} onChange={e => h("platform", e.target.value)}><option value="">Select</option>{PLATFORMS.map(g=><option key={g}>{g}</option>)}</select></div>
          <div className="fm-g"><label className="fm-l">PRICE TYPE</label><select className="fm-s" value={f.price} onChange={e => h("price", e.target.value)}>{PRICES.map(g=><option key={g}>{g}</option>)}</select></div>
        </div>
        <div className="fm-r">
          <div className="fm-g"><label className="fm-l">STATUS</label><select className="fm-s" value={f.status} onChange={e => h("status", e.target.value)}>{STATUSES.map(g=><option key={g}>{g}</option>)}</select></div>
          <div className="fm-g"><label className="fm-l">VISUAL STYLE</label><select className="fm-s" value={f.style} onChange={e => h("style", e.target.value)}><option value="">Select</option>{VSTYLES.map(g=><option key={g}>{g}</option>)}</select></div>
        </div>
        <div className="fm-g"><label className="fm-l">RELEASE DATE</label><input className="fm-i" type="date" value={f.releaseDate} onChange={e => h("releaseDate", e.target.value)}/></div>
        <div className="fm-g">
          <label className="fm-l">GAME LINK / URL (optional)</label>
          <input className="fm-i" placeholder="https://yourgame.itch.io or browser game URL…" value={f.url||""} onChange={e => h("url", e.target.value)}/>
        </div>
        {/* ── Images section ── */}
        <div className="fm-g">
          <label className="fm-l">
            IMAGES ({f.images.length}/{maxImages})
            {!plus && <span style={{marginLeft:6,fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:"rgba(255,107,43,.15)",color:"#FF6B2B"}}>Creator+ = 6 images</span>}
          </label>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={onFileChange}/>

          {/* Image gallery grid */}
          {f.images.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8, marginBottom:10 }}>
              {f.images.map((img, idx) => (
                <div key={idx} style={{ position:"relative", borderRadius:10, overflow:"hidden", aspectRatio:"16/9", background:"#000", boxShadow:"var(--shadow-sm)" }}>
                  <img src={img.data} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                  {idx === 0 && <span style={{ position:"absolute",top:4,left:4,fontSize:8,fontWeight:800,background:"var(--p)",color:"#fff",padding:"1px 6px",borderRadius:6 }}>COVER</span>}
                  <button onClick={() => removeImage(idx)}
                    style={{ position:"absolute",top:4,right:4,width:22,height:22,borderRadius:"50%",background:"rgba(0,0,0,.7)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff" }}>
                    <Icon n="x" s={10}/>
                  </button>
                  <input
                    placeholder="Caption…"
                    value={img.caption||""}
                    onChange={e => updateCaption(idx, e.target.value)}
                    style={{ position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.65)",border:"none",color:"#fff",padding:"4px 8px",fontSize:10,outline:"none",fontFamily:"var(--fb)" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add image button */}
          {f.images.length < maxImages && (
            <div className="up-area"
              style={{ borderColor:dragging?"var(--p)":undefined, color:dragging?"var(--p)":undefined, background:dragging?"rgba(255,77,109,.04)":undefined, padding:16 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}>
              <Icon n="upload" s={22}/>
              <div className="up-t" style={{ fontSize:12 }}>{dragging ? "Drop here!" : f.images.length === 0 ? "Add cover image" : `Add image (${f.images.length}/${maxImages})`}</div>
              <div className="up-s">JPG, PNG, GIF, WebP · Max 2 MB · 16:9 recommended</div>
            </div>
          )}
          {imgErr && <div style={{ fontSize:11,color:"var(--p)",marginTop:5,fontWeight:600 }}>⚠ {imgErr}</div>}
          {f.images.length === 0 && <div style={{ fontSize:10,color:"var(--t2)",marginTop:5 }}>No image? A unique cover art is generated automatically.</div>}
        </div>

        {/* ── Videos section (Creator+ only) ── */}
        <div className="fm-g">
          <label className="fm-l" style={{ display:"flex",alignItems:"center",gap:8 }}>
            VIDEOS ({f.videos.length}/{maxVideos})
            {!plus
              ? <span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:8,background:"rgba(255,107,43,.15)",color:"#FF6B2B" }}>Creator+ only</span>
              : <span style={{ fontSize:9,fontWeight:600,color:"var(--t2)" }}>trailer, gameplay, teaser…</span>
            }
          </label>
          {!plus ? (
            <div style={{ padding:"10px 14px",background:"var(--bg)",borderRadius:10,fontSize:12,color:"var(--t2)",boxShadow:"var(--shadow-in)" }}>
              🔒 Upgrade to Creator+ to add video trailers to your game pages.
            </div>
          ) : (
            <>
              {f.videos.map((v, idx) => (
                <div key={idx} style={{ display:"flex",gap:8,alignItems:"center",marginBottom:7 }}>
                  <div style={{ flex:1 }}>
                    <input className="fm-i" placeholder="Video URL (YouTube, Vimeo…)" value={v.url}
                      onChange={e => updateVideo(idx,"url",e.target.value)} style={{ marginBottom:5 }}/>
                    <input className="fm-i" placeholder="Label (e.g. Trailer officiel)" value={v.label}
                      onChange={e => updateVideo(idx,"label",e.target.value)} style={{ fontSize:12 }}/>
                  </div>
                  <button onClick={() => removeVideo(idx)} className="ghost" style={{ color:"#ef4444",flexShrink:0 }}>
                    <Icon n="trash" s={16}/>
                  </button>
                </div>
              ))}
              {f.videos.length < maxVideos && (
                <button className="btn-o btn-sm" onClick={addVideo} style={{ width:"100%",justifyContent:"center" }}>
                  <Icon n="plus" s={13}/> Add video
                </button>
              )}
              {vidErr && <div style={{ fontSize:11,color:"var(--p)",marginTop:5,fontWeight:600 }}>⚠ {vidErr}</div>}
            </>
          )}
        </div>
        <button className="fm-sub" onClick={submit}>Submit for Review</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FORUM PAGE
═══════════════════════════════════════════════════════════════════ */
const FORUM_CATS = [
  { id:"ideas",    label:"Game Ideas",       icon:"💡", color:"#F59E0B", desc:"Request game concepts & inspire creators" },
  { id:"feedback", label:"Feedback & Wishes",icon:"💬", color:"#6366F1", desc:"Share opinions and suggestions" },
  { id:"news",     label:"Creator News",     icon:"📢", color:"#10b981", desc:"Creators announce their upcoming games" },
  { id:"promo",    label:"Game Showcase",    icon:"🎮", color:"#FF4D6D", desc:"Creators promote their published games" },
  { id:"general",  label:"General",          icon:"🌐", color:"#9CA3AF", desc:"Everything else about gaming" },
];

const canPost = user => user && (["creator","admin","moderator"].includes(user.role) || isCreatorPlus(user));

function ForumPage({ user, games, showToast }) {
  const [cat,      setCat]      = useState(null);    // selected category id
  const [selPost,  setSelPost]  = useState(null);    // selected post for thread view
  const [showNew,  setShowNew]  = useState(false);
  const [posts,    setPosts]    = useState(() => LS.get("gder_forum", []));
  const [search,   setSearch]   = useState("");

  const isSubscribed = user && (["creator","admin","moderator"].includes(user.role) || isCreatorPlus(user));

  const savePost = post => {
    const next = [post, ...posts];
    setPosts(next);
    LS.set("gder_forum", next);
  };

  const deletePost = id => {
    const next = posts.filter(p => p.id !== id);
    setPosts(next);
    LS.set("gder_forum", next);
    if (selPost?.id === id) setSelPost(null);
    showToast("Post deleted");
  };

  const addReply = (postId, reply) => {
    const next = posts.map(p => p.id === postId
      ? { ...p, replies: [...(p.replies||[]), reply] }
      : p
    );
    setPosts(next);
    LS.set("gder_forum", next);
    // Update selPost too
    setSelPost(next.find(p => p.id === postId));
  };

  const deleteReply = (postId, replyId) => {
    const next = posts.map(p => p.id === postId
      ? { ...p, replies: (p.replies||[]).filter(r => r.id !== replyId) }
      : p
    );
    setPosts(next);
    LS.set("gder_forum", next);
    setSelPost(next.find(p => p.id === postId));
  };

  const likePost = id => {
    const next = posts.map(p => {
      if (p.id !== id) return p;
      const liked = (p.likes||[]).includes(user.id);
      return { ...p, likes: liked ? (p.likes||[]).filter(l=>l!==user.id) : [...(p.likes||[]), user.id] };
    });
    setPosts(next);
    LS.set("gder_forum", next);
    if (selPost?.id === id) setSelPost(next.find(p => p.id === id));
  };

  const filtered = posts.filter(p => {
    if (cat && p.cat !== cat) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catCounts = {};
  FORUM_CATS.forEach(c => { catCounts[c.id] = posts.filter(p => p.cat === c.id).length; });

  // Thread view
  if (selPost) {
    return <ForumThread
      post={selPost} user={user} isSubscribed={isSubscribed}
      onBack={() => setSelPost(null)}
      onLike={() => likePost(selPost.id)}
      onReply={reply => addReply(selPost.id, reply)}
      onDeleteReply={id => deleteReply(selPost.id, id)}
      onDeletePost={() => deletePost(selPost.id)}
      showToast={showToast}
    />;
  }

  return (
    <div className="pg">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6, flexWrap:"wrap", gap:8 }}>
        <div>
          <div className="pg-t" style={{ marginBottom:2 }}>Forum</div>
          <div className="pg-s" style={{ marginBottom:0 }}>Ideas, announcements & community discussions</div>
        </div>
        {isSubscribed ? (
          <button className="btn-r btn-sm" onClick={() => setShowNew(true)}>
            ✏️ New Post
          </button>
        ) : (
          <div style={{ fontSize:11, color:"var(--t2)", textAlign:"right" }}>
            <div style={{ fontWeight:700, color:"var(--txt)", marginBottom:2 }}>Read-only</div>
            <div>Become a Creator (Settings) and activate Creator+ to post</div>
          </div>
        )}
      </div>

      {!isSubscribed && (
        <div style={{ background:"linear-gradient(135deg,rgba(99,102,241,.08),rgba(99,102,241,.04))", border:"1.5px solid rgba(99,102,241,.2)", borderRadius:14, padding:"13px 16px", marginBottom:18, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:26 }}>🔒</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:800, color:"var(--txt)", marginBottom:3 }}>Unlock posting & replies</div>
            <div style={{ fontSize:12, color:"var(--t2)" }}>Creator accounts, Pro & Studio plans can post, reply and promote their games.</div>
          </div>
          <div style={{ fontSize:11, color:"#6366F1", fontWeight:700 }}>Free to read →</div>
        </div>
      )}

      {/* Category pills */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
        <button onClick={() => setCat(null)} style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"var(--fd)", background: cat===null ? "var(--p)" : "var(--card)", color: cat===null ? "#fff" : "var(--t2)", boxShadow:"var(--shadow-sm)", transition:"all .15s" }}>
          All ({posts.length})
        </button>
        {FORUM_CATS.map(c => (
          <button key={c.id} onClick={() => setCat(cat===c.id ? null : c.id)} style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"var(--fd)", background: cat===c.id ? c.color : "var(--card)", color: cat===c.id ? "#fff" : "var(--t2)", boxShadow:"var(--shadow-sm)", transition:"all .15s" }}>
            {c.icon} {c.label} ({catCounts[c.id]||0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg)", borderRadius:22, padding:"0 14px", height:38, boxShadow:"var(--shadow-in)", marginBottom:18 }}>
        <span style={{ color:"var(--t2)", fontSize:14 }}>🔍</span>
        <input style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:13, color:"var(--txt)", fontFamily:"var(--fb)" }}
          placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Category cards when no filter */}
      {!cat && !search && (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:22 }}>
          {FORUM_CATS.map(c => (
            <div key={c.id} className="forum-cat" onClick={() => setCat(c.id)}>
              <div className="fc-ico" style={{ background:`${c.color}18` }}>{c.icon}</div>
              <div style={{ flex:1 }}>
                <div className="fc-name">{c.label}</div>
                <div className="fc-desc">{c.desc}</div>
              </div>
              <div className="fc-count">
                <div style={{ fontFamily:"var(--fd)", fontSize:16, fontWeight:800, color:c.color }}>{catCounts[c.id]||0}</div>
                <div style={{ fontSize:10, color:"var(--t2)" }}>posts</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post list */}
      {(cat || search) && (
        filtered.length === 0 ? (
          <div className="empty"><div className="empty-i">📭</div><div className="empty-t">No posts yet</div><div className="empty-s">{isSubscribed ? "Be the first to post!" : "Be the first — become a Creator to post"}</div></div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(p => (
              <ForumPostCard key={p.id} post={p} user={user} onOpen={() => setSelPost(p)} onLike={() => likePost(p.id)}/>
            ))}
          </div>
        )
      )}

      {/* Latest posts when no filter */}
      {!cat && !search && posts.length > 0 && (
        <>
          <div className="sec-h" style={{ marginTop:4 }}><div className="sec-t">🕐 Latest Posts</div></div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[...posts].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,8).map(p => (
              <ForumPostCard key={p.id} post={p} user={user} onOpen={() => setSelPost(p)} onLike={() => likePost(p.id)}/>
            ))}
          </div>
        </>
      )}

      {showNew && (
        <NewPostModal
          user={user} games={games}
          onClose={() => setShowNew(false)}
          onCreate={post => { savePost(post); setShowNew(false); showToast("Post published!"); }}
          defaultCat={cat}
        />
      )}
    </div>
  );
}

/* ── Post card (list view) ── */
function ForumPostCard({ post, user, onOpen, onLike }) {
  const catInfo  = FORUM_CATS.find(c => c.id === post.cat) || FORUM_CATS[4];
  const planInfo = post.authorPlan && PLANS[post.authorPlan] || null;
  const isLiked  = user && (post.likes||[]).includes(user.id);
  return (
    <div className="fpost" onClick={onOpen}>
      <div style={{ display:"flex", gap:9, alignItems:"center", marginBottom:7, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:20, background:`${catInfo.color}18`, color:catInfo.color }}>
          {catInfo.icon} {catInfo.label}
        </span>
        {post.isPinned && <span style={{ fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20, background:"rgba(245,158,11,.15)", color:"#D97706" }}>📌 PINNED</span>}
        {post.isAnnouncement && <span style={{ fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20, background:"rgba(16,185,129,.12)", color:"#10b981" }}>📢 ANNOUNCEMENT</span>}
        {post.isPromo && <span style={{ fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20, background:"rgba(255,77,109,.12)", color:"var(--p)" }}>🎮 PROMO</span>}
      </div>
      <div className="fpost-title">{post.title}</div>
      <div className="fpost-body">{post.body.slice(0, 140)}{post.body.length > 140 ? "…" : ""}</div>
      <div className="fpost-meta">
        <div style={{ width:22, height:22, borderRadius:7, background:`hsl(${post.authorName.charCodeAt(0)*13%360},50%,40%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>
          {post.authorName.slice(0,2).toUpperCase()}
        </div>
        <strong style={{ color:"var(--txt)" }}>{post.authorName}</strong>
        {planInfo?.badge && <span className="badge-plan" style={{ background:planInfo.color }}>{planInfo.badge}</span>}
        {post.authorRole === "admin" && <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:6, background:"#FF4D6D", color:"#fff" }}>ADMIN</span>}
        {post.authorRole === "moderator" && <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:6, background:"#8B5CF6", color:"#fff" }}>MOD</span>}
        <span>·</span>
        <span>{new Date(post.createdAt).toLocaleDateString("en",{day:"numeric",month:"short"})}</span>
        <span>·</span>
        <span>💬 {(post.replies||[]).length}</span>
        <button onClick={e => { e.stopPropagation(); onLike(); }} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:12, color: isLiked ? "var(--p)" : "var(--t2)", display:"flex", alignItems:"center", gap:3, fontWeight:700 }}>
          {isLiked ? "❤️" : "🤍"} {(post.likes||[]).length}
        </button>
      </div>
    </div>
  );
}

/* ── Thread / single post view ── */
function ForumThread({ post, user, isSubscribed, onBack, onLike, onReply, onDeleteReply, onDeletePost, showToast }) {
  const [reply,    setReply]    = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const catInfo  = FORUM_CATS.find(c => c.id === post.cat) || FORUM_CATS[4];
  const isLiked  = user && (post.likes||[]).includes(user.id);
  const inputRef = useRef(null);
  const canDelete = user && (user.id === post.authorId || ["admin","moderator"].includes(user.role));

  const insertEmoji = emoji => {
    const inp = inputRef.current;
    if (inp) {
      const s = inp.selectionStart ?? reply.length;
      const e = inp.selectionEnd   ?? reply.length;
      const next = reply.slice(0,s) + emoji + reply.slice(e);
      setReply(next);
      setTimeout(() => { inp.focus(); inp.setSelectionRange(s+emoji.length,s+emoji.length); }, 0);
    } else {
      setReply(p => p + emoji);
    }
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    if (!isSubscribed) return showToast("Upgrade to reply", true);
    const r = {
      id: Date.now(),
      authorId:   user.id,
      authorName: user.username,
      authorRole: user.role,
      authorPlan: user.plan || "free",
      body:       reply.trim(),
      createdAt:  new Date().toISOString(),
    };
    onReply(r);
    setReply("");
    setShowEmoji(false);
    showToast("Reply posted!");
  };

  const planInfo = post.authorPlan && PLANS[post.authorPlan] || null;

  return (
    <div className="pg">
      {/* Back */}
      <button className="ghost" style={{ marginBottom:14, display:"flex", alignItems:"center", gap:6, fontWeight:700 }} onClick={onBack}>
        ← Back to Forum
      </button>

      {/* Category badge */}
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11, fontWeight:700, padding:"3px 11px", borderRadius:20, background:`${catInfo.color}18`, color:catInfo.color }}>
          {catInfo.icon} {catInfo.label}
        </span>
        {post.isAnnouncement && <span style={{ fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, background:"rgba(16,185,129,.12)", color:"#10b981" }}>📢 ANNOUNCEMENT</span>}
        {post.isPromo && <span style={{ fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, background:"rgba(255,77,109,.12)", color:"var(--p)" }}>🎮 PROMO</span>}
      </div>

      {/* Original post */}
      <div className="forum-reply op" style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"var(--fd)", fontSize:19, fontWeight:800, color:"var(--txt)", marginBottom:9, lineHeight:1.3 }}>
          {post.title}
        </div>
        <div className="fr-meta">
          <div style={{ width:26, height:26, borderRadius:8, background:`hsl(${post.authorName.charCodeAt(0)*13%360},50%,40%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {post.authorName.slice(0,2).toUpperCase()}
          </div>
          <strong style={{ color:"var(--txt)", fontSize:13 }}>{post.authorName}</strong>
          {planInfo?.badge && <span className="badge-plan" style={{ background:planInfo.color }}>{planInfo.badge}</span>}
          {post.authorRole === "admin" && <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:6, background:"#FF4D6D", color:"#fff" }}>ADMIN</span>}
          {post.authorRole === "moderator" && <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:6, background:"#8B5CF6", color:"#fff" }}>MOD</span>}
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleDateString("en",{day:"numeric",month:"short",year:"numeric"})}</span>
          {canDelete && (
            <button className="ghost" style={{ marginLeft:"auto", color:"#ef4444", fontSize:11 }} onClick={onDeletePost}>
              🗑 Delete post
            </button>
          )}
        </div>
        <div className="fr-body" style={{ marginTop:12, color:"var(--txt)" }}>{post.body}</div>

        {/* Game link for promo posts */}
        {post.linkedGame && (
          <div style={{ marginTop:12, padding:"10px 13px", background:"var(--bg)", borderRadius:11, display:"flex", alignItems:"center", gap:11, boxShadow:"var(--shadow-sm)" }}>
            <div style={{ fontSize:20 }}>🎮</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:800, color:"var(--txt)" }}>{post.linkedGame.title}</div>
              <div style={{ fontSize:10, color:"var(--t2)" }}>{post.linkedGame.genre} · {post.linkedGame.platform}</div>
            </div>
            {post.linkedGame.url && (
              <a href={/^https?:\/\//.test(post.linkedGame.url)?post.linkedGame.url:`https://${post.linkedGame.url}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize:11, fontWeight:700, padding:"5px 12px", borderRadius:9, background:"var(--p)", color:"#fff", textDecoration:"none" }}
                onClick={e => e.stopPropagation()}>
                ▶ Play
              </a>
            )}
          </div>
        )}

        {/* Like */}
        <div style={{ marginTop:13, display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={onLike} style={{ display:"flex", alignItems:"center", gap:5, background:"var(--card)", border:"none", borderRadius:20, padding:"5px 13px", cursor:"pointer", fontSize:13, fontWeight:700, color: isLiked ? "var(--p)" : "var(--t2)", boxShadow:"var(--shadow-sm)", transition:"all .15s" }}>
            {isLiked ? "❤️" : "🤍"} {(post.likes||[]).length}
          </button>
          <span style={{ fontSize:11, color:"var(--t2)" }}>💬 {(post.replies||[]).length} replies</span>
        </div>
      </div>

      {/* Replies */}
      {(post.replies||[]).length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--t2)", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>
            Replies ({post.replies.length})
          </div>
          {post.replies.map(r => {
            const rPlan = r.authorPlan && PLANS[r.authorPlan];
            const canDelR = user && (user.id === r.authorId || ["admin","moderator"].includes(user.role));
            return (
              <div className="forum-reply" key={r.id}>
                <div className="fr-meta">
                  <div style={{ width:24,height:24,borderRadius:7,background:`hsl(${r.authorName.charCodeAt(0)*13%360},50%,40%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0 }}>
                    {r.authorName.slice(0,2).toUpperCase()}
                  </div>
                  <strong style={{ color:"var(--txt)" }}>{r.authorName}</strong>
                  {rPlan?.badge && <span className="badge-plan" style={{ background:rPlan.color }}>{rPlan.badge}</span>}
                  {r.authorRole === "admin" && <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:6, background:"#FF4D6D", color:"#fff" }}>ADMIN</span>}
                  {r.authorRole === "moderator" && <span style={{ fontSize:8, fontWeight:800, padding:"1px 5px", borderRadius:6, background:"#8B5CF6", color:"#fff" }}>MOD</span>}
                  <span>·</span>
                  <span>{new Date(r.createdAt).toLocaleDateString("en",{day:"numeric",month:"short"})}</span>
                  {canDelR && <button className="ghost" style={{ marginLeft:"auto", color:"var(--t2)", fontSize:11 }} onClick={() => onDeleteReply(r.id)}>🗑</button>}
                </div>
                <div className="fr-body" style={{ marginTop:7 }}>{r.body}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply box */}
      {isSubscribed ? (
        <div style={{ background:"var(--card)", borderRadius:16, padding:"14px 16px", boxShadow:"var(--shadow-sm)", position:"relative" }}>
          <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--txt)", marginBottom:10 }}>✍️ Write a reply</div>
          <textarea
            ref={inputRef}
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            placeholder="Your reply… (Enter to post)"
            style={{ width:"100%", background:"var(--bg)", border:"none", borderRadius:11, padding:"10px 13px", fontSize:13, color:"var(--txt)", resize:"none", minHeight:80, outline:"none", fontFamily:"var(--fb)", boxShadow:"var(--shadow-in)" }}
          />
          <div style={{ display:"flex", gap:8, marginTop:9, alignItems:"center", position:"relative" }}>
            <button onClick={() => setShowEmoji(v=>!v)} style={{ width:32,height:32,borderRadius:9,border:"none",background:showEmoji?"rgba(255,77,109,.12)":"var(--bg)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"var(--shadow-sm)",color:showEmoji?"var(--p)":"var(--t2)" }}>
              😊
            </button>
            {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)}/>}
            <button className="btn-r btn-sm" style={{ marginLeft:"auto" }} disabled={!reply.trim()} onClick={sendReply}>Post Reply</button>
          </div>
        </div>
      ) : (
        <div style={{ background:"var(--bg)", borderRadius:14, padding:"14px 18px", textAlign:"center", boxShadow:"var(--shadow-in)", color:"var(--t2)" }}>
          <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:800, color:"var(--txt)", marginBottom:4 }}>🔒 Members only</div>
          <div style={{ fontSize:12 }}>Become a Creator or upgrade your plan to reply to posts.</div>
        </div>
      )}
    </div>
  );
}

/* ── New Post Modal ── */
function NewPostModal({ user, games, onClose, onCreate, defaultCat }) {
  const [f, setF] = useState({
    title:"", body:"", cat: defaultCat || "general",
    isAnnouncement: false, isPromo: false,
    linkedGameId: "",
  });
  const [err, setErr] = useState("");
  const h = (k,v) => setF(p => ({...p, [k]:v}));

  const canAnnounce = ["creator","admin","moderator"].includes(user.role) || isCreatorPlus(user);
  const canPromo    = ["creator","admin","moderator"].includes(user.role) || ["creator_plus"].includes(user.plan || "free");
  const myGames     = games.filter(g => g.creatorId === user.id && g.approvalStatus === "approved");

  const submit = () => {
    if (!f.title.trim()) return setErr("Title is required");
    if (!f.body.trim())  return setErr("Body is required");
    if (f.body.trim().length < 10) return setErr("Post too short (min 10 characters)");

    const linkedGame = f.linkedGameId
      ? games.find(g => g.id == f.linkedGameId)
      : null;

    const post = {
      id:            Date.now(),
      authorId:      user.id,
      authorName:    user.username,
      authorRole:    user.role,
      authorPlan:    user.plan || "free",
      cat:           f.cat,
      title:         f.title.trim(),
      body:          f.body.trim(),
      isAnnouncement: f.isAnnouncement && canAnnounce,
      isPromo:       f.isPromo && canPromo,
      linkedGame:    linkedGame || null,
      likes:         [],
      replies:       [],
      createdAt:     new Date().toISOString(),
    };
    onCreate(post);
  };

  return (
    <div className="mo-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo" style={{ maxWidth:560 }}>
        <div className="mo-h">
          <div className="mo-t">✏️ New Post</div>
          <button className="mo-x" onClick={onClose}><Icon n="x" s={14}/></button>
        </div>
        {err && <div className="err">{err}</div>}

        <div className="fm-g">
          <label className="fm-l">CATEGORY</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {FORUM_CATS.map(c => (
              <button key={c.id} type="button" onClick={() => h("cat", c.id)} style={{
                padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer",
                fontSize:11, fontWeight:700, fontFamily:"var(--fd)", transition:"all .15s",
                background: f.cat===c.id ? c.color : "var(--bg)",
                color:      f.cat===c.id ? "#fff"   : "var(--t2)",
                boxShadow:"var(--shadow-sm)",
              }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="fm-g">
          <label className="fm-l">TITLE *</label>
          <input className="fm-i" placeholder="What's your post about?" value={f.title} onChange={e => h("title",e.target.value)}/>
        </div>

        <div className="fm-g">
          <label className="fm-l">CONTENT *</label>
          <textarea className="fm-ta" placeholder="Share your idea, feedback or announcement…" value={f.body} onChange={e => h("body",e.target.value)} style={{ minHeight:110 }}/>
        </div>

        {/* Post type options */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16 }}>
          {canAnnounce && (
            <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--txt)" }}>
              <input type="checkbox" checked={f.isAnnouncement} onChange={e => h("isAnnouncement",e.target.checked)} style={{ accentColor:"#10b981" }}/>
              📢 Mark as Announcement
            </label>
          )}
          {canPromo && (
            <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--txt)" }}>
              <input type="checkbox" checked={f.isPromo} onChange={e => h("isPromo",e.target.checked)} style={{ accentColor:"var(--p)" }}/>
              🎮 Promote a Game
            </label>
          )}
        </div>

        {/* Game linker for promo */}
        {f.isPromo && myGames.length > 0 && (
          <div className="fm-g">
            <label className="fm-l">LINK YOUR GAME</label>
            <select className="fm-s" value={f.linkedGameId} onChange={e => h("linkedGameId", e.target.value)}>
              <option value="">Select a game (optional)</option>
              {myGames.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
        )}
        {f.isPromo && myGames.length === 0 && (
          <div style={{ fontSize:11, color:"var(--t2)", marginBottom:14, padding:"9px 12px", background:"var(--bg)", borderRadius:9 }}>
            💡 You don't have any published games yet. Publish a game first to link it.
          </div>
        )}

        <button className="fm-sub" disabled={!f.title.trim() || !f.body.trim()} onClick={submit}>
          Publish Post
        </button>
      </div>
    </div>
  );
}


function AdminPage({ user, games, setGames, users, showToast }) {
  const [tab,       setTab]       = useState("pending");
  const [rejReason, setRejReason] = useState({});
  const [reps,      setReps]      = useState(() => LS.get("gder_reports", []));
  const [tickets,   setTickets]   = useState(() => LS.get("gder_contact", []));

  // Sync reps when tab switches to reports
  useEffect(() => {
    if (tab === "reports") setReps(LS.get("gder_reports", []));
    if (tab === "messages") setTickets(LS.get("gder_contact", []));
  }, [tab]);

  const pending   = games.filter(g => g.approvalStatus === "pending");
  const approved  = games.filter(g => g.approvalStatus === "approved");
  const rejected  = games.filter(g => g.approvalStatus === "rejected");

  const approve = g => {
    const next = games.map(x => x.id === g.id ? { ...x, approvalStatus: "approved" } : x);
    setGames(next);
    LS.set("gder_games", next);
    showToast(`"${g.title}" approved!`);
  };

  const reject = g => {
    const reason = rejReason[g.id] || "Does not meet guidelines";
    const next   = games.map(x => x.id === g.id ? { ...x, approvalStatus: "rejected", rejectionReason: reason } : x);
    setGames(next);
    LS.set("gder_games", next);
    showToast(`"${g.title}" rejected`);
  };

  // Assign a slot (1–5) to a game; remove if already assigned to same slot
  const setSlot = (g, slot) => {
    const already = g.featuredSlot === slot && g.featured;
    const next = games.map(x => {
      if (x.id === g.id) {
        return already
          ? { ...x, featured: false, featuredSlot: null }
          : { ...x, featured: true,  featuredSlot: slot };
      }
      // Clear that slot from other games
      if (x.featuredSlot === slot && !already) return { ...x, featured: false, featuredSlot: null };
      return x;
    });
    setGames(next);
    LS.set("gder_games", next);
    showToast(already ? `Removed from Slot ${slot}` : `"${g.title}" → Slot ${slot}!`);
  };

  // Quick remove from feature
  const unfeature = g => {
    const next = games.map(x => x.id === g.id ? { ...x, featured: false, featuredSlot: null } : x);
    setGames(next);
    LS.set("gder_games", next);
    showToast(`"${g.title}" removed from featured`);
  };

  const deleteGame = id => {
    // Direct action — button label is the confirmation
    const next = games.filter(g => g.id !== id);
    setGames(next);
    LS.set("gder_games", next);
    showToast("Game deleted");
  };

  return (
    <div className="pg">
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6, flexWrap: "wrap" }}>
        <div className="pg-t" style={{ marginBottom: 0 }}>Admin Panel</div>
        <div style={{ background: "rgba(255,77,109,.14)", color: "var(--p)", border: "1px solid rgba(255,77,109,.28)", padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>ADMIN</div>
      </div>
      <div className="pg-s">Review submissions & manage platform content</div>
      <div className="sg">
        <div className="sc"><div className="sc-n">{pending.length}</div><div className="sc-l">Pending</div></div>
        <div className="sc"><div className="sc-n">{approved.length}</div><div className="sc-l">Published</div></div>
        <div className="sc"><div className="sc-n">{rejected.length}</div><div className="sc-l">Rejected</div></div>
        <div className="sc"><div className="sc-n">{users.length}</div><div className="sc-l">Users</div></div>
        <div className="sc"><div className="sc-n">{users.filter(u=>u.role==="moderator").length}</div><div className="sc-l">Moderators</div></div>
      </div>
      <div className="tabs">
        <button className={`tab${tab==="pending"?" on":""}`} onClick={()=>setTab("pending")}>⏳ Pending ({pending.length})</button>
        <button className={`tab${tab==="approved"?" on":""}`} onClick={()=>setTab("approved")}>✅ Published ({approved.length})</button>
        <button className={`tab${tab==="feature"?" on":""}`} onClick={()=>setTab("feature")}>⭐ Feature</button>
        <button className={`tab${tab==="reports"?" on":""}`} onClick={()=>setTab("reports")}
          style={tab!=="reports" && LS.get("gder_reports",[]).filter(r=>r.status==="pending").length > 0 ? {color:"#ef4444"} : {}}>
          🚩 Reports {LS.get("gder_reports",[]).filter(r=>r.status==="pending").length > 0 && `(${LS.get("gder_reports",[]).filter(r=>r.status==="pending").length})`}
        </button>
        <button className={`tab${tab==="messages"?" on":""}`} onClick={()=>setTab("messages")}
          style={tab!=="messages" && tickets.filter(t=>t.status==="open").length > 0 ? {color:"#3B82F6"} : {}}>
          ✉️ Messages {tickets.filter(t=>t.status==="open").length > 0 && `(${tickets.filter(t=>t.status==="open").length})`}
        </button>
        <button className={`tab${tab==="users"?" on":""}`} onClick={()=>setTab("users")}>👥 Users ({users.length})</button>
      </div>

      {tab === "pending" && (
        pending.length === 0
          ? <div className="empty"><div className="empty-i">✅</div><div className="empty-t">All caught up!</div><div className="empty-s">No games awaiting review</div></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {pending.map(g => (
                <div className="ac" key={g.id}>
                  <div className="ac-th"><Cover game={g} style={{ width: "100%", height: "100%" }}/></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ac-t">{g.title}</div>
                    <div className="ac-m">By {g.creatorName} · {g.genre} · {g.platform} · {g.price}{PLANS[g.creatorPlan||"free"]?.priorityReview && <span style={{marginLeft:7,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:8,background:"rgba(255,107,43,.15)",color:"#FF6B2B"}}>⚡ Priority</span>}</div>
                    {g.desc && <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 3, lineHeight: 1.4 }}>{g.desc.slice(0, 120)}{g.desc.length > 120 ? "…" : ""}</div>}
                    {g.url && <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--p)", display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}><Icon n="link" s={10}/> {g.url.slice(0, 40)}</a>}
                    <div style={{ marginTop: 7 }}>
                      <input className="fm-i" style={{ fontSize: 11, padding: "4px 8px" }} placeholder="Rejection reason (optional)…" value={rejReason[g.id]||""} onChange={e => setRejReason(p => ({...p,[g.id]:e.target.value}))}/>
                    </div>
                  </div>
                  <div className="ac-acts">
                    <button className="ok" onClick={() => approve(g)}><Icon n="check" s={10}/> Approve</button>
                    <button className="rej" onClick={() => reject(g)}><Icon n="x" s={10}/> Reject</button>
                    <button className="feat" onClick={() => deleteGame(g.id)}><Icon n="trash" s={10}/></button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === "approved" && (
        approved.length === 0
          ? <div className="empty"><div className="empty-i">📋</div><div className="empty-t">No published games</div></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {approved.map(g => (
                <div className="ac" key={g.id}>
                  <div className="ac-th"><Cover game={g} style={{ width: "100%", height: "100%" }}/></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ac-t">{g.title}</div>
                    <div className="ac-m">By {g.creatorName} · ▶ {g.plays.toLocaleString()} plays</div>
                    {g.featured && <span className="appr">⭐ Featured</span>}
                  </div>
                  <div className="ac-acts">
                    <button className="feat" onClick={() => setTab("feature")} title="Go to Feature tab to assign slot"><Icon n="star" s={10}/> {g.featured ? `Slot ${g.featuredSlot||"?"}` : "Feature"}</button>
                    <button className="rej" onClick={() => deleteGame(g.id)}><Icon n="trash" s={10}/></button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === "feature" && (
        approved.length === 0
          ? <div className="empty"><div className="empty-i">⭐</div><div className="empty-t">No published games to feature</div></div>
          : <>
              {/* Slot overview */}
              <div style={{ background:"linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.04))", border:"1.5px solid rgba(245,158,11,.2)", borderRadius:16, padding:"16px 18px", marginBottom:20 }}>
                <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:800, color:"var(--txt)", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                  <span>🎠</span> Featured Carousel — Active Slots
                  <span style={{ fontSize:11, color:"var(--t2)", fontWeight:500, marginLeft:4 }}>Max 5 banners · rotate every 5s</span>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[1,2,3,4,5].map(slot => {
                    const inSlot = approved.find(g => g.featuredSlot === slot && g.featured);
                    return (
                      <div key={slot} style={{ flex:1, minWidth:120, background: inSlot ? "rgba(245,158,11,.12)" : "var(--bg)", borderRadius:12, padding:"10px 12px", border:`1.5px solid ${inSlot ? "rgba(245,158,11,.4)" : "var(--bdr)"}`, textAlign:"center" }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"var(--t2)", marginBottom:4, letterSpacing:.5 }}>SLOT {slot}</div>
                        {inSlot ? (
                          <>
                            <div style={{ fontSize:11, fontWeight:800, color:"var(--txt)", marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{inSlot.title}</div>
                            <button onClick={() => unfeature(inSlot)} style={{ fontSize:9, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>✕ Remove</button>
                          </>
                        ) : (
                          <div style={{ fontSize:10, color:"var(--t2)" }}>Empty</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Game list with slot assignment */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {approved.map(g => {
                  const planInfo = PLANS[g.creatorPlan || "free"];
                  return (
                    <div key={g.id} style={{ background:"var(--card)", borderRadius:16, padding:"14px 16px", boxShadow:"var(--shadow-sm)", border: g.featured ? `1.5px solid rgba(245,158,11,.3)` : "1.5px solid var(--bdr)" }}>
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <div className="ac-th" style={{ flexShrink:0 }}><Cover game={g} style={{ width:"100%", height:"100%" }}/></div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3, flexWrap:"wrap" }}>
                            <div className="ac-t" style={{ marginBottom:0 }}>{g.title}</div>
                            {planInfo.badge && <span style={{ fontSize:8, fontWeight:800, padding:"1px 6px", borderRadius:8, background:planInfo.color, color:"#fff" }}>{planInfo.badge}</span>}
                          </div>
                          <div className="ac-m">{g.genre} · {g.plays.toLocaleString()} plays · ×{planInfo.boost} boost</div>
                          {g.featured && g.featuredSlot && (
                            <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"rgba(245,158,11,.15)", color:"#D97706", display:"inline-flex", alignItems:"center", gap:3 }}>
                              ⭐ Slot {g.featuredSlot}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Slot picker */}
                      <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, fontWeight:700, color:"var(--t2)" }}>Assign slot:</span>
                        {[1,2,3,4,5].map(slot => {
                          const isAssigned = g.featuredSlot === slot && g.featured;
                          const isTaken    = approved.some(x => x.id !== g.id && x.featuredSlot === slot && x.featured);
                          return (
                            <button key={slot} onClick={() => setSlot(g, slot)}
                              title={isTaken ? `Slot ${slot} occupied — click to replace` : `Assign to slot ${slot}`}
                              style={{
                                width:32, height:32, borderRadius:8, border:"none", cursor:"pointer",
                                fontFamily:"var(--fd)", fontWeight:800, fontSize:12,
                                background: isAssigned ? "#F59E0B" : isTaken ? "rgba(245,158,11,.12)" : "var(--bg)",
                                color: isAssigned ? "#fff" : isTaken ? "#D97706" : "var(--t2)",
                                boxShadow:"var(--shadow-sm)", transition:"all .18s",
                                outline: isAssigned ? "2px solid #F59E0B" : "none",
                              }}>
                              {slot}
                            </button>
                          );
                        })}
                        {g.featured && (
                          <button onClick={() => unfeature(g)} style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"5px 10px", borderRadius:8, background:"rgba(239,68,68,.1)", color:"#ef4444", border:"none", cursor:"pointer" }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
      )}

      {tab === "reports" && (() => {
        const rPending  = reps.filter(r => r.status === "pending");
        const rResolved = reps.filter(r => r.status !== "pending");
        const dismiss  = id => { const next = reps.map(r => r.id === id ? { ...r, status:"dismissed" } : r); setReps(next); LS.set("gder_reports", next); showToast("Report dismissed"); };
        const actioned = id => { const next = reps.map(r => r.id === id ? { ...r, status:"actioned"  } : r); setReps(next); LS.set("gder_reports", next); showToast("Report actioned"); };
        return reps.length === 0 ? (
          <div className="empty"><div className="empty-i">🚩</div><div className="empty-t">No reports</div><div className="empty-s">No games have been reported yet</div></div>
        ) : (
          <>
            {rPending.length > 0 && (
              <>
                <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"#ef4444", marginBottom:10 }}>⚠️ Pending ({rPending.length})</div>
                <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:20 }}>
                  {rPending.map(r => (
                    <div key={r.id} style={{ background:"var(--card)", borderRadius:13, padding:"13px 15px", boxShadow:"var(--shadow-sm)", border:"1.5px solid rgba(239,68,68,.2)" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:800, color:"var(--txt)", marginBottom:2 }}>
                            {r.type === "comment" ? "💬" : "🎮"} {r.gameTitle}
                            {r.type === "comment" && <span style={{ fontSize:10, fontWeight:500, color:"var(--t2)", marginLeft:6 }}>— comment by {r.commentAuthor}</span>}
                          </div>
                          <div style={{ fontSize:11, color:"var(--t2)" }}>By <strong>{r.reportedBy}</strong> · {r.date}</div>
                          {r.type === "comment" && r.commentText && (
                            <div style={{ fontSize:11, color:"var(--t2)", marginTop:4, fontStyle:"italic", padding:"5px 8px", background:"var(--bg)", borderRadius:7 }}>
                              "{r.commentText}{r.commentText.length >= 120 ? "…" : ""}"
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"rgba(239,68,68,.12)", color:"#ef4444" }}>PENDING</span>
                      </div>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--txt)", marginBottom: r.note ? 4 : 10 }}>Reason: {r.reason}</div>
                      {r.note && <div style={{ fontSize:12, color:"var(--t2)", marginBottom:10, fontStyle:"italic" }}>"{r.note}"</div>}
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <button className="ok"   onClick={() => dismiss(r.id)}>✓ Dismiss</button>
                        <button className="rej"  onClick={() => actioned(r.id)}>⚡ Actioned</button>
                        {r.type === "comment" ? (
                          <button className="feat" onClick={() => {
                            // Delete the reported comment from its game's comments
                            const key  = `gder_comments_${r.gameId}`;
                            const cmts = LS.get(key, []).filter(c => c.id !== r.commentId);
                            LS.set(key, cmts);
                            actioned(r.id);
                            showToast("Comment removed");
                          }}>🗑 Delete Comment</button>
                        ) : (
                          <button className="feat" onClick={() => { deleteGame(r.gameId); actioned(r.id); }}>🗑 Remove Game</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {rResolved.length > 0 && (
              <>
                <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--t2)", marginBottom:10 }}>✅ Resolved ({rResolved.length})</div>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  {rResolved.map(r => (
                    <div key={r.id} style={{ background:"var(--card)", borderRadius:13, padding:"11px 15px", boxShadow:"var(--shadow-sm)", opacity:.7 }}>
                      <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--txt)", marginBottom:2 }}>🎮 {r.gameTitle}</div>
                      <div style={{ fontSize:11, color:"var(--t2)" }}>{r.reason} · {r.status === "dismissed" ? "Dismissed" : "Actioned"} · {r.date}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        );
      })()}

      {tab === "messages" && (() => {
        const open   = tickets.filter(t => t.status === "open");
        const closed = tickets.filter(t => t.status !== "open");
        const closeTicket = id => {
          const next = tickets.map(t => t.id === id ? { ...t, status:"closed" } : t);
          setTickets(next); LS.set("gder_contact", next);
          showToast("Ticket closed");
        };
        const subjectColor = {
          "Report a problem":        "#ef4444",
          "Appeal a rejected game":  "#F59E0B",
          "Account issue":           "#6366F1",
          "Inappropriate content":   "#ef4444",
          "Request verification":    "#10b981",
          "Billing / Premium plan":  "#8B5CF6",
          "Other":                   "#9CA3AF",
        };
        return tickets.length === 0 ? (
          <div className="empty"><div className="empty-i">✉️</div><div className="empty-t">No messages</div><div className="empty-s">No contact messages received yet</div></div>
        ) : (
          <>
            {open.length > 0 && (
              <>
                <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"#3B82F6", marginBottom:10 }}>
                  📬 Open ({open.length})
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:22 }}>
                  {open.map(t => (
                    <div key={t.id} style={{ background:"var(--card)", borderRadius:14, padding:"15px 16px", boxShadow:"var(--shadow-sm)", border:"1.5px solid rgba(59,130,246,.2)" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:11, marginBottom:10 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,var(--p),#FF8FA3)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--fd)", fontWeight:800, fontSize:16, color:"#fff", flexShrink:0 }}>
                          {t.username[0].toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"var(--fd)", fontSize:14, fontWeight:800, color:"var(--txt)", marginBottom:2 }}>{t.username}</div>
                          <div style={{ fontSize:11, color:"var(--t2)" }}>{t.email} · {t.date}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:20, background:subjectColor[t.subject]||"#9CA3AF", color:"#fff", flexShrink:0, whiteSpace:"nowrap" }}>
                          {t.subject}
                        </span>
                      </div>
                      <div style={{ fontSize:13, color:"var(--txt)", lineHeight:1.6, whiteSpace:"pre-wrap", padding:"10px 12px", background:"var(--bg)", borderRadius:10, marginBottom:10 }}>
                        {t.message}
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <button className="ok" onClick={() => closeTicket(t.id)}>✓ Mark as Closed</button>
                        <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)} — 93NPC Support&body=Hi ${t.username},%0A%0A`}
                          style={{ fontSize:11, fontWeight:700, padding:"6px 12px", borderRadius:8, background:"rgba(59,130,246,.12)", color:"#3B82F6", textDecoration:"none", fontFamily:"var(--fd)" }}>
                          📧 Reply by Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {closed.length > 0 && (
              <>
                <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--t2)", marginBottom:10 }}>✅ Closed ({closed.length})</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {closed.map(t => (
                    <div key={t.id} style={{ background:"var(--card)", borderRadius:12, padding:"11px 14px", boxShadow:"var(--shadow-sm)", opacity:.65, display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--txt)" }}>{t.username} — {t.subject}</div>
                        <div style={{ fontSize:10, color:"var(--t2)" }}>{t.email} · {t.date}</div>
                      </div>
                      <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, background:"rgba(16,185,129,.12)", color:"#10b981" }}>Closed</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        );
      })()}

      {tab === "users" && (
        users.length === 0
          ? <div className="empty"><div className="empty-i">👥</div><div className="empty-t">No users yet</div></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {users.map(u => {
                const roleColor = {admin:"#FF4D6D",moderator:"#8B5CF6",creator:"#3B82F6",player:"#9CA3AF"}[u.role]||"#9CA3AF";
                const canChangeRole = user.role === "admin" && u.id !== user.id;
                return (
                  <div className="ac" key={u.id}>
                    <div style={{ width:42,height:42,borderRadius:10,background:`linear-gradient(135deg,${roleColor},${roleColor}99)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontWeight:700,fontSize:18,color:"#fff",flexShrink:0 }}>{u.username[0].toUpperCase()}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div className="ac-t">{u.username}</div>
                      <div className="ac-m">{u.email} · Joined {new Date(u.createdAt||Date.now()).toLocaleDateString()}</div>
                      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:5,alignItems:"center" }}>
                        {/* Role badge */}
                        <span style={{ fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20,background:roleColor,color:"#fff",letterSpacing:.5 }}>
                          {u.role.toUpperCase()}
                        </span>
                        {u.id === user.id && <span className="appr">You</span>}
                        {/* Role selector — admin only */}
                        {canChangeRole && (
                          <select
                            value={u.role}
                            onChange={e => {
                              const newRole = e.target.value;
                              const next = users.map(x => x.id === u.id ? {...x, role: newRole} : x);
                              // In localStorage mode: update directly
                              const allUsers = LS.get("gder_users",[]);
                              LS.set("gder_users", allUsers.map(x => x.id === u.id ? {...x, role: newRole} : x));
                              showToast(`${u.username} is now ${newRole}`);
                              // Re-read users list (trigger re-render via parent)
                              window.location.reload();
                              // With Supabase: await DB.updateProfile(u.id, { role: newRole })
                            }}
                            style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,border:"1px solid var(--bdr)",background:"var(--bg)",color:"var(--txt)",cursor:"pointer",outline:"none" }}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="player">Player</option>
                            <option value="creator">Creator</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GAME MODAL — with comments & report
═══════════════════════════════════════════════════════════════════ */
const REPORT_REASONS = [
  "Inappropriate content",
  "Misleading description",
  "Broken / unplayable link",
  "Spam or fake game",
  "Copyright violation",
  "Other",
];

function GameModal({ game, onClose, favs, toggleFav, onPlay, user, games, setGames }) {
  const isFav   = favs.includes(game.id);
  const [tab, setTab]           = useState("info");
  const [comment, setComment]   = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote]     = useState("");
  const [reportDone, setReportDone]     = useState(false);
  const [showEmojiC, setShowEmojiC]     = useState(false);
  const [reportingComment, setReportingComment] = useState(null); // comment being reported
  const [cmtReportReason, setCmtReportReason]   = useState("");
  const [cmtReportDone, setCmtReportDone]       = useState(false);
  const cmtInputRef = useRef(null);

  // Comments stored per game in localStorage
  const commentsKey = `gder_comments_${game.id}`;
  const [comments, setComments] = useState(() => LS.get(commentsKey, []));

  const rate = stars => {
    const total  = game.ratingCount || 0;
    const newRat = total === 0 ? stars : ((game.rating * total) + stars) / (total + 1);
    const next   = games.map(g => g.id === game.id ? { ...g, rating: Math.round(newRat * 10) / 10, ratingCount: total + 1 } : g);
    setGames(next);
    LS.set("gder_games", next);
  };

  const postComment = () => {
    if (!comment.trim()) return;
    const c = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      text: comment.trim(),
      time: new Date().toLocaleDateString("en", { day:"numeric", month:"short", year:"numeric" }),
      av: user.username.slice(0, 2).toUpperCase(),
    };
    const next = [c, ...comments];
    setComments(next);
    LS.set(commentsKey, next);
    setComment("");
    setShowEmojiC(false);
  };

  const deleteComment = id => {
    const next = comments.filter(c => c.id !== id);
    setComments(next);
    LS.set(commentsKey, next);
  };

  const submitCommentReport = () => {
    if (!cmtReportReason || !reportingComment) return;
    const reports = LS.get("gder_reports", []);
    reports.push({
      id: Date.now(),
      type: "comment",
      gameId: game.id,
      gameTitle: game.title,
      commentId: reportingComment.id,
      commentText: reportingComment.text.slice(0, 120),
      commentAuthor: reportingComment.username,
      reason: cmtReportReason,
      reportedBy: user.username,
      userId: user.id,
      date: new Date().toLocaleDateString("en", { day:"numeric", month:"short", year:"numeric" }),
      status: "pending",
    });
    LS.set("gder_reports", reports);
    setCmtReportDone(true);
  };

  const closeCmtReport = () => {
    setReportingComment(null);
    setCmtReportReason("");
    setCmtReportDone(false);
  };

  const insertEmojiComment = emoji => {
    const input = cmtInputRef.current;
    if (input) {
      const start = input.selectionStart ?? comment.length;
      const end   = input.selectionEnd   ?? comment.length;
      const next  = comment.slice(0, start) + emoji + comment.slice(end);
      setComment(next);
      setTimeout(() => { input.focus(); const p = start + emoji.length; input.setSelectionRange(p, p); }, 0);
    } else {
      setComment(p => p + emoji);
    }
  };

  const submitReport = () => {
    if (!reportReason) return;
    const reports = LS.get("gder_reports", []);
    reports.push({
      id: Date.now(),
      gameId: game.id,
      gameTitle: game.title,
      reason: reportReason,
      note: reportNote.trim(),
      reportedBy: user.username,
      userId: user.id,
      date: new Date().toLocaleDateString("en", { day:"numeric", month:"short", year:"numeric" }),
      status: "pending",
    });
    LS.set("gder_reports", reports);
    setReportDone(true);
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      padding:"7px 16px", borderRadius:10, border:"none", cursor:"pointer",
      background: tab === id ? "rgba(255,77,109,.12)" : "var(--bg)",
      color: tab === id ? "var(--p)" : "var(--t2)",
      fontWeight:700, fontSize:12, fontFamily:"var(--fd)",
      boxShadow: tab === id ? "var(--shadow-in)" : "var(--shadow-sm)",
      transition:"all .15s",
    }}>
      {label}
      {id === "comments" && comments.length > 0 && (
        <span style={{ marginLeft:5, background:"var(--p)", color:"#fff", borderRadius:20, fontSize:9, padding:"1px 5px", fontWeight:800 }}>{comments.length}</span>
      )}
    </button>
  );

  return (
    <div className="mo-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo" style={{ maxWidth: 560 }}>
        <div className="mo-h">
          <div className="mo-t">{game.title}</div>
          <button className="mo-x" onClick={onClose}><Icon n="x" s={14}/></button>
        </div>

        <div className="gm-cover"><Cover game={game} style={{ width:"100%", height:"100%" }}/></div>

        {/* Cover caption */}
        {game.coverCaption && (
          <div style={{
            fontSize:12, color:"var(--t2)", fontStyle:"italic",
            lineHeight:1.6, marginBottom:14,
            padding:"8px 12px",
            background:"var(--bg)",
            borderRadius:9,
            boxShadow:"var(--shadow-in)",
          }}>
            📷 {game.coverCaption}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display:"flex", gap:7, marginBottom:16 }}>
          {tabBtn("info",     "ℹ️ Info")}
          {tabBtn("comments", "💬 Comments")}
          {tabBtn("report",   "🚩 Report")}
        </div>

        {/* ── INFO TAB ── */}
        {tab === "info" && (
          <>
            {/* Stars rating */}
            <div className="rat">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width={14} height={14} viewBox="0 0 24 24"
                  fill={i < Math.round(game.rating) ? "#FCD34D" : "var(--bdr)"}
                  stroke="none" style={{ flexShrink:0, cursor:"pointer" }}
                  onClick={() => rate(i + 1)}>
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              ))}
              {game.rating > 0
                ? <span className="rat-c">{game.rating.toFixed(1)} · {game.ratingCount || 0} ratings · {game.plays.toLocaleString()} plays</span>
                : <span className="rat-c">Rate this game</span>
              }
            </div>
            <div className="gm-d">{game.desc}</div>
            <div className="gm-tags">
              <span className="tag tA">{game.genre}</span>
              {game.mode   && <span className="tag tE">{game.mode}</span>}
              <span className="tag tB">{game.platform}</span>
              <span className="tag tC">{game.price}</span>
              <span className="tag tD">{game.status}</span>
              {game.style  && <span className="tag" style={{ background:"rgba(156,163,175,.1)", color:"var(--t2)", borderColor:"var(--bdr)" }}>{game.style}</span>}
            </div>
            {game.releaseDate && <div style={{ fontSize:11, color:"var(--t2)", marginBottom:10 }}>📅 {new Date(game.releaseDate).toLocaleDateString("en",{year:"numeric",month:"long",day:"numeric"})}</div>}
            {game.creatorName && (
          <div style={{ fontSize:11, color:"var(--t2)", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
            👤 By <strong style={{ color:"var(--txt)" }}>{game.creatorName}</strong>
            {PLANS[game.creatorPlan||"free"]?.badge && (
              <span style={{ fontSize:9, fontWeight:800, padding:"1px 7px", borderRadius:20, background:PLANS[game.creatorPlan||"free"].color, color:"#fff" }}>
                ✓ {PLANS[game.creatorPlan||"free"].badge}
              </span>
            )}
          </div>
        )}
            <div style={{ display:"flex", gap:8 }}>
              {game.url ? (
                <a href={/^https?:\/\//.test(game.url) ? game.url : `https://${game.url}`} target="_blank" rel="noopener noreferrer" className="btn-r" style={{ flex:1, justifyContent:"center", textDecoration:"none" }} onClick={() => onPlay(game)}>
                  <Icon n="play" s={12}/>Play Now
                </a>
              ) : (
                <button className="btn-r" style={{ flex:1, justifyContent:"center" }} onClick={() => onPlay(game)}>
                  <Icon n="play" s={12}/>Play Now
                </button>
              )}
              <button className={`fav-btn${isFav ? " on" : ""}`} onClick={() => toggleFav(game.id)} style={{ width:44, height:44, borderRadius:10 }}>
                <Icon n="heart" s={16}/>
              </button>
            </div>
          </>
        )}

        {/* ── COMMENTS TAB ── */}
        {tab === "comments" && (
          <>
            {/* New comment input */}
            <div style={{ background:"var(--bg)", borderRadius:14, padding:14, marginBottom:16, boxShadow:"var(--shadow-in)", position:"relative" }}>
              <textarea
                ref={cmtInputRef}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write a comment… (Enter to post, Shift+Enter for new line)"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}
                style={{
                  width:"100%", background:"none", border:"none", outline:"none",
                  color:"var(--txt)", fontSize:13, resize:"none", minHeight:60,
                  fontFamily:"var(--fb)", lineHeight:1.5,
                }}
              />
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8, gap:8 }}>
                <div style={{ position:"relative" }}>
                  <button onClick={() => setShowEmojiC(v => !v)} style={{
                    width:32, height:32, borderRadius:9, border:"none",
                    background: showEmojiC ? "rgba(255,77,109,.12)" : "var(--card)",
                    cursor:"pointer", fontSize:18, display:"flex", alignItems:"center",
                    justifyContent:"center", boxShadow:"var(--shadow-sm)",
                  }}>😊</button>
                  {showEmojiC && (
                    <EmojiPicker
                      onSelect={insertEmojiComment}
                      onClose={() => setShowEmojiC(false)}
                    />
                  )}
                </div>
                <button className="btn-r btn-sm" onClick={postComment} disabled={!comment.trim()} style={{ opacity: comment.trim() ? 1 : .5 }}>
                  Post Comment
                </button>
              </div>
            </div>

            {/* Comments list */}
            {comments.length === 0 ? (
              <div className="empty" style={{ padding:"28px 0" }}>
                <div className="empty-i">💬</div>
                <div className="empty-t">No comments yet</div>
                <div className="empty-s">Be the first to share your thoughts!</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {comments.map(c => (
                  <div key={c.id}>
                    <div style={{
                      background:"var(--bg)", borderRadius:13, padding:"12px 14px",
                      boxShadow:"var(--shadow-sm)",
                      border: reportingComment?.id === c.id ? "1.5px solid rgba(239,68,68,.3)" : "1.5px solid transparent",
                      transition:"border .15s",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:7 }}>
                        <div style={{
                          width:32, height:32, borderRadius:9, flexShrink:0,
                          background:`hsl(${c.username.charCodeAt(0)*13%360},50%,40%)`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, fontWeight:700, color:"#fff", fontFamily:"var(--fd)",
                        }}>{c.av}</div>
                        <div>
                          <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--txt)" }}>{c.username}</div>
                          <div style={{ fontSize:10, color:"var(--t2)" }}>{c.time}</div>
                        </div>
                        {/* Action buttons */}
                        <div style={{ marginLeft:"auto", display:"flex", gap:5, alignItems:"center" }}>
                          {/* Report button — only for other users' comments */}
                          {c.userId !== user.id && (
                            <button
                              onClick={() => {
                                if (reportingComment?.id === c.id) { closeCmtReport(); }
                                else { setReportingComment(c); setCmtReportReason(""); setCmtReportDone(false); }
                              }}
                              className="ghost"
                              title="Report this comment"
                              style={{
                                color: reportingComment?.id === c.id ? "#ef4444" : "var(--t2)",
                                fontSize:14,
                                transition:"color .15s",
                              }}>
                              🚩
                            </button>
                          )}
                          {/* Delete — own or admin */}
                          {(c.userId === user.id || user.role === "admin") && (
                            <button onClick={() => deleteComment(c.id)} className="ghost" style={{ color:"var(--t2)" }}>
                              <Icon n="trash" s={13}/>
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:"var(--txt)", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{c.text}</div>
                    </div>

                    {/* Inline comment report form */}
                    {reportingComment?.id === c.id && (
                      <div style={{
                        background:"rgba(239,68,68,.05)", border:"1.5px solid rgba(239,68,68,.2)",
                        borderRadius:"0 0 13px 13px", marginTop:-4, padding:"12px 14px",
                        animation:"slideUp .2s ease",
                      }}>
                        {cmtReportDone ? (
                          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                            <span style={{ fontSize:18 }}>✅</span>
                            <div>
                              <div style={{ fontFamily:"var(--fd)", fontSize:13, fontWeight:700, color:"var(--txt)" }}>Report submitted</div>
                              <div style={{ fontSize:11, color:"var(--t2)" }}>Our team will review this comment</div>
                            </div>
                            <button onClick={closeCmtReport} className="ghost" style={{ marginLeft:"auto", fontSize:11 }}>Close</button>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize:11, fontWeight:700, color:"#ef4444", marginBottom:8 }}>🚩 Report this comment</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                              {["Harassment","Hate speech","Spam","Spoiler","Inappropriate","Off-topic"].map(r => (
                                <button key={r} onClick={() => setCmtReportReason(r)}
                                  style={{
                                    padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer",
                                    fontSize:11, fontWeight:700, transition:"all .15s",
                                    background: cmtReportReason === r ? "#ef4444" : "var(--card)",
                                    color:      cmtReportReason === r ? "#fff"    : "var(--t2)",
                                    boxShadow:"var(--shadow-sm)",
                                  }}>
                                  {r}
                                </button>
                              ))}
                            </div>
                            <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                              <button
                                onClick={submitCommentReport}
                                disabled={!cmtReportReason}
                                style={{
                                  padding:"6px 14px", borderRadius:9, border:"none", cursor:"pointer",
                                  background: cmtReportReason ? "#ef4444" : "var(--bdr)",
                                  color:"#fff", fontWeight:700, fontSize:12,
                                  opacity: cmtReportReason ? 1 : .5, transition:"all .15s",
                                  fontFamily:"var(--fd)",
                                }}>
                                Submit
                              </button>
                              <button onClick={closeCmtReport} className="ghost" style={{ fontSize:12 }}>Cancel</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── REPORT TAB ── */}
        {tab === "report" && (
          reportDone ? (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ fontSize:44, marginBottom:12 }}>✅</div>
              <div style={{ fontFamily:"var(--fd)", fontSize:18, fontWeight:800, color:"var(--txt)", marginBottom:6 }}>Report Submitted</div>
              <div style={{ fontSize:13, color:"var(--t2)", marginBottom:20, lineHeight:1.5 }}>
                Thank you. Our moderation team will review this game.
              </div>
              <button className="btn-o btn-sm" onClick={() => { setReportDone(false); setReportReason(""); setReportNote(""); setTab("info"); }}>
                Back to Game
              </button>
            </div>
          ) : (
            <>
              <div style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.18)", borderRadius:13, padding:"12px 14px", marginBottom:18, fontSize:12, color:"var(--t2)", lineHeight:1.5 }}>
                🚩 Report this game if it violates our guidelines. False reports may result in account action.
              </div>
              <div className="fm-g">
                <label className="fm-l">REASON *</label>
                {REPORT_REASONS.map(r => (
                  <label key={r} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, cursor:"pointer", marginBottom:5, background: reportReason === r ? "rgba(255,77,109,.08)" : "var(--bg)", boxShadow:"var(--shadow-sm)", transition:"background .15s" }}>
                    <input
                      type="radio" name="report" value={r}
                      checked={reportReason === r}
                      onChange={() => setReportReason(r)}
                      style={{ accentColor:"var(--p)", flexShrink:0 }}
                    />
                    <span style={{ fontSize:13, color:"var(--txt)", fontWeight:reportReason === r ? 700 : 500 }}>{r}</span>
                  </label>
                ))}
              </div>
              <div className="fm-g" style={{ marginTop:4 }}>
                <label className="fm-l">ADDITIONAL DETAILS (optional)</label>
                <textarea
                  className="fm-ta"
                  value={reportNote}
                  onChange={e => setReportNote(e.target.value)}
                  placeholder="Describe the issue in more detail…"
                  style={{ minHeight:70 }}
                />
              </div>
              <button className="fm-sub" disabled={!reportReason} onClick={submitReport}
                style={{ background: reportReason ? "linear-gradient(135deg,#ef4444,#f87171)" : undefined }}>
                🚩 Submit Report
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SEARCH DROPDOWN
═══════════════════════════════════════════════════════════════════ */
function SearchDrop({ query, games, onSelect, onClose }) {
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return games.filter(g => g.approvalStatus === "approved" && (g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q))).slice(0, 6);
  }, [query, games]);

  if (!results.length || !query.trim()) return null;
  return (
    <div className="search-drop">
      {results.map(g => (
        <div className="s-item" key={g.id} onClick={() => { onSelect(g); onClose(); }}>
          <div className="s-thumb"><Cover game={g} style={{ width: "100%", height: "100%" }}/></div>
          <div>
            <div className="s-title">{g.title}</div>
            <div className="s-sub">{g.genre} · {g.platform} · {g.price}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════════════════════════════════ */
function NotifPanel({ notifs, onClear, onClose }) {
  return (
    <div className="notif-panel">
      <div className="notif-h">
        Notifications
        <button className="ghost" style={{ fontSize: 11 }} onClick={onClear}>Clear all</button>
      </div>
      {notifs.length === 0
        ? <div style={{ padding: "18px 16px", textAlign: "center", fontSize: 12, color: "var(--t2)" }}>No notifications</div>
        : notifs.map((n, i) => (
          <div className="notif-item" key={i} onClick={onClose}>
            <div className="notif-dot"/>
            <div>
              <div className="notif-msg">{n.msg}</div>
              <div className="notif-time">{n.time}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   AUTH PAGE — Supabase only, no hardcoded accounts
═══════════════════════════════════════════════════════════════════ */
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF]       = useState({ username: "", email: "", password: "", confirm: "", role: "player" });
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);
  const h = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const getSupabase = async () => {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(
      "https://yfrtywzyjlkeldukzxxj.supabase.co",
      "sb_publishable_NDlHt0p6LjORkBHMO1nh5g_zvxq7GVc"
    );
  };

  const buildUserObj = (authUser, profile) => ({
    id:        authUser.id,
    email:     authUser.email,
    username:  profile?.username  || authUser.email.split("@")[0],
    role:      profile?.role      || "player",
    plan:      profile?.plan      || "free",
    bio:       profile?.bio       || "",
    createdAt: authUser.created_at,
  });

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      const supabase = await getSupabase();
      if (mode === "register") {
        if (!f.username.trim() || !f.email.trim() || !f.password)
          return setErr("Please fill all fields.");
        if (f.password.length < 6)
          return setErr("Password must be at least 6 characters.");
        if (f.password !== f.confirm)
          return setErr("Passwords don't match.");

        const { data, error } = await supabase.auth.signUp({
          email: f.email.trim().toLowerCase(),
          password: f.password,
          options: { data: { username: f.username.trim(), role: f.role } }
        });
        if (error) return setErr(error.message);

        // Wait for DB trigger to create profile
        await new Promise(r => setTimeout(r, 900));
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", data.user.id).single();
        const userObj = buildUserObj(data.user, profile);
        LS.set("gder_user", userObj);
        onAuth(userObj);

      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email:    f.email.trim().toLowerCase(),
          password: f.password,
        });
        if (error) return setErr("Invalid email or password.");

        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", data.user.id).single();
        const userObj = buildUserObj(data.user, profile);
        LS.set("gder_user", userObj);
        onAuth(userObj);
      }
    } catch (e) {
      setErr("Network error — please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const AUTH_LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAIc0lEQVR42u2af0xU2RXHP/e9NwMComKqE4SgaxEhDtZIU3+0aew2m1Vr7R8Um/QPrUYTs3ZTtTWaGJImGn8kpoptTKuxP5LqLq7rj64a06SpVmvjj5VdKygjrILYZV1UQCMw793TP4b3BEVhYAZtnZO8MMzL3HvP955z7jnfexQgvMZi8JpLAoAEAAkAEgAkAEgA8BqLNVgTKaUwDAOlFABaa0QEEenxndZ6cNYV70zQMAwMw8C27eh3x7JwHAcR+d8DwN1Vx3EA8Pv9TJkyhWnTphEMBsnJyWH48OFYlkVHRwdNTU3U1NRQUVHBuXPnqKys9MYyTdOzmHiIxPoxTdP7nJ+fL1u2bJHr169LX8VxHDl//rysWrVKRo8e3eO4MXxiN5hSyltkTk6O7N69W9ra2jzFtNYSDoclHA6Lbdti27Y4juN9dt91lcbGRiktLZXU1FQBxLKsVxMApZQopQSQpUuXSlNTk6dEOBwWx3H6bAFaa3EcpxsYlZWVMmvWrHhYQmyUd3dnz5493RTXWstAxLUa9/PKlStjDcLAlTcMQ5KSkuTYsWMxU7ynuOBa0aZNm2LpDgP3eaWUHDlyREREOjo6JF6itfbGLy0tjRUIA4/227Zti7vyPblESUlJLNxhYMrPnj3bM/vBEtcdHjx4INnZ2Z4bDhoA7oQpKSlSW1vrRe3BFBfwgwcPDtQKov+R63erV68e9N3vKrZti4jIzJkzBwJC/877lJQUqa+vfym7/7QVHD16dPAAcHe/uLi42y5EG8S6HpVds8BoEyattbS3t8u4ceMEiDoWRM0HuAVJSUmJV85GWyRZloVlWSilEBFM0/S+MwwjqrEcx8Hv9zN//nyv+oxbNeguOCUlhVAoRGZmJlrrPk3q1v2tra1s376d1tZWVqxYQXZ2NuvXr8cwDO7fv09RURGLFi1CawdDqcgSO3mCnsRxHEzT5Pjx48ydOxfTNL0KNOaMkEtY5ObmkpmZiYj0rLwIaAe6kBoigm3bLFu2jObmZrKzs1m4cCGNjY0UFRVx+vRp9u3bR1ZWFlprlGGCMiLKi46MJ/q5ayosLCQ5ORnHcbzvYs4IGYaB1prc3FyPuTFNs4viOqK8YYIyuylvGAa3bt3i7t279+7fv09hYSG5ublYlkVHRwdt2bJl3Lp1i7a2NsCb3SWNuguOCUlhVAoRGZmJlrrPk3q1v2tra1s376d1tZWVqxYQXZ2NuvXr8cwDO7fv09RURGLFi1CawdDqcgSO3mCnsRxHEzT5Pjx48ydOxfTNL0KNOaMkEtY5ObmkpmZiYj0rLwIaAe6kBoigm3bLFu2jObmZrKzs1m4cCGNjY0UFRVx+vRp9u3bR1ZWFlprlGGCMiLKi46MJ/q5ayosLCQ5ORnHcbzvYs4IGYaB1prc3FyPuTFNs4viOqK8YYIyuylvGAa3bt3i7t279+7fv09hYSG5ublYlkVHRwdt2bJl3Lp1i7a2NsCb3SWNuguOCUlhVAoRGZmJlrrPk3q1v2tra1s376d1tZWVqxYQXZ2NuvXr8cwDO7fv09RURGLFi1CawdDqcgSO3mCnsRxHEzT5Pjx48ydOxfTNL0KNOaMkEtY5ObmkpmZiYj0rLwIaAe6kBoigm3bLFu2jObmZrKzs1m4cCGNjY0UFRVx+vRp9u3bR1ZWFlprlGGCMiLKi46MJ/q5ayosLCQ5ORnHcbzvYs4IGYaB1prc3FyPuTFNs4viOqK8YYIyuylvGAa3bt3i7t279+/";

  return (
    <div className="auth-wrap" style={{background:"linear-gradient(135deg,#E8ECF0,#EEF1F5,#E4EBF5)",color:"#2D3436"}}>
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10, marginBottom:4 }}>
            <img src={AUTH_LOGO_B64} alt="93NPC" style={{ width:90, height:90, objectFit:"contain" }}/>
            <div style={{ fontFamily:"var(--fd)", fontSize:26, fontWeight:900, letterSpacing:4, color:"var(--txt)" }}>93NPC</div>
          </div>
        </div>
        <div className="auth-t" style={{marginTop:4}}>{mode === "login" ? "Welcome Back" : "Create Account"}</div>
        <div className="auth-s">PLAY • CREATE • CONNECT</div>

        {mode === "register" && (
          <div className="fm-g"><label className="fm-l">USERNAME</label><input className="fm-i" placeholder="Your gamer tag" value={f.username} onChange={h("username")} autoComplete="username"/></div>
        )}
        <div className="fm-g"><label className="fm-l">EMAIL</label><input className="fm-i" type="email" placeholder="your@email.com" value={f.email} onChange={h("email")} autoComplete="email"/></div>
        <div className="fm-g"><label className="fm-l">PASSWORD</label><input className="fm-i" type="password" placeholder="••••••••" value={f.password} onChange={h("password")} autoComplete={mode==="login"?"current-password":"new-password"} onKeyDown={e => e.key === "Enter" && mode === "login" && submit()}/></div>
        {mode === "register" && (
          <>
            <div className="fm-g"><label className="fm-l">CONFIRM PASSWORD</label><input className="fm-i" type="password" placeholder="••••••••" value={f.confirm} onChange={h("confirm")} autoComplete="new-password"/></div>
            <div className="fm-g">
              <label className="fm-l">ACCOUNT TYPE</label>
              <div className="type-row">
                {[["player","🎮","Player"],["creator","🛠️","Creator"]].map(([v,ic,lb]) => (
                  <div key={v} className={`type-btn${f.role===v?" sel":""}`} onClick={() => setF(p => ({...p,role:v}))}>
                    <div className="type-ico">{ic}</div><div className="type-lbl">{lb}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {err && <div className="err">{err}</div>}
        <button className="auth-btn" onClick={submit} disabled={loading}>{loading ? "…" : mode === "login" ? "Sign In" : "Create Account"}</button>
        <div className="auth-sw">
          {mode === "login"
            ? <>No account? <span className="auth-lk" onClick={() => { setMode("register"); setErr(""); }}>Sign Up</span></>
            : <>Have account? <span className="auth-lk" onClick={() => { setMode("login"); setErr(""); }}>Sign In</span></>
          }
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP ROOT — Supabase session management
═══════════════════════════════════════════════════════════════════ */
export default function App() {

  useEffect(() => {
    const id = 'gder-styles';
    let el = document.getElementById(id);
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent = GDER_CSS;
  }, []);

  const [user,        setUser]        = useState(() => LS.get("gder_user", null));
  const [authLoading, setAuthLoading] = useState(true);
  const [page,        setPage]        = useState("home");
  const [games,       setGames]       = useState(() => LS.get("gder_games", []));
  const [favs,        setFavs]        = useState(() => LS.get("gder_favs",  []));
  const [played,      setPlayed]      = useState(() => LS.get("gder_played",[]));
  const [groups,      setGroups]      = useState(() => LS.get("gder_groups",[]));
  const [joined,      setJoined]      = useState(() => LS.get("gder_joined",[]));
  const [users,       setUsers]       = useState(() => LS.get("gder_users", []));
  const [sbOpen,      setSbOpen]      = useState(false);
  const [sbMini,      setSbMini]      = useState(() => LS.get("gder_mini", false));
  const [selGame,     setSelGame]     = useState(null);
  const [toast,       setToast]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [showSearch,  setShowSearch]  = useState(false);
  const [showNotifs,  setShowNotifs]  = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const toastTimer = useRef(null);
  const searchRef  = useRef(null);

  // ── Supabase: restore session on mount + listen for auth events ──
  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          "https://yfrtywzyjlkeldukzxxj.supabase.co",
          "sb_publishable_NDlHt0p6LjORkBHMO1nh5g_zvxq7GVc"
        );

        // Build normalized user object from Supabase auth + profiles table
        const fetchUser = async (authUser) => {
          const { data: profile } = await supabase
            .from("profiles").select("*").eq("id", authUser.id).single();
          return {
            id:        authUser.id,
            email:     authUser.email,
            username:  profile?.username  || authUser.email.split("@")[0],
            role:      profile?.role      || "player",   // ← from profiles.role in DB
            plan:      profile?.plan      || "free",
            bio:       profile?.bio       || "",
            createdAt: authUser.created_at,
          };
        };

        // Restore session after page refresh
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userObj = await fetchUser(session.user);
          setUser(userObj);
          LS.set("gder_user", userObj);
          // Preload all profiles for admin panel
          const { data: allProfiles } = await supabase.from("profiles").select("*");
          if (allProfiles) { setUsers(allProfiles); LS.set("gder_users", allProfiles); }
        } else {
          LS.del("gder_user");
          setUser(null);
        }

        // Real-time auth state listener
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "SIGNED_OUT") {
              LS.del("gder_user");
              setUser(null);
              setFavs([]);
              setPlayed([]);
              setJoined([]);
            }
            if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
              const userObj = await fetchUser(session.user);
              setUser(userObj);
              LS.set("gder_user", userObj);
            }
          }
        );
        subscription = sub;
      } catch (e) {
        // Supabase unavailable (offline / blocked) — keep cached localStorage session
        console.warn("Supabase session check failed:", e.message);
      } finally {
        setAuthLoading(false);
      }
    })();
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  // Reload users list when current user changes (needed for admin panel)
  useEffect(() => {
    if (user) setUsers(LS.get("gder_users", []));
  }, [user]);

  const showToast = useCallback((msg, isErr = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, isErr });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const toggleFav = useCallback(id => {
    const has  = favs.includes(id);
    const next = has ? favs.filter(f => f !== id) : [...favs, id];
    setFavs(next);
    LS.set("gder_favs", next);
    showToast(has ? "Removed from favorites" : "Added to favorites!");
  }, [favs, showToast]);

  const go = useCallback(p => {
    setPage(p);
    setSbOpen(false);
    setShowSearch(false);
    setShowNotifs(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        "https://yfrtywzyjlkeldukzxxj.supabase.co",
        "sb_publishable_NDlHt0p6LjORkBHMO1nh5g_zvxq7GVc"
      );
      await supabase.auth.signOut();
    } catch (e) { /* Supabase unavailable — continue anyway */ }
    LS.del("gder_user");
    setUser(null);
    setPage("home");
    setFavs([]);
    setPlayed([]);
    setJoined([]);
  }, []);

  const toggleSbMini = () => {
    const next = !sbMini;
    setSbMini(next);
    LS.set("gder_mini", next);
  };

  useEffect(() => {
    const h = e => {
      if (!e.target.closest(".hdr-search") && !e.target.closest(".search-drop"))
        setShowSearch(false);
      if (!e.target.closest(".hdr-ico") && !e.target.closest(".notif-panel"))
        setShowNotifs(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const addNotif = useCallback(msg => {
    setNotifs(p => [{
      msg,
      time: new Date().toLocaleTimeString("en", { hour:"2-digit", minute:"2-digit" })
    }, ...p.slice(0, 9)]);
  }, []);

  const prevApproved = useRef(games.filter(g => g.approvalStatus === "approved").length);
  useEffect(() => {
    const now = games.filter(g => g.approvalStatus === "approved").length;
    if (now > prevApproved.current) addNotif("A new game was just approved!");
    prevApproved.current = now;
  }, [games, addNotif]);

  // ── Loading spinner while Supabase checks session ──
  if (authLoading) return (
    <div style={{
      width:"100vw", height:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#E8ECF0", flexDirection:"column", gap:16
    }}>
      <div style={{
        width:48, height:48, border:"4px solid #FF4D6D",
        borderTopColor:"transparent", borderRadius:"50%",
        animation:"spin 0.8s linear infinite"
      }}/>
      <div style={{ fontFamily:"system-ui,sans-serif", fontSize:14, color:"#636E72", fontWeight:600 }}>
        93NPC
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  // ── Auth wall ──
  if (!user) return (
    <AuthPage onAuth={u => {
      setUser(u);
      setUsers(LS.get("gder_users", []));
    }}/>
  );

  // ── Navigation — role sourced exclusively from Supabase profiles table ──
  const NAV = [
    { id:"home",      label:"Home",     icon:"home"   },
    { id:"forum",     label:"Forum",    icon:"globe"  },
    { id:"recent",    label:"Recent",   icon:"clock"  },
    { id:"all-games", label:"All Games",icon:"grid"   },
    { id:"library",   label:"Library",  icon:"book"   },
    { id:"groups",    label:"Groups",   icon:"users"  },
    { id:"profile",   label:"Profile",  icon:"user"   },
    // Studio tab: role === creator OR creator_plus plan
    ...(user.role === "creator" || isCreatorPlus(user)
      ? [{ id:"creator", label:"Studio", icon:"zap" }]
      : []),
    // Admin tab: ONLY role === "admin" (set via SQL UPDATE profiles SET role='admin')
    ...(user.role === "admin"
      ? [{ id:"admin", label:"Admin", icon:"shield" }]
      : []),
    // Moderator tab: ONLY role === "moderator"
    ...(user.role === "moderator"
      ? [{ id:"admin", label:"Modération", icon:"shield" }]
      : []),
    { id:"settings",  label:"Settings", icon:"cog"    },
  ];

  const BOT = [
    { id:"home",      l:"Home",   i:"home"  },
    { id:"all-games", l:"Games",  i:"grid"  },
    { id:"forum",     l:"Forum",  i:"globe" },
    { id:"groups",    l:"Groups", i:"users" },
    { id:"profile",   l:"Profile",i:"user"  },
  ];

  const renderPage = () => {
    const base = { games, favs, toggleFav, onView: g => { setSelGame(g); setShowSearch(false); }, showToast };
    // Helper: record last-played timestamp for creator "In-Game Now" stat
    const trackPlay = g => {
      const playing = LS.get("gder_playing", {});
      playing[g.id] = Date.now();
      LS.set("gder_playing", playing);
    };
    switch (page) {
      case "home":      return <HomePage {...base} onPlay={g=>{
            const n=games.map(x=>x.id===g.id?{...x,plays:x.plays+1}:x);
            setGames(n); LS.set("gder_games",n);
            if(!played.includes(g.id)){const p=[...played,g.id];setPlayed(p);LS.set("gder_played",p);}
            trackPlay(g);
            if(g.url){const url=/^https?:\/\//.test(g.url)?g.url:`https://${g.url}`;window.open(url,"_blank","noopener,noreferrer");}
            else showToast("No game link set — ask the creator to add one",true);
          }} go={go}/>;
      case "forum":     return <ForumPage user={user} games={games.filter(g=>g.approvalStatus==="approved")} showToast={showToast}/>;
      case "recent":    return <RecentPage {...base}/>;
      case "all-games": return <AllGamesPage {...base}/>;
      case "library":   return <LibraryPage {...base} played={played}/>;
      case "groups":    return <GroupsPage groups={groups} setGroups={setGroups} joined={joined} setJoined={setJoined} user={user} showToast={showToast} games={games}/>;
      case "profile":   return <ProfilePage user={user} setUser={u=>{setUser(u);setUsers(LS.get("gder_users",[]))}} favs={favs} played={played} games={games} showToast={showToast}/>;
      case "settings":  return <SettingsPage user={user} setUser={u=>{setUser(u);setUsers(LS.get("gder_users",[]))}} showToast={showToast} onLogout={logout}/>;
      case "creator":   return <CreatorPage user={user} setUser={u=>{setUser(u);setUsers(LS.get('gder_users',[]))}} games={games} setGames={setGames} favs={favs} played={played} showToast={showToast}/>;
      case "admin":     return <AdminPage user={user} games={games} setGames={setGames} users={users} showToast={showToast}/>;
      default:          return <HomePage {...base} onPlay={g=>{
            const n=games.map(x=>x.id===g.id?{...x,plays:x.plays+1}:x);
            setGames(n); LS.set("gder_games",n);
            if(!played.includes(g.id)){const p=[...played,g.id];setPlayed(p);LS.set("gder_played",p);}
            trackPlay(g);
            if(g.url){const url=/^https?:\/\//.test(g.url)?g.url:`https://${g.url}`;window.open(url,"_blank","noopener,noreferrer");}
            else showToast("No game link set",true);
          }} go={go}/>;
    }
  };

  return (
    <>
      <div className="shell" onClick={e => { if (!e.target.closest(".sb") && !e.target.closest(".hdr-ham")) setSbOpen(false); }} style={{
        "--bg":"#E8ECF0","--bg2":"#EEF1F5","--sl":"#FFFFFF","--card":"#FFFFFF","--card2":"#F0F3F7",
        "--bdr":"#D1D9E6","--p":"#FF4D6D","--ph":"#FF6B85","--txt":"#2D3436","--t2":"#636E72","--t3":"#B2BEC3",
        "--shadow":"6px 6px 18px rgba(166,180,200,.55),-6px -6px 18px rgba(255,255,255,.85)",
        "--shadow-sm":"3px 3px 8px rgba(166,180,200,.5),-3px -3px 8px rgba(255,255,255,.8)",
        "--shadow-in":"inset 3px 3px 8px rgba(166,180,200,.55),inset -3px -3px 8px rgba(255,255,255,.85)",
        "--hov":"#E0E5EC",
        background:"#E8ECF0", color:"#2D3436",
      }}>
        {sbOpen && <div className="sb-overlay" onClick={() => setSbOpen(false)}/>}

        {/* SIDEBAR */}
        <aside className={`sb${sbMini ? " mini" : ""}${sbOpen ? " mob-open" : ""}`}>
          <div className="sb-logo" onClick={toggleSbMini}>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAIc0lEQVR42u2af0xU2RXHP/e9NwMComKqE4SgaxEhDtZIU3+0aew2m1Vr7R8Um/QPrUYTs3ZTtTWaGJImGn8kpoptTKuxP5LqLq7rj64a06SpVmvjj5VdKygjrILYZV1UQCMw793TP4b3BEVhYAZtnZO8MMzL3HvP955z7jnfexQgvMZi8JpLAoAEAAkAEgAkAEgA8BqLNVgTKaUwDAOlFABaa0QEEenxndZ6cNYV70zQMAwMw8C27eh3x7JwHAcR+d8DwN1Vx3EA8Pv9TJkyhWnTphEMBsnJyWH48OFYlkVHRwdNTU3U1NRQUVHBuXPnqKys9MYyTdOzmHiIxPoxTdP7nJ+fL1u2bJHr169LX8VxHDl//rysWrVKRo8e3eO4MXxiN5hSyltkTk6O7N69W9ra2jzFtNYSDoclHA6Lbdti27Y4juN9dt91lcbGRiktLZXU1FQBxLKsVxMApZQopQSQpUuXSlNTk6dEOBwWx3H6bAFaa3EcpxsYlZWVMmvWrHhYQmyUd3dnz5493RTXWstAxLUa9/PKlStjDcLAlTcMQ5KSkuTYsWMxU7ynuOBa0aZNm2LpDgP3eaWUHDlyREREOjo6JF6itfbGLy0tjRUIA4/227Zti7vyPblESUlJLNxhYMrPnj3bM/vBEtcdHjx4INnZ2Z4bDhoA7oQpKSlSW1vrRe3BFBfwgwcPDtQKov+R63erV68e9N3vKrZti4jIzJkzBwJC/877lJQUqa+vfym7/7QVHD16dPAAcHe/uLi42y5EG8S6HpVds8BoEyattbS3t8u4ceMEiDoWRM0HuAVJSUmJV85GWyRZloVlWSilEBFM0/S+MwwjqrEcx8Hv9zN//nyv+oxbNeguOCUlhVAoRGZmJlrrPk3q1v2tra1s376d1tZWVqxYQXZ2NuvXr8cwDO7fv09RURGLFi1CawdDqcgSO3mCnsRxHEzT5Pjx48ydOxfTNL0KNOaMkEtY5ObmkpmZiYj0rLwIaAe6kBoigm3bLFu2jObmZrKzs1m4cCGNjY0UFRVx+vRp9u3bR1ZWFlprlGGCMiLKi46MJ/q5ayosLCQ5ORnHcbzvYs4IGYaB1prc3FyPuTFNs4viOqK8YYIyuylvGAa3bt3i7t277N+/H4CLFy9y5coV8vLyaGlpYdKkSRhGhEfQj+7DFzdQgTwYkh6xVW8OoBN4V9lAIEBmZia1tbWepcaNEhszZky3eIB0xhRlgAJp+QKu/x0+Pgyjc1E/+CWiHQKBAH6/n127djFp0iSqq6sJBoMEAgHOnDlDVVUVK955h/IDH5A9ajiydwmIA2OnQt63oeC7qJE5nY4bmVMpAxHBsixGjRrlARBXUjQ9Pf3JP9qJmKkykPoKZP/PYOss1J+Woz75CHXpQ2hrBWUwZMgQduzYwbVr1yguLmbevHn4fD7u3LlDamoqRUVF5E2cSPW1SlTyUCT4NqqpDvXvk6j3VqO2von8fglSfdqbE/2EMhs6dOjgsMIewtoBw0Qe3EH+/FPUr+aizv4R1dYKqRkwIgtaGpHQWZRSaDtMbm4uK1eupLCwkDVr1nDp0iVKSkqoqqqivLycmpoaphYVRay8cA74kiFlOKSPBnFQHx9B/aYY+d2PkTuVEXfTDv2VfrlAa2trxBf9Scinx+H9n6Oa/xNROikN7HZ43ALajvyt+AsE3/bc5sCBAyxatAjLsnjrrbeoq6tj7dq1JCUlUVZWxoiMkQig3vgGEpiAarga2XHDguQ0MH2oq39FQmeQ75fCt5YAwqNHD+NLilqWhW3b/Kjkh+x/v5zwP/6Ar3x1RGkrCR4/ALsDUjOQzHwY93XImQpjClBfGf/M0eWarlKq23HqHpkA0vw5NFyF+k/gs/NQ/ymq+XMwfeBLRh63oOauQc9Zx8TcXEI3bnjBOuYW4A5aXd+IDp3G+mANJKdD+0NwOpA3psHXvgf530GN+upzx3GV73oPYBhGN0C8HRoWgGEBKHjTA0RCZ6HiKCp0BlEG6uRWbj+Eui+buwfneCVCIzNGULt8HOnNtYg/DQrnwDd/gho/7SnEHPeHkYDVL85aOs9/95R5Mo40hpB/7UNdeI8Hd25ReNChoTWMQtBRJKh95wBUpBiaPz5Z5N1hEv51sejPLnTNzkUcW0Q78WREnpmj48s6kSO/kHeDPgHEb5nxKYZ8ZqTQWB4cIvLP34rH/8Rb6eeC4Yg4tjgi4ojIpb995N0jRFEZRlcGp6amyokTJ0R3MjMvRfEerMKxI6VxTU2N5OfnR1MZ9p38tCxLTp48Gdn0cIe8amJ38gO3b9+OhirrO/+3YcOGiM+1t8urKi5JcurUKTEMY+AAuAOMHTtW2traxLbtmHP+sRaXnS4uLu6VOjf6UgECLFiwgKSkpG7n99P1/mDd6fc2j3tcL168uNe8wOj9GI78eOrUqS9kXJ6+Do+n8r0RMC7bVFBQgM/neyFH0OdEKCcnp8dqSymFUgq/309ZWRnTp08nHA57i4il4i59tmfPHsrKyrwU+nli2zbV1dW9WkzMblrT0tLk0KFDz9DWsboJEhHZuHHjy7kedyPq856uice6deu8vgCtdb8C59PX4w0NDV5QM01TTNPsdU0xywOivTECZPLkyXL48OEelXIbI7o+XanxrmA9evRIdu7c2Z8Mb/A7RHpqZZkxY4bs3btXGhsbo7KAUCgkmzdvlgkTJsS1RSZuTVJupHYDUEZGBtOnT2fGjBkEg0GysrIYNmyY1yR17949bt68yeXLlzl79iwXLlygra0t7k1Sg9Im515g9HRcmaaJbdvPfR/vnsG4A9BTo6SIPKPw0+/j2Rb3UgB4IbkaJYvzfwPAqyCJbvEEAAkAEgAkAEgAkAAgAUACgAQAr6n8F65nk/m3F2dQAAAAAElFTkSuQmCC" alt="93NPC" style={{ width:34, height:34, objectFit:"contain", flexShrink:0 }}/>
            <span className="sb-logo-t" style={{ fontSize:20, fontWeight:900, letterSpacing:2 }}>93NPC</span>
          </div>
          <nav className="sb-nav">
            {NAV.map(it => (
              <div key={it.id} className={`sb-item${page === it.id ? " on" : ""}`} onClick={() => go(it.id)}>
                <Icon n={it.icon} s={17}/><span className="sb-lbl">{it.label}</span>
              </div>
            ))}
            <div style={{ flex: 1 }}/>
            <div className="sb-div"/>
            <div className="sb-item" style={{ color: "#EF4444" }} onClick={logout}>
              <Icon n="out" s={17}/><span className="sb-lbl">Logout</span>
            </div>
          </nav>
          <div className="sb-promo">
            {user.role === "creator" ? (
              <>
                <div className="promo-badge" style={{ background:`linear-gradient(90deg,${PLANS[user.plan||"free"].color},${PLANS[user.plan||"free"].color}bb)` }}>
                  {user.plan === "creator_plus" ? "🟠 Creator+" : "🆓 FREE"}
                </div>
                <div className="promo-t">Your Studio</div>
                <div className="promo-d">
                  {!isCreatorPlus(user)
                    ? "Upgrade to Creator+ for unlimited games, 6 images, 2 videos & more"
                    : `Creator+ active — ×${PLANS.creator_plus.boost} visibility boost`
                  }
                </div>
                <button className="promo-btn" onClick={() => go("creator")}>
                  {!isCreatorPlus(user) ? "🟠 Upgrade to Creator+" : "Open Studio"}
                </button>
              </>
            ) : (
              <>
                <div className="promo-badge">✦ CREATOR</div>
                <div className="promo-t">Publish Your Game</div>
                <div className="promo-d">Submit games and reach players worldwide.</div>
                <button className="promo-btn" onClick={() => go("settings")}>Become a Creator →</button>
              </>
            )}
          </div>
          <button className="sb-toggle" onClick={toggleSbMini}>
            <Icon n={sbMini ? "cR" : "cL"} s={14}/>
          </button>
        </aside>

        {/* MAIN */}
        <div className="main">
          <header className="hdr" style={{ position: "relative" }}>
            <button className="hdr-ham" onClick={e => { e.stopPropagation(); setSbOpen(!sbOpen); }}>
              <Icon n="menu" s={17}/>
            </button>
            <div className="hdr-search" ref={searchRef}>
              <Icon n="search" s={14}/>
              <input
                placeholder="Search games…"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
              />
              {search && <button style={{ background:"none",border:"none",color:"var(--t2)",cursor:"pointer",display:"flex" }} onClick={() => { setSearch(""); setShowSearch(false); }}><Icon n="x" s={14}/></button>}
            </div>
            {showSearch && <SearchDrop query={search} games={games} onSelect={g => setSelGame(g)} onClose={() => { setShowSearch(false); setSearch(""); }}/>}
            <div className="hdr-r">
              <div className="hdr-ico" onClick={() => { setShowNotifs(!showNotifs); setShowSearch(false); }}>
                <Icon n="bell" s={16}/>
                {notifs.length > 0 && <div className="nb">{Math.min(notifs.length, 9)}</div>}
              </div>
              {showNotifs && <NotifPanel notifs={notifs} onClear={() => setNotifs([])} onClose={() => setShowNotifs(false)}/>}
              <div className="av-sm" onClick={() => go("profile")}>{user.username[0].toUpperCase()}</div>
            </div>
          </header>

          <div className="content">{renderPage()}</div>

          <nav className="bn">
            {BOT.map(it => (
              <div key={it.id} className={`bn-item${page === it.id ? " on" : ""}`} onClick={() => go(it.id)}>
                <div className="bn-ico-wrap"><Icon n={it.i} s={19}/></div>
                <span className="bn-lbl">{it.l}</span>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {selGame && (
        <GameModal
          game={selGame}
          onClose={() => setSelGame(null)}
          favs={favs}
          toggleFav={toggleFav}
          games={games}
          setGames={setGames}
          user={user}
          onPlay={g => {
            // Increment plays + track history
            const n = games.map(x => x.id === g.id ? { ...x, plays: x.plays + 1 } : x);
            setGames(n); LS.set("gder_games", n);
            if (!played.includes(g.id)) { const p=[...played,g.id]; setPlayed(p); LS.set("gder_played",p); }
            // Track timestamp for creator "In-Game Now" stat
            const playing = LS.get("gder_playing", {}); playing[g.id] = Date.now(); LS.set("gder_playing", playing);
            // Open URL synchronously (direct user gesture) — avoids popup blockers on mobile
            if (g.url) {
              const url = /^https?:\/\//.test(g.url) ? g.url : `https://${g.url}`;
              window.open(url, "_blank", "noopener,noreferrer");
            } else {
              showToast("No game link set — ask the creator to add one", true);
            }
            setSelGame(null);
          }}
        />
      )}

      {toast && (
        <div className={`toast${toast.isErr ? " err-toast" : ""}`}>
          <div className="toast-ico"><Icon n={toast.isErr ? "x" : "check"} s={11}/></div>
          {toast.msg}
        </div>
      )}
    </>
  );
}
