"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import SectionTitle from "../../../components/SectionTitle";
import SectionDivider from "../../../components/SectionDivider";

const GAME_OPTIONS = [
  { key: "fortnite", label: "Fortnite" },
  { key: "cod-mobile", label: "Call of Duty: Mobile" },
  { key: "wild-rift", label: "League of Legends: Wild Rift" },
  { key: "clash-royale", label: "Clash Royale" },
  { key: "pubg", label: "PUBG Mobile" },
  { key: "coc", label: "Clash of Clans" },
  { key: "free-fire", label: "Free Fire" },
  { key: "ml", label: "Mobile Legends" },
  { key: "brawl", label: "Brawl Stars" },
  { key: "xbox", label: "Xbox Account" },
  { key: "psn", label: "PlayStation (PSN)" },
  { key: "steam", label: "Steam Account" },
];

const GAME_FIELDS = {
  fortnite: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["اپیک گیمز (Epic Games)", "سونی پلی‌استیشن (PSN)", "ایکس‌باکس (Xbox)", "نینتندو (Nintendo)"], required: true },
    { name: "epic_email", label: "ایمیل اکانت (لاگین)", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "epic_password", label: "رمز ورود اکانت", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "extra_notes", label: "توضیحات اضافه (اختیاری)", type: "textarea", placeholder: "در صورتی که توضیح و نکته خاصی دارید یا سوال امنیتی اکانت را می دانید وارد کنید...", required: false },
    { name: "link_status", label: "وضعیت لینک و پلتفرم", type: "select", options: ["تحویل psn یا xbox", "قابلیت لینک دلخواه", "فقط برای پیسی و موبایل"], required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۱۲۰۰۰۰۰", required: true },
  ],
  "cod-mobile": [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["اکتیویژن (Activision)", "فیس‌بوک (Facebook)", "گوگل‌پلی (Google Play)", "لاین (Line)"], required: true },
    { name: "account_email", label: "ایمیل یا نام‌کاربری لاگین", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز ورود اکانت", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۱۵۰", required: true },
    { name: "rank", label: "رنک اکانت", type: "text", placeholder: "مثلاً: Legendary", required: true },
    { name: "mythic_count", label: "تعداد گان میتیک", type: "number", placeholder: "مثلاً: ۲", required: true },
    { name: "cp_amount", label: "مقدار سیپی", type: "text", placeholder: "مثلاً: ۳۶۰", required: true },
    { name: "skins_count", label: "تعداد کاراکتر (اسکین)", type: "number", placeholder: "مثلاً: ۸۵", required: true },
    { name: "region", label: "ریجن اکانت", type: "text", placeholder: "مثلاً: هند، ایران", required: true },
    { name: "legend_count", label: "تعداد گان لجند", type: "number", placeholder: "مثلاً: ۵", required: true },
    { name: "epic_count", label: "تعداد اپیک", type: "number", placeholder: "مثلاً: ۷۰", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "سایر توضیحات اکانت...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۱۵۰۰۰۰۰", required: true },
  ],
  "wild-rift": [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["رایت اکانت (Riot Games)", "گوگل (Google)", "فیس‌بوک (Facebook)"], required: true },
    { name: "account_email", label: "ایمیل یا نام‌کاربری لاگین", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز ورود اکانت", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "skins_count", label: "تعداد اسکین", type: "number", placeholder: "مثلاً: ۴۵", required: true },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۴۰", required: true },
    { name: "rank", label: "رنک اکانت", type: "text", placeholder: "مثلاً: Emerald II", required: true },
    { name: "wild_cores", label: "وایلد کور", type: "text", placeholder: "مثلاً: ۵۰۰", required: true },
    { name: "blue_motes", label: "بلو موت", type: "text", placeholder: "مثلاً: ۱۵۰۰۰", required: true },
    { name: "region", label: "ریجن اکانت", type: "text", placeholder: "مثلاً: ترکیه", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "جزئیات قهرمان‌ها و اسکین‌ها...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۹۰۰۰۰۰", required: true },
  ],
  "clash-royale": [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["سوپرسل ایدی (Supercell ID)", "گوگل‌پلی / جیمیل (Gmail)"], required: true },
    { name: "account_email", label: "ایمیل متصل به اکانت", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز عبور دسترسی ایمیل / جیمیل", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "account_name", label: "اسم اکانت", type: "text", placeholder: "مثلاً: RoyalHero", required: true },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۱۴", required: true },
    { name: "rank_trophies", label: "رنک و کاپ", type: "text", placeholder: "مثلاً: ۶۵۰۰", required: true },
    { name: "gems", label: "جم اکانت", type: "text", placeholder: "مثلاً: ۴۵۰", required: true },
    { name: "coins", label: "تعداد سکه", type: "text", placeholder: "مثلاً: ۱۲۰۰۰۰", required: true },
    { name: "legendary_cards", label: "تعداد کارت لجندری", type: "number", placeholder: "مثلاً: ۱۸", required: true },
    { name: "evolved_cards", label: "کارت تکامل یافته دارد؟", type: "checkbox", required: true },
    { name: "tower_level", label: "لول برج", type: "text", placeholder: "مثلاً: ۱۴", required: true },
    { name: "name_change", label: "وضعیت تغییر نام", type: "text", placeholder: "رایگان / ۵۰۰ جم", required: true, description: "اگر ندارد مقدار جم مورد نیاز را بنویسید" },
    { name: "supercell_id", label: "وضعیت سوپرسل ایدی", type: "select", options: ["دارد", "ندارد"], required: true, description: "دارد یا ندارد" },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "سطح کارت‌ها و دک‌های اصلی...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۸۰۰۰۰۰", required: true },
  ],
  pubg: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["توییتر (X / Twitter)", "فیس‌بوک (Facebook)", "گوگل پلی (Google Play)", "پلتفرم VK"], required: true },
    { name: "account_email", label: "ایمیل یا نام‌کاربری لاگین", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز ورود اکانت", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "account_name", label: "اسم اکانت", type: "text", placeholder: "مثلاً: PubgKing", required: true },
    { name: "platform", label: "پلتفرم اکانت", type: "select", options: ["موبایل", "پیسی", "سایر"], required: true, description: "موبایل - پیسی و ..." },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۶۵", required: true },
    { name: "skins", label: "اسکین ها", type: "textarea", placeholder: "لیست اسکین‌های تفنگ و لباس...", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "وضعیت رویال پس و کارت‌های تغییر نام...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۱۸۰۰۰۰۰", required: true },
  ],
  coc: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["سوپرسل ایدی (Supercell ID)", "گوگل‌پلی / جیمیل (Gmail)"], required: true },
    { name: "account_email", label: "ایمیل متصل به اکانت", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز یا اطلاعات دسترسی ایمیل", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "account_name", label: "اسم اکانت", type: "text", placeholder: "مثلاً: ClashMaster", required: true },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۱۶۰", required: true },
    { name: "rank_trophies", label: "رنک و کاپ", type: "text", placeholder: "مثلاً: ۴۲۰۰", required: true },
    { name: "gems", label: "جم اکانت", type: "text", placeholder: "مثلاً: ۱۲۰۰", required: true },
    { name: "townhall", label: "لول تاون هال", type: "text", placeholder: "مثلاً: ۱۳", required: true },
    { name: "king_lvl", label: "لول بربرکینگ", type: "text", placeholder: "مثلاً: ۵۵", required: true, description: "اگر باز نشده صفر بزنید" },
    { name: "queen_lvl", label: "لول آرچر کویین", type: "text", placeholder: "مثلاً: ۶۰", required: true, description: "اگر باز نشده صفر بزنید" },
    { name: "warden_lvl", label: "لول استاد بزرگ", type: "text", placeholder: "مثلاً: ۳۰", required: true, description: "اگر باز نشده صفر بزنید" },
    { name: "royal_lvl", label: "لول جنگجوی سلطنتی", type: "text", placeholder: "مثلاً: ۱۰", required: true, description: "اگر باز نشده صفر بزنید" },
    { name: "name_change", label: "وضعیت تغییر نام", type: "text", placeholder: "رایگان / ۱۰۰۰ جم", required: true, description: "اگر ندارد مقدار جم مورد نیاز را بنویسید" },
    { name: "supercell_id", label: "وضعیت سوپرسل ایدی", type: "select", options: ["دارد", "ندارد"], required: true, description: "دارد یا ندارد" },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "سطح نیروها و ساختمان‌های دفاعی...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۲۰۰۰۰۰۰", required: true },
  ],
  "free-fire": [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["فیس‌بوک (Facebook)", "گوگل (Google)", "توییتر (Twitter)", "پلتفرم VK"], required: true },
    { name: "account_email", label: "ایمیل یا شماره لاگین", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز ورود اکانت", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "account_name", label: "نام اکانت", type: "text", placeholder: "مثلاً: FireBoss", required: true },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۵۵", required: true },
    { name: "region", label: "ریجن یا سرور اکانت", type: "text", placeholder: "مثلاً: خاورمیانه", required: true },
    { name: "sets_count", label: "تعداد ست ها", type: "number", placeholder: "مثلاً: ۱۲", required: true },
    { name: "elites_count", label: "تعداد الایت ها", type: "number", placeholder: "مثلاً: ۴", required: true },
    { name: "name_change", label: "تغییر نام دارد؟", type: "checkbox", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "ست‌ها و تفنگ‌های ارتقا یافته...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۶۰۰۰۰۰", required: true },
  ],
  ml: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["موتون اکانت (Moonton Account)", "گوگل پلی (Google Play)", "تیک‌تاک (TikTok)", "فیس‌بوک (Facebook)", "پلتفرم VK"], required: true },
    { name: "account_email", label: "ایمیل یا نام‌کاربری لاگین", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز ورود اکانت", type: "text", placeholder: "••••••••", required: true, description: "به منظور بررسی ادمین و تهیه تصاویر اکانت وارد کنید" },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۶۰", required: true },
    { name: "account_name", label: "نام اکانت", type: "text", placeholder: "مثلاً: LegendPlayer", required: true },
    { name: "region", label: "ریجن اکانت", type: "text", placeholder: "مثلاً: سنگاپور، امارات", required: true },
    { name: "mythics_count", label: "تعداد میتیک ها", type: "number", placeholder: "مثلاً: ۳", required: true },
    { name: "legends_count", label: "تعداد لجند ها", type: "number", placeholder: "مثلاً: ۱", required: true },
    { name: "diamonds_count", label: "تعداد الماس", type: "text", placeholder: "مثلاً: ۲۰۰", required: true },
    { name: "rank", label: "رنک", type: "text", placeholder: "مثلاً: Mythic II", required: true },
    { name: "elite_rp", label: "الایت RP دارد؟", type: "checkbox", required: true },
    { name: "silver_fragments", label: "سیلور فرگمنتس", type: "text", placeholder: "مثلاً: ۴۵۰۰", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "اسکین‌های خاص و قهرمان‌های آنلاک...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۱۲۰۰۰۰۰", required: true },
  ],
  brawl: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["سوپرسل ایدی (Supercell ID)", "گوگل‌پلی / جیمیل (Gmail)"], required: true },
    { name: "account_email", label: "ایمیل متصل به اکانت", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز یا اطلاعات دسترسی ایمیل", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "account_name", label: "اسم اکانت", type: "text", placeholder: "مثلاً: BrawlHero", required: true },
    { name: "level", label: "لول اکانت", type: "text", placeholder: "مثلاً: ۱۲۰", required: true },
    { name: "rank_trophies", label: "رنک و کاپ", type: "text", placeholder: "مثلاً: ۱۸۰۰۰", required: true },
    { name: "gems", label: "جم اکانت", type: "text", placeholder: "مثلاً: ۱۸۰", required: true },
    { name: "brawl_pass", label: "تعداد براول پس", type: "number", placeholder: "مثلاً: ۲", required: true },
    { name: "brawlers_epic", label: "تعداد براول اپیک", type: "number", placeholder: "مثلاً: ۱۰", required: true },
    { name: "brawlers_legendary", label: "تعداد براول لجندری", type: "number", placeholder: "مثلاً: ۳", required: true },
    { name: "brawlers_mythic", label: "تعداد براول میتیک", type: "number", placeholder: "مثلاً: ۵", required: true, description: "اگر باز نشده صفر بزنید" },
    { name: "name_change", label: "وضعیت تغییر نام", type: "text", placeholder: "رایگان / ۶۰ جم", required: true, description: "اگر ندارد مقدار جم مورد نیاز را بنویسید" },
    { name: "supercell_id", label: "وضعیت سوپرسل ایدی", type: "select", options: ["دارد", "ندارد"], required: true, description: "دارد یا ندارد" },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "سطح براولرها و پاور پوینت‌ها...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۷۰۰۰۰۰", required: true },
  ],
  xbox: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["مایکروسافت / ایکس‌باکس (Microsoft / Xbox)"], required: true },
    { name: "account_email", label: "ایمیل لاگین مایکروسافت", type: "email", placeholder: "example@outlook.com", required: true },
    { name: "account_password", label: "رمز ورود مایکروسافت", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "account_name", label: "نام اکانت", type: "text", placeholder: "مثلاً: XboxGamer", required: true },
    { name: "gamepass", label: "وضعیت گیم پس دارد؟", type: "checkbox", required: true },
    { name: "purchased_games", label: "بازی های خریداری شده", type: "textarea", placeholder: "مثال: FIFA 24, Cyberpunk 2077...", required: true },
    { name: "name_change", label: "تغییر نام دارد؟", type: "checkbox", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "وضعیت پلاس، ایمیل اصلی اکانت و...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۱۵۰۰۰۰۰", required: true },
  ],
  psn: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["سونی پلی‌استیشن (PSN)"], required: true },
    { name: "account_email", label: "ایمیل لاگین پلی‌استیشن (PSN)", type: "email", placeholder: "example@gmail.com", required: true },
    { name: "account_password", label: "رمز ورود PSN", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "id_change", label: "تغییر ایدی دارد؟", type: "checkbox", required: true },
    { name: "purchased_games", label: "لیست بازی های خریداری شده", type: "textarea", placeholder: "مثال: GTA V, EAFC 24, RDR2...", required: true, description: "بازی ها ، وضعیت پلاس و اکانت های پیشرفته" },
    { name: "region", label: "ریجن اکانت", type: "text", placeholder: "مثلاً: ترکیه، آمریکا", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "بازی‌های پلاس فعال و زمان اشتراک...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۲۰۰۰۰۰۰", required: true },
  ],
  steam: [
    { name: "phone", label: "شماره تلفن همراه", type: "text", placeholder: "مثلاً: ۰۹۱۲۳۴۵۶۷۸۹", required: true },
    { name: "telegram", label: "آیدی تلگرام", type: "text", placeholder: "مثلاً: @JinxFan", required: false },
    { name: "login_method", label: "روش ورود به اکانت", type: "select", options: ["استیم (Steam Account)"], required: true },
    { name: "account_email", label: "نام‌کاربری یا ایمیل استیم", type: "text", placeholder: "steam_username", required: true },
    { name: "account_password", label: "رمز ورود استیم", type: "password", placeholder: "••••••••", required: true, description: "این اطلاعات هرگز در آگهی عمومی نمایش داده نمی‌شوند." },
    { name: "original_status", label: "اورجینال یا غیر اورجینال", type: "select", options: ["اورجینال (بدون سابقه بن یا محدودیت)", "غیر اورجینال (دارای محدودیت)"], required: true },
    { name: "purchased_games", label: "بازی های خریداری شده", type: "textarea", placeholder: "مثال: CS2 Prime, Rust, RDR2...", required: true },
    { name: "region", label: "ریجن اکانت", type: "text", placeholder: "مثلاً: آرژانتین، ترکیه", required: true },
    { name: "description", label: "توضیحات دلخواه", type: "textarea", placeholder: "وضعیت اکانت، مدال‌های بازی‌ها و...", required: true },
    { name: "price", label: "قیمت فروش (تومان)", type: "number", placeholder: "مثلاً: ۲۵۰۰۰۰۰", required: true },
  ],
};

