// Community Calendar — dock calendar page.
// Shows live community huddles (relay read model) and events you create.
// Views: 今日 / 週 (24h time grid) / 月 / 年. Double-click a day to add an
// event; click an event to edit it. Single self-contained ES module.

export const inject = ["react", "pages", "navigation"];

const PLUGIN_ID = "n.community-calendar";
const PAGE_ID = "calendar";
const STORE_KEY = "n.community-calendar:events";
const PREFS_KEY = "n.community-calendar:prefs";
// ---------- i18n ----------
// Fork-friendly: copy a locale object, translate the values (and the two
// weekday arrays), add `languageName`, and it appears in the language
// selector. Missing keys fall back to `ja`.
const STRINGS = {
  ja: {
    languageName: "日本語",
    weekdays: ["日", "月", "火", "水", "木", "金", "土"],
    meeting: "会議",
    plan: "予定",
    kindMeetingOption: "会議 (ハドル)",
    kindPlanOption: "予定",
    viewToday: "今日",
    viewWeek: "週",
    viewMonth: "月",
    viewYear: "年",
    weekStartSun: "週の始まり: 日曜",
    weekStartMon: "週の始まり: 月曜",
    weekStartTitle: "週の始まりを切り替えます",
    newEvent: "＋ 予定",
    liveNow: "今のハドル",
    join: "参加する",
    openHuddle: "ハドルを開く",
    share: "共有",
    shareTitle: "リンク先チャンネルにこの予定を投稿します",
    cancel: "キャンセル",
    removeRow: "削除",
    editEvent: "予定を編集",
    addEvent: "予定を追加",
    update: "更新",
    addBtn: "追加",
    titlePh: "タイトル",
    dateLabel: "日付",
    startTimeLabel: "開始時刻",
    endTimeLabel: "終了時刻 (任意)",
    kindLabel: "種類",
    channelLabel: "チャンネル",
    noChannel: "なし",
    channelFallback: "チャンネル",
    startedAt: "開始",
    notesPh: "メモ (任意)",
    meetingHint:
      "会議にはチャンネルへのリンクが付きます。開始時になったら予定の「ハドル」ボタンからそのチャンネルを開き、huddle を開始してください。",
    persistWarn: "注意: 保存できませんでした。このセッションだけ残ります。",
    membersLabel: "メンバー (任意)",
    membersPh: "メンバーを検索して追加…",
    removeMember: "外す",
    self: "(自分)",
    prev: "前へ",
    next: "次へ",
    allDay: "終日",
    shared: "チャンネルに共有しました ✓",
    shareFailed: "共有できませんでした",
    noRelay: "リレーに接続されていません",
    pickChannel: "共有先のチャンネルを選んでください",
    cannotPost: "この接続では投稿できません",
    weekOf: (day) => `${day} の週`,
    dayTitle: (d, w) => `${d.getMonth() + 1}月${d.getDate()}日 (${w})`,
    language: "言語",
  },
  en: {
    languageName: "English",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    meeting: "Meeting",
    plan: "Plan",
    kindMeetingOption: "Meeting (huddle)",
    kindPlanOption: "Plan",
    viewToday: "Today",
    viewWeek: "Week",
    viewMonth: "Month",
    viewYear: "Year",
    weekStartSun: "Week starts: Sunday",
    weekStartMon: "Week starts: Monday",
    weekStartTitle: "Toggle week start",
    newEvent: "+ Event",
    liveNow: "Live huddles",
    join: "Join",
    openHuddle: "Open huddle",
    share: "Share",
    shareTitle: "Post this event to the linked channel",
    cancel: "Cancel",
    removeRow: "Delete",
    editEvent: "Edit event",
    addEvent: "New event",
    update: "Save",
    addBtn: "Add",
    titlePh: "Title",
    dateLabel: "Date",
    startTimeLabel: "Start",
    endTimeLabel: "End (optional)",
    kindLabel: "Type",
    channelLabel: "Channel",
    noChannel: "None",
    channelFallback: "channel",
    startedAt: "started",
    notesPh: "Notes (optional)",
    meetingHint:
      "Meetings link to their channel. When it starts, use the event's huddle button to open the channel and start a huddle.",
    persistWarn: "Note: could not save; kept for this session only.",
    membersLabel: "Members (optional)",
    membersPh: "Search members to add…",
    removeMember: "Remove",
    self: "(you)",
    prev: "Previous",
    next: "Next",
    allDay: "All day",
    shared: "Shared to the channel ✓",
    shareFailed: "Could not share",
    noRelay: "Not connected to the relay",
    pickChannel: "Choose a channel to share to",
    cannotPost: "This connection cannot post",
    weekOf: (day) => `Week of ${day}`,
    dayTitle: (d, w) => `${w} ${d.getMonth() + 1}/${d.getDate()}`,
    language: "Language",
  },
};
const LOCALES = Object.keys(STRINGS);
const LOCALE_KEY = "n.community-calendar:locale";
function loadLocale() {
  try {
    const v = JSON.parse(localStorage.getItem(LOCALE_KEY) ?? "null");
    if (v && STRINGS[v]) return v;
  } catch {}
  const langs =
    typeof navigator !== "undefined"
      ? navigator.languages ?? [navigator.language]
      : [];
  for (const l of langs)
    if (STRINGS[String(l).slice(0, 2).toLowerCase()]) return String(l).slice(0, 2).toLowerCase();
  return "ja";
}
const VIEWS = [
  { id: "today", key: "viewToday" },
  { id: "week", key: "viewWeek" },
  { id: "month", key: "viewMonth" },
  { id: "year", key: "viewYear" },
];
const HOUR_H = 46;
const GRID_H = HOUR_H * 24;

