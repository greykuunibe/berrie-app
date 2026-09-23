# Future Features

## AI Read-Aloud / TTS Engine (Kokoro-82M)

**Status:** Planned — not yet started  
**Priority:** High  
**Complexity:** Large (multi-phase, spans Rust + Python + React)

### What it is
An "Eleven Reader"-style read-aloud feature for the Bible reader. The user selects a passage and the app reads it aloud using Kokoro-82M (Apache 2.0 licensed, ~300MB ONNX model), highlighting each active word/verse in real time as speech progresses.

### Architecture

```
Reader UI  ──IPC──►  Tauri command  ──stdin──►  kokoro_tts.py (PyInstaller sidecar)
                                                    ↓ kokoro-onnx inference
                  ◄──JSON event──  Tauri command  ◄──stdout── { audio_b64, timestamps[] }
```

### Phases

**Phase 1 — Frontend (no backend needed)**
- `useReadAloudEngine` hook — HTML5 Audio + `requestAnimationFrame` timestamp sync
- `VerseBlock` gains `isActive` + `activeWords` props for highlighting
- Per-verse refs in Reader for smooth `scrollIntoView` as speech progresses
- Floating audio control bar: Play/Pause, speed (0.75×/1×/1.25×/1.5×), voice selector, skip verse

**Phase 2 — Tauri backend**
- Add `tauri-plugin-shell` to `Cargo.toml` + `tauri.conf.json`
- Write `kokoro_tts.py` Python sidecar (G2P → ONNX inference → WAV + timestamp manifest)
- Bundle sidecar with PyInstaller
- Tauri IPC commands: `generate_speech`, `pause_speech`, `stop_speech`
- Streaming queue: pre-buffer next verse while current is playing

**Phase 3 — Integration**
- Connect `useReadAloudEngine` hook to real Tauri IPC events
- Replace placeholder audio with generated PCM/WAV
- Word-level timestamp manifest: `[{ word, start_ms, end_ms }]`

### Gaps to fill before starting (Phase 2)
- `tauri-plugin-shell` not yet installed
- `externalBin: []` in `tauri.conf.json` is empty
- No shell capability permissions in `capabilities/default.json`
- No `ort` or audio crates in `Cargo.toml`

### References
- Model: https://huggingface.co/hexgrad/Kokoro-82M
- Python lib: `kokoro-onnx` (pip)
- Sidecar docs: https://tauri.app/plugin/shell/
