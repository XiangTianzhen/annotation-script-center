(function () {
  const LOG_PREFIX = "[ASR Edge][annotation-text-pipeline]";
  const runtimeConfig = window.__ASREdgeAlibabaLabelxAnnotationRuntimeConfig;
  const QUESTION_HINT_PATTERN = /[吗呢啊吧呀怎谁哪什]/;
  const TERMINAL_PUNCTUATION_PATTERN = /[。？！.!?]$/;
  const PUNCTUATION_SPACE_BEFORE_PATTERN = /\s+([，。？！、,.!?])/g;
  const CJK_PUNCTUATION_SPACE_AFTER_PATTERN =
    /([，。？！、])\s+(?=[\u3400-\u9FFF\uF900-\uFAFF，。？！、,.!?])/g;
  const CJK_OPEN_QUOTE_SPACE_AFTER_PATTERN = /([“‘])\s+/g;
  const CJK_CLOSE_QUOTE_SPACE_BEFORE_PATTERN = /\s+([”’])/g;
  const CJK_OPEN_PARENTHESIS_SPACE_AFTER_PATTERN = /(（)\s+/g;
  const CJK_CLOSE_PARENTHESIS_SPACE_BEFORE_PATTERN = /\s+(）)/g;
  const REPEATED_SEPARATOR_PUNCTUATION_PATTERN = /([，、,])\1+/g;
  const TRAILING_SEPARATOR_BEFORE_TERMINAL_PATTERN = /[，、,]+([”’]?)([。？！.!?]+)$/;
  const REPEATED_TERMINAL_PUNCTUATION_PATTERN = /([。？！.!?])\1+$/;
  const PURE_DIGIT_CHINESE_PATTERN = /^[幺零一二两三四五六七八九]+$/;
  const CHINESE_NUMBER_PATTERN = /[幺零一二两三四五六七八九十百千万亿]+/g;
  const chnNumChar = {
    幺: 1,
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  const chnNameValue = {
    十: 10,
    百: 100,
    千: 1000,
    万: 10000,
    亿: 100000000,
  };

  if (!runtimeConfig) {
    console.warn(LOG_PREFIX, "Required dependencies are not loaded.");
    return;
  }

  function toSafeString(value) {
    return typeof value === "string" ? value : "";
  }

  function removeZeroWidthCharacters(text) {
    return toSafeString(text).replace(/[\u200B-\u200D\uFEFF]/g, "");
  }

  function normalizeWhitespace(text) {
    return toSafeString(text).replace(/\s+/g, " ").trim();
  }

  function removeAllWhitespace(text) {
    return toSafeString(text).replace(/\s+/g, "");
  }

  function normalizePunctuationWhitespace(text) {
    return toSafeString(text)
      .replace(PUNCTUATION_SPACE_BEFORE_PATTERN, "$1")
      .replace(CJK_PUNCTUATION_SPACE_AFTER_PATTERN, "$1");
  }

  function normalizeCjkQuoteWhitespace(text) {
    return toSafeString(text)
      .replace(CJK_OPEN_QUOTE_SPACE_AFTER_PATTERN, "$1")
      .replace(CJK_CLOSE_QUOTE_SPACE_BEFORE_PATTERN, "$1");
  }

  function normalizeCjkParenthesisWhitespace(text) {
    return toSafeString(text)
      .replace(CJK_OPEN_PARENTHESIS_SPACE_AFTER_PATTERN, "$1")
      .replace(CJK_CLOSE_PARENTHESIS_SPACE_BEFORE_PATTERN, "$1");
  }

  function collapseRepeatedSeparatorPunctuation(text) {
    return toSafeString(text).replace(REPEATED_SEPARATOR_PUNCTUATION_PATTERN, "$1");
  }

  function stripTrailingSeparatorBeforeTerminalPunctuation(text) {
    return toSafeString(text).replace(TRAILING_SEPARATOR_BEFORE_TERMINAL_PATTERN, "$1$2");
  }

  function collapseRepeatedTerminalPunctuation(text) {
    return toSafeString(text).replace(REPEATED_TERMINAL_PUNCTUATION_PATTERN, "$1");
  }

  function appendTerminalPunctuation(text) {
    const normalizedText = toSafeString(text);
    if (!normalizedText || TERMINAL_PUNCTUATION_PATTERN.test(normalizedText)) {
      return normalizedText;
    }

    const lastClause = normalizedText.split(/[，、,]/).pop() || normalizedText;
    return normalizedText + (QUESTION_HINT_PATTERN.test(lastClause) ? "？" : "。");
  }

  function getConfigSnapshot(options) {
    const base = runtimeConfig.getSnapshot();
    const override = options && typeof options === "object" ? options : {};

    return {
      numConvertMode:
        override.numConvertMode === "蜂鸟众包"
          ? "蜂鸟众包"
          : override.numConvertMode === "千问"
            ? "千问"
            : base.numConvertMode,
      customReplacements: Array.isArray(override.customReplacements)
        ? override.customReplacements
        : base.customReplacements,
    };
  }

  function applyCustomReplacements(text, options) {
    const snapshot = getConfigSnapshot(options);
    let resultText = toSafeString(text);

    snapshot.customReplacements.forEach(function (rule) {
      const fromValue = typeof rule?.from === "string" ? rule.from : "";
      const toValue = typeof rule?.to === "string" ? rule.to : "";

      if (!fromValue.trim()) {
        return;
      }

      fromValue.split(/[,，|]/).forEach(function (keyword) {
        const normalizedKeyword = keyword.trim();
        if (!normalizedKeyword) {
          return;
        }

        resultText = resultText.split(normalizedKeyword).join(toValue);
      });
    });

    return resultText;
  }

  function convertChineseNumberStr(chnStr) {
    const chars = toSafeString(chnStr).split("");
    let total = 0;
    let section = 0;
    let number = 0;

    if (chars.length === 0) {
      return null;
    }

    if (chars[0] === "十") {
      chars.unshift("一");
    }

    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index];
      const digit = chnNumChar[char];

      if (digit !== undefined) {
        number = digit;

        if (index === chars.length - 1) {
          const previousChar = chars[index - 1];
          const previousUnit = previousChar ? chnNameValue[previousChar] : undefined;

          if (previousUnit && previousUnit >= 100) {
            section += number * (previousUnit / 10);
          } else {
            section += number;
          }
        }

        continue;
      }

      const unit = chnNameValue[char];
      if (unit === undefined) {
        return null;
      }

      if (number === 0 && (unit === 10 || unit === 100 || unit === 1000)) {
        number = 1;
      }

      if (unit === 10000 || unit === 100000000) {
        section += number;
        total += (section === 0 ? 1 : section) * unit;
        section = 0;
      } else {
        section += number * unit;
      }

      number = 0;
    }

    total += section;
    return total;
  }

  function convertPureDigitSequence(sequence) {
    let result = "";

    for (let index = 0; index < sequence.length; index += 1) {
      const digit = chnNumChar[sequence[index]];
      if (digit === undefined) {
        return null;
      }
      result += String(digit);
    }

    return result;
  }

  function isPureDigitSequence(sequence) {
    return PURE_DIGIT_CHINESE_PATTERN.test(sequence);
  }

  function convertSpecialNumberPatterns(text) {
    let nextText = toSafeString(text);

    nextText = nextText.replace(/([幺零一二两三四五六七八九十百千万]+)(块|楼|号)/g, function (
      match,
      prefix,
      suffix
    ) {
      if (/^[百千万]+$/.test(prefix)) {
        return match;
      }

      if (isPureDigitSequence(prefix) && prefix.length > 1) {
        const convertedDigits = convertPureDigitSequence(prefix);
        if (convertedDigits && (parseInt(convertedDigits, 10) >= 1 || convertedDigits.includes("0"))) {
          return convertedDigits + suffix;
        }
        return match;
      }

      const numericValue = convertChineseNumberStr(prefix);
      return numericValue !== null && numericValue >= 1 ? String(numericValue) + suffix : match;
    });

    nextText = nextText.replace(
      /(饿了么|饿了)([幺零一二两三四五六七八九十百千万]+)/g,
      function (match, prefix, suffix) {
        if (/^[百千万]+$/.test(suffix)) {
          return match;
        }

        if (isPureDigitSequence(suffix) && suffix.length > 1) {
          const convertedDigits = convertPureDigitSequence(suffix);
          if (
            convertedDigits &&
            (parseInt(convertedDigits, 10) >= 1 || convertedDigits.includes("0"))
          ) {
            return prefix + convertedDigits;
          }
          return match;
        }

        const numericValue = convertChineseNumberStr(suffix);
        return numericValue !== null && numericValue >= 1 ? prefix + numericValue : match;
      }
    );

    return nextText;
  }

  function strictEvaluate(text) {
    const safeText = toSafeString(text);

    if (isPureDigitSequence(safeText)) {
      const convertedDigits = convertPureDigitSequence(safeText);
      return convertedDigits ? parseInt(convertedDigits, 10) : null;
    }

    const tenCount = (safeText.match(/十/g) || []).length;
    const hundredCount = (safeText.match(/百/g) || []).length;

    if (tenCount > 1 || hundredCount > 1) {
      return null;
    }

    if (tenCount === 1 && hundredCount === 1 && safeText.indexOf("十") < safeText.indexOf("百")) {
      return null;
    }

    return convertChineseNumberStr(safeText);
  }

  function splitIntoIncreasingSequence(text) {
    const safeText = toSafeString(text);
    let bestPartition = null;
    let bestScore = Infinity;

    function backtrack(startIndex, previousValue, partition) {
      if (startIndex === safeText.length) {
        if (partition.length > 1) {
          let maxDiff = 0;
          for (let index = 1; index < partition.length; index += 1) {
            const diff = partition[index] - partition[index - 1];
            if (diff > maxDiff) {
              maxDiff = diff;
            }
          }

          if (maxDiff < bestScore || (maxDiff === bestScore && (!bestPartition || partition.length > bestPartition.length))) {
            bestScore = maxDiff;
            bestPartition = partition.slice();
          }
        }
        return;
      }

      for (let length = 1; length <= safeText.length - startIndex; length += 1) {
        const segment = safeText.slice(startIndex, startIndex + length);
        const numericValue = strictEvaluate(segment);

        if (numericValue === null || numericValue > 999) {
          continue;
        }

        if (previousValue !== -1 && numericValue <= previousValue) {
          continue;
        }

        partition.push(numericValue);
        backtrack(startIndex + length, numericValue, partition);
        partition.pop();
      }
    }

    backtrack(0, -1, []);
    return {
      partition: bestPartition,
      score: bestScore,
    };
  }

  function convertTextNumbers(text, options) {
    const snapshot = getConfigSnapshot(options);
    const inputText = removeZeroWidthCharacters(text);
    const preprocessedText = convertSpecialNumberPatterns(inputText);
    let outputText = preprocessedText;
    const appliedRules = [];

    if (inputText !== preprocessedText) {
      appliedRules.push("convert-special-number-patterns");
    }

    if (snapshot.numConvertMode === "千问") {
      const qianwenText = preprocessedText.replace(
        /(\d+(?:\.\d+)?)([十百千万亿]+)/g,
        function (match, digits, units) {
          const multiplier = convertChineseNumberStr(units);
          return multiplier !== null ? String(parseFloat(digits) * multiplier) : match;
        }
      );

      outputText = qianwenText.replace(CHINESE_NUMBER_PATTERN, function (match) {
        if (isPureDigitSequence(match)) {
          return convertPureDigitSequence(match) || match;
        }

        const numericValue = convertChineseNumberStr(match);
        return numericValue !== null ? String(numericValue) : match;
      });
    } else {
      outputText = preprocessedText.replace(/([幺零一二两三四五六七八九十百]+)/g, function (match) {
        if (/^[百十]+$/.test(match)) {
          return match;
        }

        const singleValue = strictEvaluate(match);
        const sequenceInfo = splitIntoIncreasingSequence(match);

        if (sequenceInfo.partition && sequenceInfo.partition.length >= 2 && sequenceInfo.score <= 15) {
          return sequenceInfo.partition.join("、");
        }

        if (singleValue !== null && singleValue <= 999) {
          if (singleValue >= 3 || (isPureDigitSequence(match) && match.includes("零"))) {
            return String(singleValue);
          }
          return match;
        }

        const fallbackValue = convertChineseNumberStr(match);
        return fallbackValue !== null && fallbackValue >= 3 && fallbackValue <= 999
          ? String(fallbackValue)
          : match;
      });
    }

    if (preprocessedText !== outputText) {
      appliedRules.push(snapshot.numConvertMode === "千问" ? "convert-qianwen-mode" : "convert-fengniao-mode");
    }

    return {
      inputText: inputText,
      outputText: outputText,
      appliedRules: appliedRules,
      mode: snapshot.numConvertMode,
      changed: inputText !== outputText,
    };
  }

  function runQuickfillPipeline(sourceText, options) {
    const inputText = toSafeString(sourceText);
    const withoutZeroWidth = removeZeroWidthCharacters(inputText);
    const replacementText = applyCustomReplacements(withoutZeroWidth, options);
    const specialNumberText = convertSpecialNumberPatterns(replacementText);
    const whitespaceNormalizedText = normalizeWhitespace(specialNumberText);
    const punctuationWhitespaceNormalizedText =
      normalizePunctuationWhitespace(whitespaceNormalizedText);
    const quoteWhitespaceNormalizedText =
      normalizeCjkQuoteWhitespace(punctuationWhitespaceNormalizedText);
    const parenthesisWhitespaceNormalizedText =
      normalizeCjkParenthesisWhitespace(quoteWhitespaceNormalizedText);
    const separatorCollapsedText = collapseRepeatedSeparatorPunctuation(
      parenthesisWhitespaceNormalizedText
    );
    const trailingSeparatorNormalizedText =
      stripTrailingSeparatorBeforeTerminalPunctuation(separatorCollapsedText);
    const normalizedText = collapseRepeatedTerminalPunctuation(
      trailingSeparatorNormalizedText
    );
    const generatedText = appendTerminalPunctuation(normalizedText);
    const appliedRules = [];

    if (inputText !== withoutZeroWidth) {
      appliedRules.push("remove-zero-width");
    }

    if (withoutZeroWidth !== replacementText) {
      appliedRules.push("apply-custom-replacements");
    }

    if (replacementText !== specialNumberText) {
      appliedRules.push("convert-special-number-patterns");
    }

    if (specialNumberText !== whitespaceNormalizedText) {
      appliedRules.push("normalize-whitespace");
    }

    if (whitespaceNormalizedText !== punctuationWhitespaceNormalizedText) {
      appliedRules.push("normalize-punctuation-whitespace");
    }

    if (punctuationWhitespaceNormalizedText !== quoteWhitespaceNormalizedText) {
      appliedRules.push("normalize-cjk-quote-whitespace");
    }

    if (quoteWhitespaceNormalizedText !== parenthesisWhitespaceNormalizedText) {
      appliedRules.push("normalize-cjk-parenthesis-whitespace");
    }

    if (parenthesisWhitespaceNormalizedText !== separatorCollapsedText) {
      appliedRules.push("collapse-repeated-separator-punctuation");
    }

    if (separatorCollapsedText !== trailingSeparatorNormalizedText) {
      appliedRules.push("strip-trailing-separator-before-terminal-punctuation");
    }

    if (trailingSeparatorNormalizedText !== normalizedText) {
      appliedRules.push("collapse-repeated-terminal-punctuation");
    }

    if (normalizedText && normalizedText !== generatedText) {
      appliedRules.push("append-terminal-punctuation");
    }

    return {
      inputText: inputText,
      normalizedText: normalizedText,
      generatedText: generatedText,
      appliedRules: appliedRules,
    };
  }

  function removeSpaces(text) {
    const inputText = toSafeString(text);
    const withoutZeroWidth = removeZeroWidthCharacters(inputText);
    const outputText = removeAllWhitespace(withoutZeroWidth);
    const appliedRules = [];

    if (inputText !== withoutZeroWidth) {
      appliedRules.push("remove-zero-width");
    }

    if (withoutZeroWidth !== outputText) {
      appliedRules.push("remove-all-whitespace");
    }

    return {
      inputText: inputText,
      outputText: outputText,
      appliedRules: appliedRules,
      changed: inputText !== outputText,
    };
  }

  window.__ASREdgeAlibabaLabelxAnnotationTextPipeline = {
    run: runQuickfillPipeline,
    runQuickfill: runQuickfillPipeline,
    applyCustomReplacements: applyCustomReplacements,
    convertChineseNumberStr: convertChineseNumberStr,
    convertTextNumbers: convertTextNumbers,
    convertSpecialNumberPatterns: convertSpecialNumberPatterns,
    removeZeroWidthCharacters: removeZeroWidthCharacters,
    normalizeWhitespace: normalizeWhitespace,
    removeAllWhitespace: removeAllWhitespace,
    removeSpaces: removeSpaces,
    appendTerminalPunctuation: appendTerminalPunctuation,
    LOG_PREFIX: LOG_PREFIX,
  };
})();