// Buzz theme tokens (the app's accent is "Citrus" lime by default).
const ACCENT = "var(--accent-9, #b8e62e)";
const ACCENT_TEXT = "var(--accent-11, inherit)";
const ACCENT_TINT = "var(--accent-3, rgba(184,230,46,0.15))";
const ACCENT_INK = "var(--accent-contrast, #111)";
const SURFACE = "var(--surface-panel, inherit)";
const SURFACE_INSET = "var(--surface-inset, rgba(127,127,127,0.1))";
const TEXT_SUBTLE = "var(--text-secondary, rgba(127,127,127,0.9))";
const BORDER =
  "1px solid var(--border-color-standard, rgba(127,127,127,0.25))";

export function apply(ctx) {
  const React = ctx.react;
  const { useState, useEffect, useMemo, useRef, useSyncExternalStore } = React;
  const e = React.createElement;

  // ---------- relay (optional service: present on this host, read models only) ----------
  const relay = ctx.reflect.get("relay");

  // ---------- generic tiny store ----------
  function createStore(initial) {
    let value = initial;
    const listeners = new Set();
    return {
      get: () => value,
      set(next) {
        if (next === value) return;
        value = next;
        for (const l of listeners) l();
      },
      subscribe(l) {
        listeners.add(l);
        return () => listeners.delete(l);
      },
    };
  }

  // ---------- persistent events ----------
  let persistOk = true;
  function loadEvents() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed?.events) ? parsed.events : [];
    } catch {
      persistOk = false;
      return [];
    }
  }
  const eventsStore = createStore(loadEvents());
  function saveEvents() {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ version: 1, events: eventsStore.get() }),
      );
    } catch {
      persistOk = false;
    }
  }
  function addEvent(ev) {
    eventsStore.set([ev, ...eventsStore.get()].slice(0, 500));
    saveEvents();
  }
  function updateEvent(id, patch) {
    eventsStore.set(
      eventsStore.get().map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)),
    );
    saveEvents();
  }
  function removeEvent(id) {
    eventsStore.set(eventsStore.get().filter((ev) => ev.id !== id));
    saveEvents();
  }

  // ---------- preferences (week start) ----------
  function loadWeekStart() {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      return p?.weekStart === "mon" ? "mon" : "sun";
    } catch {
      return "sun";
    }
  }
  const prefsStore = createStore(loadWeekStart());
  function setWeekStart(v) {
    prefsStore.set(v);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ weekStart: v }));
    } catch {
      // keep session value
    }
  }
  // ---------- locale ----------
  const localeStore = createStore(loadLocale());
  function setLocale(v) {
    localeStore.set(v);
    try {
      localStorage.setItem(LOCALE_KEY, JSON.stringify(v));
    } catch {}
  }
  const t = (key) => STRINGS[localeStore.get()]?.[key] ?? STRINGS.ja[key] ?? key;
  const weekdays = () => STRINGS[localeStore.get()].weekdays;
  function kindName(kind) {
    const s = STRINGS[localeStore.get()];
    return kind === "meeting" ? s.meeting : s.plan;
  }
  const weekOffset = (start) => (start === "mon" ? 1 : 0);
  const orderedWeekdays = (start) =>
    start === "mon" ? [...weekdays().slice(1), weekdays()[0]] : weekdays();
  const weekdayColor = (w) =>
    w === "日"
      ? "var(--color-red-9, #e5484d)"
      : w === "土"
        ? "var(--color-blue-9, #0090ff)"
        : undefined;

  // ---------- people (community members + agents, for the member picker) ----------
  const peopleStore = createStore([]);
  function collectPeople(session, channels) {
    try {
      const agents = new Map();
      const selectable = session.agentChoices?.snapshot?.().selectable ?? [];
      for (const a of selectable)
        if (a.pubkey) agents.set(a.pubkey, a.managedName || a.name || a.pubkey.slice(0, 10));
      const pubkeys = new Set(agents.keys());
      for (const c of channels)
        for (const p of c.members ?? []) if (p && p.length === 64) pubkeys.add(p);
      const viewer = session.viewer;
      if (viewer) pubkeys.add(viewer);
      const profiles = session.profiles?.snapshot?.() ?? new Map();
      const known = [...pubkeys, ...profiles.keys()].filter(
        (p) => typeof p === "string" && p.length === 64,
      );
      if (session.profiles?.ensure) void session.profiles.ensure(known).catch(() => {});
      const rows = [];
      for (const p of known) {
        const prof = profiles.get(p);
        const isAgent = prof?.isAgent || agents.has(p);
        rows.push({
          pubkey: p,
          name: prof?.name || agents.get(p) || `${p.slice(0, 8)}…`,
          isAgent,
          viewer: p === viewer,
        });
      }
      rows.sort((a, b) => (a.isAgent - b.isAgent) || a.name.localeCompare(b.name));
      peopleStore.set(rows);
    } catch {
      // People discovery is advisory; the form still works with a manual entry.
    }
  }

  // ---------- live huddles + channel roster (refreshed from the relay) ----------
  const huddlesStore = createStore([]);
  const channelsStore = createStore([]);
  let refreshing = false;
  async function refreshHuddles() {
    if (!relay || refreshing) return;
    const snap = relay.snapshot();
    if (snap?.status !== "ready" || !snap.session) return;
    refreshing = true;
    try {
      const session = snap.session;
      const list = session.channels?.list?.();
      if (list) {
        const usable = (list.channels ?? []).filter(
          (c) => !c.archived && c.channelType !== "system" && c.channelType !== "solo",
        );
        channelsStore.set(usable);
        collectPeople(session, usable);
      }
      const events = await session.read(
        [
          { kinds: [48100], limit: 50 },
          { kinds: [48103], limit: 100 },
        ],
        { signal: AbortSignal.timeout(15000), priority: "foreground", fresh: true },
      );
      const now = Date.now() / 1000;
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      const roomOf = (ev) => {
        try {
          const body = JSON.parse(ev.content);
          const id = body && typeof body === "object" ? body.ephemeral_channel_id : undefined;
          return typeof id === "string" && uuid.test(id) ? id : undefined;
        } catch {
          return undefined;
        }
      };
      const parentOf = (ev, room) => {
        const h = (ev.tags ?? []).filter((t) => t[0] === "h" && t[1] && t[1] !== room).map((t) => t[1]);
        return h[0];
      };
      const starts = new Map(); // room -> {creator, startedAt, parent}
      for (const ev of events) {
        const room = roomOf(ev);
        if (ev.kind !== 48100 || !room) continue;
        const prev = starts.get(room);
        if (!prev || ev.created_at < prev.startedAt)
          starts.set(room, { creator: ev.pubkey, startedAt: ev.created_at, parent: parentOf(ev, room) });
      }
      const authority = session.relayAuthor;
      for (const ev of events) {
        const room = roomOf(ev);
        if (ev.kind !== 48103 || !room) continue;
        const start = starts.get(room);
        if (start && ev.created_at >= start.startedAt && (ev.pubkey === start.creator || ev.pubkey === authority))
          starts.delete(room);
      }
      const byId = new Map(channelsStore.get().map((c) => [c.id, c.name]));
      const live = [...starts.entries()]
        .filter(([, r]) => r.startedAt <= now && r.startedAt + 3600 > now)
        .map(([room, r]) => ({
          room,
          creator: r.creator,
          startedAt: r.startedAt,
          parent: r.parent,
          parentName: r.parent ? byId.get(r.parent) ?? undefined : undefined,
        }))
        .sort((a, b) => b.startedAt - a.startedAt);
      huddlesStore.set(live);
    } catch {
      // Discovery is advisory; a failed read just clears live rows until the next tick.
    } finally {
      refreshing = false;
    }
  }

  // ---------- date helpers (local time) ----------
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => fmtDate(new Date());
  function parseDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }
  function shiftDays(s, n) {
    const d = parseDate(s);
    d.setDate(d.getDate() + n);
    return fmtDate(d);
  }
  function startOfWeek(s, start) {
    const off = weekOffset(start);
    return shiftDays(s, -((parseDate(s).getDay() + 7 - off) % 7));
  }
  function label(ev) {
    if (!ev.time) return `${t("allDay")} ${ev.title}`;
    const span = ev.end && ev.end > ev.time ? `${ev.time}–${ev.end}` : ev.time;
    return `${span} ${ev.title}`;
  }
  function dayTitle(s) {
    const d = parseDate(s);
    return STRINGS[localeStore.get()].dayTitle(d, weekdays()[d.getDay()]);
  }
  const clockOf = (sec) => {
    const d = new Date(sec * 1000);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const minOf = (t) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // ---------- navigation helpers ----------
  async function openPage() {
    let res = await ctx.navigation.open({ version: 1, kind: "plugin", pluginId: PLUGIN_ID, pageId: PAGE_ID });
    if (res?.status === "failed")
      await ctx.navigation.open({ version: 1, kind: "page", pluginId: PLUGIN_ID, pageId: PAGE_ID });
  }
  async function openChannel(channelId) {
    const snap = relay?.snapshot();
    if (channelId && snap?.viewer && snap?.origin) {
      const res = await ctx.navigation.open({
        version: 1,
        kind: "conversation",
        scope: { viewer: snap.viewer, communityOrigin: snap.origin },
        channelId,
      });
      if (res?.status !== "failed") return;
    }
    await openPage();
  }

  // ---------- share an event as an ordinary channel post (kind 9) ----------
  async function shareEvent(draft) {
    const snap = relay?.snapshot();
    const outbox = snap?.session?.outbox;
    if (!snap || snap.status !== "ready" || !outbox?.send)
      return t("noRelay");
    if (!draft.channel) return t("pickChannel");
    if (typeof outbox.supports === "function" && !outbox.supports(9))
      return t("cannotPost");
    const when = draft.time
      ? `${draft.date} ${draft.time}${draft.end && draft.end > draft.time ? `–${draft.end}` : ""}`
      : `${draft.date} ${t("allDay")}`;
    const memberNames = (draft.members ?? []).map((m) => nameOf(m, peopleStore.get()));
    const lines = [
      `📅 ${when} ${kindName(draft.kind) ?? t("plan")}: ${draft.title}`,
      memberNames.length ? `👥 ${memberNames.join(", ")}` : "",
      draft.notes ? `📝 ${draft.notes}` : "",
    ].filter(Boolean);
    try {
      await outbox.ready();
      outbox.send({ kind: 9, content: lines.join("\n"), tags: [["h", draft.channel]] });
      return true;
    } catch (err) {
      return `${t("shareFailed")}: ${err?.message ?? err}`;
    }
  }

  // ---------- people helpers ----------
  function nameOf(key, people) {
    if (!key) return "";
    const hit = people.find((p) => p.pubkey === key);
    return hit?.name ?? key;
  }

  // ---------- UI ----------
  function Chip({ ev, onClick, compact }) {
    return e(
      "button",
      {
        type: "button",
        title: label(ev),
        onClick: (ev2) => {
          ev2?.stopPropagation?.();
          onClick?.(ev);
        },
        style: {
          all: "unset",
          cursor: "pointer",
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: compact ? 10 : 11.5,
          padding: "2px 7px",
          borderRadius: 7,
          background: ACCENT_TINT,
          color: "var(--text-primary, inherit)",
        },
      },
      compact ? `${ev.time ? `${ev.time} ` : ""}${ev.title}` : label(ev),
    );
  }

  function LiveStrip({ rows, onOpen }) {
    if (!rows.length) return null;
    return e(
      "div",
      {
        className: "ui-card",
        style: { padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 },
      },
      e("h3", { style: { margin: 0, fontSize: 14 } }, t("liveNow")),
      ...rows.map((r) =>
        e(
          "div",
          { key: r.room, style: { display: "flex", alignItems: "center", gap: 8 } },
          e(
            "span",
            { style: { color: "var(--color-green-9, #30a46c)", fontWeight: 700 } },
            "●",
          ),
          e(
            "span",
            { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
            `${r.parentName ?? r.parent ?? t("channelFallback")} · ${clockOf(r.startedAt)} ${t("startedAt")}`,
          ),
          e(
            "button",
            {
              type: "button",
              onClick: () => onOpen(r),
              style: { background: ACCENT, color: ACCENT_INK, fontWeight: 600 },
            },
            t("join"),
          ),
        ),
      ),
    );
  }

  // ---------- member picker (candidates appear only while typing) ----------
  function MemberPicker({ selected, candidates, onChange }) {
    const [query, setQuery] = useState("");
    const sel = selected;
    const toggle = (key) => {
      onChange(sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key]);
    };
    const q = query.trim().toLowerCase();
    const filtered = q
      ? candidates.filter(
          (c) => c.name.toLowerCase().includes(q) || c.pubkey.includes(q),
        )
      : [];
    const nameCounts = new Map();
    for (const c of candidates) nameCounts.set(c.name, (nameCounts.get(c.name) ?? 0) + 1);
    const displayName = (c) =>
      (nameCounts.get(c.name) ?? 0) > 1 ? `${c.name} (${c.pubkey.slice(-4)})` : c.name;
    return e(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 6, position: "relative" } },
      e("span", { style: { fontSize: 12, color: TEXT_SUBTLE } }, t("membersLabel")),
      sel.length
        ? e(
            "div",
            { style: { display: "flex", flexWrap: "wrap", gap: 4 } },
            ...sel.map((key) =>
              e(
                "span",
                {
                  key: key,
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    padding: "2px 9px",
                    borderRadius: 999,
                    background: ACCENT_TINT,
                  },
                },
                `${nameOf(key, candidates)}${candidates.find((c) => c.pubkey === key)?.isAgent ? " 🤖" : ""}`,
                e(
                  "button",
                  {
                    type: "button",
                    "aria-label": t("removeMember"),
                    onClick: () => toggle(key),
                    style: { all: "unset", cursor: "pointer", lineHeight: 1 },
                  },
                  "×",
                ),
              ),
            ),
          )
        : null,
      e("input", {
        placeholder: t("membersPh"),
        value: query,
        onChange: (ev) => setQuery(ev.target.value),
      }),
      q && filtered.length
        ? e(
            "div",
            {
              style: {
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 40,
                marginTop: 4,
                maxHeight: 220,
                overflowY: "auto",
                background: SURFACE,
                border: BORDER,
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              },
            },
            ...filtered.slice(0, 20).map((c) =>
              e(
                "button",
                {
                  key: c.pubkey,
                  type: "button",
                  onClick: () => {
                    toggle(c.pubkey);
                    setQuery("");
                  },
                  style: {
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    padding: "6px 8px",
                    borderRadius: 8,
                    background: sel.includes(c.pubkey) ? ACCENT_TINT : "transparent",
                  },
                },
                e("span", { style: { width: 16 } }, sel.includes(c.pubkey) ? "☑" : "☐"),
                e("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, displayName(c)),
                c.isAgent ? e("span", { style: { color: TEXT_SUBTLE, fontSize: 11 } }, "🤖") : null,
                c.viewer ? e("span", { style: { color: TEXT_SUBTLE, fontSize: 11 } }, t("self")) : null,
              ),
            ),
          )
        : null,
    );
  }

  // ---------- event form (create / edit, shown in a blurred overlay) ----------
  function EventForm({ initial, channels, candidates, onSave, onCancel, onDelete, onOpenChannel, onShare }) {
    const [title, setTitle] = useState(initial.title ?? "");
    const [date, setDate] = useState(initial.date ?? todayStr());
    const [time, setTime] = useState(initial.time ?? "");
    const [end, setEnd] = useState(initial.end ?? "");
    const [kind, setKind] = useState(initial.kind ?? "meeting");
    const [channel, setChannel] = useState(initial.channel ?? "");
    const [members, setMembers] = useState(initial.members ?? []);
    const [notes, setNotes] = useState(initial.notes ?? "");
    const valid = title.trim() && date;
    const isEdit = Boolean(initial.id);
    const endOk = time && end && end > time ? end : undefined;
    const [shareMsg, setShareMsg] = useState("");
    const share = async () => {
      if (!title.trim() || !channel) return;
      const res = await onShare({
        title: title.trim(),
        date,
        time: time || undefined,
        end: endOk,
        kind,
        channel,
        members: members.length ? members : undefined,
        notes: notes.trim() || undefined,
      });
      setShareMsg(res === true ? t("shared") : String(res ?? t("shareFailed")));
      setTimeout(() => setShareMsg(""), 5000);
    };
    const field = (labelText, node) =>
      e(
        "label",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 12,
            color: TEXT_SUBTLE,
            flex: "1 1 130px",
          },
        },
        e("span", null, labelText),
        node,
      );
    return e(
      "form",
      {
        onSubmit: (ev) => {
          ev.preventDefault();
          if (!valid) return;
          onSave({
            id: initial.id,
            title: title.trim(),
            date,
            time: time || undefined,
            end: endOk,
            kind,
            channel: channel || undefined,
            members: members.length ? members : undefined,
            notes: notes.trim() || undefined,
          });
        },
        style: { display: "flex", flexDirection: "column", gap: 12 },
      },
      e(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 8 } },
        e("h3", { style: { margin: 0, flex: 1, fontSize: 16 } }, isEdit ? t("editEvent") : t("addEvent")),
        onShare
          ? e(
              "button",
              {
                type: "button",
                disabled: !title.trim() || !channel,
                title: t("shareTitle"),
                onClick: share,
              },
              t("share"),
            )
          : null,
        kind === "meeting" && initial.channel && onOpenChannel
          ? e(
              "button",
              { type: "button", onClick: () => onOpenChannel(initial.channel) },
              t("openHuddle"),
            )
          : null,
        e("button", { type: "button", onClick: onCancel }, t("cancel")),
        isEdit ? e("button", { type: "button", onClick: onDelete }, t("removeRow")) : null,
      ),
      persistOk
        ? null
        : e("p", { style: { margin: 0, fontSize: 12, color: TEXT_SUBTLE } }, t("persistWarn")),
      e("input", {
        required: true,
        placeholder: t("titlePh"),
        value: title,
        autoFocus: true,
        onChange: (ev) => setTitle(ev.target.value),
        style: { fontSize: 14 },
      }),
      e(
        "div",
        { style: { display: "flex", gap: 10, flexWrap: "wrap" } },
        field(t("dateLabel"), e("input", { type: "date", required: true, value: date, onChange: (ev) => setDate(ev.target.value) })),
        field(t("startTimeLabel"), e("input", { type: "time", value: time, step: 300, onChange: (ev) => setTime(ev.target.value) })),
        field(t("endTimeLabel"), e("input", { type: "time", value: end, step: 300, onChange: (ev) => setEnd(ev.target.value) })),
        field(
          t("kindLabel"),
          e(
            "select",
            { value: kind, onChange: (ev) => setKind(ev.target.value) },
            e("option", { value: "meeting" }, t("kindMeetingOption")),
            e("option", { value: "plan" }, t("kindPlanOption")),
          ),
        ),
      ),
      channels.length
        ? field(
            t("channelLabel"),
            e(
              "select",
              { value: channel, onChange: (ev) => setChannel(ev.target.value) },
              e("option", { value: "" }, t("noChannel")),
              ...channels.map((c) => e("option", { key: c.id, value: c.id }, `#${c.name}`)),
            ),
          )
        : null,
      e(MemberPicker, { selected: members, candidates, onChange: setMembers }),
      shareMsg
        ? e("p", { style: { margin: 0, fontSize: 12, color: ACCENT_TEXT } }, shareMsg)
        : null,
      e("textarea", {
        placeholder: t("notesPh"),
        rows: 2,
        value: notes,
        onChange: (ev) => setNotes(ev.target.value),
        style: { resize: "vertical" },
      }),
      e(
        "button",
        {
          type: "submit",
          disabled: !valid,
          style: {
            background: valid ? ACCENT : undefined,
            color: valid ? ACCENT_INK : undefined,
            fontWeight: 600,
            fontSize: 14,
          },
        },
        isEdit ? t("update") : t("addBtn"),
      ),
    );
  }

  function DialogOverlay({ children, onClose }) {
    return e(
      "div",
      {
        onClick: onClose,
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface-base, rgba(0,0,0,0.45))",
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          padding: 24,
        },
      },
      e(
        "div",
        {
          onClick: (ev) => ev.stopPropagation(),
          className: "ui-card",
          style: {
            background: SURFACE,
            width: "min(560px, 94vw)",
            maxHeight: "88vh",
            overflowY: "auto",
            padding: 18,
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          },
        },
        children,
      ),
    );
  }

  // ---------- 24h time grid (今日 / 週) ----------
  function TimeGrid({ days, start, selected, byDate, onSelect, onOpenDialog, onEdit }) {
    const scrollRef = useRef(null);
    const mounted = useRef(false);
    useEffect(() => {
      if (mounted.current || !scrollRef.current) return;
      mounted.current = true;
      const n = new Date();
      const top = ((n.getHours() * 60 + n.getMinutes()) / 1440) * GRID_H - HOUR_H * 2.5;
      scrollRef.current.scrollTop = Math.max(0, top);
    }, []);
    const openAt = (iso, ev) => {
      let time;
      try {
        const rect = ev.currentTarget.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
        time = `${pad(Math.floor((frac * 24 * 60) / 60))}:${pad(Math.round(((frac * 24 * 60) % 60) / 30) * 30 % 60)}`;
      } catch {
        time = undefined;
      }
      onOpenDialog(iso, time);
    };
    const dayColumn = (iso) => {
      const d = parseDate(iso);
      const evs = (byDate.get(iso) ?? []).sort((a, b) => (a.time ?? "0").localeCompare(b.time ?? "0"));
      const timed = evs.filter((ev) => ev.time);
      const allDay = evs.filter((ev) => !ev.time);
      const n = new Date();
      const isToday = iso === todayStr();
      return e(
        "div",
        { key: iso, style: { position: "relative" } },
        // header
        e(
          "button",
          {
            type: "button",
            style: {
              all: "unset",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              height: 40,
              boxSizing: "border-box",
              background: SURFACE_INSET,
              borderBottom: BORDER,
            },
            onClick: () => onSelect(iso),
            onDoubleClick: (ev) => openAt(iso, ev),
          },
          e(
            "span",
            { style: { fontSize: 11, color: weekdayColor(weekdays()[d.getDay()]) ?? TEXT_SUBTLE } },
            weekdays()[d.getDay()],
          ),
          e(DayNumber, { iso, size: 20 }),
        ),
        // body
        e(
          "div",
          {
            onDoubleClick: (ev) => openAt(iso, ev),
            style: {
              position: "relative",
              height: GRID_H,
              background: `linear-gradient(to bottom, var(--border-color-standard, rgba(127,127,127,0.25)) 1px, transparent 1px)`,
              backgroundSize: `100% ${HOUR_H}px`,
            },
          },
          ...allDay.slice(0, 3).map((ev, i) =>
            e(
              "button",
              {
                key: ev.id,
                type: "button",
                onClick: () => onEdit(ev),
                style: {
                  all: "unset",
                  cursor: "pointer",
                  position: "absolute",
                  left: 2,
                  right: 2,
                  top: 2 + i * 18,
                  zIndex: 6,
                  fontSize: 10,
                  padding: "1px 5px",
                  borderRadius: 6,
                  background: ACCENT,
                  color: ACCENT_INK,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                },
              },
              ev.title,
            ),
          ),
          isToday
            ? e("div", {
                key: "now",
                style: {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: ((n.getHours() * 60 + n.getMinutes()) / 1440) * GRID_H,
                  borderTop: `2px solid var(--color-red-9, #e5484d)`,
                  zIndex: 5,
                  pointerEvents: "none",
                },
              })
            : null,
          ...timed.map((ev) => {
            const top = (minOf(ev.time) / 1440) * GRID_H;
            const height =
              ev.end && ev.end > ev.time
                ? Math.max(18, ((minOf(ev.end) - minOf(ev.time)) / 1440) * GRID_H - 2)
                : 22;
            return e(
              "button",
              {
                key: ev.id,
                type: "button",
                title: label(ev),
                onClick: () => onEdit(ev),
                style: {
                  all: "unset",
                  cursor: "pointer",
                  position: "absolute",
                  left: 2,
                  right: 2,
                  top,
                  height,
                  zIndex: 4,
                  boxSizing: "border-box",
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 8,
                  background: ev.kind === "meeting" ? ACCENT_TINT : SURFACE_INSET,
                  color: "var(--text-primary, inherit)",
                  border: ev.kind === "meeting" ? `1px solid ${ACCENT_TEXT}` : BORDER,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                },
              },
              ev.time ? `${ev.time} ` : "",
              ev.title,
            );
          }),
        ),
      );
    };
    return e(
      "div",
      { className: "ui-card", style: { padding: 0, overflow: "hidden" } },
      e(
        "div",
        { ref: scrollRef, style: { maxHeight: "58vh", overflowY: "auto" } },
        e(
          "div",
          { style: { display: "grid", gridTemplateColumns: `48px repeat(${days.length}, 1fr)` } },
          // hour gutter (same single row as the day columns)
          e(
            "div",
            {
              style: {
                height: 40 + GRID_H,
                boxSizing: "border-box",
                paddingTop: 40,
                background: SURFACE,
                borderRight: BORDER,
              },
            },
            ...Array.from({ length: 24 }, (_, h) =>
              e(
                "div",
                {
                  key: h,
                  style: {
                    height: HOUR_H,
                    boxSizing: "border-box",
                    textAlign: "right",
                    paddingRight: 6,
                    fontSize: 10,
                    color: TEXT_SUBTLE,
                    transform: "translateY(-7px)",
                  },
                },
                `${pad(h)}:00`,
              ),
            ),
          ),
          ...days.map(dayColumn),
        ),
      ),
    );
  }

  // ---------- views ----------
  function cellStyle(iso, selected, extra) {
    return {
      all: "unset",
      cursor: "pointer",
      boxSizing: "border-box",
      border: iso === selected ? `2px solid ${ACCENT}` : "1px solid transparent",
      borderRadius: 10,
      textAlign: "left",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 3,
      ...extra,
    };
  }

  function DayNumber({ iso, size = 22 }) {
    const isToday = iso === todayStr();
    return e(
      "span",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: size,
          height: size,
          padding: "0 2px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: isToday ? 700 : 400,
          background: isToday ? ACCENT : "transparent",
          color: isToday ? ACCENT_INK : "var(--text-primary, inherit)",
        },
      },
      String(parseDate(iso).getDate()),
    );
  }

  function DayCellEvents({ byDate, iso, onEdit, max = 3, compact }) {
    const list = (byDate.get(iso) ?? []).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
    return [
      ...list
        .slice(0, max)
        .map((ev) => e(Chip, { key: ev.id, ev, compact, onClick: () => onEdit(ev) })),
      list.length > max
        ? e("span", { key: "more", style: { fontSize: 10, color: TEXT_SUBTLE, padding: "0 4px" } }, `+${list.length - max}`)
        : null,
    ];
  }

  function MonthView({ cursor, start, selected, byDate, onSelect, onOpenDialog, onEdit }) {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 7 - weekOffset(start)) % 7;
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const weeks = Math.ceil((lead + daysInMonth) / 7);
    const startDate = new Date(first);
    startDate.setDate(1 - lead);
    const cells = Array.from({ length: weeks * 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return { key: fmtDate(d), date: d, inMonth: d.getMonth() === cursor.m };
    });
    return e(
      "div",
      { className: "ui-card", style: { padding: 10 } },
      e(
        "div",
        { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 } },
        ...orderedWeekdays(start).map((w) =>
          e(
            "div",
            {
              key: w,
              style: { textAlign: "center", fontSize: 12, fontWeight: 600, padding: "2px 0", color: weekdayColor(w) ?? TEXT_SUBTLE },
            },
            w,
          ),
        ),
        ...cells.map((c) =>
          e(
            "button",
            {
              key: c.key,
              type: "button",
              style: cellStyle(c.key, selected, {
                minHeight: 72,
                padding: 5,
                background: c.inMonth ? SURFACE_INSET : "transparent",
                opacity: c.inMonth ? 1 : 0.35,
              }),
              onClick: () => onSelect(c.key),
              onDoubleClick: () => onOpenDialog(c.key),
            },
            e(DayNumber, { iso: c.key }),
            ...DayCellEvents({ byDate, iso: c.key, onEdit }),
          ),
        ),
      ),
    );
  }

  function MiniMonth({ y, m, start, byDate, selected, onPick, onOpenDialog }) {
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 7 - weekOffset(start)) % 7;
    const startDate = new Date(first);
    startDate.setDate(1 - lead);
    const weeks = Math.ceil((lead + new Date(y, m + 1, 0).getDate()) / 7);
    return e(
      "div",
      { className: "ui-card", style: { padding: 8 } },
      e("div", { style: { textAlign: "center", fontWeight: 600, marginBottom: 4, fontSize: 13 } }, `${m + 1}月`),
      e(
        "div",
        { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 } },
        ...orderedWeekdays(start).map((w) =>
          e("div", { key: w, style: { textAlign: "center", fontSize: 10, color: weekdayColor(w) ?? TEXT_SUBTLE } }, w),
        ),
        ...Array.from({ length: weeks * 7 }, (_, i) => {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          const iso = fmtDate(d);
          const inMonth = d.getMonth() === m;
          const has = (byDate.get(iso) ?? []).length > 0;
          return e(
            "button",
            {
              key: iso,
              type: "button",
              style: cellStyle(iso, selected, {
                minHeight: 22,
                padding: 1,
                fontSize: 10,
                opacity: inMonth ? 1 : 0.3,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 2,
              }),
              onClick: () => onPick(iso),
              onDoubleClick: () => onOpenDialog(iso),
            },
            e(DayNumber, { iso, size: 16 }),
            has ? e("span", { style: { color: ACCENT_TEXT, fontSize: 9, lineHeight: 1 } }, "•") : null,
          );
        }),
      ),
    );
  }

  function YearView({ cursor, start, selected, byDate, onPick, onOpenDialog }) {
    return e(
      "div",
      {
        className: "ui-card",
        style: {
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 8,
        },
      },
      ...Array.from({ length: 12 }, (_, m) =>
        e(MiniMonth, { key: m, y: cursor.y, m, start, byDate, selected, onPick, onOpenDialog }),
      ),
    );
  }

  // ---------- page ----------
  function CalendarPage() {
    const events = useSyncExternalStore(eventsStore.subscribe, eventsStore.get);
    const live = useSyncExternalStore(huddlesStore.subscribe, huddlesStore.get);
    const channels = useSyncExternalStore(channelsStore.subscribe, channelsStore.get);
    const people = useSyncExternalStore(peopleStore.subscribe, peopleStore.get);
    const weekStart = useSyncExternalStore(prefsStore.subscribe, prefsStore.get);
    useSyncExternalStore(localeStore.subscribe, localeStore.get);
    const now = new Date();
    const [view, setView] = useState("month");
    const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
    const [selected, setSelected] = useState(todayStr());
    const [dialog, setDialog] = useState(null); // {mode:"create",date,time?} | {mode:"edit",eventId}

    const byDate = useMemo(() => {
      const map = new Map();
      for (const ev of events) {
        if (!map.has(ev.date)) map.set(ev.date, []);
        map.get(ev.date).push(ev);
      }
      return map;
    }, [events]);

    const openCreate = (date, time) => {
      setSelected(date);
      setDialog({ mode: "create", date, time });
    };
    const openEdit = (ev) => setDialog({ mode: "edit", eventId: ev.id });
    const closeDialog = () => setDialog(null);
    const saveEvent = (data) => {
      const scope = relay?.snapshot()?.origin ?? "local";
      if (dialog?.mode === "edit") {
        updateEvent(dialog.eventId, data);
      } else {
        addEvent({
          ...data,
          id: typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          scope,
          createdAt: Math.floor(Date.now() / 1000),
        });
      }
      setDialog(null);
    };
    const deleteEvent = () => {
      if (dialog?.mode === "edit") removeEvent(dialog.eventId);
      setDialog(null);
    };
    const dialogEvent = dialog?.mode === "edit" ? events.find((x) => x.id === dialog.eventId) : undefined;

    useEffect(() => {
      if (!dialog) return;
      const onKey = (ev) => {
        if (ev.key === "Escape") setDialog(null);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [dialog]);

    const goToday = () => {
      const t = new Date();
      setCursor({ y: t.getFullYear(), m: t.getMonth() });
      setSelected(todayStr());
    };
    const step = (dir) => {
      if (view === "today") {
        setSelected((s) => shiftDays(s, dir));
      } else if (view === "week") {
        setSelected((s) => {
          const next = shiftDays(s, 7 * dir);
          const d = parseDate(next);
          setCursor({ y: d.getFullYear(), m: d.getMonth() });
          return next;
        });
      } else if (view === "month") {
        setCursor(({ y, m }) => (m + dir < 0 ? { y: y - 1, m: 11 } : m + dir > 11 ? { y: y + 1, m: 0 } : { y, m: m + dir }));
      } else {
        setCursor(({ y, m }) => ({ y: y + dir, m }));
      }
    };
    const rangeLabel = () => {
      if (view === "today") return dayTitle(selected);
      if (view === "week")
        return STRINGS[localeStore.get()].weekOf(dayTitle(startOfWeek(selected, weekStart)));
      if (view === "month") return `${cursor.y}年${cursor.m + 1}月`;
      return `${cursor.y}年`;
    };
    const pickFromYear = (iso) => {
      const d = parseDate(iso);
      setCursor({ y: d.getFullYear(), m: d.getMonth() });
      setSelected(iso);
      setView("month");
    };

    const viewButton = (v) =>
      e(
        "button",
        {
          key: v.id,
          type: "button",
          onClick: () => setView(v.id),
          style: {
            all: "unset",
            cursor: "pointer",
            fontSize: 13,
            padding: "4px 14px",
            borderRadius: 999,
            fontWeight: view === v.id ? 700 : 400,
            background: view === v.id ? ACCENT : "transparent",
            color: view === v.id ? ACCENT_INK : TEXT_SUBTLE,
          },
        },
        t(v.key),
      );

    const body =
      view === "month"
        ? e(MonthView, { cursor, start: weekStart, selected, byDate, onSelect: setSelected, onOpenDialog: openCreate, onEdit: openEdit })
        : view === "week"
          ? e(TimeGrid, {
              days: Array.from({ length: 7 }, (_, i) => shiftDays(startOfWeek(selected, weekStart), i)),
              start: weekStart,
              selected,
              byDate,
              onSelect: setSelected,
              onOpenDialog: openCreate,
              onEdit: openEdit,
            })
          : view === "today"
            ? e(TimeGrid, {
                days: [selected],
                start: weekStart,
                selected,
                byDate,
                onSelect: setSelected,
                onOpenDialog: openCreate,
                onEdit: openEdit,
              })
            : e(YearView, { cursor, start: weekStart, selected, byDate, onPick: pickFromYear, onOpenDialog: openCreate });

    return e(
      "div",
      {
        style: {
          height: "100%",
          overflowY: "auto",
          padding: "var(--space-panel-inset, 16px)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3, 12px)",
          boxSizing: "border-box",
        },
      },
      e(LiveStrip, { rows: live, onOpen: (r) => r.parent && openChannel(r.parent) }),
      e(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
        e(
          "div",
          {
            style: {
              display: "flex",
              gap: 2,
              padding: 2,
              borderRadius: 999,
              background: SURFACE_INSET,
            },
          },
          ...VIEWS.map(viewButton),
        ),
        e(
          "button",
          {
            type: "button",
            onClick: () => setWeekStart(weekStart === "sun" ? "mon" : "sun"),
            title: t("weekStartTitle"),
          },
          t(weekStart === "sun" ? "weekStartSun" : "weekStartMon"),
        ),
        e(
          "select",
          {
            value: localeStore.get(),
            onChange: (ev) => setLocale(ev.target.value),
            "aria-label": t("language"),
          },
          ...LOCALES.map((l) =>
            e("option", { key: l, value: l }, STRINGS[l].languageName),
          ),
        ),
        e("div", { style: { flex: 1 } }),
        e("button", { type: "button", onClick: () => step(-1), "aria-label": t("prev") }, "◀"),
        e("button", { type: "button", onClick: goToday }, "今日"),
        e("button", { type: "button", onClick: () => step(1), "aria-label": t("next") }, "▶"),
        e("strong", { style: { fontSize: 15 } }, rangeLabel()),
        e(
          "button",
          {
            type: "button",
            onClick: () => openCreate(selected),
            style: { background: ACCENT, color: ACCENT_INK, fontWeight: 600 },
          },
          t("newEvent"),
        ),
      ),
      body,
      dialog
        ? e(
            DialogOverlay,
            { onClose: closeDialog },
            e(EventForm, {
              initial:
                dialog.mode === "edit"
                  ? dialogEvent ?? { date: selected }
                  : { date: dialog.date ?? selected, time: dialog.time },
              channels,
              candidates: people,
              onSave: saveEvent,
              onCancel: closeDialog,
              onDelete: deleteEvent,
              onOpenChannel: openChannel,
              onShare: shareEvent,
            }),
          )
        : null,
    );
  }

  ctx.pages.register({
    id: PAGE_ID,
    title: t("calendarTitle"),
    primary: true,
    placement: "dock",
    icon:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>',
      ),
    component: CalendarPage,
  });

  // ---------- live huddle refresh ----------
  ctx.effect(() => {
    const tick = () => {
      void refreshHuddles();
    };
    tick();
    const timer = setInterval(tick, 60000);
    const unsub = relay?.subscribe?.(() => {
      if (relay.snapshot()?.status === "ready") void refreshHuddles();
    });
    return () => {
      clearInterval(timer);
      unsub?.();
    };
  });
}