const PRIVATE_LISTING_FIELD_NAMES = new Set([
  "phone",
  "telegram",
  "epic_email",
  "epic_password",
  "account_email",
  "account_password",
  "extra_notes",
]);

const isPublicListingField = (field) => (
  !["price", "description"].includes(field.name)
  && !PRIVATE_LISTING_FIELD_NAMES.has(field.name)
);

function SellWizardContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [game, setGame] = useState("fortnite");
  
  // Custom dynamic form state dictionary
  const [formData, setFormData] = useState({});

  // User profile phone state
  const [userPhone, setUserPhone] = useState("");
  const [userLoaded, setUserLoaded] = useState(false);

  // Load user profile phone number on mount
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const u = data.user || data;
          const phone = u?.phone || u?.phone_number || u?.mobile || "";
          if (phone) {
            setUserPhone(phone);
            setFormData(prev => ({ ...prev, phone }));
          }
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setUserLoaded(true);
      }
    }
    loadUserProfile();
  }, []);

  // Ensure userPhone stays set in formData across game changes
  useEffect(() => {
    if (userPhone) {
      setFormData(prev => ({ ...prev, phone: userPhone }));
    }
  }, [game, userPhone]);

  // Uploaded images & payment
  const [listingId, setListingId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (key, val) => {
    if (key === "phone" && userPhone) {
      return; // Locked from profile
    }
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const buildDescription = () => {
    const fields = GAME_FIELDS[game] || [];
    let descLines = [];
    fields.forEach(f => {
      if (isPublicListingField(f)) {
        const val = formData[f.name];
        if (val !== undefined && val !== null) {
          if (f.type === "checkbox") {
            descLines.push(`• **${f.label}**: ${val ? "بله" : "خیر"}`);
          } else {
            descLines.push(`• **${f.label}**: ${val}`);
          }
        }
      }
    });
    if (formData.description) {
      descLines.push(`\n**توضیحات بیشتر**:\n${formData.description}`);
    }
    return descLines.join("\n");
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    const gameFields = GAME_FIELDS[game] || [];
    
    const activePhone = userPhone || formData.phone || "";
    if (userPhone && formData.phone !== userPhone) {
      formData.phone = userPhone;
    }

    // Validate required fields
    for (const f of gameFields) {
      const val = f.name === "phone" ? activePhone : formData[f.name];
      if (f.required && !val && f.type !== "checkbox" && val !== 0) {
        if (f.name === "phone") {
          setMessage("شماره تلفن در پروفایل شما یافت نشد. لطفاً ابتدا وارد حساب کاربری شوید یا پروفایل خود را تکمیل کنید.");
        } else {
          setMessage(`لطفاً فیلد "${f.label}" را پر کنید.`);
        }
        return;
      }
    }

    setSubmitting(true);
    setMessage("");

    try {
      const priceVal = parseInt(formData.price || 0, 10);
      const platformVal = game === "xbox" ? "Xbox" : game === "psn" ? "PSN" : game === "steam" ? "Steam" : "Mobile";
      const regionVal = formData.region || "جهانی";
      
      const attrs = {};
      const privateAttributes = {};
      gameFields.forEach(f => {
        if (isPublicListingField(f)) {
          attrs[f.label] = String(formData[f.name] === true ? "بله" : formData[f.name] === false ? "خیر" : formData[f.name] || "");
        }
        if (PRIVATE_LISTING_FIELD_NAMES.has(f.name) && formData[f.name]) {
          privateAttributes[f.label] = String(formData[f.name]);
        }
      });

      const res = await fetch("/api/market/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `آگهی اکانت ${GAME_OPTIONS.find((o) => o.key === game)?.label}`,
          game,
          description: buildDescription(),
          price: priceVal,
          platform: platformVal,
          region: regionVal,
          attributes: attrs,
          private_attributes: privateAttributes
        }),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setListingId(data.id);
        if (data.redirect_url) {
          setRedirectUrl(data.redirect_url);
        }
        setStep(3);
      } else {
        setMessage(data.message || "خطا در ثبت اولیه اطلاعات آگهی.");
      }
    } catch (err) {
      setMessage("خطایی رخ داد. آیا وارد حساب کاربری خود شده‌اید؟");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !listingId) return;

    setUploading(true);
    setMessage("");

    for (let i = 0; i < files.length; i++) {
      if (images.length >= 10) {
        setMessage("حداکثر ۱۰ تصویر می‌توانید بارگذاری کنید.");
        break;
      }

      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        setMessage(`فایل ${file.name} بزرگتر از ۱۵ مگابایت است.`);
        continue;
      }

      const uploadData = new FormData();
      uploadData.append("image", file);

      try {
        const res = await fetch(`/api/market/listings/${listingId}/images`, {
          method: "POST",
          body: uploadData,
          credentials: "include"
        });
        const data = await res.json();
        if (res.ok && data.image_url) {
          setImages((prev) => [...prev, data.image_url]);
        } else {
          setMessage(data.message || "خطا در آپلود یکی از فایل‌ها.");
        }
      } catch (err) {
        setMessage("خطا در بارگذاری تصاویر.");
      }
    }
    setUploading(false);
  };

  const gameFields = GAME_FIELDS[game] || [];

  return (
    <>
      <Navbar />
      <div className="container market-sell-page" style={{ padding: "40px 16px", minHeight: "80vh", direction: "rtl" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <SectionTitle fa="ثبت آگهی فروش اکانت" en="Post Account Sale Ad" />
        <Link href="/panel/user/listings" style={{ padding: "10px 18px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--line)", color: "#e2e8f0", textDecoration: "none", fontWeight: "800", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          📦 آگهی‌های من
        </Link>
      </div>
      <SectionDivider variant="drips" />

      {/* Stepper Wizard Indicator */}
      <div className="sell-stepper-container">
        <div style={{ position: "absolute", top: "14px", left: "10%", right: "10%", height: "2px", background: "var(--line)", zIndex: 1 }} />
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="sell-stepper-item" style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: step >= s ? "var(--primary)" : "#27272a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              border: "3px solid var(--bg)"
            }}>
              {s}
            </div>
            <span className="sell-stepper-label" style={{ fontSize: "11px", marginTop: "4px", color: step >= s ? "var(--text)" : "var(--muted)" }}>
              {s === 1 ? "انتخاب بازی" : s === 2 ? "مشخصات اکانت" : s === 3 ? "آپلود تصاویر" : "تایید و ارسال"}
            </span>
          </div>
        ))}
      </div>

      <div className="sell-form-container">
        
        {/* Step 1: Select Game */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "20px", color: "#fff", textAlign: "center" }}>🎮 انتخاب بازی اکانت</h3>
            <div className="sell-game-options-grid">
              {GAME_OPTIONS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => {
                    setGame(g.key);
                    setFormData(userPhone ? { phone: userPhone } : {});
                    setStep(2);
                  }}
                  className={`market-sell-game-card${game === g.key ? ' active' : ''}`}
                  style={{
                    position: "relative",
                    height: "170px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: `2.5px solid ${game === g.key ? "#00f2fe" : "rgba(255,255,255,0.08)"}`,
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    background: `linear-gradient(to top, rgba(8, 12, 28, 0.95) 0%, rgba(8, 12, 28, 0.5) 50%, rgba(8, 12, 28, 0.1) 100%), url(/images/games/${g.key}.webp)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    padding: "14px 6px",
                    boxShadow: game === g.key ? "0 0 15px rgba(0, 242, 254, 0.4)" : "none",
                  }}
                >
                  <span style={{
                    fontSize: "13px",
                    fontWeight: "900",
                    color: "#fff",
                    textShadow: "0 2px 5px rgba(0,0,0,0.9)",
                    textAlign: "center",
                  }}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Information form */}
        {step === 2 && (
          <form onSubmit={handleCreateListing} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#fff" }}>📝 مشخصات اکانت {GAME_OPTIONS.find(o => o.key === game)?.label}</h3>

            <div className="sell-form-grid">
              {gameFields.map((field) => {
                if (field.type === "textarea" || field.type === "checkbox") return null;
                const isPhone = field.name === "phone";
                return (
                  <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "13px", fontWeight: "bold", color: "#e2e8f0" }}>
                        {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      {isPhone && (
                        <span style={{ fontSize: "11px", color: userPhone ? "#00f2fe" : "#f59e0b", fontWeight: "bold" }}>
                          {userPhone ? "🔒 دریافت شده از پروفایل (غیرقابل تغییر)" : "⚠️ خوانده شده از پروفایل"}
                        </span>
                      )}
                    </div>
                    {field.type === "select" ? (
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) => updateField(field.name, e.target.value)}
                        required={field.required}
                        style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "#0c0a1c", color: "#fff", outline: "none" }}
                      >
                        <option value="">انتخاب کنید...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.name === "price" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={
                            (formData[field.name] !== undefined && formData[field.name] !== null && formData[field.name] !== "")
                              ? Number(String(formData[field.name]).replace(/\D/g, '')).toLocaleString('fa-IR')
                              : ""
                          }
                          onChange={(e) => {
                            const englishDigits = e.target.value
                              .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
                              .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
                              .replace(/\D/g, "");
                            updateField(field.name, englishDigits);
                          }}
                          required={field.required}
                          style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "transparent", color: "#fff", outline: "none" }}
                        />
                        {(formData[field.name] !== undefined && formData[field.name] !== null && formData[field.name] !== "") && (
                          <span style={{ fontSize: "12px", color: "#00f2fe", fontWeight: "bold" }}>
                            معادل: {Number(formData[field.name]).toLocaleString('fa-IR')} تومان
                          </span>
                        )}
                      </div>
                    ) : isPhone ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={userPhone || formData.phone || ""}
                          placeholder={userLoaded ? "شماره تلفن یافت نشد" : "در حال دریافت شماره تلفن..."}
                          style={{
                            padding: "12px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "#cbd5e1",
                            outline: "none",
                            cursor: "not-allowed",
                            direction: "ltr",
                            textAlign: "right",
                            fontWeight: "700"
                          }}
                        />
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {userPhone
                            ? "این شماره از پروفایل شما فراخوانی شده است و جهت امنیت خریداران قابل تغییر نیست."
                            : userLoaded
                              ? "شماره تلفن در پروفایل شما ثبت نشده است."
                              : "در حال استعلام شماره تلفن از پروفایل..."}
                        </span>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ""}
                        onChange={(e) => updateField(field.name, e.target.value)}
                        required={field.required}
                        style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "transparent", color: "#fff", outline: "none" }}
                      />
                    )}
                    {!isPhone && field.description && <span style={{ fontSize: "11px", color: "var(--muted)" }}>{field.description}</span>}
                  </div>
                );
              })}
            </div>

            {/* Checkbox fields (styled like custom switches/toggles) */}
            {gameFields.filter(f => f.type === "checkbox").map((field) => (
              <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#e2e8f0" }}>
                  {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => updateField(field.name, true)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1.5px solid ${formData[field.name] === true ? "#00f2fe" : "var(--line)"}`,
                      background: formData[field.name] === true ? "rgba(0, 242, 254, 0.08)" : "transparent",
                      color: formData[field.name] === true ? "#00f2fe" : "#94a3b8",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    بله دارد ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField(field.name, false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1.5px solid ${formData[field.name] === false ? "#ef4444" : "var(--line)"}`,
                      background: formData[field.name] === false ? "rgba(239, 68, 68, 0.08)" : "transparent",
                      color: formData[field.name] === false ? "#ef4444" : "#94a3b8",
                      fontWeight: "bold",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    خیر ندارد ✕
                  </button>
                </div>
              </div>
            ))}

            {/* Textarea fields */}
            {gameFields.filter(f => f.type === "textarea").map((field) => (
              <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#e2e8f0" }}>
                  {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                <textarea
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => updateField(field.name, e.target.value)}
                  required={field.required}
                  rows={4}
                  style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", background: "transparent", color: "#fff", outline: "none" }}
                />
              </div>
            ))}

            {message && <div style={{ color: "#ef4444", fontSize: "13px" }}>{message}</div>}

            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: "1",
                  padding: "15px 24px",
                  borderRadius: "14px",
                  border: "none",
                  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  color: "#080c1c",
                  fontWeight: "900",
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(0, 242, 254, 0.3)",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <span>{submitting ? "در حال ثبت..." : "ادامه و ثبت تصاویر"}</span>
                <span style={{ fontSize: "16px" }}>📸 ←</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: "15px 24px",
                  borderRadius: "14px",
                  border: "1.5px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e2e8f0",
                  fontWeight: "800",
                  fontSize: "14.5px",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <span style={{ fontSize: "16px" }}>→</span>
                <span>بازگشت</span>
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Upload Images */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "16px", color: "#fff" }}>📸 آپلود تصاویر اکانت</h3>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{ display: "none" }}
              id="ad-images-uploader"
            />
            
            <label
              htmlFor="ad-images-uploader"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #00f2fe",
                borderRadius: "20px",
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(0, 242, 254, 0.01)",
                boxShadow: "0 0 15px rgba(0, 242, 254, 0.05)",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ fontSize: "40px", marginBottom: "12px" }}>📁</span>
              <span style={{ fontSize: "16px", fontWeight: "800", color: "#fff" }}>
                {uploading ? "در حال آپلود تصاویر..." : "کلیک کنید تا تصاویر را آپلود کنید"}
              </span>
              <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
                حداکثر ۱۰ فایل • حداکثر حجم هر فایل ۱۵ مگابایت
              </span>
            </label>

            {message && <div style={{ color: "#ef4444", fontSize: "13px", marginTop: "10px" }}>{message}</div>}

            {images.length > 0 && (
              <div className="sell-images-grid">
                {images.map((img, i) => (
                  <div key={i} style={{ width: "100%", aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", border: "1.5px solid var(--line)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={uploading}
                style={{
                  flex: "1",
                  padding: "15px 24px",
                  borderRadius: "14px",
                  border: "none",
                  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  color: "#080c1c",
                  fontWeight: "900",
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(0, 242, 254, 0.3)",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <span>تایید و بررسی نهایی</span>
                <span style={{ fontSize: "16px" }}>✓ ←</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  padding: "15px 24px",
                  borderRadius: "14px",
                  border: "1.5px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e2e8f0",
                  fontWeight: "800",
                  fontSize: "14.5px",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <span style={{ fontSize: "16px" }}>→</span>
                <span>بازگشت</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Summary & Confirm */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#fff" }}>✓ بررسی و تایید نهایی</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "16px", border: "1px solid var(--line)", color: "#e2e8f0" }}>
              <div style={{ fontSize: "16px", borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "8px" }}>
                <strong>نوع اکانت:</strong> {GAME_OPTIONS.find((o) => o.key === game)?.label}
              </div>
              {gameFields.map(f => {
                const val = formData[f.name];
                if (val === undefined || val === null) return null;
                return (
                  <div key={f.name}>
                    <strong>{f.label}:</strong> {val === true ? "بله" : val === false ? "خیر" : val.toLocaleString ? val.toLocaleString("fa-IR") : val}
                  </div>
                );
              })}
            </div>

            <div style={{ background: "rgba(0, 242, 254, 0.08)", padding: "16px", borderRadius: "14px", border: "1px dashed #00f2fe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>حق مزد ثبت آگهی فروشگاه:</span>
              <span style={{ fontSize: "16px", fontWeight: "900", color: "#00f2fe" }}>۸۰,۰۰۰ تومان</span>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  if (redirectUrl) {
                    window.location.href = redirectUrl;
                  } else {
                    setStep(5);
                  }
                }}
                style={{
                  flex: "1",
                  padding: "16px 24px",
                  borderRadius: "14px",
                  border: "none",
                  background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  color: "#080c1c",
                  fontWeight: "900",
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(0, 242, 254, 0.35)",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <span>💳 پرداخت حق مزد (۸۰,۰۰۰ تومان) و ارسال نهایی آگهی</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  padding: "16px 24px",
                  borderRadius: "14px",
                  border: "1.5px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#e2e8f0",
                  fontWeight: "800",
                  fontSize: "14.5px",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <span style={{ fontSize: "16px" }}>→</span>
                <span>بازگشت</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success Popup */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "rgba(0, 242, 254, 0.05)", borderRadius: "20px", border: "2px solid #00f2fe", animation: "popIn 0.5s ease-out forwards" }}>
            <div style={{ fontSize: "64px", marginBottom: "20px", animation: "bounce 1s infinite" }}>🎉</div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#00f2fe", marginBottom: "12px", textAlign: "center" }}>
              درخواستت ارسال شده!
            </h2>
            <p style={{ fontSize: "16px", color: "#e2e8f0", textAlign: "center", marginBottom: "30px", lineHeight: "1.6" }}>
              آگهی شما با موفقیت ثبت شد و در صف بررسی ادمین قرار گرفت. می‌توانید وضعیت آن را از پنل کاربری مشاهده کنید.
            </p>
            <button
              onClick={() => router.push("/panel/user/listings")}
              className="btn-primary"
              style={{ padding: "14px 32px", fontSize: "16px", fontWeight: "bold" }}
            >
              رفتن به اینباکس آگهی‌ها
            </button>
          </div>
        )}

      </div>
    </div>
  </>
  );
}

export default function SellWizardPage() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <SellWizardContent />
    </Suspense>
  );
}
