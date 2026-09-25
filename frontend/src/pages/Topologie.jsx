import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  ConnectionMode,
  EdgeLabelRenderer,
  Panel,
  useNodesState,
  useReactFlow,
  useInternalNode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import api from "../services/api";
import LegendeLiaisons from "../components/LegendeLiaisons";
import { TraceLiaison } from "../components/TraceLiaison";
import { cheminSvg } from "../utils/symbolesLiaison";
import {
  TYPES_LIAISON,
  LIBELLE_CATEGORIE,
  libelleLiaison,
  courtLiaison,
  categorieLiaison,
  couleurLiaison,
  epaisseurLiaison,
  formeLiaison,
} from "../utils/liaisonTypes";
import { urlIconeEquipement } from "../utils/iconesEquipements";

const TAILLE_NOEUD = 68;
const TYPE_DRAG = "application/zranexus-equipement";
const FORM_VIDE = { type_liaison: "", interface_source: "", interface_destination: "", debit: "", sous_reseau: "", description: "" };

/* ───────────── Équipement (nœud) ───────────── */

function NoeudEquipement({ data, selected }) {
  const couleur = data.statut === "disponible" ? "#2ecc71" : "#e74c3c";
  return (
    <div className="noeud-eq" style={{ width: TAILLE_NOEUD, height: TAILLE_NOEUD, position: "relative" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "white",
          border: `3px solid ${couleur}`,
          borderRadius: 14,
          boxShadow: selected ? "0 0 0 3px #3498db, 0 2px 8px rgba(0,0,0,.35)" : "0 2px 6px rgba(0,0,0,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={data.iconeUrl} alt="" draggable={false} style={{ width: 40, height: 40, objectFit: "contain" }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: TAILLE_NOEUD + 4,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          background: "rgba(255,255,255,.8)",
          borderRadius: 4,
          padding: "0 4px",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#222" }}>{data.nom}</div>
        {data.ip && <div style={{ fontSize: 10, color: "#555" }}>{data.ip}</div>}
      </div>
      <Handle id="t" type="source" position={Position.Top} />
      <Handle id="r" type="source" position={Position.Right} />
      <Handle id="b" type="source" position={Position.Bottom} />
      <Handle id="l" type="source" position={Position.Left} />
    </div>
  );
}

/* ───────────── Liaison (arête) ───────────── */

// Extrémités de la liaison : de bord à bord des deux équipements, décalées si plusieurs liaisons relient la même paire
function extremites(noeudA, noeudB, decalage) {
  const centre = (n) => ({
    x: n.internals.positionAbsolute.x + (n.measured?.width ?? TAILLE_NOEUD) / 2,
    y: n.internals.positionAbsolute.y + (n.measured?.height ?? TAILLE_NOEUD) / 2,
  });
  const a = centre(noeudA);
  const b = centre(noeudB);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longueur = Math.hypot(dx, dy);
  if (longueur < 1) return null;
  const d = [dx / longueur, dy / longueur];
  const n = [-d[1], d[0]];
  const demi = TAILLE_NOEUD / 2 + 4;
  const t = Math.min(demi / (Math.abs(d[0]) || 1e-9), demi / (Math.abs(d[1]) || 1e-9));
  if (2 * t >= longueur) return null; // équipements collés : pas de place pour tracer
  const p1 = [a.x + d[0] * t + n[0] * decalage, a.y + d[1] * t + n[1] * decalage];
  const p2 = [b.x - d[0] * t + n[0] * decalage, b.y - d[1] * t + n[1] * decalage];
  return { p1, p2, d, n };
}

const styleEtiquette = {
  position: "absolute",
  background: "rgba(255,255,255,.9)",
  borderRadius: 4,
  padding: "0 3px",
  fontSize: 10,
  color: "#333",
  pointerEvents: "none",
  whiteSpace: "nowrap",
};

function LiaisonArete({ source, target, data }) {
  const noeudA = useInternalNode(source);
  const noeudB = useInternalNode(target);
  if (!noeudA || !noeudB) return null;
  const g = extremites(noeudA, noeudB, data.decalage);
  if (!g) return null;

  const { p1, p2, d } = g;
  const { liaison, horsService, selectionnee } = data;
  const type = liaison.type_liaison;
  const couleur = couleurLiaison(type, horsService);

  // normale tournée vers le haut, pour poser les textes au-dessus du trait
  let n = g.n;
  if (n[1] > 0 || (n[1] === 0 && n[0] < 0)) n = [-n[0], -n[1]];

  const milieu = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  // la pastille du type est posée sur le trait, ou au-dessus quand le symbole (Z, ondes) occupe le milieu
  const forme = formeLiaison(type);
  const ecart = forme === "eclair" ? 27 : forme === "ondes" ? 17 : 0;
  const pastille = [milieu[0] + n[0] * ecart, milieu[1] + n[1] * ecart];
  const posInterfaceA = [p1[0] + d[0] * 30 + n[0] * 11, p1[1] + d[1] * 30 + n[1] * 11];
  const posInterfaceB = [p2[0] - d[0] * 30 + n[0] * 11, p2[1] - d[1] * 30 + n[1] * 11];
  const centrer = ([x, y]) => `translate(-50%,-50%) translate(${x}px,${y}px)`;

  return (
    <>
      {/* zone cliquable large */}
      <path d={cheminSvg([p1, p2])} stroke="transparent" strokeWidth={22} fill="none" style={{ pointerEvents: "stroke", cursor: "pointer" }} />
      {selectionnee && (
        <path d={cheminSvg([p1, p2])} stroke="#3498db" strokeOpacity={0.35} strokeWidth={epaisseurLiaison(type) + 9} strokeLinecap="round" fill="none" />
      )}
      <TraceLiaison p1={p1} p2={p2} type={type} horsService={horsService} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          onClick={() => data.onSelect(liaison.id)}
          style={{
            position: "absolute",
            transform: centrer(pastille),
            pointerEvents: "all",
            cursor: "pointer",
            background: "white",
            color: couleur,
            border: `1.5px solid ${couleur}`,
            borderRadius: 10,
            padding: "1px 7px",
            fontSize: 11,
            fontWeight: "bold",
            boxShadow: "0 1px 3px rgba(0,0,0,.3)",
            whiteSpace: "nowrap",
          }}
        >
          {courtLiaison(type)}
        </div>
        {liaison.interface_source && <div style={{ ...styleEtiquette, transform: centrer(posInterfaceA) }}>{liaison.interface_source}</div>}
        {liaison.interface_destination && <div style={{ ...styleEtiquette, transform: centrer(posInterfaceB) }}>{liaison.interface_destination}</div>}
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { equipement: NoeudEquipement };
const edgeTypes = { liaison: LiaisonArete };

/* ───────────── Formulaire de liaison ───────────── */

const inputStyle = { width: "100%", marginBottom: 6, padding: 6, boxSizing: "border-box" };
const boutonStyle = { width: "100%", padding: 8, marginBottom: 6, cursor: "pointer" };

function ChampsLiaison({ form, onChange }) {
  return (
    <>
      <select name="type_liaison" value={form.type_liaison} onChange={onChange} required style={inputStyle}>
        <option value="">-- Type de connexion --</option>
        {form.type_liaison && !TYPES_LIAISON[form.type_liaison] && <option value={form.type_liaison}>{form.type_liaison} (ancien)</option>}
        {["filaire", "sans_fil"].map((cat) => (
          <optgroup key={cat} label={LIBELLE_CATEGORIE[cat]}>
            {Object.entries(TYPES_LIAISON)
              .filter(([, t]) => t.categorie === cat)
              .map(([cle, t]) => (
                <option key={cle} value={cle}>
                  {t.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <input name="interface_source" placeholder="Interface source (ex: e0/0)" value={form.interface_source} onChange={onChange} style={inputStyle} />
      <input name="interface_destination" placeholder="Interface destination (ex: e0/1)" value={form.interface_destination} onChange={onChange} style={inputStyle} />
      <input name="debit" placeholder="Débit (ex: 1 Gbit/s)" value={form.debit} onChange={onChange} style={inputStyle} />
      <input name="sous_reseau" placeholder="Sous-réseau (ex: 10.0.0.0/30)" value={form.sous_reseau} onChange={onChange} style={inputStyle} />
      <input name="description" placeholder="Description" value={form.description} onChange={onChange} style={inputStyle} />
    </>
  );
}

function versCorps(form) {
  return {
    type_liaison: form.type_liaison || null,
    interface_source: form.interface_source || null,
    interface_destination: form.interface_destination || null,
    debit: form.debit || null,
    sous_reseau: form.sous_reseau || null,
    description: form.description || null,
  };
}

/* ───────────── Page ───────────── */

function Contenu() {
  const navigate = useNavigate();
  const { screenToFlowPosition, fitView, setCenter } = useReactFlow();
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const conteneurRef = useRef(null);
  const [hauteur, setHauteur] = useState(600);
  const [pleinEcran, setPleinEcran] = useState(false);

  const [sites, setSites] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [types, setTypes] = useState([]);
  const [liaisons, setLiaisons] = useState([]);
  const [placement, setPlacement] = useState({}); // { idEquipement: {x, y} }
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [filtreSite, setFiltreSite] = useState("");
  const [panneau, setPanneau] = useState(null); // {mode:"nouvelle",source,target} | {mode:"liaison",id} | {mode:"noeud",id}
  const [form, setForm] = useState(FORM_VIDE);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const dejaCadre = useRef(false);

  useLayoutEffect(() => {
    const maj = () => {
      if (document.fullscreenElement) {
        setHauteur(window.innerHeight);
        return;
      }
      const haut = conteneurRef.current?.getBoundingClientRect().top ?? 0;
      setHauteur(Math.max(420, window.innerHeight - haut));
    };
    maj();
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, []);

  useEffect(() => {
    const handler = () => setPleinEcran(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    const haut = pleinEcran ? window.innerHeight : Math.max(420, window.innerHeight - (conteneurRef.current?.getBoundingClientRect().top ?? 0));
    setHauteur(haut);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
  }, [pleinEcran]);

  const basculerPleinEcran = () => {
    if (!document.fullscreenElement) {
      conteneurRef.current.requestFullscreen().catch((err) => {
        setErreur("Impossible d'activer le plein écran : " + err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  /* chargement des données */
  const chargerTout = useCallback(async () => {
    try {
      const [s, e, t, l, p] = await Promise.all([
        api.get("/api/sites", { headers }),
        api.get("/api/equipements", { headers }),
        api.get("/api/type-equipements", { headers }),
        api.get("/api/liaisons/", { headers }),
        api.get("/api/topologie/positions", { headers }),
      ]);
      setSites(s.data);
      setEquipements(e.data);
      setTypes(t.data);
      setLiaisons(l.data);
      setPlacement(Object.fromEntries(p.data.map((x) => [x.equipement_id, { x: x.x, y: x.y }])));
      setErreur("");
    } catch (err) {
      setErreur("Impossible de charger la topologie.");
    } finally {
      setChargement(false);
    }
  }, [headers]);

  const rafraichirStatuts = useCallback(async () => {
    try {
      const [e, l] = await Promise.all([api.get("/api/equipements", { headers }), api.get("/api/liaisons/", { headers })]);
      setEquipements(e.data);
      setLiaisons(l.data);
    } catch (err) {
      /* silencieux : on réessaie au prochain passage */
    }
  }, [headers]);

  useEffect(() => {
    chargerTout();
  }, [chargerTout]);

  useEffect(() => {
    const t = setInterval(rafraichirStatuts, 30000);
    return () => clearInterval(t);
  }, [rafraichirStatuts]);

  /* équipements placés → nœuds */
  useEffect(() => {
    const typeParId = Object.fromEntries(types.map((t) => [t.id, t]));
    const construits = equipements
      .filter((e) => placement[e.id])
      .map((e) => {
        const t = typeParId[e.type_id];
        return {
          id: String(e.id),
          type: "equipement",
          position: { x: placement[e.id].x, y: placement[e.id].y },
          data: { nom: e.nom, ip: e.adresse_ip, statut: e.statut, iconeUrl: urlIconeEquipement(t?.libelle, t?.icone) },
        };
      });
    setNodes((prev) => {
      const anciens = Object.fromEntries(prev.map((n) => [n.id, n]));
      return construits.map((n) => {
        const ancien = anciens[n.id];
        if (!ancien) return n;
        return ancien.dragging ? { ...n, position: ancien.position, dragging: true, selected: ancien.selected } : { ...n, selected: ancien.selected };
      });
    });
  }, [equipements, types, placement, setNodes]);

  useEffect(() => {
    if (!dejaCadre.current && nodes.length > 0) {
      dejaCadre.current = true;
      setTimeout(() => fitView({ padding: 0.25, maxZoom: 1.2 }), 80);
    }
  }, [nodes, fitView]);

  /* liaisons → arêtes */
  const equipementParId = useMemo(() => Object.fromEntries(equipements.map((e) => [e.id, e])), [equipements]);

  const selectionnerLiaison = useCallback((id) => setPanneau({ mode: "liaison", id }), []);

  const { edges, liaisonsMasquees } = useMemo(() => {
    const visibles = liaisons.filter((l) => placement[l.equipement_source_id] && placement[l.equipement_destination_id] && equipementParId[l.equipement_source_id] && equipementParId[l.equipement_destination_id]);
    const cle = (l) => [l.equipement_source_id, l.equipement_destination_id].sort((a, b) => a - b).join("-");
    const total = {};
    visibles.forEach((l) => (total[cle(l)] = (total[cle(l)] || 0) + 1));
    const rang = {};
    const aretes = visibles.map((l) => {
      const k = cle(l);
      const i = rang[k] || 0;
      rang[k] = i + 1;
      const s = equipementParId[l.equipement_source_id];
      const dst = equipementParId[l.equipement_destination_id];
      return {
        id: `l${l.id}`,
        source: String(l.equipement_source_id),
        target: String(l.equipement_destination_id),
        type: "liaison",
        data: {
          liaison: l,
          horsService: s.statut === "indisponible" || dst.statut === "indisponible",
          decalage: (i - (total[k] - 1) / 2) * 34,
          selectionnee: panneau?.mode === "liaison" && panneau.id === l.id,
          onSelect: selectionnerLiaison,
        },
      };
    });
    return { edges: aretes, liaisonsMasquees: liaisons.length - visibles.length };
  }, [liaisons, placement, equipementParId, panneau, selectionnerLiaison]);

  /* enregistrement des positions */
  const placer = useCallback(
    async (liste) => {
      setPlacement((prev) => {
        const suivant = { ...prev };
        liste.forEach((p) => (suivant[p.id] = { x: p.x, y: p.y }));
        return suivant;
      });
      try {
        await api.put("/api/topologie/positions", liste.map((p) => ({ equipement_id: p.id, x: p.x, y: p.y })), { headers });
      } catch (err) {
        setErreur("Impossible d'enregistrer la position.");
      }
    },
    [headers]
  );

  const retirer = async (id) => {
    try {
      await api.delete(`/api/topologie/positions/${id}`, { headers });
      setPlacement((prev) => {
        const suivant = { ...prev };
        delete suivant[id];
        return suivant;
      });
      setPanneau(null);
    } catch (err) {
      setErreur("Impossible de retirer l'équipement.");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData(TYPE_DRAG));
    if (!id) return;
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    placer([{ id, x: pos.x - TAILLE_NOEUD / 2, y: pos.y - TAILLE_NOEUD / 2 }]);
  };

  const ajouterAuCentre = (id) => {
    const rect = conteneurRef.current.getBoundingClientRect();
    const pos = screenToFlowPosition({ x: rect.left + rect.width / 2 + 130, y: rect.top + rect.height / 2 });
    const alea = () => Math.round((Math.random() - 0.5) * 60);
    placer([{ id, x: pos.x - TAILLE_NOEUD / 2 + alea(), y: pos.y - TAILLE_NOEUD / 2 + alea() }]);
  };

  const placerTout = () => {
    const aPlacer = equipementsFiltres.filter((e) => !placement[e.id]);
    if (aPlacer.length === 0) return;
    const ys = Object.values(placement).map((p) => p.y);
    const yDepart = ys.length ? Math.max(...ys) + 180 : 0;
    const parSite = {};
    aPlacer.forEach((e) => (parSite[e.site_id] = [...(parSite[e.site_id] || []), e]));
    const COLONNES = 4;
    const liste = [];
    let x0 = 0;
    Object.values(parSite).forEach((groupe) => {
      groupe.forEach((e, i) => liste.push({ id: e.id, x: x0 + (i % COLONNES) * 140, y: yDepart + Math.floor(i / COLONNES) * 150 }));
      x0 += Math.min(groupe.length, COLONNES) * 140 + 100;
    });
    placer(liste);
    setTimeout(() => fitView({ padding: 0.25, maxZoom: 1.2 }), 150);
  };

  const centrerSur = (id) => {
    const p = placement[id];
    if (p) setCenter(p.x + TAILLE_NOEUD / 2, p.y + TAILLE_NOEUD / 2, { zoom: 1.2, duration: 500 });
    setPanneau({ mode: "noeud", id });
  };

  /* panneau de droite */
  useEffect(() => {
    if (panneau?.mode === "liaison") {
      const l = liaisons.find((x) => x.id === panneau.id);
      if (l) {
        setForm({
          type_liaison: l.type_liaison || "",
          interface_source: l.interface_source || "",
          interface_destination: l.interface_destination || "",
          debit: l.debit || "",
          sous_reseau: l.sous_reseau || "",
          description: l.description || "",
        });
      }
    } else if (panneau?.mode === "nouvelle") {
      setForm(FORM_VIDE);
    }
    // on ne recharge le formulaire que quand la sélection change, pas à chaque rafraîchissement des statuts
  }, [panneau?.mode, panneau?.id, panneau?.source, panneau?.target]); // eslint-disable-line react-hooks/exhaustive-deps

  const changerForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const messageErreur = (err, defaut) => {
    const detail = err?.response?.data?.detail;
    return typeof detail === "string" ? detail : defaut;
  };

  const creerLiaison = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/liaisons/", { equipement_source_id: panneau.source, equipement_destination_id: panneau.target, ...versCorps(form) }, { headers });
      setPanneau(null);
      setErreur("");
      rafraichirStatuts();
    } catch (err) {
      setErreur(messageErreur(err, "Erreur lors de la création de la liaison."));
    }
  };

  const modifierLiaison = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/liaisons/${panneau.id}`, versCorps(form), { headers });
      setErreur("");
      rafraichirStatuts();
    } catch (err) {
      setErreur(messageErreur(err, "Erreur lors de la modification."));
    }
  };

  const supprimerLiaison = async () => {
    if (!window.confirm("Supprimer cette liaison ?")) return;
    try {
      await api.delete(`/api/liaisons/${panneau.id}`, { headers });
      setPanneau(null);
      rafraichirStatuts();
    } catch (err) {
      setErreur("Erreur lors de la suppression de la liaison.");
    }
  };

  /* liste de gauche */
  const nomSite = (id) => sites.find((s) => s.id === id)?.nom || "";
  const equipementsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const mac = q.replace(/[^0-9a-f]/g, "");
    return equipements
      .filter((e) => !filtreSite || String(e.site_id) === filtreSite)
      .filter(
        (e) =>
          !q ||
          (e.nom || "").toLowerCase().includes(q) ||
          (e.adresse_ip || "").includes(q) ||
          (mac.length >= 4 && (e.adresse_mac || "").toLowerCase().replace(/[^0-9a-f]/g, "").includes(mac))
      )
      .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
  }, [equipements, recherche, filtreSite]);

  const liaisonSelectionnee = panneau?.mode === "liaison" ? liaisons.find((l) => l.id === panneau.id) : null;
  const equipementSelectionne = panneau?.mode === "noeud" ? equipementParId[panneau.id] : null;

  return (
    <div ref={conteneurRef} style={{ display: "flex", height: hauteur, width: "100%", background: "#f4f6f8" }}>
      <style>{`
        .noeud-eq .react-flow__handle { opacity: 0; width: 12px; height: 12px; background: #3498db; border: 2px solid white; }
        .noeud-eq:hover .react-flow__handle { opacity: 1; }
        .react-flow__node-equipement { cursor: grab; }
      `}</style>

      {/* ── Panneau des équipements ── */}
      <div style={{ width: 270, background: "white", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column", padding: 10, boxSizing: "border-box" }}>
        <button onClick={() => navigate("/carte")} style={{ ...boutonStyle, marginBottom: 6 }}>
          ← Carte réseau
        </button>
        <button onClick={basculerPleinEcran} style={{ ...boutonStyle, marginBottom: 10 }}>
          {pleinEcran ? "🡼 Quitter le plein écran" : "⛶ Plein écran"}
        </button>
        <strong style={{ marginBottom: 6 }}>Équipements</strong>
        <input placeholder="Nom, IP ou MAC…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={inputStyle} />
        <select value={filtreSite} onChange={(e) => setFiltreSite(e.target.value)} style={inputStyle}>
          <option value="">Tous les sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
              {s.ville ? ` — ${s.ville}` : ""}
            </option>
          ))}
        </select>
        <button onClick={placerTout} style={boutonStyle} title="Place sur la zone de travail tous les équipements de la liste qui n'y sont pas encore">
          Placer tout ({equipementsFiltres.filter((e) => !placement[e.id]).length})
        </button>
        <div style={{ fontSize: 11, color: "#777", marginBottom: 6 }}>Glisse un équipement sur la zone de travail, ou clique sur ＋.</div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {chargement && <div style={{ color: "#777" }}>Chargement…</div>}
          {!chargement && equipementsFiltres.length === 0 && <div style={{ color: "#777" }}>Aucun équipement.</div>}
          {equipementsFiltres.map((e) => {
            const place = !!placement[e.id];
            const t = types.find((x) => x.id === e.type_id);
            return (
              <div
                key={e.id}
                draggable={!place}
                onDragStart={(ev) => ev.dataTransfer.setData(TYPE_DRAG, String(e.id))}
                onClick={() => place && centrerSur(e.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 6px",
                  marginBottom: 4,
                  border: "1px solid #e3e3e3",
                  borderRadius: 6,
                  background: place ? "#f0f4f7" : "white",
                  cursor: place ? "pointer" : "grab",
                  opacity: place ? 0.75 : 1,
                }}
              >
                <img src={urlIconeEquipement(t?.libelle, t?.icone)} alt="" draggable={false} style={{ width: 24, height: 24, objectFit: "contain" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nom}</div>
                  <div style={{ fontSize: 10, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[e.adresse_ip, nomSite(e.site_id)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: e.statut === "disponible" ? "#2ecc71" : "#e74c3c" }} />
                {place ? (
                  <span title="Déjà sur la zone de travail">✓</span>
                ) : (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      ajouterAuCentre(e.id);
                    }}
                    title="Ajouter à la zone de travail"
                    style={{ border: "none", background: "#3498db", color: "white", borderRadius: 4, cursor: "pointer", padding: "0 6px" }}
                  >
                    ＋
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {liaisonsMasquees > 0 && (
          <div style={{ fontSize: 11, color: "#a66", marginTop: 6 }}>
            {liaisonsMasquees} liaison(s) non affichée(s) : un de leurs équipements n'est pas sur la zone de travail.
          </div>
        )}
      </div>

      {/* ── Zone de travail ── */}
      <div style={{ flex: 1, position: "relative" }} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onConnect={(c) => c.source !== c.target && setPanneau({ mode: "nouvelle", source: Number(c.source), target: Number(c.target) })}
          onNodeClick={(_, n) => setPanneau({ mode: "noeud", id: Number(n.id) })}
          onEdgeClick={(_, ar) => selectionnerLiaison(ar.data.liaison.id)}
          onPaneClick={() => setPanneau((p) => (p?.mode === "nouvelle" ? p : null))}
          onNodeDragStop={(_, n, liste) => placer((liste?.length ? liste : [n]).map((x) => ({ id: Number(x.id), x: x.position.x, y: x.position.y })))}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={null}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background gap={24} color="#d5dbe0" />
          <Controls position="bottom-right" showInteractive={false} />

          {erreur && (
            <Panel position="top-center">
              <div style={{ background: "#fdecea", color: "#b71c1c", border: "1px solid #f5c6cb", borderRadius: 6, padding: "6px 12px", fontSize: 13 }}>
                {erreur}{" "}
                <button onClick={() => setErreur("")} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            </Panel>
          )}

          {panneau && (
            <Panel position="top-right">
              <div style={{ width: 270, background: "white", borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,.3)", padding: 14, boxSizing: "border-box", maxHeight: "80vh", overflowY: "auto" }}>
                {panneau.mode === "nouvelle" && (
                  <form onSubmit={creerLiaison}>
                    <h3 style={{ marginTop: 0 }}>Nouvelle liaison</h3>
                    <p style={{ fontSize: 13 }}>
                      <strong>{equipementParId[panneau.source]?.nom}</strong> ↔ <strong>{equipementParId[panneau.target]?.nom}</strong>
                    </p>
                    <ChampsLiaison form={form} onChange={changerForm} />
                    <button type="submit" style={boutonStyle}>
                      Créer la liaison
                    </button>
                    <button type="button" onClick={() => setPanneau(null)} style={boutonStyle}>
                      Annuler
                    </button>
                  </form>
                )}

                {panneau.mode === "liaison" && liaisonSelectionnee && (
                  <form onSubmit={modifierLiaison}>
                    <h3 style={{ marginTop: 0 }}>Liaison</h3>
                    <p style={{ fontSize: 13, marginBottom: 4 }}>
                      <strong>{equipementParId[liaisonSelectionnee.equipement_source_id]?.nom}</strong> ↔{" "}
                      <strong>{equipementParId[liaisonSelectionnee.equipement_destination_id]?.nom}</strong>
                    </p>
                    <p style={{ fontSize: 12, color: "#555", marginTop: 0 }}>
                      {libelleLiaison(liaisonSelectionnee.type_liaison)}
                      {categorieLiaison(liaisonSelectionnee.type_liaison) ? ` · ${LIBELLE_CATEGORIE[categorieLiaison(liaisonSelectionnee.type_liaison)].toLowerCase()}` : ""}
                    </p>
                    <ChampsLiaison form={form} onChange={changerForm} />
                    <button type="submit" style={boutonStyle}>
                      Enregistrer
                    </button>
                    <button type="button" onClick={supprimerLiaison} style={{ ...boutonStyle, color: "#c0392b" }}>
                      Supprimer la liaison
                    </button>
                    <button type="button" onClick={() => setPanneau(null)} style={boutonStyle}>
                      Fermer
                    </button>
                  </form>
                )}

                {panneau.mode === "noeud" && equipementSelectionne && (
                  <div>
                    <h3 style={{ marginTop: 0 }}>{equipementSelectionne.nom}</h3>
                    <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                      Site : {nomSite(equipementSelectionne.site_id) || "—"}
                      <br />
                      Type : {types.find((t) => t.id === equipementSelectionne.type_id)?.libelle || "Non déterminé"}
                      <br />
                      IP : {equipementSelectionne.adresse_ip || "—"}
                      <br />
                      MAC : {equipementSelectionne.adresse_mac || "—"}
                      <br />
                      Statut :{" "}
                      <strong style={{ color: equipementSelectionne.statut === "disponible" ? "#27ae60" : "#c0392b" }}>
                        {equipementSelectionne.statut === "disponible" ? "Disponible" : "Indisponible"}
                      </strong>
                    </div>
                    <p style={{ fontSize: 11, color: "#777" }}>Pour relier cet équipement, tire un trait depuis un des points bleus qui apparaissent sur ses bords vers un autre équipement.</p>
                    <button onClick={() => retirer(equipementSelectionne.id)} style={boutonStyle}>
                      Retirer de la topologie
                    </button>
                    <button onClick={() => setPanneau(null)} style={boutonStyle}>
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </ReactFlow>

        {!chargement && nodes.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: "#7f8c8d", textAlign: "center", fontSize: 15 }}>
            La zone de travail est vide.
            <br />
            Glisse des équipements depuis la liste de gauche, ou clique sur « Placer tout ».
          </div>
        )}

        <LegendeLiaisons style={{ left: 12, bottom: 12 }} />
      </div>
    </div>
  );
}

export default function Topologie() {
  return (
    <ReactFlowProvider>
      <Contenu />
    </ReactFlowProvider>
  );
}
