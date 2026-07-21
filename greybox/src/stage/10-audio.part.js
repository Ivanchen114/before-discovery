  /* ---------- 程序化環境音樂(BGM):Web Audio 即席合成,零資產零版權 ----------
     音訊分工裁決(總監 20260720):v1=程式合成;真實錄音/生成音樂=未來選項(掛點相容)。
     每個 mood=低音 drone+調式撥弦(隨機稀疏)+環境噪音層;場景切換交叉淡入;非確定性=氛圍非 fixture。 */
  var BGM = (function () {
    var cur = null, curVariant = 0, curFinished = false;
    var master = null, layers = [], timers = [];
    /* 撥弦層已停用(總監試玩:合成撥弦=丁丁丁風鈴,出戲)——只留鋪底 drone+環境噪音+辯論脈搏;
       真音樂(Gemini 生成/bgmFiles)落地即整組讓位。pluckMs:null=不排撥弦。 */
    var MOODS = {
      storm:    { drone: [55, 82.5],     scale: [],  gain: 0.05,  pluckMs: null, noise: "rumble" },
      pisa:     { drone: [110, 165],     scale: [],  gain: 0.05,  pluckMs: null, noise: null },
      study:    { drone: [98, 147],      scale: [],  gain: 0.045, pluckMs: null, noise: null },
      rain:     { drone: [87.3, 130.8],  scale: [],  gain: 0.05,  pluckMs: null, noise: "rain" },
      workshop: { drone: [103.8, 155.6], scale: [],  gain: 0.05,  pluckMs: null, noise: "drip" },
      hall:     { drone: [73.4, 110],    scale: [],  gain: 0.055, pluckMs: null, noise: null, pulse: true },
      dusk:     { drone: [130.8, 196],   scale: [],  gain: 0.04,  pluckMs: null, noise: null }
    };
    function noiseBuf(c, secs) {
      var b = c.createBuffer(1, c.sampleRate * secs, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }
    function stopAll(fade) {
      timers.forEach(clearTimeout); timers = [];
      var c = SFX.ctx();
      if (master && c) {
        var m = master;
        try { m.gain.setTargetAtTime(0.0001, c.currentTime, fade ? 0.5 : 0.05); } catch (e) {}
        setTimeout(function () { try { m.disconnect(); } catch (e) {} }, 1400);
      }
      layers.forEach(function (n) { try { if (n.stop) n.stop(c ? c.currentTime + 1.3 : 0); } catch (e) {} });
      layers = []; master = null;
    }
    function pluck(c, freq, M) {
      if (!master) return;
      [0, 3].forEach(function (detune) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = "triangle"; o.frequency.value = freq; o.detune.value = detune;
        g.gain.setValueAtTime(0.22, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.1);
        o.connect(g); g.connect(master);
        o.start(); o.stop(c.currentTime + 1.2);
      });
    }
    /* BGM v2(Gemini 30 秒素材):once=播一次回環境音;milestone=A/B/C 依玩法進度換段;
       silence=刻意留白。舊 string schema 仍視為 once,舊存檔/舊資產可回退。 */
    var fileCur = null, fileTimer = null;
    function cueSpec(mood) {
      var files = ASSETS && ASSETS.bgmFiles;
      var raw = files && files[mood];
      if (raw === null || typeof raw === "undefined") return null;
      if (typeof raw === "string") return { mode: "once", ambient: mood, clips: [raw] };
      return raw;
    }
    function stopFile(fast) {
      if (fileTimer) { clearInterval(fileTimer); fileTimer = null; }
      if (!fileCur) return;
      var a = fileCur; fileCur = null;
      var t = setInterval(function () {
        a.volume = Math.max(0, a.volume - (fast ? 0.08 : 0.008));
        if (a.volume <= 0.01) { clearInterval(t); a.pause(); }
      }, 60);
    }
    function playFile(url, done) {
      stopAll(false); stopFile(false);
      var a = new Audio(url);
      a.loop = false; a.volume = 0;
      a.addEventListener("ended", function () {
        if (fileCur !== a) return;
        fileCur = null; curFinished = true;
        if (done) done();
      });
      var p = a.play();
      if (p && p.catch) p.catch(function () {}); /* 手勢前被擋:unlockAudio 會 refresh 補播 */
      fileCur = a;
      fileTimer = setInterval(function () {
        if (!fileCur) return;
        fileCur.volume = Math.min(0.24, fileCur.volume + 0.008);
        if (fileCur.volume >= 0.24) { clearInterval(fileTimer); fileTimer = null; }
      }, 60);
    }
    function playSynth(mood) {
      stopFile(false);
      var c = SFX.ctx(); if (!c) return;
      try { if (c.state === "suspended") c.resume(); } catch (e) {}
      stopAll(true);
      var M = MOODS[mood]; if (!M) return;
      master = c.createGain();
      master.gain.setValueAtTime(0.0001, c.currentTime);
      master.gain.setTargetAtTime(M.gain, c.currentTime, 1.2);
      master.connect(c.destination);
      M.drone.forEach(function (f, i) {
        var o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = f; g.gain.value = i ? 0.5 : 0.8;
        o.connect(g); g.connect(master); o.start(); layers.push(o);
      });
      if (M.noise) {
        var s = c.createBufferSource(), f2 = c.createBiquadFilter(), g2 = c.createGain();
        s.buffer = noiseBuf(c, 2); s.loop = true;
        f2.type = "lowpass";
        f2.frequency.value = M.noise === "rain" ? 900 : (M.noise === "rumble" ? 170 : 500);
        g2.gain.value = M.noise === "rain" ? 0.5 : 0.3;
        s.connect(f2); f2.connect(g2); g2.connect(master);
        s.start(); layers.push(s);
        if (M.noise === "drip") (function drip() { /* 低頻悶滴,稀疏——不再是丁 */
          timers.push(setTimeout(function () {
            if (!master) return;
            var o = c.createOscillator(), g = c.createGain();
            o.type = "sine"; o.frequency.value = 620 + Math.random() * 180;
            g.gain.setValueAtTime(0.045, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
            o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + 0.13);
            drip();
          }, 7000 + Math.random() * 7000));
        })();
      }
      if (M.pulse) (function beat() { /* 辯論廳:55Hz 低頻脈搏,緊張感的物理學 */
        timers.push(setTimeout(function () {
          if (!master) return;
          var o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.frequency.value = 55;
          g.gain.setValueAtTime(0.5, c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.28);
          o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime + 0.3);
          beat();
        }, 1150));
      })();
      if (M.pluckMs && M.scale.length) (function stroll() { /* 撥弦漫步(現停用;真曲進場前不再排) */
        timers.push(setTimeout(function () {
          if (!master) return;
          pluck(c, M.scale[Math.floor(Math.random() * M.scale.length)], M);
          stroll();
        }, M.pluckMs[0] + Math.random() * (M.pluckMs[1] - M.pluckMs[0])));
      })();
    }
    function settle(spec) {
      if (spec && spec.ambient) playSynth(spec.ambient);
      else stopAll(true);
    }
    function play(mood, variant) {
      cur = mood;
      curVariant = typeof variant === "number" ? variant : 0;
      curFinished = false;
      if (!SFX.isOn()) return;
      var spec = cueSpec(mood);
      if (spec && spec.mode === "silence") {
        stopAll(true); stopFile(true); curFinished = true; return;
      }
      if (spec && spec.clips && spec.clips.length) {
        curVariant = Math.max(0, Math.min(curVariant, spec.clips.length - 1));
        playFile(ASSETS.audioBasePath + spec.clips[curVariant], function () { settle(spec); });
        return;
      }
      playSynth(mood); /* storm/null 或無實檔 cue → 程序化聲景 */
    }
    function variant(index) {
      var spec = cueSpec(cur);
      if (!spec || spec.mode !== "milestone" || !spec.clips || !spec.clips.length) return;
      var next = Math.max(0, Math.min(index, spec.clips.length - 1));
      if (next === curVariant) return; /* 同一節點重繪不得把已播完的 30 秒段落重新叫回來 */
      play(cur, next);
    }
    return {
      play: play,
      variant: variant,
      stop: function (fade) { stopAll(fade); stopFile(true); },
      current: function () { return cur; },
      currentVariant: function () { return curVariant; },
      refresh: function () {
        if (!cur) return;
        var spec = cueSpec(cur);
        if (curFinished) { if (spec && spec.ambient) playSynth(spec.ambient); return; }
        play(cur, curVariant);
      }
    };
  })();
  function syncSfxBtn() {
    $("btnSfx").textContent = "聲音：" + (SFX.isOn() ? "開" : "關");
    $("btnSfx").setAttribute("aria-pressed", SFX.isOn() ? "true" : "false");
  }
  $("btnSfx").addEventListener("click", function () {
    var on = SFX.toggle();
    syncSfxBtn();
    if (on) BGM.refresh(); else BGM.stop(false);
  });
  syncSfxBtn();
  BGM.play("travelerTitle"); /* autoplay 被擋時只記 cue;第一次手勢由 unlockAudioOnce 補播 */
  function unlockAudioOnce() { /* 首次手勢(滑鼠或鍵盤皆可,B-3):解鎖 AudioContext,補播當前 mood */
    document.removeEventListener("pointerdown", unlockAudioOnce);
    document.removeEventListener("keydown", unlockAudioOnce);
    var c = SFX.ctx();
    try { if (c && c.state === "suspended") c.resume(); } catch (e) {}
    BGM.refresh();
  }
  document.addEventListener("pointerdown", unlockAudioOnce);
  document.addEventListener("keydown", unlockAudioOnce);
  document.addEventListener("visibilitychange", function () { /* 背景頁暫停/回前景恢復 */
    if (document.hidden) BGM.stop(false); else BGM.refresh();
  });
  function sceneCue(sceneId) { /* 同名共用場景（如 SC-R1）可由章別覆寫，避免跨章誤播。 */
    var map = ASSETS && ASSETS.sceneBgm;
    return map && (map[CHAPTER_ID + ":" + sceneId] || map[sceneId]);
  }
  document.addEventListener("bd:scene", function (ev) { /* 場景→mood(資料驅動),同 mood 不重啟 */
    var mood = sceneCue(ev.detail.sceneId);
    if (mood && mood !== BGM.current()) BGM.play(mood);
  });
  document.addEventListener("bd:view", function (ev) { /* 雙章工坊 A/B/C:依認知里程碑,不按時間輪播 */
    var d = ev.detail || {};
    if (BGM.current() === "workshop") {
      if (d.scene === "A2-2" && (d.nodeId === "c1" || d.nodeId === "n3")) BGM.variant(1);
      else if (d.scene === "A2-3" && d.nodeId !== "nsch" && d.nodeId !== "n6") BGM.variant(1);
      else if ((d.scene === "A2-3" && (d.nodeId === "nsch" || d.nodeId === "n6")) || d.scene === "A2-4") BGM.variant(2);
      return;
    }
    if (BGM.current() === "ch2Catapult") {
      /* A=裝置與首輪；B=第一組乾淨關係成立後；C=換球複驗與雙球機關。 */
      if (d.scene === "B2-4" || (d.scene === "B2-3" && ["e3", "n6", "s2", "g1"].indexOf(d.nodeId) >= 0)) BGM.variant(2);
      else if (d.scene === "B2-3" && ["n1", "n2", "e1"].indexOf(d.nodeId) < 0) BGM.variant(1);
      else BGM.variant(0);
    }
  });
  document.addEventListener("bd:debate", function (ev) { /* 雙章辯論 A/B/C:開庭→支柱裂開→最後反撲 */
    if (BGM.current() !== "hall" && BGM.current() !== "ch2Debate") return;
    var d = ev.detail || {}, n = (d.broken || []).length;
    if (d.phase === "fr" || d.phase === "trap" || d.phase === "won") BGM.variant(2);
    else if (n >= (BGM.current() === "ch2Debate" ? 1 : 2)) BGM.variant(1);
    else BGM.variant(0);
  });
