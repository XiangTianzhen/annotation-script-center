"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const clipCacheService = require("./clip-cache-service");

function createRuntimeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "asc-cvpc-clip-cache-"));
}

function createFakeWavBase64() {
  const pcmBytes = 320;
  const buffer = Buffer.alloc(44 + pcmBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(16000, 24);
  buffer.writeUInt32LE(32000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(pcmBytes, 40);
  return buffer.toString("base64");
}

test("clip cache upload stores wav clip and returns public url metadata", function () {
  const runtimeDir = createRuntimeDir();

  const saved = clipCacheService.saveClip(
    {
      clipBase64: createFakeWavBase64(),
      contentType: "audio/wav",
      sourceFileName: "sample.mp3",
      sourceAudioUrlHash: "hash-1",
      startMs: 18565,
      endMs: 35677,
    },
    {
      runtimeDir,
      publicBaseUrl: "https://script.example.com",
      nowMs: function () {
        return 1000;
      },
    }
  );

  assert.equal(saved.success, true);
  assert.match(saved.clipId, /^[a-f0-9]{24}$/);
  assert.equal(
    saved.audioUrl,
    "https://script.example.com/api/data-baker-cvpc/liuzhou-helper/clip-cache/files/" +
      saved.clipId +
      ".wav"
  );
  assert.equal(saved.expiresAt, new Date(1000 + clipCacheService.DEFAULT_CLIP_TTL_MS).toISOString());

  const fileRecord = clipCacheService.readClip(saved.clipId, {
    runtimeDir,
    nowMs: function () {
      return 2000;
    },
  });
  assert.ok(fileRecord);
  assert.equal(fileRecord.contentType, "audio/wav");
  assert.equal(fileRecord.metadata.sourceFileName, "sample.mp3");
  assert.ok(Buffer.isBuffer(fileRecord.buffer));
  assert.equal(fileRecord.buffer.toString("ascii", 0, 4), "RIFF");
});

test("clip cache rejects invalid clip payloads", function () {
  const runtimeDir = createRuntimeDir();

  assert.throws(
    function () {
      clipCacheService.saveClip(
        {
          clipBase64: "not-base64",
          contentType: "audio/wav",
          sourceFileName: "sample.mp3",
          sourceAudioUrlHash: "hash-1",
          startMs: 0,
          endMs: 1000,
        },
        {
          runtimeDir,
          publicBaseUrl: "https://script.example.com",
        }
      );
    },
    function (error) {
      return error && error.code === "invalid-clip-base64";
    }
  );

  assert.throws(
    function () {
      clipCacheService.saveClip(
        {
          clipBase64: createFakeWavBase64(),
          contentType: "audio/mp3",
          sourceFileName: "sample.mp3",
          sourceAudioUrlHash: "hash-1",
          startMs: 0,
          endMs: 1000,
        },
        {
          runtimeDir,
          publicBaseUrl: "https://script.example.com",
        }
      );
    },
    function (error) {
      return error && error.code === "invalid-clip-content-type";
    }
  );
});

test("clip cache removes expired files on read", function () {
  const runtimeDir = createRuntimeDir();

  const saved = clipCacheService.saveClip(
    {
      clipBase64: createFakeWavBase64(),
      contentType: "audio/wav",
      sourceFileName: "sample.mp3",
      sourceAudioUrlHash: "hash-1",
      startMs: 0,
      endMs: 1000,
    },
    {
      runtimeDir,
      publicBaseUrl: "https://script.example.com",
      ttlMs: 10,
      nowMs: function () {
        return 1000;
      },
    }
  );

  const expired = clipCacheService.readClip(saved.clipId, {
    runtimeDir,
    nowMs: function () {
      return 2000;
    },
  });
  assert.equal(expired, null);

  const runtimeFiles = fs.readdirSync(runtimeDir);
  assert.equal(runtimeFiles.length, 0);
});
