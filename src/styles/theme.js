// src/styles/theme.js
import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, X, Plus, ChevronLeft, ChevronRight, Send, LogOut, Edit3, Check, AlertCircle, Settings, MessageCircle, Wallet, Crown, FileText, BarChart2, Search, Info, Camera, ShieldCheck, Video, CheckCircle2, TrendingUp, Trash2, AlertTriangle, Paperclip, HelpCircle, ShieldAlert } from 'lucide-react';

export const accent = "#e91e63";

export const styles = {
  body: { backgroundColor: '#050508', backgroundImage: `linear-gradient(rgba(233, 30, 99, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(233, 30, 99, 0.03) 1px, transparent 1px)`, backgroundSize: '40px 40px', minHeight: '100vh', color: 'white', fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility', paddingTop: '100px', border: `2px solid ${accent}`, boxShadow: `inset 0 0 20px ${accent}44`, position: 'relative', overflowX: 'hidden' },
  header: { position: 'fixed', top: '2px', left: '2px', right: '2px', height: '80px', backgroundColor: '#000', borderBottom: `2px solid ${accent}`, display: 'flex', alignItems: 'center', zIndex: 1000, padding: '0 25px' },
  input: { width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #222', color: 'white', boxSizing: 'border-box', outline: 'none', fontFamily: "inherit" },
  artLine: { position: 'absolute', width: '300px', height: '600px', border: `1px solid ${accent}22`, borderRadius: '50%', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' },
  neonSign: { position: 'fixed', zIndex: 0, pointerEvents: 'none', opacity: 0.2, mixBlendMode: 'screen' },
  hintBox: { position: 'fixed', bottom: '30px', right: '30px', width: '280px', padding: '15px', background: '#000', border: `1px solid ${accent}`, color: 'white', zIndex: 9999, boxShadow: `0 0 20px ${accent}44`, fontSize: '11px', animation: 'fadeIn 0.3s' },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #111', fontSize: '13px', color: 'white', fontWeight: '500' },
  statsModal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
};