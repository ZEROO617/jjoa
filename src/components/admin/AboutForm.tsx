"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getAbout, upsertAbout } from "@/lib/data/admin";
import type { AboutLink } from "@/types/project";

/** RPD 8장 — About 정보도 DB에서 관리한다. */
export function AboutForm() {
  const [form, setForm] = useState({
    id: "",
    name: "",
    title: "",
    affiliation: "",
    tagline: "",
  });
  const [links, setLinks] = useState<AboutLink[]>([]);
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAbout()
      .then((about) => {
        if (about) {
          setForm({
            id: about.id,
            name: about.name,
            title: about.title,
            affiliation: about.affiliation,
            tagline: about.tagline,
          });
          setLinks(about.links);
        }
      })
      .catch((e) => setStatus({ kind: "error", text: e instanceof Error ? e.message : String(e) }))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await upsertAbout({
        ...form,
        // 최초 저장이면 고정 id를 부여한다(행은 하나만 유지).
        id: form.id || "00000000-0000-0000-0000-000000000001",
        links: links.filter((l) => l.label && l.url),
      });
      setStatus({ kind: "success", text: "저장되었습니다." });
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <form onSubmit={onSubmit}>
      <h2>About Me (중앙 동상)</h2>
      {status && <div className={`alert ${status.kind === "success" ? "success" : ""}`}>{status.text}</div>}

      <div className="grid-2">
        <div className="field">
          <label htmlFor="about-name">Name</label>
          <input
            id="about-name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="KIM YOONSEO"
          />
        </div>
        <div className="field">
          <label htmlFor="about-title">Title / 직함</label>
          <input
            id="about-title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Developer"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="about-affiliation">Affiliation</label>
        <input
          id="about-affiliation"
          value={form.affiliation}
          onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
          placeholder="Global Media"
        />
      </div>

      <div className="field">
        <label htmlFor="about-tagline">Tagline / 프로필 문구</label>
        <textarea
          id="about-tagline"
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          placeholder={"Building things with\nCode, AI and Interactive Media."}
          style={{ minHeight: 100 }}
        />
        <span className="help">줄바꿈이 그대로 표시됩니다.</span>
      </div>

      <h2>Links</h2>
      {links.map((link, i) => (
        <div className="grid-2" key={i}>
          <div className="field">
            <label htmlFor={`link-label-${i}`}>Label</label>
            <input
              id={`link-label-${i}`}
              value={link.label}
              onChange={(e) =>
                setLinks(links.map((l, li) => (li === i ? { ...l, label: e.target.value } : l)))
              }
              placeholder="GitHub"
            />
          </div>
          <div className="field">
            <label htmlFor={`link-url-${i}`}>URL</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id={`link-url-${i}`}
                type="url"
                value={link.url}
                onChange={(e) =>
                  setLinks(links.map((l, li) => (li === i ? { ...l, url: e.target.value } : l)))
                }
                placeholder="https://github.com/..."
                style={{ flex: 1 }}
              />
              <button
                className="btn danger"
                type="button"
                onClick={() => setLinks(links.filter((_, li) => li !== i))}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}

      <button className="btn" type="button" onClick={() => setLinks([...links, { label: "", url: "" }])}>
        + Add Link
      </button>

      <div className="form-actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
