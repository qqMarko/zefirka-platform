// src/data/mockData.js
import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, X, Plus, ChevronLeft, ChevronRight, Send, LogOut, Edit3, Check, AlertCircle, Settings, MessageCircle, Wallet, Crown, FileText, BarChart2, Search, Info, Camera, ShieldCheck, Video, CheckCircle2, TrendingUp, Trash2, AlertTriangle, Paperclip, HelpCircle, ShieldAlert } from 'lucide-react';

export const initialModels = [
    { id: 1, name: "АЛІНА", city: "КИЇВ", photos: [], title: "Ексклюзивна пропозиція", priceFrom: 1500, age: 22, fetishes: ["f2", "f4"], vLevel: 2, isMine: false },
    { id: 2, name: "МАРИНА", city: "ОДЕСА", photos: [], title: "Відпочинок зі смаком", priceFrom: 3000, age: 28, fetishes: ["f3"], vLevel: 1, isMine: false }
  ];
  
  export const initialDisputeMessages = [
    { id: 1, sender: 'admin', text: "Вітаю. Я Адміністратор платформи Zefirka. Спір відкрито. Будь ласка, завантажте докази та натисніть кнопку підтвердження нижче.", time: "10:00" },
    { id: 2, sender: 'opponent', text: "Опонент видалив переписку. Ось мій скріншот банківського додатку.", time: "10:05" }
  ];