"use strict";

const IPA_REPLACEMENTS = [
  ["tɕh", "q"],
  ["tɕ", "j"],
  ["dʑ", "j"],
  ["ʨh", "q"],
  ["ʨ", "j"],
  ["ʦ", "ts"],
  ["ȵ", "n"],
  ["ɕ", "x"],
  ["ʑ", "r"],
  ["ŋ", "ng"],
  ["ɡ", "g"],
  ["ɑ", "a"],
  ["ɛ", "e"],
  ["ə", "e"],
  ["ɤ", "e"],
  ["ɿ", "i"],
  ["Ǿ", ""],
  ["ʔ", ""],
  ["\u0303", ""],
  ["\u0304", ""],
];

function replaceAllText(text, search, replacement) {
  return text.split(search).join(replacement);
}

function toJinhuaPronunciationDisplay(value) {
  let text = String(value || "").trim();
  if (!text) {
    return "";
  }

  text = text
    .replace(/([A-Za-z])\./g, "$1 ")
    .replace(/[，、；;]+/g, " ")
    .replace(/[。]+/g, ". ")
    .replace(/[？]+/g, "? ")
    .replace(/[！]+/g, "! ")
    .replace(/[…]+/g, " ")
    .replace(/[0-9]+/g, " ");

  for (const replacement of IPA_REPLACEMENTS) {
    text = replaceAllText(text, replacement[0], replacement[1]);
  }

  return text
    .replace(/\s*([?.!])\s*/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = {
  toJinhuaPronunciationDisplay,
};
