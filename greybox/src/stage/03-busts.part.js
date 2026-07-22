  /* ---------- 對話框左側半身像 ---------- */
  var curBustId = null;
  function buildBustImg(e, alt) { /* ART-ADR-001 混合制;高度貼容器,不裁不鏡像 */
    if (!e.layers || !e.layers.length) {
      var img = document.createElement("img");
      img.src = assetUrl(e); img.alt = alt || "角色立繪";
      return img;
    }
    var wrap = document.createElement("span");
    wrap.style.position = "relative"; wrap.style.display = "inline-block"; wrap.style.height = "100%";
    var base = document.createElement("img");
    base.src = assetUrl(e); base.alt = alt || "角色立繪";
    base.style.height = "100%"; base.style.width = "auto"; base.style.display = "block";
    wrap.appendChild(base);
    e.layers.forEach(function (L) {
      if (!L.path) return;
      var li = document.createElement("img");
      li.src = ASSETS.basePath + L.path; li.alt = "";
      li.style.position = "absolute";
      li.style.left = (100 * L.anchorX / e.w) + "%";
      li.style.top = (100 * L.anchorY / e.h) + "%";
      li.style.width = (100 * L.w / e.w) + "%";
      li.style.height = "auto";
      wrap.appendChild(li);
    });
    return wrap;
  }
  /* 左右雙肖像槽(Sol 審核 20260720):站位由 assets.speakerSide 決定(依原圖朝向,永不鏡像);
     旅人=無臉中性剪影,站對手相反側,按側選圖(travelerSilhouette 資料);
     發言者亮/對方暗;旁白系統=雙暗;預設開啟,?travelerBust=0 一鍵撤回(A/B)。 */
  var TRAVELER = { "旅人": 1, "旅人(你)": 1 };
  var travelerOn = true;
  try { travelerOn = !/[?&]travelerBust=0/.test(window.location.search); } catch (e) {}
  var SLOT_ID = { left: "bustLeft", right: "bustRight" };
  var slotEntry = { left: null, right: null };
  var npcSide = null;
  function otherSide(s) { return s === "left" ? "right" : "left"; }
  function sideOf(speaker) {
    var m = ASSETS && ASSETS.speakerSide;
    return (m && m[speaker]) || "right";
  }
  function fillSlot(side, entry, alt, masked) {
    var box = $(SLOT_ID[side]);
    if (slotEntry[side] !== entry.id) {
      slotEntry[side] = entry.id;
      box.innerHTML = "";
      box.appendChild(buildBustImg(entry, alt));
    }
    box.classList.toggle("masked", !!masked);
    $("dialogue").classList.add(side === "left" ? "has-l" : "has-r");
  }
  function clearSlot(side) {
    slotEntry[side] = null;
    $(SLOT_ID[side]).innerHTML = "";
    $("dialogue").classList.remove(side === "left" ? "has-l" : "has-r");
  }
  function setLit(side) { /* side="left"|"right"|"none":發言側亮,其餘暗 */
    ["left", "right"].forEach(function (s) {
      var b = $(SLOT_ID[s]);
      b.classList.toggle("lit", s === side);
      b.classList.toggle("dim", s !== side);
    });
    $("dialogue").setAttribute("data-active", side);
  }
  function ensureTraveler() { /* 旅人剪影站對手相反側;無對手時預設左 */
    if (!travelerOn) return null;
    var side = npcSide ? otherSide(npcSide) : "left";
    var map = ASSETS && ASSETS.travelerSilhouette;
    var e = map ? assetEntry(map[side]) : null;
    if (!e) return null;
    fillSlot(side, e, "旅人", false);
    return side;
  }
  function lineOverride(speaker, text) { /* 台詞級表情覆寫(資料驅動;Sol:用未上場表情,不重複生圖) */
    var rules = ASSETS && ASSETS.lineDialoguePortrait;
    if (!rules || !text) return null;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.scene === curSceneId && r.speaker === speaker && text.indexOf(r.match) >= 0)
        return assetEntry(r.asset);
    }
    return null;
  }
  function setBust(speaker, cls, text) {
    var noPortraitVoice = cls === "stage" || cls === "system";
    $("dialogue").classList.toggle("voice-no-portrait", noPortraitVoice);
    if (noPortraitVoice) { setLit("none"); return; } /* 旁白/系統:肖像退場並還回完整文字寬度 */
    if (TRAVELER[speaker] || cls === "player") {
      var tside = ensureTraveler();
      setLit(tside || "none"); /* 撤回剪影時=舊行為:對手壓暗 */
      return;
    }
    /* NPC:四層解析(台詞覆寫→場景覆寫→對話預設→舊筆記頭像遮罩;年代由資料層+測試保證) */
    var entry = lineOverride(speaker, text), masked = false;
    if (!entry && ASSETS && ASSETS.sceneDialoguePortrait && ASSETS.sceneDialoguePortrait[curSceneId])
      entry = assetEntry(ASSETS.sceneDialoguePortrait[curSceneId][speaker]);
    if (!entry && ASSETS && ASSETS.speakerDialoguePortrait)
      entry = assetEntry(ASSETS.speakerDialoguePortrait[speaker]);
    if (!entry && ASSETS && ASSETS.speakerPortrait) {
      entry = assetEntry(ASSETS.speakerPortrait[speaker]);
      masked = !!entry;
    }
    if (!entry) {
      $("dialogue").classList.add("voice-no-portrait");
      setLit("none");
      return;
    } /* 無圖角色:不沿用上一位肖像,還回完整文字寬度 */
    var side = sideOf(speaker);
    if (npcSide && npcSide !== side) clearSlot(npcSide); /* 對手換側:舊側清場 */
    npcSide = side;
    fillSlot(side, entry, speaker, masked);
    if (travelerOn) ensureTraveler(); else clearSlot(otherSide(side));
    setLit(side);
  }
