import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Utils ──────────────────────────────────────────────
function formatMoney(n, currency = '€') {
  const str = Math.abs(n).toFixed(2).replace('.', ',');
  const parts = str.split(',');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  return parts.join(',') + '\u00A0' + currency;
}

// Génération numéro séquentiel DEV-YYYY-NNNN
function genDevisNum() {
  const year = new Date().getFullYear();
  const counter = lsGet('md_devis_counter', {});
  const currentCount = (counter[year] || 0) + 1;
  const newCounter = { ...counter, [year]: currentCount };
  lsSet('md_devis_counter', newCounter);
  return `DEV-${year}-${String(currentCount).padStart(4, '0')}`;
}

function today() { return new Date().toISOString().split('T')[0]; }
function daysLater(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }
function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [201, 168, 76];
}

// ── Local Storage helpers ──
function lsGet(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } }

// ─────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────
const THEMES = {
  or: {
    name: 'Or Classique',
    desc: 'Élégant fond sombre avec accent doré',
    accentColor: '#c9a84c',
    headerBg: '#1a1a2e',
    headerText: '#c9a84c',
    tableHeadBg: '#1a1a2e',
    tableHeadText: '#e8dcc8',
    tableAltBg: '#f8f8f6',
    totalBg: '#1a1a2e',
    totalText: '#c9a84c',
    footerBg: '#1a1a2e',
  },
  ardoise: {
    name: 'Ardoise Minéral',
    desc: 'Bleu ardoise professionnel et sobre',
    accentColor: '#4a6fa5',
    headerBg: '#2c3e50',
    headerText: '#7fb3d3',
    tableHeadBg: '#2c3e50',
    tableHeadText: '#ecf0f1',
    tableAltBg: '#f4f6f9',
    totalBg: '#2c3e50',
    totalText: '#7fb3d3',
    footerBg: '#2c3e50',
  },
  noir: {
    name: 'Noir Épuré',
    desc: 'Minimaliste noir et blanc pur',
    accentColor: '#1a1a1a',
    headerBg: '#111111',
    headerText: '#ffffff',
    tableHeadBg: '#111111',
    tableHeadText: '#ffffff',
    tableAltBg: '#f5f5f5',
    totalBg: '#111111',
    totalText: '#ffffff',
    footerBg: '#111111',
  },
  emeraude: {
    name: 'Émeraude Nature',
    desc: 'Vert forêt élégant et apaisant',
    accentColor: '#2d6a4f',
    headerBg: '#1b4332',
    headerText: '#95d5b2',
    tableHeadBg: '#1b4332',
    tableHeadText: '#d8f3dc',
    tableAltBg: '#f0f7f2',
    totalBg: '#1b4332',
    totalText: '#95d5b2',
    footerBg: '#1b4332',
  },
  marine: {
    name: 'Marine Royal',
    desc: 'Bleu marine institutionnel et fiable',
    accentColor: '#1e3a5f',
    headerBg: '#0d2137',
    headerText: '#a8c8e8',
    tableHeadBg: '#0d2137',
    tableHeadText: '#e8f0f8',
    tableAltBg: '#f2f6fb',
    totalBg: '#0d2137',
    totalText: '#a8c8e8',
    footerBg: '#0d2137',
  },
};

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const G = {
  gold: '#c9a84c', goldLight: '#e2c76a', goldDark: '#9a7a30',
  bg: '#0a0a0f', bgCard: '#111118', bgPanel: '#0d0d14',
  border: 'rgba(201,168,76,0.15)', borderStrong: 'rgba(201,168,76,0.35)',
  text: '#e8dcc8', textMuted: '#8a7d6a', textDim: '#5a5048',
  red: '#c03b2b', green: '#4a7c59',
};

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'Outfit', sans-serif; font-weight: 400; line-height: 1.5; min-height: 100dvh; overflow-x: hidden; }
  input, select, textarea, button { font-family: 'Outfit', sans-serif; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${G.bg}; } ::-webkit-scrollbar-thumb { background: ${G.goldDark}; border-radius: 2px; }

  .app-wrapper { display: flex; flex-direction: column; min-height: 100dvh; padding-bottom: 64px; }

  /* ── HEADER ── */
  .app-header { position: sticky; top: 0; z-index: 100; background: rgba(10,10,15,0.95); backdrop-filter: blur(16px); border-bottom: 1px solid ${G.border}; padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .logo { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 700; color: ${G.gold}; letter-spacing: 0.02em; white-space: nowrap; }
  .header-actions { display: flex; gap: 8px; align-items: center; }

  /* ── BUTTONS ── */
  .btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: all 0.15s ease; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: ${G.gold}; color: #0a0a0f; font-weight: 600; }
  .btn-primary:hover { background: ${G.goldLight}; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(201,168,76,0.25); }
  .btn-outline { background: transparent; border: 1px solid ${G.borderStrong}; color: ${G.gold}; }
  .btn-outline:hover { background: rgba(201,168,76,0.08); }
  .btn-ghost { background: transparent; color: ${G.textMuted}; border: 1px solid transparent; }
  .btn-ghost:hover { color: ${G.text}; background: rgba(255,255,255,0.04); }
  .btn-sm { padding: 5px 10px; font-size: 0.75rem; }
  .btn-danger { background: transparent; border: 1px solid rgba(192,59,43,0.3); color: ${G.red}; }
  .btn-danger:hover { background: rgba(192,59,43,0.1); }
  .btn-green { background: rgba(74,124,89,0.15); border: 1px solid rgba(74,124,89,0.4); color: #7fcf92; }
  .btn-green:hover { background: rgba(74,124,89,0.25); }

  /* ── LAYOUT ── */
  .main-content { display: grid; grid-template-columns: 1fr 460px; gap: 20px; padding: 20px; max-width: 1400px; margin: 0 auto; width: 100%; }
  @media (max-width: 1100px) { .main-content { grid-template-columns: 1fr; } .preview-column { display: none; } }

  /* ── CARDS ── */
  .card { background: ${G.bgCard}; border: 1px solid ${G.border}; border-radius: 12px; margin-bottom: 16px; overflow: hidden; transition: border-color 0.2s; }
  .card:focus-within { border-color: ${G.borderStrong}; }
  .card-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: rgba(201,168,76,0.04); border-bottom: 1px solid ${G.border}; cursor: pointer; user-select: none; }
  .card-icon { font-size: 1rem; }
  .card-title { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: ${G.text}; flex: 1; letter-spacing: 0.02em; }
  .card-body { padding: 18px; }
  .card-body.no-pad { padding: 0; }
  .collapse-btn { background: none; border: none; color: ${G.textMuted}; cursor: pointer; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; }
  .collapse-btn:hover { color: ${G.gold}; }

  /* ── FORM ── */
  .form-grid { display: grid; gap: 14px; }
  .form-grid.two-col { grid-template-columns: 1fr 1fr; }
  .form-grid.one-col { grid-template-columns: 1fr; }
  @media (max-width: 600px) { .form-grid.two-col { grid-template-columns: 1fr; } }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field.full { grid-column: 1 / -1; }
  label { font-size: 0.72rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: ${G.textMuted}; }
  label .opt { font-size: 0.65rem; color: ${G.textDim}; text-transform: none; letter-spacing: 0; margin-left: 4px; font-style: italic; font-weight: 400; }
  input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="number"], input[type="date"], input[type="color"], select, textarea {
    background: rgba(255,255,255,0.04); border: 1px solid ${G.border}; border-radius: 7px; color: ${G.text}; font-size: 0.875rem; padding: 9px 12px; outline: none; transition: all 0.2s; width: 100%;
  }
  input:focus, select:focus, textarea:focus { border-color: ${G.gold}; background: rgba(201,168,76,0.05); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }
  select { cursor: pointer; } select option { background: #1a1a28; color: ${G.text}; }
  textarea { resize: vertical; min-height: 80px; }
  input[type="color"] { padding: 3px; height: 36px; cursor: pointer; }

  /* ── ITEMS ── */
  .items-header { display: grid; grid-template-columns: 1fr 70px 80px 90px 90px 36px; gap: 6px; padding: 8px 0; margin-bottom: 4px; border-bottom: 1px solid ${G.border}; }
  .items-header span { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: ${G.textDim}; font-weight: 600; }
  .item-row { display: grid; grid-template-columns: 1fr 70px 80px 90px 90px 36px; gap: 6px; margin-bottom: 6px; align-items: center; }
  @media (max-width: 700px) {
    .items-header { display: none; }
    .item-row { grid-template-columns: 1fr 1fr; background: rgba(255,255,255,0.02); border: 1px solid ${G.border}; border-radius: 8px; padding: 10px; margin-bottom: 10px; }
    .item-row input:first-child { grid-column: 1 / -1; }
  }
  .item-row input, .item-row select { padding: 8px 10px; font-size: 0.82rem; }
  .item-total-display { font-size: 0.82rem; font-weight: 600; color: ${G.gold}; text-align: right; padding: 8px 10px; background: rgba(201,168,76,0.06); border-radius: 7px; border: 1px solid rgba(201,168,76,0.12); }
  .btn-remove-item { background: none; border: 1px solid rgba(192,59,43,0.2); color: rgba(192,59,43,0.5); border-radius: 6px; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; transition: all 0.15s; }
  .btn-remove-item:hover { border-color: ${G.red}; color: ${G.red}; background: rgba(192,59,43,0.08); }
  .add-item-bar { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .btn-add-item { background: transparent; border: 1px dashed ${G.borderStrong}; color: ${G.gold}; padding: 8px 16px; border-radius: 7px; cursor: pointer; font-size: 0.82rem; font-family: 'Outfit', sans-serif; transition: all 0.15s; }
  .btn-add-item:hover { background: rgba(201,168,76,0.08); }
  .btn-add-catalog { background: transparent; border: 1px solid ${G.border}; color: ${G.textMuted}; padding: 8px 14px; border-radius: 7px; cursor: pointer; font-size: 0.82rem; font-family: 'Outfit', sans-serif; transition: all 0.15s; }
  .btn-add-catalog:hover { color: ${G.text}; border-color: ${G.borderStrong}; }

  /* ── TOTALS ── */
  .totals-block { margin-top: 16px; padding: 16px; background: rgba(201,168,76,0.04); border: 1px solid ${G.border}; border-radius: 10px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 0.875rem; color: ${G.textMuted}; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .total-row:last-child { border-bottom: none; }
  .total-row.grand { margin-top: 8px; padding-top: 10px; border-top: 1px solid ${G.borderStrong}; font-size: 1rem; font-weight: 700; color: ${G.gold}; border-bottom: none; }
  .total-row.disc { color: ${G.red}; }

  /* ── PREVIEW ── */
  .preview-column { position: relative; }
  .preview-sticky { position: sticky; top: 72px; max-height: calc(100dvh - 92px); overflow-y: auto; }
  .pdf-preview-area { background: white; border-radius: 0 0 10px 10px; font-family: 'Outfit', sans-serif; font-size: 9px; color: #333; overflow: hidden; }
  .pdf-doc { padding: 20px; position: relative; }
  .pdf-logo-img { max-height: 36px; max-width: 80px; object-fit: contain; }
  .pdf-company-name { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .pdf-company-info { font-size: 7px; color: #aaa; line-height: 1.6; }
  .pdf-devis-block { text-align: right; }
  .pdf-devis-block h2 { font-size: 16px; font-weight: 900; font-family: 'Cormorant Garamond', serif; letter-spacing: 0.1em; }
  .pdf-devis-num { font-size: 7.5px; color: #ccc; margin-top: 2px; }
  .pdf-devis-dates { font-size: 7px; color: #aaa; line-height: 1.6; margin-top: 2px; }
  .pdf-devis-object { font-size: 7px; color: #bbb; font-style: italic; margin-top: 2px; }
  .pdf-parties { display: grid; gap: 8px; margin-bottom: 14px; }
  .pdf-party-label { font-size: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; }
  .pdf-party-info { font-size: 7.5px; color: #555; line-height: 1.6; }
  .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .pdf-table tbody td { padding: 4px 6px; font-size: 7.5px; color: #444; border-bottom: 1px solid #eee; }
  .pdf-totals { margin-left: auto; width: 55%; }
  .pdf-total-row { display: flex; justify-content: space-between; font-size: 7.5px; padding: 3px 0; color: #666; }
  .pdf-total-row.grand-total { font-size: 9px; font-weight: 700; border-top: 2px solid; padding-top: 6px; margin-top: 4px; }
  .pdf-notes { margin-top: 12px; padding: 8px 10px; background: #f9f8f4; border-left: 3px solid ${G.green}; border-radius: 0 4px 4px 0; }
  .pdf-notes-label { font-size: 6px; font-weight: 700; text-transform: uppercase; color: ${G.green}; margin-bottom: 3px; }
  .pdf-notes-text { font-size: 7px; color: #555; line-height: 1.5; }
  .pdf-footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 6.5px; color: #999; text-align: center; }

  /* ── INLINE PREVIEW ── */
  .inline-preview-toggle { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(201,168,76,0.04); border: 1px solid ${G.border}; border-radius: 10px; cursor: pointer; margin-top: 4px; transition: all 0.15s; user-select: none; }
  .inline-preview-toggle:hover { background: rgba(201,168,76,0.08); border-color: ${G.borderStrong}; }
  .inline-preview-box { margin-top: 12px; border: 1px solid ${G.border}; border-radius: 10px; overflow: hidden; cursor: zoom-in; }
  .inline-preview-box:hover::after { content: '🔍 Plein écran'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: rgba(10,10,15,0.85); color: ${G.gold}; padding: 8px 16px; border-radius: 8px; font-size: 0.82rem; pointer-events: none; }
  .inline-preview-box { position: relative; }

  /* ── FULLSCREEN PREVIEW ── */
  .preview-fullscreen-overlay { position: fixed; inset: 0; z-index: 900; background: rgba(0,0,0,0.92); display: flex; flex-direction: column; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
  .preview-fullscreen-overlay.active { opacity: 1; pointer-events: all; }
  .preview-fullscreen-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: rgba(10,10,15,0.95); border-bottom: 1px solid ${G.border}; flex-shrink: 0; }
  .preview-fullscreen-title { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: ${G.gold}; }
  .preview-fullscreen-actions { display: flex; gap: 8px; align-items: center; }
  .preview-fullscreen-body { flex: 1; overflow-y: auto; width: 100%; display: flex; justify-content: center; padding: 24px 20px 40px; }
  .preview-fullscreen-doc { background: white; width: 100%; max-width: 794px; border-radius: 4px; box-shadow: 0 8px 48px rgba(0,0,0,0.6); font-family: 'Outfit', sans-serif; font-size: 11px; color: #333; overflow: hidden; transform-origin: top center; }
  .btn-close-fullscreen { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #e8dcc8; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-family: 'Outfit', sans-serif; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
  .btn-close-fullscreen:hover { background: rgba(255,255,255,0.1); }

  /* ── BOTTOM NAV ── */
  .bottom-tabbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 400; background: #0d0d14; border-top: 1px solid rgba(201,168,76,0.12); display: flex; align-items: stretch; height: 64px; padding: 0 8px; padding-bottom: env(safe-area-inset-bottom, 0px); }
  .tab-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: none; border: none; cursor: pointer; padding: 8px 4px; color: #5a5048; transition: color 0.18s; position: relative; font-family: 'Outfit', sans-serif; }
  .tab-btn::after { content: ''; position: absolute; top: 0; left: 20%; right: 20%; height: 2px; background: ${G.gold}; border-radius: 0 0 2px 2px; transform: scaleX(0); transition: transform 0.2s ease; }
  .tab-btn:hover { color: ${G.textMuted}; }
  .tab-btn.active { color: ${G.gold}; }
  .tab-btn.active::after { transform: scaleX(1); }
  .tab-btn-icon { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; }
  .tab-btn-icon svg { width: 20px; height: 20px; }
  .tab-btn-label { font-size: 0.58rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; }
  .tab-badge { position: absolute; top: 6px; right: calc(50% - 18px); background: ${G.gold}; color: #0a0a0f; font-size: 0.5rem; font-weight: 700; min-width: 14px; height: 14px; border-radius: 7px; padding: 0 3px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
  .tab-badge.visible { opacity: 1; }

  /* ── OPTIONS TABS ── */
  .opts-tabs { display: flex; gap: 2px; padding: 0 20px; border-bottom: 1px solid ${G.border}; background: ${G.bg}; position: sticky; top: 56px; z-index: 50; overflow-x: auto; }
  .opts-tab { padding: 12px 16px; font-size: 0.82rem; font-weight: 500; color: ${G.textMuted}; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; transition: all 0.18s; white-space: nowrap; font-family: 'Outfit', sans-serif; }
  .opts-tab:hover { color: ${G.text}; }
  .opts-tab.active { color: ${G.gold}; border-bottom-color: ${G.gold}; }
  .opts-body { padding: 20px; max-width: 700px; margin: 0 auto; }

  /* ── LOGO UPLOAD ── */
  .logo-upload-area { border: 2px dashed ${G.borderStrong}; border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: rgba(201,168,76,0.02); }
  .logo-upload-area:hover { border-color: ${G.gold}; background: rgba(201,168,76,0.05); }
  .logo-upload-area.has-logo { border-style: solid; border-color: rgba(201,168,76,0.3); }
  .logo-preview-img { max-height: 64px; max-width: 180px; object-fit: contain; margin: 0 auto 12px; display: block; }
  .logo-upload-text { font-size: 0.8rem; color: ${G.textMuted}; }

  /* ── CATALOG ── */
  .catalog-add-form { background: rgba(201,168,76,0.05); border: 1px solid ${G.border}; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
  .catalog-add-title { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: ${G.gold}; margin-bottom: 10px; }
  .catalog-form-row { display: grid; grid-template-columns: 1fr 100px 80px auto; gap: 8px; align-items: end; }
  @media (max-width: 600px) { .catalog-form-row { grid-template-columns: 1fr 1fr; } .catalog-form-row .field:first-child { grid-column: 1 / -1; } }
  .catalog-items-list { display: flex; flex-direction: column; gap: 6px; }
  .catalog-category-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${G.gold}; padding: 8px 0 4px; border-bottom: 1px solid ${G.border}; margin-bottom: 4px; }
  .catalog-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid ${G.border}; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
  .catalog-item:hover { background: rgba(201,168,76,0.06); border-color: ${G.borderStrong}; transform: translateX(2px); }
  .catalog-item-plus { width: 24px; height: 24px; border-radius: 50%; background: rgba(201,168,76,0.15); color: ${G.gold}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; flex-shrink: 0; }
  .catalog-item-info { flex: 1; min-width: 0; }
  .catalog-item-name { font-size: 0.85rem; color: ${G.text}; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .catalog-item-meta { font-size: 0.7rem; color: ${G.textMuted}; margin-top: 1px; }
  .catalog-item-price { font-size: 0.85rem; font-weight: 600; color: ${G.gold}; white-space: nowrap; }
  .catalog-item-del { background: none; border: none; color: rgba(192,59,43,0.4); cursor: pointer; font-size: 0.75rem; padding: 4px; transition: color 0.15s; }
  .catalog-item-del:hover { color: ${G.red}; }
  .catalog-search { margin-bottom: 12px; position: relative; }
  .catalog-search input { padding-left: 32px; }
  .catalog-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: ${G.textMuted}; font-size: 0.85rem; pointer-events: none; }
  .cat-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .cat-chip { padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; border: 1px solid ${G.border}; color: ${G.textMuted}; cursor: pointer; transition: all 0.15s; }
  .cat-chip:hover { border-color: ${G.borderStrong}; color: ${G.text}; }
  .cat-chip.active { background: rgba(201,168,76,0.15); border-color: ${G.gold}; color: ${G.gold}; }
  .catalog-empty { text-align: center; padding: 32px 20px; color: ${G.textMuted}; font-size: 0.875rem; }
  .catalog-empty-icon { font-size: 2.5rem; margin-bottom: 10px; opacity: 0.4; }

  /* ── OPTIONS SECTION (liste) ── */
  .opts-section { margin-bottom: 24px; }
  .opts-section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: ${G.gold}; margin-bottom: 0; padding: 10px 14px; border: 1px solid ${G.border}; border-radius: 8px 8px 0 0; background: rgba(201,168,76,0.06); }
  .opts-list { border: 1px solid ${G.border}; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; }
  .opts-list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem; color: ${G.text}; transition: background 0.15s; }
  .opts-list-item:last-child { border-bottom: none; }
  .opts-list-item:hover { background: rgba(255,255,255,0.02); }
  .opts-list-item-label { display: flex; flex-direction: column; gap: 2px; }
  .opts-list-item-desc { font-size: 0.72rem; color: ${G.textMuted}; }
  .toggle-switch { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.1); border-radius: 20px; cursor: pointer; transition: 0.2s; }
  .toggle-slider::before { content: ''; position: absolute; width: 14px; height: 14px; background: white; border-radius: 50%; left: 3px; top: 3px; transition: 0.2s; }
  .toggle-switch input:checked + .toggle-slider { background: ${G.gold}; }
  .toggle-switch input:checked + .toggle-slider::before { transform: translateX(16px); }

  /* ── COMPANY BADGE ── */
  .company-saved-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(74,124,89,0.15); border: 1px solid rgba(74,124,89,0.3); color: ${G.green}; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 500; margin-bottom: 12px; }

  /* ── COMPANIES PAGE ── */
  .company-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .company-card { background: ${G.bgCard}; border: 1px solid ${G.border}; border-radius: 10px; overflow: hidden; transition: border-color 0.2s; }
  .company-card.active-company { border-color: ${G.gold}; box-shadow: 0 0 0 1px rgba(201,168,76,0.2); }
  .company-card-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; }
  .company-card-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: contain; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; overflow: hidden; border: 1px solid ${G.border}; }
  .company-card-logo img { width: 100%; height: 100%; object-fit: contain; }
  .company-card-info { flex: 1; min-width: 0; }
  .company-card-name { font-size: 0.95rem; font-weight: 600; color: ${G.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .company-card-meta { font-size: 0.72rem; color: ${G.textMuted}; margin-top: 2px; }
  .company-card-active-badge { font-size: 0.65rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: rgba(201,168,76,0.15); color: ${G.gold}; border: 1px solid rgba(201,168,76,0.3); white-space: nowrap; }
  .company-card-body { padding: 16px; border-top: 1px solid ${G.border}; background: rgba(255,255,255,0.01); }
  .company-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .btn-add-company { width: 100%; padding: 14px; border: 2px dashed ${G.borderStrong}; border-radius: 10px; background: transparent; color: ${G.gold}; font-size: 0.875rem; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-add-company:hover { background: rgba(201,168,76,0.06); }

  /* ── THEMES ── */
  .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 500px) { .theme-grid { grid-template-columns: 1fr; } }
  .theme-card { border: 1px solid ${G.border}; border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.2s; }
  .theme-card:hover { border-color: ${G.borderStrong}; transform: translateY(-1px); }
  .theme-card.active { border-color: ${G.gold}; box-shadow: 0 0 0 2px rgba(201,168,76,0.2); }
  .theme-preview { height: 60px; display: flex; flex-direction: column; }
  .theme-preview-header { flex: 2; display: flex; align-items: center; padding: 0 10px; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; }
  .theme-preview-body { flex: 3; background: #f9f9f7; display: flex; align-items: center; padding: 0 10px; gap: 6px; }
  .theme-preview-line { height: 4px; border-radius: 2px; background: #ddd; flex: 1; }
  .theme-info { padding: 10px 12px; background: ${G.bgCard}; }
  .theme-name { font-size: 0.82rem; font-weight: 600; color: ${G.text}; }
  .theme-desc { font-size: 0.7rem; color: ${G.textMuted}; margin-top: 2px; }

  /* ── HOME PAGE ── */
  .home-page { padding: 28px 20px; max-width: 900px; margin: 0 auto; }
  .home-company-logo { max-height: 56px; max-width: 160px; object-fit: contain; margin-bottom: 14px; display: block; }
  .home-title { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 700; color: ${G.gold}; margin-bottom: 4px; }
  .home-subtitle { font-size: 0.9rem; color: ${G.textMuted}; margin-bottom: 28px; }
  .home-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
  @media (max-width: 500px) { .home-stats { grid-template-columns: 1fr 1fr; } }
  .stat-card { background: ${G.bgCard}; border: 1px solid ${G.border}; border-radius: 12px; padding: 20px; text-align: center; }
  .stat-number { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; font-weight: 700; color: ${G.gold}; line-height: 1; }
  .stat-label { font-size: 0.7rem; color: ${G.textMuted}; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
  .home-cta { display: flex; gap: 10px; margin-bottom: 28px; flex-wrap: wrap; }
  .home-recent-title { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: ${G.textMuted}; margin-bottom: 12px; }

  /* ── HISTORY ── */
  .history-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: ${G.bgCard}; border: 1px solid ${G.border}; border-radius: 10px; margin-bottom: 8px; }
  .history-item-info { flex: 1; min-width: 0; }
  .history-item-label { font-size: 0.875rem; font-weight: 500; color: ${G.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .history-item-date { font-size: 0.7rem; color: ${G.textMuted}; margin-top: 2px; }
  .history-item-status { font-size: 0.65rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; white-space: nowrap; flex-shrink: 0; }
  .status-draft { background: rgba(201,168,76,0.1); color: ${G.gold}; border: 1px solid rgba(201,168,76,0.2); }
  .status-validated { background: rgba(74,124,89,0.1); color: #7fcf92; border: 1px solid rgba(74,124,89,0.25); }
  .history-actions { display: flex; gap: 6px; flex-shrink: 0; }

  /* ── MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  .modal-overlay.active { opacity: 1; pointer-events: all; }
  .modal { background: ${G.bgCard}; border: 1px solid ${G.borderStrong}; border-radius: 16px; padding: 24px; max-width: 520px; width: 100%; max-height: 90dvh; overflow-y: auto; transform: scale(0.95); transition: transform 0.2s; }
  .modal-overlay.active .modal { transform: scale(1); }
  .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 700; color: ${G.gold}; margin-bottom: 16px; }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

  /* ── TOAST ── */
  .toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%) translateY(20px); background: rgba(20,20,30,0.95); border: 1px solid ${G.borderStrong}; color: ${G.text}; padding: 10px 20px; border-radius: 10px; font-size: 0.85rem; z-index: 600; opacity: 0; pointer-events: none; transition: all 0.25s; white-space: nowrap; backdrop-filter: blur(10px); }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .toast.error { border-color: rgba(192,59,43,0.4); color: #e87766; }
  .toast.success { border-color: rgba(74,124,89,0.4); color: #7fcf92; }

  /* ── PICKER ── */
  .picker-item { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid ${G.border}; border-radius: 8px; cursor: pointer; margin-bottom: 6px; transition: all 0.15s; }
  .picker-item:hover { background: rgba(201,168,76,0.06); border-color: ${G.borderStrong}; }
  .picker-item-name { font-size: 0.875rem; font-weight: 500; color: ${G.text}; }
  .picker-item-meta { font-size: 0.72rem; color: ${G.textMuted}; }
  .picker-item-price { font-weight: 600; color: ${G.gold}; font-size: 0.875rem; align-self: center; }

  /* ── COMPANY SELECTOR on Devis ── */
  .company-selector { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(201,168,76,0.04); border: 1px solid ${G.border}; border-radius: 8px; margin-bottom: 16px; }
  .company-selector-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: ${G.textMuted}; white-space: nowrap; }
  .company-selector select { flex: 1; margin: 0; }

  @media (max-width: 768px) { .header-btn-text { display: none; } .btn { padding: 7px 10px; } .app-header { padding: 0 12px; } .main-content { padding: 12px; gap: 12px; } }
  @media print { .app-header, .bottom-tabbar, .form-column, .toast { display: none !important; } .preview-column { display: block !important; } .main-content { grid-template-columns: 1fr !important; padding: 0 !important; } .preview-sticky { position: static; max-height: none; } }
`;

// ─────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);
const IconHistory = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 8 12 12 14 14"/>
    <path d="M3.05 11a9 9 0 1 0 .5-4"/>
    <polyline points="3 3 3 7 7 7"/>
  </svg>
);

// ─────────────────────────────────────────
// SUB COMPONENTS
// ─────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}
function Toast({ message, type, show }) {
  return <div className={`toast ${show ? 'show' : ''} ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`}>{message}</div>;
}
function Card({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <div className="card-header" onClick={() => setOpen(o => !o)}>
        <span className="card-icon">{icon}</span>
        <span className="card-title">{title}</span>
        <button className="collapse-btn">{open ? '▾' : '▸'}</button>
      </div>
      {open && <div className="card-body">{children}</div>}
    </div>
  );
}

// Composant logo upload réutilisable
function LogoUpload({ logo, onUpload, onRemove, inputId }) {
  return (
    <div className="opts-section">
      <div className="opts-section-title">Logo de l'entreprise</div>
      <div className="opts-list">
        <div className="opts-list-item" style={{flexDirection:'column',alignItems:'stretch',gap:10}}>
          <div className={`logo-upload-area ${logo?'has-logo':''}`} onClick={() => document.getElementById(inputId).click()}>
            {logo
              ? <img src={logo} alt="logo" className="logo-preview-img" />
              : <div style={{fontSize:'2.5rem',marginBottom:8}}>🖼</div>
            }
            <div className="logo-upload-text">{logo ? 'Cliquer pour changer le logo' : 'Cliquer pour importer un logo (PNG, JPG)'}</div>
            <input id={inputId} type="file" accept="image/*" style={{display:'none'}} onChange={onUpload} />
          </div>
          {logo && <button className="btn btn-danger btn-sm" style={{alignSelf:'flex-start'}} onClick={onRemove}>✕ Supprimer le logo</button>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────
export default function App() {
  // ── Navigation ──
  const [page, setPage] = useState('home');
  const [optionsTab, setOptionsTab] = useState('entreprises');
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const toastTimer = useRef(null);
  function showToast(msg, type = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message: msg, type });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }

  // ── Companies (multi-entreprise) ──
  const [companies, setCompanies] = useState(() => lsGet('md_companies', []));
  const [activeCompanyId, setActiveCompanyId] = useState(() => lsGet('md_active_company', null));
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [newCompanyForm, setNewCompanyForm] = useState(null); // null = fermé, {} = ouvert

  // Entreprise active
  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0] || null;
  
  // Compatibilité: ancienne entreprise unique migrée
  useEffect(() => {
    const oldCompany = lsGet('md_company', null);
    const oldLogo = lsGet('md_logo', null);
    if (oldCompany && oldCompany.name && companies.length === 0) {
      const migrated = { id: Date.now(), ...oldCompany, logo: oldLogo, themeId: 'or' };
      const newList = [migrated];
      setCompanies(newList);
      setActiveCompanyId(migrated.id);
      lsSet('md_companies', newList);
      lsSet('md_active_company', migrated.id);
    }
  }, []);

  function saveCompanies(list) { setCompanies(list); lsSet('md_companies', list); }
  function setActiveCompany(id) { setActiveCompanyId(id); lsSet('md_active_company', id); showToast('✓ Entreprise sélectionnée'); }

  function addCompany(form) {
    const newC = { id: Date.now(), name: '', email: '', phone: '', siret: '', address: '', tvaNum: '', website: '', logo: null, themeId: 'or', ...form };
    const list = [...companies, newC];
    saveCompanies(list);
    if (!activeCompanyId) { setActiveCompanyId(newC.id); lsSet('md_active_company', newC.id); }
    setNewCompanyForm(null);
    showToast('✓ Entreprise ajoutée');
  }

  function updateCompany(id, data) {
    const list = companies.map(c => c.id === id ? { ...c, ...data } : c);
    saveCompanies(list);
    showToast('✓ Entreprise sauvegardée');
  }

  function deleteCompany(id) {
    const list = companies.filter(c => c.id !== id);
    saveCompanies(list);
    if (activeCompanyId === id) {
      const newActive = list[0]?.id || null;
      setActiveCompanyId(newActive);
      lsSet('md_active_company', newActive);
    }
    setEditingCompanyId(null);
    showToast('Entreprise supprimée');
  }

  function handleLogoUploadForCompany(id, e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { updateCompany(id, { logo: ev.target.result }); showToast('✓ Logo importé'); };
    reader.readAsDataURL(file);
  }

  // Rétrocompatibilité: companyInfo et companyLogo = de l'entreprise active
  const companyInfo = activeCompany ? {
    name: activeCompany.name || '', email: activeCompany.email || '',
    phone: activeCompany.phone || '', siret: activeCompany.siret || '',
    address: activeCompany.address || '', tvaNum: activeCompany.tvaNum || '',
    website: activeCompany.website || ''
  } : { name: '', email: '', phone: '', siret: '', address: '', tvaNum: '', website: '' };
  const companyLogo = activeCompany?.logo || null;
  const activeTheme = THEMES[activeCompany?.themeId] || THEMES.or;

  // ── Client ──
  const [clientInfo, setClientInfo] = useState({ name: '', firstName: '', email: '', phone: '', address: '', siret: '' });

  // ── Devis info ──
  const [devisInfo, setDevisInfo] = useState({
    num: '', object: '', date: today(), validity: daysLater(30),
    tvaRate: 20, currency: '€', paymentTerms: 'À réception', discount: 0, notes: '', conditions: '',
    companyId: null
  });
  // Générer le numéro à la première ouverture de la page devis
  const devisNumGenerated = useRef(false);
  useEffect(() => {
    if (page === 'devis' && !devisNumGenerated.current) {
      setDevisInfo(p => ({ ...p, num: genDevisNum(), companyId: activeCompanyId }));
      devisNumGenerated.current = true;
    }
  }, [page]);

  // ── Items ──
  const [items, setItems] = useState([
    { id: 1, desc: '', qty: 1, unit: 'unité', price: 0 },
    { id: 2, desc: '', qty: 1, unit: 'unité', price: 0 },
  ]);
  const [itemCounter, setItemCounter] = useState(3);

  // ── Catalog ──
  const [catalog, setCatalog] = useState(() => lsGet('md_catalog', []));
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState(null);
  const [catForm, setCatForm] = useState({ desc: '', price: '', unit: 'unité', category: '' });

  // ── PDF Options ──
  const [pdfOptions, setPdfOptions] = useState(() => lsGet('md_pdfopts', {
    showEmitter: true, showRecipient: true, showUnit: true,
    showSubtotals: true, showTva: true, showFooter: true,
    showLineNumbers: false, showWatermark: false,
    accentColor: '#c9a84c', headerStyle: 'full',
  }));
  useEffect(() => { lsSet('md_pdfopts', pdfOptions); }, [pdfOptions]);

  // ── Drafts ──
  const [drafts, setDrafts] = useState(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('md_draft_'));
    return keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }).filter(Boolean).sort((a, b) => b._ts - a._ts);
  });

  // ── Modals ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);

  // ── Computed ──
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discountAmt = subtotal * devisInfo.discount / 100;
  const afterDisc = subtotal - discountAmt;
  const tva = pdfOptions.showTva ? afterDisc * devisInfo.tvaRate / 100 : 0;
  const ttc = afterDisc + tva;
  const totalDevis = drafts.length;
  const validatedDevis = drafts.filter(d => d._status === 'validated').length;

  // ── Catalog ──
  function saveCatalog(c) { setCatalog(c); lsSet('md_catalog', c); }
  function addToCatalog() {
    if (!catForm.desc.trim()) { showToast('La désignation est obligatoire', 'error'); return; }
    const entry = { id: Date.now(), ...catForm, price: parseFloat(catForm.price) || 0, category: catForm.category || 'Général' };
    saveCatalog([...catalog, entry]);
    setCatForm({ desc: '', price: '', unit: 'unité', category: '' });
    showToast(`✓ "${entry.desc}" ajouté`);
  }
  function removeFromCatalog(id) { saveCatalog(catalog.filter(i => i.id !== id)); showToast('Prestation supprimée'); }
  function addCatalogItemToDevis(entry) {
    const id = itemCounter;
    setItemCounter(c => c + 1);
    setItems(prev => [...prev, { id, desc: entry.desc, qty: 1, unit: entry.unit, price: entry.price }]);
    showToast(`✓ "${entry.desc}" ajouté au devis`);
  }

  // ── Items ──
  function addItem() { const id = itemCounter; setItemCounter(c => c + 1); setItems(prev => [...prev, { id, desc: '', qty: 1, unit: 'unité', price: 0 }]); }
  function removeItem(id) { setItems(prev => prev.filter(i => i.id !== id)); }
  function updateItem(id, field, value) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: (field === 'qty' || field === 'price') ? (parseFloat(value) || 0) : value } : i));
  }

  // ── Drafts ──
  function saveDraft(status = 'draft') {
    const key = `md_draft_${Date.now()}`;
    const clientDisplay = [clientInfo.name, clientInfo.firstName].filter(Boolean).join(' ');
    const label = `${clientDisplay || 'Sans client'} — ${devisInfo.num}`;
    const data = { _key: key, _label: label, _ts: Date.now(), _status: status, companyInfo, companyId: activeCompanyId, clientInfo, devisInfo, items };
    lsSet(key, data);
    setDrafts([data, ...drafts].slice(0, 20));
    showToast(status === 'validated' ? '✓ Devis validé !' : `✓ Brouillon sauvegardé`);
  }
  function updateDraftStatus(key, status) {
    const updated = drafts.map(d => d._key === key ? { ...d, _status: status } : d);
    setDrafts(updated);
    const d = updated.find(x => x._key === key);
    if (d) lsSet(key, d);
    showToast(status === 'validated' ? '✓ Devis validé' : '✓ Mis à jour');
  }
  function loadDraft(draft) {
    if (draft.companyId) {
      setActiveCompanyId(draft.companyId);
      lsSet('md_active_company', draft.companyId);
    }
    setClientInfo(draft.clientInfo || { name: '', firstName: '', email: '', phone: '', address: '', siret: '' });
    setDevisInfo(draft.devisInfo);
    devisNumGenerated.current = true;
    setItems(draft.items.map(i => ({ ...i, id: itemCounter + Math.random() })));
    setItemCounter(c => c + 100);
    setPage('devis');
    showToast(`✓ Devis "${draft._label}" chargé`);
  }
  function deleteDraft(key) {
    localStorage.removeItem(key);
    setDrafts(prev => prev.filter(d => d._key !== key));
    showToast('Supprimé');
  }
  function resetForm() {
    setConfirmModal({
      title: 'Nouveau devis',
      message: 'Réinitialiser le formulaire ? Les données seront perdues.',
      onOk: () => {
        setClientInfo({ name: '', firstName: '', email: '', phone: '', address: '', siret: '' });
        devisNumGenerated.current = false;
        setDevisInfo({ num: '', object: '', date: today(), validity: daysLater(30), tvaRate: 20, currency: '€', paymentTerms: 'À réception', discount: 0, notes: '', conditions: '', companyId: activeCompanyId });
        setItems([{ id: 1, desc: '', qty: 1, unit: 'unité', price: 0 }, { id: 2, desc: '', qty: 1, unit: 'unité', price: 0 }]);
        setItemCounter(3);
        setConfirmModal(null);
        showToast('✓ Réinitialisé');
      }
    });
  }

  // ── Thème PDF selon l'entreprise active ──
  function getThemeForPdf() {
    const comp = companies.find(c => c.id === (devisInfo.companyId || activeCompanyId));
    return THEMES[comp?.themeId] || THEMES.or;
  }

  // ── PDF ──
  async function generatePDF(download = true) {
    if (!window.jspdf) { showToast('jsPDF non chargé', 'error'); return null; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297, ml = 16, mr = 16, cw = W - ml - mr;
    let y = 0;
    const theme = getThemeForPdf();
    const ACCENT = hexToRgb(theme.accentColor);
    const HBGR = hexToRgb(theme.headerBg);
    const HTXR = hexToRgb(theme.headerText);
    const INK = HBGR, CREAM = hexToRgb(theme.tableHeadText), LGRAY = [240, 238, 234];
    const MGRAY = [180, 176, 166], DGRAY = [80, 78, 90], GREEN = [74, 124, 89];
    const cur = devisInfo.currency;

    // Entreprise courante du devis
    const devisCompany = companies.find(c => c.id === (devisInfo.companyId || activeCompanyId)) || activeCompany;
    const devisLogo = devisCompany?.logo || null;
    const devisCompanyInfo = devisCompany ? {
      name: devisCompany.name, email: devisCompany.email, phone: devisCompany.phone,
      siret: devisCompany.siret, address: devisCompany.address, tvaNum: devisCompany.tvaNum
    } : companyInfo;

    doc.setFillColor(...HBGR); doc.rect(0, 0, W, 46, 'F');
    doc.setFillColor(...ACCENT); doc.rect(0, 44, W, 2, 'F');

    if (devisLogo) {
      try {
        const ext = devisLogo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(devisLogo, ext, ml, 8, 30, 28, undefined, 'FAST');
        if (pdfOptions.headerStyle === 'full') {
          const lines = [devisCompanyInfo.address, devisCompanyInfo.phone ? 'Tél : ' + devisCompanyInfo.phone : '', devisCompanyInfo.email, devisCompanyInfo.siret ? 'SIRET : ' + devisCompanyInfo.siret : ''].filter(Boolean);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 200, 218);
          let cy = 10; lines.forEach(l => { doc.text(l, ml + 34, cy); cy += 4; });
        }
      } catch(e) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...ACCENT);
        doc.text(devisCompanyInfo.name || 'Votre Entreprise', ml, 16);
      }
    } else {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...ACCENT);
      doc.text(devisCompanyInfo.name || 'Votre Entreprise', ml, 16);
      if (pdfOptions.headerStyle === 'full') {
        const lines = [devisCompanyInfo.address, devisCompanyInfo.phone ? 'Tél : ' + devisCompanyInfo.phone : '', devisCompanyInfo.email, devisCompanyInfo.siret ? 'SIRET : ' + devisCompanyInfo.siret : ''].filter(Boolean);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 200, 218);
        let cy = 23; lines.forEach(l => { doc.text(l, ml, cy); cy += 4; });
      }
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...ACCENT);
    doc.text('DEVIS', W - mr, 16, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 200, 218);
    doc.text(`N° ${devisInfo.num}`, W - mr, 23, { align: 'right' });
    if (devisInfo.date) doc.text('Émis le ' + formatDate(devisInfo.date), W - mr, 28.5, { align: 'right' });
    if (devisInfo.validity) doc.text("Valide jusqu'au " + formatDate(devisInfo.validity), W - mr, 33, { align: 'right' });
    if (devisInfo.object) { doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.text('Objet : ' + devisInfo.object, W - mr, 37.5, { align: 'right' }); }
    y = 53;

    if (pdfOptions.showEmitter || pdfOptions.showRecipient) {
      const both = pdfOptions.showEmitter && pdfOptions.showRecipient;
      doc.setFillColor(...LGRAY);
      if (pdfOptions.showEmitter) doc.roundedRect(ml, y, both ? (cw/2)-3 : cw, 32, 2, 2, 'F');
      if (pdfOptions.showRecipient && both) doc.roundedRect(W/2+3, y, (cw/2)-3, 32, 2, 2, 'F');
      if (pdfOptions.showRecipient && !pdfOptions.showEmitter) doc.roundedRect(ml, y, cw, 32, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...ACCENT);
      if (pdfOptions.showEmitter) doc.text('ÉMETTEUR', ml+4, y+6);
      if (pdfOptions.showRecipient && both) doc.text('DESTINATAIRE', W/2+7, y+6);
      if (pdfOptions.showRecipient && !pdfOptions.showEmitter) doc.text('DESTINATAIRE', ml+4, y+6);
      if (pdfOptions.showEmitter) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...DGRAY);
        doc.text(devisCompanyInfo.name || '—', ml+4, y+12);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DGRAY);
        let ey = y+17;
        if (devisCompanyInfo.address) { doc.text(devisCompanyInfo.address, ml+4, ey); ey += 4; }
        if (devisCompanyInfo.email) doc.text(devisCompanyInfo.email, ml+4, ey);
      }
      const cx = (pdfOptions.showRecipient && both) ? W/2+7 : (pdfOptions.showRecipient ? ml+4 : null);
      if (cx) {
        const fullName = [clientInfo.name, clientInfo.firstName].filter(Boolean).join(' ');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...DGRAY);
        doc.text(fullName || '—', cx, y+12);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DGRAY);
        let cly = y+17;
        if (clientInfo.address) { doc.text(clientInfo.address, cx, cly); cly += 4; }
        if (clientInfo.email) { doc.text(clientInfo.email, cx, cly); cly += 4; }
        if (clientInfo.siret) doc.text('SIRET : ' + clientInfo.siret, cx, cly);
      }
      y += 40;
    }

    doc.setFillColor(...INK); doc.rect(ml, y, cw, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...CREAM);
    doc.text('DESCRIPTION', ml+3, y+5.3);
    const qtyX = ml+(pdfOptions.showUnit?82:92), unitX = ml+103;
    const prX = ml+(pdfOptions.showUnit?130:140), totX = ml+cw-1;
    doc.text('QTÉ', qtyX, y+5.3, {align:'right'});
    if (pdfOptions.showUnit) doc.text('UNITÉ', unitX, y+5.3, {align:'center'});
    doc.text('PRIX HT', prX, y+5.3, {align:'right'});
    doc.text('TOTAL HT', totX, y+5.3, {align:'right'});
    y += 8;

    items.forEach((item, idx) => {
      const rowH = 7.5;
      if (y+rowH > H-40) { doc.addPage(); y=16; }
      if (idx%2===0) { doc.setFillColor(250,249,246); doc.rect(ml,y,cw,rowH,'F'); }
      const itemTot = item.qty*item.price;
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...DGRAY);
      const desc = pdfOptions.showLineNumbers ? `${idx+1}. ${item.desc||'—'}` : (item.desc||'—');
      doc.text(desc, ml+3, y+5);
      doc.text(String(item.qty), qtyX, y+5, {align:'right'});
      if (pdfOptions.showUnit) doc.text(item.unit||'', unitX, y+5, {align:'center'});
      doc.text(formatMoney(item.price,cur), prX, y+5, {align:'right'});
      doc.setFont('helvetica','bold'); doc.setTextColor(...INK);
      doc.text(formatMoney(itemTot,cur), totX, y+5, {align:'right'});
      y += rowH;
    });

    doc.setDrawColor(...MGRAY); doc.setLineWidth(0.3);
    doc.line(ml, y+2, W-mr, y+2); y += 8;

    const tx = W-mr, tbx = tx-68;
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...DGRAY);
    if (pdfOptions.showSubtotals) {
      doc.text('Sous-total HT', tbx, y); doc.text(formatMoney(subtotal,cur), tx, y, {align:'right'}); y += 5.5;
      if (devisInfo.discount > 0) {
        doc.setTextColor(192,57,43);
        doc.text(`Remise (${devisInfo.discount}%)`, tbx, y); doc.text('− '+formatMoney(discountAmt,cur), tx, y, {align:'right'});
        doc.setTextColor(...DGRAY); y += 5.5;
      }
      if (pdfOptions.showTva) {
        doc.text(`TVA ${devisInfo.tvaRate}%`, tbx, y); doc.text(formatMoney(tva,cur), tx, y, {align:'right'}); y += 7;
      }
    }
    doc.setFillColor(...INK); doc.roundedRect(tbx-2, y-2, 72, 10, 2, 2, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(...ACCENT);
    const totLabel = pdfOptions.showTva ? 'Total TTC' : 'Total HT';
    doc.text(totLabel, tbx+2, y+5.5); doc.text(formatMoney(ttc,cur), tx-1, y+5.5, {align:'right'}); y += 17;

    if (devisInfo.notes) {
      const lines = doc.splitTextToSize(devisInfo.notes, cw-10);
      const nh = lines.length*4+10;
      if (y+nh > H-35) { doc.addPage(); y=16; }
      doc.setFillColor(249,248,244); doc.roundedRect(ml,y,cw,nh,2,2,'F');
      doc.setFillColor(...GREEN); doc.rect(ml,y,3,nh,'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(...GREEN);
      doc.text('NOTES', ml+6, y+5.5);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(80,80,90);
      doc.text(lines, ml+6, y+10); y += nh+6;
    }

    if (pdfOptions.showWatermark) {
      const pg = doc.getNumberOfPages();
      for (let p=1; p<=pg; p++) {
        doc.setPage(p); doc.saveGraphicsState();
        doc.setGState(new doc.GState({opacity:0.1}));
        doc.setFont('helvetica','bold'); doc.setFontSize(55); doc.setTextColor(192,57,43);
        doc.text('BROUILLON', W/2, H/2, {angle:35, align:'center'});
        doc.restoreGraphicsState();
      }
    }

    if (pdfOptions.showFooter) {
      doc.setFillColor(...INK); doc.rect(0, H-14, W, 14, 'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(160,155,140);
      const fp = [`Paiement : ${devisInfo.paymentTerms}`, devisCompanyInfo.name, devisCompanyInfo.siret?'SIRET : '+devisCompanyInfo.siret:''].filter(Boolean).join(' — ');
      doc.text(fp, W/2, H-6, {align:'center'});
    }

    if (download) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href=url; a.download=`devis-${devisInfo.num}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      showToast('✓ PDF téléchargé !');
    }
    return doc;
  }

  // ── Preview HTML ──
  function buildPreviewHTML() {
    const devisCompany = companies.find(c => c.id === (devisInfo.companyId || activeCompanyId)) || activeCompany;
    const dComp = devisCompany ? {
      name: devisCompany.name, email: devisCompany.email, phone: devisCompany.phone,
      siret: devisCompany.siret, address: devisCompany.address
    } : companyInfo;
    const dLogo = devisCompany?.logo || null;
    const dTheme = THEMES[devisCompany?.themeId] || THEMES.or;

    const compRows = [dComp.address, dComp.phone?'Tél : '+dComp.phone:'', dComp.email, dComp.siret?'SIRET : '+dComp.siret:''].filter(Boolean).join('<br>');
    const clientFullName = [clientInfo.name, clientInfo.firstName].filter(Boolean).join(' ');
    const clientRows = [clientInfo.address, clientInfo.phone?'Tél : '+clientInfo.phone:'', clientInfo.email, clientInfo.siret?'SIRET : '+clientInfo.siret:''].filter(Boolean).join('<br>');

    const tableRows = items.map((item, idx) => `
      <tr style="background:${idx%2===0?'#fff':dTheme.tableAltBg}">
        <td>${pdfOptions.showLineNumbers?`<span style="color:#999;font-size:0.65rem">${idx+1}. </span>`:''}${escHtml(item.desc)||'<em style="color:#ccc">—</em>'}</td>
        <td style="text-align:right">${item.qty}</td>
        ${pdfOptions.showUnit?`<td style="text-align:right">${escHtml(item.unit)}</td>`:''}
        <td style="text-align:right">${formatMoney(item.price,devisInfo.currency)}</td>
        <td style="text-align:right;font-weight:600">${formatMoney(item.qty*item.price,devisInfo.currency)}</td>
      </tr>`).join('');

    let totalsHTML = '';
    if (pdfOptions.showSubtotals) {
      totalsHTML += `<div class="pdf-total-row"><span>Sous-total HT</span><span>${formatMoney(subtotal,devisInfo.currency)}</span></div>`;
      if (devisInfo.discount>0) totalsHTML += `<div class="pdf-total-row" style="color:#c03b2b"><span>Remise (${devisInfo.discount}%)</span><span>− ${formatMoney(discountAmt,devisInfo.currency)}</span></div>`;
      if (pdfOptions.showTva) totalsHTML += `<div class="pdf-total-row"><span>TVA ${devisInfo.tvaRate}%</span><span>${formatMoney(tva,devisInfo.currency)}</span></div>`;
    }
    const totLabel = pdfOptions.showTva ? 'Total TTC' : 'Total HT';
    totalsHTML += `<div class="pdf-total-row grand-total" style="border-top-color:${dTheme.accentColor};color:${dTheme.headerBg}"><span>${totLabel}</span><span>${formatMoney(ttc,devisInfo.currency)}</span></div>`;

    const logoHTML = dLogo ? `<img src="${dLogo}" class="pdf-logo-img" alt="logo" />` : '';
    const partiesHTML = (pdfOptions.showEmitter||pdfOptions.showRecipient) ? `
      <div class="pdf-parties" style="grid-template-columns:${pdfOptions.showEmitter&&pdfOptions.showRecipient?'1fr 1fr':'1fr'}">
        ${pdfOptions.showEmitter?`<div><div class="pdf-party-label" style="color:${dTheme.accentColor}">Émetteur</div><div class="pdf-party-info"><strong>${escHtml(dComp.name)||'—'}</strong><br>${compRows}</div></div>`:''}
        ${pdfOptions.showRecipient?`<div><div class="pdf-party-label" style="color:${dTheme.accentColor}">Destinataire</div><div class="pdf-party-info"><strong>${escHtml(clientFullName)||'—'}</strong><br>${clientRows||'<span style="color:#ccc">À compléter</span>'}</div></div>`:''}
      </div>` : '';

    return `
      <div class="pdf-doc">
        <div class="pdf-header" style="background:${dTheme.headerBg};border-bottom:2px solid ${dTheme.accentColor}">
          <div>
            ${logoHTML}
            ${!dLogo?`<div class="pdf-company-name" style="color:${dTheme.accentColor}">${escHtml(dComp.name)||'<span style="color:#555">Votre Entreprise</span>'}</div>`:''}
            <div class="pdf-company-info">${compRows}</div>
          </div>
          <div class="pdf-devis-block">
            <h2 style="color:${dTheme.headerText}">DEVIS</h2>
            <div class="pdf-devis-num">N° ${escHtml(devisInfo.num)||'—'}</div>
            <div class="pdf-devis-dates">${devisInfo.date?'Émis le '+formatDate(devisInfo.date):''}${devisInfo.validity?'<br>Valide jusqu\'au '+formatDate(devisInfo.validity):''}</div>
            ${devisInfo.object?`<div class="pdf-devis-object">Objet : ${escHtml(devisInfo.object)}</div>`:''}
          </div>
        </div>
        ${partiesHTML}
        <table class="pdf-table">
          <thead><tr style="background:${dTheme.tableHeadBg}">
            <th style="text-align:left;padding:5px 6px;font-size:6.5px;text-transform:uppercase;letter-spacing:0.08em;color:${dTheme.tableHeadText}">Description</th>
            <th style="text-align:right;padding:5px 6px;font-size:6.5px;text-transform:uppercase;letter-spacing:0.08em;color:${dTheme.tableHeadText}">Qté</th>
            ${pdfOptions.showUnit?`<th style="text-align:right;padding:5px 6px;font-size:6.5px;text-transform:uppercase;color:${dTheme.tableHeadText}">Unité</th>`:''}
            <th style="text-align:right;padding:5px 6px;font-size:6.5px;text-transform:uppercase;letter-spacing:0.08em;color:${dTheme.tableHeadText}">Prix HT</th>
            <th style="text-align:right;padding:5px 6px;font-size:6.5px;text-transform:uppercase;letter-spacing:0.08em;color:${dTheme.tableHeadText}">Total HT</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="pdf-totals">${totalsHTML}</div>
        ${devisInfo.notes?`<div class="pdf-notes"><div class="pdf-notes-label">Notes</div><div class="pdf-notes-text">${escHtml(devisInfo.notes).replace(/\n/g,'<br>')}</div></div>`:''}
        ${pdfOptions.showFooter?`<div class="pdf-footer">Paiement : ${escHtml(devisInfo.paymentTerms)}${dComp.name?' — '+escHtml(dComp.name):''}${dComp.siret?' — SIRET : '+escHtml(dComp.siret):''}</div>`:''}
      </div>`;
  }

  // ── Catalog filter ──
  const categories = [...new Set(catalog.map(i => i.category))].sort();
  const filteredCatalog = catalog.filter(i => {
    const ms = !catalogSearch || i.desc.toLowerCase().includes(catalogSearch.toLowerCase()) || (i.category||'').toLowerCase().includes(catalogSearch.toLowerCase());
    const mf = !catalogFilter || i.category === catalogFilter;
    return ms && mf;
  });
  const catalogByCat = filteredCatalog.reduce((acc, i) => { (acc[i.category]=acc[i.category]||[]).push(i); return acc; }, {});

  // ═══════════════════════════════════════
  // PAGE RENDERS
  // ═══════════════════════════════════════

  // ── HOME ──
  const renderHome = () => (
    <div className="home-page">
      {companyLogo && <img src={companyLogo} alt="logo" className="home-company-logo" />}
      <div className="home-title">{companyInfo.name || 'Mydevis'}</div>
      <div className="home-subtitle">Tableau de bord · Gestion de vos devis</div>

      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-number">{totalDevis}</div>
          <div className="stat-label">Devis créés</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#7fcf92' }}>{validatedDevis}</div>
          <div className="stat-label">Validés</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: G.gold }}>{totalDevis - validatedDevis}</div>
          <div className="stat-label">En attente</div>
        </div>
      </div>

      <div className="home-cta">
        <button className="btn btn-primary" onClick={() => { devisNumGenerated.current = false; setPage('devis'); }}>＋ Nouveau devis</button>
        <button className="btn btn-outline" onClick={() => setPage('historique')}>Historique</button>
        <button className="btn btn-ghost" onClick={() => { setPage('options'); setOptionsTab('entreprises'); }}>Configurer</button>
      </div>

      {drafts.length > 0 && (
        <>
          <div className="home-recent-title">Derniers devis</div>
          {drafts.slice(0, 5).map(d => (
            <div key={d._key} className="history-item">
              <div className="history-item-info">
                <div className="history-item-label">{d._label}</div>
                <div className="history-item-date">{new Date(d._ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
              <span className={`history-item-status ${d._status === 'validated' ? 'status-validated' : 'status-draft'}`}>
                {d._status === 'validated' ? '✓ Validé' : 'Brouillon'}
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => loadDraft(d)}>Charger</button>
            </div>
          ))}
        </>
      )}
    </div>
  );

  // ── DEVIS ──
  const renderDevis = () => (
    <>
      <header className="app-header">
        <div className="logo">Mydevis</div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={resetForm}>↺ <span className="header-btn-text">Nouveau</span></button>
          <button className="btn btn-ghost btn-sm" onClick={() => saveDraft('draft')}>💾 <span className="header-btn-text">Sauvegarder</span></button>
          <button className="btn btn-green btn-sm" onClick={() => saveDraft('validated')}>✓ <span className="header-btn-text">Valider</span></button>
          <button className="btn btn-outline btn-sm" onClick={() => generatePDF(true)}>⬇ <span className="header-btn-text">PDF</span></button>
          <button className="btn btn-primary btn-sm" onClick={() => setEmailModal({
            to: clientInfo.email,
            subject: `Devis N° ${devisInfo.num} — ${companyInfo.name || 'Notre société'}`,
            body: `Bonjour ${[clientInfo.firstName, clientInfo.name].filter(Boolean).join(' ') || 'Madame/Monsieur'},\n\nVeuillez trouver ci-joint notre devis N° ${devisInfo.num}.\n\nCe devis est valable jusqu'au ${formatDate(devisInfo.validity) || '—'}.\n\nCordialement,\n${companyInfo.name || ''}\n${companyInfo.phone || ''}\n${companyInfo.email || ''}`
          })}>✉ <span className="header-btn-text">Email</span></button>
        </div>
      </header>

      <div className="main-content">
        <div className="form-column">

          {/* Sélecteur d'entreprise */}
          {companies.length > 1 && (
            <div className="company-selector">
              <span className="company-selector-label">Entreprise</span>
              <select value={devisInfo.companyId || activeCompanyId || ''} onChange={e => {
                const id = parseInt(e.target.value);
                setDevisInfo(p => ({ ...p, companyId: id }));
                setActiveCompany(id);
              }}>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name || 'Sans nom'}</option>
                ))}
              </select>
            </div>
          )}

          <Card title="Détails du Devis" icon="📋" defaultOpen>
            <div className="form-grid two-col">
              <div className="field"><label>N° de devis</label><input type="text" value={devisInfo.num} onChange={e => setDevisInfo(p => ({...p, num: e.target.value}))} /></div>
              <div className="field"><label>Objet du devis</label><input type="text" placeholder="Développement site web..." value={devisInfo.object} onChange={e => setDevisInfo(p => ({...p, object: e.target.value}))} /></div>
              <div className="field"><label>Date d'émission</label><input type="date" value={devisInfo.date} onChange={e => setDevisInfo(p => ({...p, date: e.target.value}))} /></div>
              <div className="field"><label>Date de validité</label><input type="date" value={devisInfo.validity} onChange={e => setDevisInfo(p => ({...p, validity: e.target.value}))} /></div>
              <div className="field"><label>Taux TVA (%)</label><input type="number" min="0" max="100" step="0.5" value={devisInfo.tvaRate} onChange={e => setDevisInfo(p => ({...p, tvaRate: parseFloat(e.target.value)||0}))} /></div>
              <div className="field"><label>Devise</label>
                <select value={devisInfo.currency} onChange={e => setDevisInfo(p => ({...p, currency: e.target.value}))}>
                  <option value="€">EUR — Euro (€)</option>
                  <option value="$">USD — Dollar ($)</option>
                  <option value="CHF">CHF — Franc suisse</option>
                  <option value="£">GBP — Livre sterling (£)</option>
                  <option value="MAD">MAD — Dirham</option>
                </select>
              </div>
              <div className="field"><label>Conditions de paiement</label>
                <select value={devisInfo.paymentTerms} onChange={e => setDevisInfo(p => ({...p, paymentTerms: e.target.value}))}>
                  <option>À réception</option><option>15 jours net</option><option>30 jours net</option>
                  <option>45 jours net</option><option>60 jours net</option>
                  <option>50% à la commande, 50% à la livraison</option>
                </select>
              </div>
              <div className="field"><label>Remise globale (%)</label><input type="number" min="0" max="100" step="0.5" value={devisInfo.discount} onChange={e => setDevisInfo(p => ({...p, discount: parseFloat(e.target.value)||0}))} /></div>
            </div>
          </Card>

          <Card title="Informations Client" icon="👤" defaultOpen>
            <div className="form-grid two-col">
              <div className="field"><label>Nom *</label><input type="text" placeholder="Dupont" value={clientInfo.name} onChange={e => setClientInfo(p => ({...p, name: e.target.value}))} /></div>
              <div className="field"><label>Prénom <span className="opt">(facultatif)</span></label><input type="text" placeholder="Jean" value={clientInfo.firstName} onChange={e => setClientInfo(p => ({...p, firstName: e.target.value}))} /></div>
              <div className="field"><label>Email *</label><input type="email" placeholder="client@email.fr" value={clientInfo.email} onChange={e => setClientInfo(p => ({...p, email: e.target.value}))} /></div>
              <div className="field"><label>Téléphone</label><input type="tel" placeholder="+33 6 12 34 56 78" value={clientInfo.phone} onChange={e => setClientInfo(p => ({...p, phone: e.target.value}))} /></div>
              <div className="field full"><label>Adresse de facturation</label><input type="text" placeholder="5 avenue Victor Hugo, 69001 Lyon" value={clientInfo.address} onChange={e => setClientInfo(p => ({...p, address: e.target.value}))} /></div>
              <div className="field"><label>SIRET client <span className="opt">(facultatif)</span></label><input type="text" placeholder="123 456 789 00010" value={clientInfo.siret} onChange={e => setClientInfo(p => ({...p, siret: e.target.value}))} /></div>
            </div>
          </Card>

          <Card title="Articles & Prestations" icon="📦" defaultOpen>
            <div className="items-header">
              <span>Description</span><span>Qté</span><span>Unité</span>
              <span style={{textAlign:'right'}}>Prix HT</span>
              <span style={{textAlign:'right'}}>Total HT</span>
              <span></span>
            </div>
            {items.map(item => (
              <div key={item.id} className="item-row">
                <input type="text" placeholder="Description..." value={item.desc} onChange={e => updateItem(item.id,'desc',e.target.value)} />
                <input type="number" min="0" step="0.01" value={item.qty} onChange={e => updateItem(item.id,'qty',e.target.value)} />
                <select value={item.unit} onChange={e => updateItem(item.id,'unit',e.target.value)}>
                  {['unité','h','j','m²','m³','kg','forfait','lot'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id,'price',e.target.value)} />
                <div className="item-total-display">{formatMoney(item.qty*item.price,devisInfo.currency)}</div>
                <button className="btn-remove-item" onClick={() => removeItem(item.id)}>✕</button>
              </div>
            ))}
            <div className="add-item-bar">
              <button className="btn-add-item" onClick={addItem}>+ Ligne vide</button>
              <button className="btn-add-catalog" onClick={() => { setPickerSearch(''); setPickerOpen(true); }}>📋 Depuis les prestations</button>
            </div>
            <div className="totals-block">
              <div className="total-row"><span>Sous-total HT</span><span>{formatMoney(subtotal,devisInfo.currency)}</span></div>
              {devisInfo.discount>0 && <div className="total-row disc"><span>Remise ({devisInfo.discount}%)</span><span>− {formatMoney(discountAmt,devisInfo.currency)}</span></div>}
              {pdfOptions.showTva && <div className="total-row"><span>TVA ({devisInfo.tvaRate}%)</span><span>{formatMoney(tva,devisInfo.currency)}</span></div>}
              <div className="total-row grand"><span>{pdfOptions.showTva?'Total TTC':'Total HT'}</span><span>{formatMoney(ttc,devisInfo.currency)}</span></div>
            </div>
          </Card>

          <Card title="Notes & Conditions" icon="📝">
            <div className="form-grid one-col">
              <div className="field"><label>Notes (visibles sur le devis)</label><textarea rows={3} placeholder="Conditions particulières, délais, garanties..." value={devisInfo.notes} onChange={e => setDevisInfo(p => ({...p, notes: e.target.value}))} /></div>
              <div className="field"><label>Conditions générales</label><textarea rows={3} placeholder="Pénalités de retard..." value={devisInfo.conditions} onChange={e => setDevisInfo(p => ({...p, conditions: e.target.value}))} /></div>
            </div>
          </Card>

          <div className="inline-preview-toggle" onClick={() => setShowInlinePreview(v => !v)}>
            <span style={{display:'flex',alignItems:'center',gap:8,fontSize:'0.82rem',color:G.textMuted}}>
              <span>👁</span><span>Aperçu du devis</span>
            </span>
            <span style={{fontSize:'0.75rem',color:G.textMuted}}>{showInlinePreview ? '▾ Masquer' : '▸ Afficher'}</span>
          </div>
          {showInlinePreview && (
            <div className="inline-preview-box" onClick={() => setFullscreenPreview(true)} title="Cliquer pour agrandir">
              <div style={{position:'absolute',top:8,right:8,background:'rgba(10,10,15,0.75)',color:G.gold,padding:'3px 9px',borderRadius:6,fontSize:'0.68rem',pointerEvents:'none',zIndex:2}}>⛶ Plein écran</div>
              <div className="pdf-preview-area" dangerouslySetInnerHTML={{__html: buildPreviewHTML()}} />
            </div>
          )}
        </div>

        <div className="preview-column">
          <div className="preview-sticky">
            <Card title="Aperçu en temps réel" icon="👁" defaultOpen>
              <div className="card-body no-pad">
                <div style={{position:'relative',cursor:'zoom-in'}} onClick={() => setFullscreenPreview(true)} title="Cliquer pour agrandir">
                  <div style={{position:'absolute',top:8,right:8,background:'rgba(10,10,15,0.75)',color:G.gold,padding:'3px 9px',borderRadius:6,fontSize:'0.68rem',pointerEvents:'none',zIndex:2}}>⛶ Plein écran</div>
                  <div className="pdf-preview-area" dangerouslySetInnerHTML={{__html: buildPreviewHTML()}} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );

  // ── Rendu formulaire entreprise ──
  function CompanyForm({ company, onSave, onCancel, isNew = false }) {
    const [form, setForm] = useState(company || { name: '', email: '', phone: '', siret: '', address: '', tvaNum: '', website: '', logo: null, themeId: 'or' });
    const [saved, setSaved] = useState(false);

    return (
      <div className="company-card-body">
        <LogoUpload
          logo={form.logo}
          inputId={`logo-input-${company?.id || 'new'}`}
          onUpload={e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => setForm(p => ({ ...p, logo: ev.target.result }));
            reader.readAsDataURL(file);
          }}
          onRemove={() => setForm(p => ({ ...p, logo: null }))}
        />
        <div className="form-grid two-col" style={{marginTop:12}}>
          <div className="field"><label>Nom de l'entreprise *</label><input type="text" placeholder="Acme SARL" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} /></div>
          <div className="field"><label>Email *</label><input type="email" placeholder="contact@acme.fr" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} /></div>
          <div className="field"><label>Téléphone</label><input type="tel" placeholder="+33 1 23 45 67 89" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} /></div>
          <div className="field"><label>SIRET</label><input type="text" placeholder="123 456 789 00010" value={form.siret} onChange={e => setForm(p=>({...p,siret:e.target.value}))} /></div>
          <div className="field full"><label>Adresse complète</label><input type="text" placeholder="12 rue de la Paix, 75001 Paris" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} /></div>
          <div className="field"><label>N° TVA intracom.</label><input type="text" placeholder="FR12345678901" value={form.tvaNum} onChange={e => setForm(p=>({...p,tvaNum:e.target.value}))} /></div>
          <div className="field"><label>Site web</label><input type="url" placeholder="https://www.acme.fr" value={form.website} onChange={e => setForm(p=>({...p,website:e.target.value}))} /></div>
        </div>

        <div style={{marginTop:16}}>
          <div style={{fontSize:'0.72rem',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:G.textMuted,marginBottom:10}}>Thème du devis</div>
          <div className="theme-grid">
            {Object.entries(THEMES).map(([key, t]) => (
              <div key={key} className={`theme-card ${form.themeId===key?'active':''}`} onClick={() => setForm(p=>({...p,themeId:key}))}>
                <div className="theme-preview">
                  <div className="theme-preview-header" style={{background:t.headerBg,color:t.headerText}}>DEVIS</div>
                  <div className="theme-preview-body">
                    <div className="theme-preview-line" style={{background:t.accentColor,opacity:0.6}}/>
                    <div className="theme-preview-line"/>
                    <div className="theme-preview-line"/>
                  </div>
                </div>
                <div className="theme-info">
                  <div className="theme-name">{t.name}</div>
                  <div className="theme-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="company-actions">
          <button className="btn btn-primary" onClick={() => { onSave(form); setSaved(true); setTimeout(()=>setSaved(false),3000); }}>
            {saved ? '✓ Sauvegardé' : '💾 Sauvegarder'}
          </button>
          {!isNew && <button className="btn btn-ghost" onClick={onCancel}>Fermer</button>}
          {!isNew && <button className="btn btn-danger" onClick={() => setConfirmModal({
            title: 'Supprimer',
            message: `Supprimer l'entreprise "${form.name}" ?`,
            onOk: () => { deleteCompany(company.id); setConfirmModal(null); }
          })}>Supprimer</button>}
          {isNew && <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>}
        </div>
      </div>
    );
  }

  // ── OPTIONS ──
  const renderOptions = () => (
    <>
      <header className="app-header"><div className="logo">Options</div></header>
      <div className="opts-tabs">
        {[
          {key:'entreprises', label:'Mes entreprises'},
          {key:'prestations', label:'Prestations'},
          {key:'apparence', label:'Apparence PDF'},
        ].map(t => (
          <button key={t.key} className={`opts-tab ${optionsTab===t.key?'active':''}`} onClick={() => setOptionsTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="opts-body">

        {/* ── Mes Entreprises ── */}
        {optionsTab === 'entreprises' && (
          <>
            <div className="company-list">
              {companies.map(c => (
                <div key={c.id} className={`company-card ${c.id===activeCompanyId?'active-company':''}`}>
                  <div className="company-card-header" onClick={() => setEditingCompanyId(editingCompanyId===c.id?null:c.id)}>
                    <div className="company-card-logo">
                      {c.logo ? <img src={c.logo} alt="logo" /> : <span>🏢</span>}
                    </div>
                    <div className="company-card-info">
                      <div className="company-card-name">{c.name || 'Sans nom'}</div>
                      <div className="company-card-meta">
                        {THEMES[c.themeId]?.name || 'Or Classique'}
                        {c.siret ? ` · SIRET ${c.siret}` : ''}
                      </div>
                    </div>
                    {c.id === activeCompanyId && <span className="company-card-active-badge">Active</span>}
                    {c.id !== activeCompanyId && (
                      <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); setActiveCompany(c.id); }}>
                        Activer
                      </button>
                    )}
                  </div>
                  {editingCompanyId === c.id && (
                    <CompanyForm
                      company={c}
                      onSave={data => { updateCompany(c.id, data); }}
                      onCancel={() => setEditingCompanyId(null)}
                    />
                  )}
                </div>
              ))}
            </div>

            {newCompanyForm ? (
              <div className="company-card">
                <div className="company-card-header">
                  <div className="company-card-logo"><span>🏢</span></div>
                  <div className="company-card-info">
                    <div className="company-card-name">Nouvelle entreprise</div>
                  </div>
                </div>
                <CompanyForm
                  company={null}
                  isNew
                  onSave={data => addCompany(data)}
                  onCancel={() => setNewCompanyForm(null)}
                />
              </div>
            ) : (
              <button className="btn-add-company" onClick={() => setNewCompanyForm({})}>
                + Ajouter une entreprise
              </button>
            )}
          </>
        )}

        {/* ── Prestations ── */}
        {optionsTab === 'prestations' && (
          <>
            <div className="catalog-add-form">
              <div className="catalog-add-title">Nouvelle prestation</div>
              <div className="catalog-form-row">
                <div className="field" style={{gridColumn:'1 / -1'}}><label>Désignation *</label><input type="text" placeholder="ex: Audit SEO complet" value={catForm.desc} onChange={e => setCatForm(p=>({...p,desc:e.target.value}))} /></div>
                <div className="field"><label>Prix HT</label><input type="number" placeholder="0.00" min="0" step="0.01" value={catForm.price} onChange={e => setCatForm(p=>({...p,price:e.target.value}))} /></div>
                <div className="field"><label>Unité</label>
                  <select value={catForm.unit} onChange={e => setCatForm(p=>({...p,unit:e.target.value}))}>
                    {['unité','h','j','m²','m³','kg','forfait','lot'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="field"><label>Catégorie</label><input type="text" placeholder="ex: Web, Conseil..." value={catForm.category} onChange={e => setCatForm(p=>({...p,category:e.target.value}))} list="cat-list" /><datalist id="cat-list">{categories.map(c=><option key={c} value={c}/>)}</datalist></div>
                <div className="field" style={{alignSelf:'end'}}><button className="btn btn-primary" onClick={addToCatalog}>+ Ajouter</button></div>
              </div>
            </div>
            <div className="catalog-search"><span className="catalog-search-icon">🔍</span><input type="text" placeholder="Rechercher une prestation..." value={catalogSearch} onChange={e=>setCatalogSearch(e.target.value)} /></div>
            {categories.length>0 && <div className="cat-chips">{categories.map(cat=><span key={cat} className={`cat-chip ${catalogFilter===cat?'active':''}`} onClick={()=>setCatalogFilter(f=>f===cat?null:cat)}>{cat}</span>)}</div>}
            {filteredCatalog.length===0 ? (
              <div className="catalog-empty"><div className="catalog-empty-icon">📦</div><div>Aucune prestation</div><div style={{fontSize:'0.75rem',marginTop:6,color:G.textDim}}>Ajoutez vos prestations récurrentes</div></div>
            ) : (
              <div className="catalog-items-list">
                {Object.entries(catalogByCat).map(([cat, its]) => (
                  <div key={cat}>
                    <div className="catalog-category-label">{cat}</div>
                    {its.map(item => (
                      <div key={item.id} className="catalog-item" onClick={() => { addCatalogItemToDevis(item); setPage('devis'); }}>
                        <div className="catalog-item-plus">+</div>
                        <div className="catalog-item-info">
                          <div className="catalog-item-name">{item.desc}</div>
                          <div className="catalog-item-meta">{item.unit}{item.price>0?' · '+formatMoney(item.price,devisInfo.currency):''}</div>
                        </div>
                        <div className="catalog-item-price">{item.price>0?formatMoney(item.price,devisInfo.currency):'—'}</div>
                        <button className="catalog-item-del" onClick={e=>{e.stopPropagation();removeFromCatalog(item.id);}}>✕</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Apparence ── */}
        {optionsTab === 'apparence' && (
          <>
            <div className="opts-section">
              <div className="opts-section-title">Sections visibles sur le PDF</div>
              <div className="opts-list">
                {[
                  ['showEmitter', "Afficher l'émetteur", "Bloc coordonnées de votre entreprise"],
                  ['showRecipient', 'Afficher le destinataire', "Bloc coordonnées client"],
                  ['showUnit', 'Afficher les unités', "Colonne unité dans le tableau"],
                  ['showSubtotals', 'Afficher les sous-totaux', "Sous-total HT, TVA, remise"],
                  ['showTva', 'Afficher la TVA', "Calcul et affichage de la TVA"],
                  ['showFooter', 'Pied de page', "Conditions de paiement en bas"],
                  ['showLineNumbers', 'Numérotation des lignes', "Numéro devant chaque article"],
                  ['showWatermark', 'Filigrane BROUILLON', "Marque diagonale rouge"],
                ].map(([key, label, desc]) => (
                  <div key={key} className="opts-list-item">
                    <div className="opts-list-item-label">
                      <span>{label}</span>
                      {desc && <span className="opts-list-item-desc">{desc}</span>}
                    </div>
                    <Toggle checked={pdfOptions[key]} onChange={v => setPdfOptions(p=>({...p,[key]:v}))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="opts-section">
              <div className="opts-section-title">Style du header PDF</div>
              <div className="opts-list">
                {[
                  ['full', 'Complet', 'Avec toutes les informations entreprise'],
                  ['compact', 'Compact', 'Logo et nom uniquement'],
                  ['minimal', 'Minimal', 'Juste le nom'],
                ].map(([val, label, desc]) => (
                  <div key={val} className="opts-list-item" style={{cursor:'pointer'}} onClick={() => setPdfOptions(p=>({...p,headerStyle:val}))}>
                    <div className="opts-list-item-label">
                      <span>{label}</span>
                      <span className="opts-list-item-desc">{desc}</span>
                    </div>
                    <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${pdfOptions.headerStyle===val?G.gold:G.border}`,background:pdfOptions.headerStyle===val?G.gold:'transparent',flexShrink:0}} />
                  </div>
                ))}
              </div>
            </div>

            <div className="opts-section">
              <div className="opts-section-title">Couleur d'accentuation (override global)</div>
              <div className="opts-list">
                <div className="opts-list-item">
                  <div className="opts-list-item-label">
                    <span>Couleur personnalisée</span>
                    <span className="opts-list-item-desc">Remplace la couleur du thème actif</span>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input type="color" value={pdfOptions.accentColor} onChange={e=>setPdfOptions(p=>({...p,accentColor:e.target.value}))} style={{width:36,flex:'none'}} />
                    <button className="btn btn-ghost btn-sm" onClick={()=>setPdfOptions(p=>({...p,accentColor:'#c9a84c'}))}>Reset</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{padding:'12px 0',fontSize:'0.75rem',color:G.textMuted}}>
              💡 Pour changer le thème complet du devis (couleurs, fond header…), allez dans <strong style={{color:G.gold}}>Mes entreprises</strong> et éditez votre entreprise.
            </div>
          </>
        )}

      </div>
    </>
  );

  // ── HISTORIQUE ──
  const renderHistorique = () => (
    <>
      <header className="app-header">
        <div className="logo">Historique</div>
        <div className="header-actions"><span style={{fontSize:'0.8rem',color:G.textMuted}}>{drafts.length} devis</span></div>
      </header>
      <div style={{maxWidth:700,margin:'0 auto',padding:20}}>
        {drafts.length===0 ? (
          <div className="catalog-empty" style={{paddingTop:60}}>
            <div className="catalog-empty-icon">📂</div>
            <div>Aucun devis sauvegardé</div>
            <div style={{fontSize:'0.75rem',marginTop:8,color:G.textDim}}>Créez des devis depuis l'onglet Devis</div>
            <button className="btn btn-primary" style={{marginTop:20}} onClick={()=>setPage('devis')}>+ Créer un devis</button>
          </div>
        ) : (
          drafts.map(d => (
            <div key={d._key} className="history-item">
              <div className="history-item-info">
                <div className="history-item-label">{d._label}</div>
                <div className="history-item-date">{new Date(d._ts).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <span className={`history-item-status ${d._status==='validated'?'status-validated':'status-draft'}`}>
                {d._status==='validated'?'✓ Validé':'Brouillon'}
              </span>
              <div className="history-actions">
                <button className="btn btn-outline btn-sm" onClick={()=>loadDraft(d)}>Charger</button>
                <button className="btn btn-primary btn-sm" title="Exporter PDF" onClick={async()=>{loadDraft(d);setTimeout(()=>generatePDF(true),400);}}>⬇</button>
                {d._status!=='validated' && <button className="btn btn-green btn-sm" title="Marquer validé" onClick={()=>updateDraftStatus(d._key,'validated')}>✓</button>}
                <button className="btn btn-danger btn-sm" onClick={()=>setConfirmModal({title:'Supprimer',message:`Supprimer "${d._label}" ?`,onOk:()=>{deleteDraft(d._key);setConfirmModal(null);}})}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // ═══════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════
  return (
    <>
      <style>{css}</style>
      <div className="app-wrapper">

        {page === 'home' && renderHome()}
        {page === 'devis' && renderDevis()}
        {page === 'options' && renderOptions()}
        {page === 'historique' && renderHistorique()}

        {/* ── Bottom Nav ── */}
        <nav className="bottom-tabbar">
          <button className={`tab-btn ${page==='home'?'active':''}`} onClick={()=>setPage('home')}>
            <span className="tab-btn-icon"><IconHome /></span>
            <span className="tab-btn-label">Accueil</span>
          </button>
          <button className={`tab-btn ${page==='devis'?'active':''}`} onClick={()=>setPage('devis')}>
            <span className="tab-btn-icon"><IconDoc /></span>
            <span className="tab-btn-label">Devis</span>
          </button>
          <button className={`tab-btn ${page==='options'?'active':''}`} onClick={()=>setPage('options')}>
            <span className="tab-btn-icon"><IconSettings /></span>
            <span className="tab-btn-label">Options</span>
          </button>
          <button className={`tab-btn ${page==='historique'?'active':''}`} onClick={()=>setPage('historique')}>
            <span className="tab-btn-icon"><IconHistory /></span>
            <span className="tab-btn-label">Historique</span>
            <span className={`tab-badge ${drafts.length>0?'visible':''}`}>{drafts.length}</span>
          </button>
        </nav>

        {/* ── Picker Modal ── */}
        <div className={`modal-overlay ${pickerOpen?'active':''}`} onClick={e=>{if(e.target.classList.contains('modal-overlay'))setPickerOpen(false);}}>
          <div className="modal">
            <div className="modal-title">Ajouter depuis les prestations</div>
            <div className="catalog-search" style={{marginBottom:12}}>
              <span className="catalog-search-icon">🔍</span>
              <input type="text" placeholder="Rechercher..." value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)} />
            </div>
            {catalog.filter(i=>!pickerSearch||i.desc.toLowerCase().includes(pickerSearch.toLowerCase())).length===0 ? (
              <div className="catalog-empty"><div className="catalog-empty-icon">📋</div><div>Aucune prestation</div></div>
            ) : (
              catalog.filter(i=>!pickerSearch||i.desc.toLowerCase().includes(pickerSearch.toLowerCase())).map(item => (
                <div key={item.id} className="picker-item" onClick={()=>{addCatalogItemToDevis(item);setPickerOpen(false);}}>
                  <div><div className="picker-item-name">{item.desc}</div><div className="picker-item-meta">{item.category} · {item.unit}</div></div>
                  <div className="picker-item-price">{item.price>0?formatMoney(item.price,devisInfo.currency):'Prix libre'}</div>
                </div>
              ))
            )}
            <div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setPickerOpen(false)}>Fermer</button></div>
          </div>
        </div>

        {/* ── Confirm Modal ── */}
        {confirmModal && (
          <div className="modal-overlay active" onClick={e=>{if(e.target.classList.contains('modal-overlay'))setConfirmModal(null);}}>
            <div className="modal">
              <div className="modal-title">{confirmModal.title}</div>
              <p style={{color:G.textMuted,fontSize:'0.875rem'}}>{confirmModal.message}</p>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={()=>setConfirmModal(null)}>Annuler</button>
                <button className="btn btn-danger" onClick={confirmModal.onOk}>Confirmer</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Email Modal ── */}
        {emailModal && (
          <div className="modal-overlay active" onClick={e=>{if(e.target.classList.contains('modal-overlay'))setEmailModal(null);}}>
            <div className="modal">
              <div className="modal-title">✉ Envoyer par Email</div>
              <div className="form-grid one-col">
                <div className="field"><label>Destinataire *</label><input type="email" value={emailModal.to} onChange={e=>setEmailModal(p=>({...p,to:e.target.value}))} /></div>
                <div className="field"><label>Objet</label><input type="text" value={emailModal.subject} onChange={e=>setEmailModal(p=>({...p,subject:e.target.value}))} /></div>
                <div className="field"><label>Corps du message</label><textarea rows={6} value={emailModal.body} onChange={e=>setEmailModal(p=>({...p,body:e.target.value}))} /></div>
              </div>
              <p style={{fontSize:'0.72rem',color:G.textMuted,marginTop:8}}>Le PDF sera téléchargé. Joignez-le manuellement.</p>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={()=>setEmailModal(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={async()=>{
                  if(!emailModal.to){showToast('Email requis','error');return;}
                  await generatePDF(true);
                  setTimeout(()=>{
                    const ml=`mailto:${encodeURIComponent(emailModal.to)}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(emailModal.body+'\n\n[Merci de joindre le PDF téléchargé]')}`;
                    window.location.href=ml;
                  },800);
                  setEmailModal(null);
                }}>Télécharger PDF & Ouvrir Email</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Fullscreen Preview ── */}
        <div className={`preview-fullscreen-overlay ${fullscreenPreview?'active':''}`} onClick={e=>{if(e.target.classList.contains('preview-fullscreen-overlay'))setFullscreenPreview(false);}}>
          <div className="preview-fullscreen-header">
            <div className="preview-fullscreen-title">👁 Aperçu — {devisInfo.num || 'Devis'}</div>
            <div className="preview-fullscreen-actions">
              <button className="btn btn-outline btn-sm" onClick={()=>generatePDF(true)}>⬇ Télécharger PDF</button>
              <button className="btn-close-fullscreen" onClick={()=>setFullscreenPreview(false)}>✕ Fermer</button>
            </div>
          </div>
          <div className="preview-fullscreen-body">
            <div className="preview-fullscreen-doc" dangerouslySetInnerHTML={{__html: buildPreviewHTML()}} />
          </div>
        </div>

        <Toast {...toast} />
      </div>
    </>
  );
}
