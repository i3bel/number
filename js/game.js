document.addEventListener('DOMContentLoaded', () => {
  let count = 4;
  let tiles = [], expected = 1, phase = "idle";
  let timerInterval = null, startTime = 0;
  let nextCountInput = "";
  let wallpaperOffset = 0;

  const gameArea = document.getElementById("gameArea");
  const overlay = document.getElementById("overlay");
  const countEl = document.getElementById("count");
  const timerEl = document.getElementById("timer");

  function updateStatus() {
    // 当 expected 大于 count 时，显示最大为 count
    const current = Math.min(expected, count);
    countEl.textContent = `${count} / ${current}`;
  }




  function showOverlay(title, subtitle){
    overlay.innerHTML = `<h1 style="color:#e40900">${title}</h1>${subtitle?`<p style="color:#e40900">${subtitle}</p>`:''}`;
    overlay.classList.remove("hidden");
  }
  function hideOverlay(){ overlay.classList.add("hidden"); }

  function clearTiles(){ tiles.forEach(t=>t.remove()); tiles=[]; }

function createTiles(n){
  clearTiles();
  expected = 1;

  const areaWidth = gameArea.clientWidth;
  const areaHeight = window.innerHeight - 20; // 保留少量缓冲，不让圆圈贴底

  for(let i = 1; i <= n; i++){
    const div = document.createElement("div");
    div.className = "tile";
    div.innerHTML = `<span>${i}</span>`;
    let x, y, ok = false;

    while(!ok){
      x = Math.random() * (areaWidth - 88); // 圆圈宽度 88px
      y = Math.random() * (areaHeight - 88);
      // 碰撞检测
      ok = !tiles.some(t => Math.hypot(parseFloat(t.style.left) - x, parseFloat(t.style.top) - y) < 95);
    }

    div.style.left = x + "px";
    div.style.top = y + "px";
    div.dataset.num = i;
    div.addEventListener("click", () => onTileClick(div));
    gameArea.appendChild(div);
    tiles.push(div);
  }
}

function startTimer(){
    startTime = Date.now();
    timerInterval = setInterval(()=>{
        const elapsed = (Date.now() - startTime) / 1000;

        if(elapsed >= 100){
            stopTimer();
            timerEl.textContent = "在?";
            return;
        }

        timerEl.textContent = elapsed.toFixed(0);
    }, 100);
}

  function stopTimer(){ if(timerInterval) clearInterval(timerInterval); }

  let showTimeout=null;
  function startRound(){
    phase="show";
    hideOverlay();
    createTiles(count);
    expected = 1; // 重置下一轮数字
    updateStatus(); // 确保数筹显示正确
    startTimer();
    const showTime=Math.max(2000,count*700);
    showTimeout=setTimeout(()=>{ tiles.forEach(t=>t.classList.add("hidden")); phase="play"; }, showTime);
  }

function onTileClick(tile){
    if(phase !== "play") return;
    if(tile.classList.contains("correct")) return;
    const num = parseInt(tile.dataset.num);

    if(num === expected){
        tile.classList.add("correct");
        tile.classList.remove("wrong");
        expected++;

        // ✅ 在这里更新状态栏显示总数 / 当前数字
        updateStatus();

        if(expected > count){
            phase = "completed";
            stopTimer();
            const subtitle = nextCountInput ? 
                `Next Round: ${nextCountInput} · Press Space to Continue` : 
                `时计: ${timerEl.textContent} · 阙续游`;
            showOverlay("功成不负此间行", subtitle);
        }
    } else {
        tile.classList.add("wrong");
    }
}


  document.addEventListener("keydown",e=>{
    // 空格逻辑
    if(e.code==="Space"){ e.preventDefault();
      if(phase==="idle"||phase==="completed"){
        if(nextCountInput) count=parseInt(nextCountInput);
        startRound(); 
        nextCountInput="";
      } else if(phase==="show"){
        clearTimeout(showTimeout);
        tiles.forEach(t=>t.classList.add("hidden"));
        phase="play";
      }
    }

    // Tab 显示作弊
    if(e.code==="Tab"){ e.preventDefault(); if(phase==="play") tiles.forEach(t=>{ t.classList.remove("hidden"); t.classList.add("cheat"); }); }

    // 壁纸微调
    if(e.shiftKey&&e.code==="ArrowUp"){ wallpaperOffset-=10; updateWallpaperPosition(); }
    if(e.shiftKey&&e.code==="ArrowDown"){ wallpaperOffset+=10; updateWallpaperPosition(); }

    // 数字输入和删除
    if(phase==="completed"){
      if(/Digit[0-9]/.test(e.code)){
        nextCountInput+=e.key;
        showOverlay("功成不负此间行", `次局: ${nextCountInput} · 阙续游`);
      }
      else if(e.code==="Backspace"){
        nextCountInput=nextCountInput.slice(0,-1);
        const subtitle=nextCountInput?`Next Round: ${nextCountInput} · Press Space to Continue`:`time: ${timerEl.textContent} · Press Space to Continue`;
        showOverlay("Completed",subtitle);
      }


    }
  });

  document.addEventListener("keyup",e=>{ 
    if(e.code==="Tab"&&phase==="play") tiles.forEach(t=>{ t.classList.add("hidden"); t.classList.remove("cheat"); }); 
  });


let startY = 0;

// 触摸开始
overlay.addEventListener("touchstart", e => {
  if(phase !== "completed") return; // 只在完成界面有效
  startY = e.touches[0].clientY;
});

// 触摸滑动
overlay.addEventListener("touchmove", e => {
  if(phase !== "completed") return;

  let currentY = e.touches[0].clientY;
  let diff = startY - currentY;

  if(Math.abs(diff) > 30) { // 阈值
    e.preventDefault(); // 阻止滚动

    if(diff > 0) {
      // 上划 → 增加数量
      nextCountInput = nextCountInput ? (parseInt(nextCountInput) + 1).toString() : "1";
    } else {
      // 下滑 → 减少数量
      nextCountInput = nextCountInput ? (Math.max(1, parseInt(nextCountInput) - 1)).toString() : "1";
    }

    showOverlay("功成不负此间行", `次局: ${nextCountInput} · 阙续游`);

    startY = currentY; // 重置起点，实现连续滑动可累加
  }
}, { passive: false });


  // 点击 overlay 开始
  overlay.addEventListener("click",()=>{
    if(phase==="idle"||phase==="completed"){
      if(nextCountInput) count=parseInt(nextCountInput);
      startRound();
      nextCountInput="";
    } else if(phase==="show"){
      clearTimeout(showTimeout);
      tiles.forEach(t=>t.classList.add("hidden"));
      phase="play";
    }
  });

  function isTile(target){ return target.classList.contains("tile")||target.closest(".tile"); }
  gameArea.addEventListener("click",e=>{
    if(isTile(e.target)) return;
    if(phase==="idle"||phase==="completed"){
      if(nextCountInput) count=parseInt(nextCountInput);
      startRound();
      nextCountInput="";
    } else if(phase==="show"){
      clearTimeout(showTimeout);
      tiles.forEach(t=>t.classList.add("hidden"));
      phase="play";
    }
  });

  // 长按作弊逻辑
  let longPressTimer=null,longPressTriggered=false;
  gameArea.addEventListener("touchstart",e=>{
    if(e.target.closest(".tile")) return; 
    longPressTriggered=false;
    longPressTimer=setTimeout(()=>{
      if(phase==="play"){ tiles.forEach(t=>{ t.classList.remove("hidden"); t.classList.add("cheat"); }); longPressTriggered=true; } 
    },400);
  });
  gameArea.addEventListener("touchend",()=>{ 
    clearTimeout(longPressTimer); 
    if(longPressTriggered&&phase==="play"){ tiles.forEach(t=>{ t.classList.add("hidden"); t.classList.remove("cheat"); }); } 
  });
  gameArea.addEventListener("touchmove",()=>{ clearTimeout(longPressTimer); });

  // 壁纸逻辑
  const wallpaper=document.getElementById("wallpaper");
  const input=document.getElementById("wallpaperInput");
  const resetBtn=document.getElementById("resetWallpaper");

  function updateWallpaperPosition(){ wallpaper.style.backgroundPosition=`center ${wallpaperOffset}px`; localStorage.setItem("wallpaperOffset",wallpaperOffset); }
  input.addEventListener("change",()=>{ 
    const file=input.files[0]; 
    if(!file) return; 
    const reader=new FileReader(); 
    reader.onload=e=>{ wallpaper.style.backgroundImage=`url(${e.target.result})`; wallpaper.style.opacity=1; }; 
    reader.readAsDataURL(file); 
  });
  resetBtn.addEventListener("click",()=>{ wallpaper.style.backgroundImage=""; wallpaper.style.opacity=1; wallpaperOffset=0; updateWallpaperPosition(); });

  function loadDefaultWallpaper(){
    const exts=["jpg","png","jfif"]; let loaded=false;
    exts.forEach(ext=>{
      const img=new Image(); img.src=`./wallpaper.${ext}`;
      img.onload=()=>{ 
        if(!loaded){ 
          wallpaper.style.backgroundImage=`url(${img.src})`; 
          wallpaper.style.opacity=1; 
          loaded=true; 
          const savedOffset=parseInt(localStorage.getItem("wallpaperOffset"))||0; 
          wallpaperOffset=savedOffset; 
          updateWallpaperPosition(); 
        } 
      }; 
    });
  }

  loadDefaultWallpaper();
  updateStatus();
  showOverlay("猿心辨数试仙才","阙启游・柬显数");
});

// 初始滚动到游戏区域
window.addEventListener("load", () => { window.scrollTo(0, window.innerHeight * 0.2); });

// 禁止页面滑动
document.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });
