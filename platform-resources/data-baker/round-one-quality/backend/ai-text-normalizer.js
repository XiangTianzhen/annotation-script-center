"use strict";

const { loadMinnanLexicon, __testOnly } = require("./ai-lexicon");

const BASE_SUGGESTED_TEXT = [
  "阮、咱",
  "汝、恁",
  "伊、因",
  "即个",
  "即阵",
  "诶",
  "真",
  "欢喜",
  "食",
  "规日",
  "门理清",
  "迄代志",
];

const TRADITIONAL_TO_SIMPLIFIED_MAP = {
  "這": "这",
  "個": "个",
  "問": "问",
  "題": "题",
  "複": "复",
  "雜": "杂",
  "聽": "听",
  "說": "说",
  "語": "语",
  "體": "体",
  "廢": "废",
  "殘": "残",
  "覺": "觉",
  "認": "认",
  "識": "识",
  "實": "实",
  "際": "际",
  "發": "发",
  "聲": "声",
  "優": "优",
  "輸": "输",
  "資": "资",
  "訊": "讯",
  "轉": "转",
  "換": "换",
  "後": "后",
  "裡": "里",
  "還": "还",
  "點": "点",
  "會": "会",
  "應": "应",
  "對": "对",
  "讓": "让",
  "與": "与",
  "為": "为",
  "無": "无",
  "詞": "词",
  "標": "标",
  "註": "注",
  "檢": "检",
  "稱": "称",
  "錯": "错",
  "過": "过",
  "進": "进",
  "選": "选",
  "擇": "择",
  "寫": "写",
  "虛": "虚",
  "該": "该",
  "嗎": "吗",
  "麼": "么",
  "開": "开",
  "關": "关",
  "頁": "页",
  "錄": "录",
  "滿": "满",
  "裝": "装",
  "臺": "台",
  "網": "网",
  "電": "电",
  "將": "将",
  "衛": "卫",
  "術": "术",
  "萬": "万",
  "時": "时",
  "間": "间",
  "長": "长",
  "變": "变",
  "號": "号",
  "門": "门",
  "員": "员",
  "線": "线",
  "響": "响",
};

function splitSuggestedTerms(text) {
  const splitter = __testOnly && typeof __testOnly.splitTerms === "function"
    ? __testOnly.splitTerms
    : function fallbackSplit(value) {
        return String(value || "")
          .split(/[、，,；;／/\s]+/)
          .map(function (item) {
            return String(item || "").trim();
          })
          .filter(Boolean);
      };
  return splitter(text);
}

function getProtectedLexiconTerms() {
  const terms = new Set();
  BASE_SUGGESTED_TEXT.forEach(function (value) {
    splitSuggestedTerms(value).forEach(function (term) {
      if (term) {
        terms.add(term);
      }
    });
  });

  loadMinnanLexicon().forEach(function (entry) {
    splitSuggestedTerms(entry && entry.suggested).forEach(function (term) {
      if (term) {
        terms.add(term);
      }
    });
  });

  return Array.from(terms).sort(function (left, right) {
    return right.length - left.length;
  });
}

function protectLexiconTerms(text, protectedTerms) {
  const replacements = [];
  let output = String(text || "");

  protectedTerms.forEach(function (term, index) {
    if (!term || output.indexOf(term) < 0) {
      return;
    }
    const token = "__ASC_LEXICON_TOKEN_" + String(index) + "__";
    output = output.split(term).join(token);
    replacements.push({ token: token, value: term });
  });

  return { text: output, replacements: replacements };
}

function convertTraditionalToSimplified(text) {
  let output = "";
  const source = String(text || "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    output += TRADITIONAL_TO_SIMPLIFIED_MAP[char] || char;
  }
  return output;
}

function restoreLexiconTerms(text, replacements) {
  let output = String(text || "");
  (Array.isArray(replacements) ? replacements : []).forEach(function (entry) {
    if (!entry || !entry.token) {
      return;
    }
    output = output.split(entry.token).join(entry.value || "");
  });
  return output;
}

function normalizeToSimplifiedChinesePreservingLexicon(text) {
  const source = String(text || "");
  if (!source) {
    return "";
  }
  const protectedTerms = getProtectedLexiconTerms();
  const protectedResult = protectLexiconTerms(source, protectedTerms);
  const simplified = convertTraditionalToSimplified(protectedResult.text);
  return restoreLexiconTerms(simplified, protectedResult.replacements);
}

module.exports = {
  normalizeToSimplifiedChinesePreservingLexicon,
};

