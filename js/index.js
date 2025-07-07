class MusicPlayer {
  constructor() {
    this.initializeElements();
    this.initializeState();
    this.bindEvents();
    this.createFloatingNotes();
    this.loadMusicLibrary();
  }

  initializeElements() {
    // 音频和控制元素
    this.audio = document.getElementById("audioPlayer");
    this.playBtn = document.getElementById("playBtn");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");

    // 进度和时间元素
    this.progressBar = document.getElementById("progressBar");
    this.progress = document.getElementById("progress");
    this.currentTimeEl = document.getElementById("currentTime");
    this.totalTimeEl = document.getElementById("totalTime");

    // 音量控制
    this.volumeSlider = document.getElementById("volumeSlider");
    this.volumeValue = document.getElementById("volumeValue");

    // 显示元素
    this.playlist = document.getElementById("playlist");
    this.songTitle = document.getElementById("songTitle");
    this.songArtist = document.getElementById("songArtist");
    this.albumArt = document.getElementById("albumArt");
    this.fileCount = document.getElementById("fileCount");

    // 播放模式按钮
    this.sequentialBtn = document.getElementById("sequentialBtn");
    this.randomBtn = document.getElementById("randomBtn");
    this.repeatBtn = document.getElementById("repeatBtn");

    // 定时器元素
    this.timerMinutes = document.getElementById("timerMinutes");
    this.startTimerBtn = document.getElementById("startTimerBtn");
    this.cancelTimerBtn = document.getElementById("cancelTimerBtn");
    this.timerStatus = document.getElementById("timerStatus");

    // 搜索元素
    this.searchInput = document.getElementById("searchInput");
    this.searchClear = document.getElementById("searchClear");
  }

  initializeState() {
    // 播放状态
    this.isPlaying = false;
    this.currentSongIndex = 0;
    this.playMode = "sequential";
    this.songs = [];
    this.filteredSongs = [];

    // 定时器
    this.timer = null;
    this.timerInterval = null;

    // 设置初始音量
    this.audio.volume = 0.5;
  }

  createFloatingNotes() {
    const notes = ["🎵", "🎶", "🎼", "♪", "♫", "♬"];
    const container = document.getElementById("floatingNotes");

    setInterval(() => {
      if (this.isPlaying && Math.random() > 0.7) {
        const note = document.createElement("div");
        note.className = "note";
        note.textContent = notes[Math.floor(Math.random() * notes.length)];
        note.style.left = Math.random() * 100 + "%";
        note.style.animationDuration = Math.random() * 10 + 10 + "s";
        note.style.fontSize = Math.random() * 20 + 15 + "px";

        container.appendChild(note);

        setTimeout(() => {
          if (note.parentNode) {
            note.parentNode.removeChild(note);
          }
        }, 20000);
      }
    }, 2000);
  }

  async loadMusicLibrary() {
    try {
      this.showLoading("正在加载音乐库...");
      const response = await fetch("music(love).json");
      if (!response.ok) {
        throw new Error("无法加载音乐库数据");
      }

      const musicData = await response.json();
      console.log(musicData);

      // 处理音乐数据
      this.songs = musicData.map((item) => {
        const { title, artist } = this.parseFileName(item.fileName);
        return {
          title: title,
          artist: artist,
          src: item.filePath,
          cover: this.getRandomEmoji(),
          duration: 0, // 将在播放时获取
          fileName: item.fileName,
        };
      });

      this.filteredSongs = [...this.songs];

      if (this.songs.length === 0) {
        this.showMessage("音乐库为空");
        this.updateFileCount("音乐库为空");
        return;
      }

      this.updateFileCount(`音乐库: ${this.songs.length} 首音乐`);
      this.renderPlaylist();
      this.enableControls();
      this.loadSong(0);
    } catch (error) {
      console.error("加载音乐库失败:", error);
      this.showMessage("加载音乐库失败，请检查网络连接");
      this.updateFileCount("加载失败");
    }
  }

  parseFileName(fileName) {
    // 移除文件扩展名
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

    // 尝试解析不同的格式
    let title = nameWithoutExt;
    let artist = "未知艺术家";

    // 格式1: "艺术家 - 歌曲名"
    if (nameWithoutExt.includes(" - ")) {
      const parts = nameWithoutExt.split(" - ");
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }
    }
    // 格式2: "歌曲名-艺术家"
    else if (
      nameWithoutExt.includes("-") &&
      !nameWithoutExt.includes("(") &&
      !nameWithoutExt.includes("#")
    ) {
      const parts = nameWithoutExt.split("-");
      if (parts.length >= 2) {
        title = parts[0].trim();
        artist = parts[1].trim();
      }
    }
    // 格式3: 包含括号的情况，如 "歌曲名(版本) - 艺术家"
    else if (nameWithoutExt.includes("(") && nameWithoutExt.includes(")")) {
      const match = nameWithoutExt.match(/^(.+?)\s*$$[^)]*$$\s*-\s*(.+)$/);
      if (match) {
        title = match[1].trim();
        artist = match[2].trim();
      } else {
        // 如果没有匹配到，尝试其他解析方式
        const parts = nameWithoutExt.split(/\s*-\s*/);
        if (parts.length >= 2) {
          title = parts[0].trim();
          artist = parts[1].trim();
        }
      }
    }

    // 清理特殊字符和编号
    title = title.replace(/^\d+\.\s*/, ""); // 移除开头的数字编号
    title = title.replace(/#[a-zA-Z0-9]+$/, ""); // 移除结尾的哈希标签
    artist = artist.replace(/#[a-zA-Z0-9]+$/, ""); // 移除结尾的哈希标签

    return { title, artist };
  }

  bindEvents() {
    // 播放控制事件
    this.playBtn.addEventListener("click", () => this.togglePlay());
    this.prevBtn.addEventListener("click", () => this.prevSong());
    this.nextBtn.addEventListener("click", () => this.nextSong());

    // 音频事件
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("loadedmetadata", () => this.updateDuration());
    this.audio.addEventListener("ended", () => this.handleSongEnd());
    this.audio.addEventListener("play", () => this.onPlay());
    this.audio.addEventListener("pause", () => this.onPause());
    this.audio.addEventListener("error", (e) => this.handleAudioError(e));

    // 进度条事件
    this.progressBar.addEventListener("click", (e) => this.setProgress(e));

    // 音量控制事件
    this.volumeSlider.addEventListener("input", (e) =>
      this.setVolume(e.target.value)
    );

    // 播放模式事件
    this.sequentialBtn.addEventListener("click", () =>
      this.setPlayMode("sequential")
    );
    this.randomBtn.addEventListener("click", () => this.setPlayMode("random"));
    this.repeatBtn.addEventListener("click", () => this.setPlayMode("repeat"));

    // 定时器事件
    this.startTimerBtn.addEventListener("click", () => this.startTimer());
    this.cancelTimerBtn.addEventListener("click", () => this.cancelTimer());

    // 搜索事件
    this.searchInput.addEventListener("input", (e) =>
      this.handleSearch(e.target.value)
    );
    this.searchClear.addEventListener("click", () => this.clearSearch());

    // 键盘快捷键
    this.setupKeyboardShortcuts();
  }

  handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();

    if (searchTerm === "") {
      this.searchClear.classList.remove("show");
      this.filteredSongs = [...this.songs];
    } else {
      this.searchClear.classList.add("show");
      this.filteredSongs = this.songs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchTerm) ||
          song.artist.toLowerCase().includes(searchTerm)
      );
    }

    this.renderPlaylist();

    if (this.filteredSongs.length === 0 && searchTerm !== "") {
      this.showNoResults();
    }
  }

  clearSearch() {
    this.searchInput.value = "";
    this.searchClear.classList.remove("show");
    this.filteredSongs = [...this.songs];
    this.renderPlaylist();
  }

  showNoResults() {
    this.playlist.innerHTML = '<div class="no-results">未找到匹配的歌曲</div>';
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          this.togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          this.prevSong();
          break;
        case "ArrowRight":
          e.preventDefault();
          this.nextSong();
          break;
        case "ArrowUp":
          e.preventDefault();
          this.adjustVolume(10);
          break;
        case "ArrowDown":
          e.preventDefault();
          this.adjustVolume(-10);
          break;
      }
    });
  }

  handleAudioError(e) {
    console.error("音频播放错误:", e);
    this.showMessage(
      `播放失败: ${this.songs[this.currentSongIndex]?.title || "未知歌曲"}`
    );

    // 尝试播放下一首
    setTimeout(() => {
      this.nextSong();
    }, 2000);
  }

  getRandomEmoji() {
    const emojis = [
      "🎵",
      "🎶",
      "🎼",
      "🎤",
      "🎧",
      "🎸",
      "🎹",
      "🥁",
      "🎺",
      "🎷",
      "🎻",
      "🪕",
    ];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  showLoading(message) {
    this.playlist.innerHTML = `<div class="loading">${message}</div>`;
  }

  showMessage(message) {
    this.playlist.innerHTML = `<div class="loading">${message}</div>`;
  }

  updateFileCount(message) {
    this.fileCount.textContent = message;
  }

  enableControls() {
    this.playBtn.disabled = false;
    this.prevBtn.disabled = false;
    this.nextBtn.disabled = false;
  }

  renderPlaylist() {
    this.playlist.innerHTML = "";

    if (this.filteredSongs.length === 0) {
      this.showNoResults();
      return;
    }

    this.filteredSongs.forEach((song, index) => {
      const originalIndex = this.songs.indexOf(song);
      const item = document.createElement("div");
      item.className = "playlist-item fade-in";
      item.innerHTML = `
              <div class="song-details">
                  <div class="title">${this.escapeHtml(song.title)}</div>
                  <div class="artist">${this.escapeHtml(song.artist)}</div>
              </div>
              <div class="song-duration">${this.formatTime(song.duration)}</div>
          `;
      item.addEventListener("click", () => this.loadSong(originalIndex));

      // 高亮当前播放的歌曲
      if (originalIndex === this.currentSongIndex) {
        item.classList.add("active");
      }

      this.playlist.appendChild(item);
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  loadSong(index) {
    if (index < 0 || index >= this.songs.length) return;

    this.currentSongIndex = index;
    const song = this.songs[index];

    this.audio.src = song.src;
    this.songTitle.textContent = song.title;
    this.songArtist.textContent = song.artist;
    // this.albumArt.querySelector(".emoji").textContent = song.cover;

    // 更新播放列表高亮
    this.renderPlaylist();

    // 滚动到当前歌曲
    const activeItem = document.querySelector(".playlist-item.active");
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (this.isPlaying) {
      this.play();
    }
  }

  togglePlay() {
    if (this.songs.length === 0) {
      this.showMessage("请先加载音乐文件");
      return;
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio
      .play()
      .then(() => {
        this.isPlaying = true;
        this.playBtn.textContent = "⏸️";
        this.albumArt.classList.add("playing");
      })
      .catch((e) => {
        console.error("播放失败:", e);
        this.showMessage("播放失败，请检查音频文件");
      });
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playBtn.textContent = "▶️";
    this.albumArt.classList.remove("playing");
  }

  onPlay() {
    this.isPlaying = true;
    this.playBtn.textContent = "⏸️";
    this.albumArt.classList.add("playing");
  }

  onPause() {
    this.isPlaying = false;
    this.playBtn.textContent = "▶️";
    this.albumArt.classList.remove("playing");
  }

  prevSong() {
    if (this.songs.length === 0) return;

    let newIndex;
    if (this.playMode === "random") {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } else {
      newIndex = this.currentSongIndex - 1;
      if (newIndex < 0) newIndex = this.songs.length - 1;
    }
    this.loadSong(newIndex);
  }

  nextSong() {
    if (this.songs.length === 0) return;

    let newIndex;
    if (this.playMode === "random") {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } else {
      newIndex = this.currentSongIndex + 1;
      if (newIndex >= this.songs.length) newIndex = 0;
    }
    this.loadSong(newIndex);
  }

  handleSongEnd() {
    if (this.playMode === "repeat") {
      this.audio.currentTime = 0;
      this.play();
    } else {
      this.nextSong();
    }
  }

  setProgress(e) {
    if (!this.audio.duration) return;

    const rect = this.progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.audio.currentTime = percent * this.audio.duration;
  }

  updateProgress() {
    if (this.audio.duration) {
      const percent = (this.audio.currentTime / this.audio.duration) * 100;
      this.progress.style.width = percent + "%";
      this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
  }

  updateDuration() {
    this.totalTimeEl.textContent = this.formatTime(this.audio.duration);

    // 更新歌曲时长信息
    if (this.songs[this.currentSongIndex]) {
      this.songs[this.currentSongIndex].duration = this.audio.duration;
    }
  }

  setVolume(value) {
    this.audio.volume = value / 100;
    this.volumeValue.textContent = value + "%";

    const volumeIcon = document.querySelector(".volume-icon");
    if (value == 0) {
      volumeIcon.textContent = "🔇";
    } else if (value < 50) {
      volumeIcon.textContent = "🔉";
    } else {
      volumeIcon.textContent = "🔊";
    }
  }

  adjustVolume(delta) {
    const currentVolume = parseInt(this.volumeSlider.value);
    const newVolume = Math.max(0, Math.min(100, currentVolume + delta));
    this.volumeSlider.value = newVolume;
    this.setVolume(newVolume);
  }

  setPlayMode(mode) {
    this.playMode = mode;

    document
      .querySelectorAll(".mode-btn")
      .forEach((btn) => btn.classList.remove("active"));

    switch (mode) {
      case "sequential":
        this.sequentialBtn.classList.add("active");
        break;
      case "random":
        this.randomBtn.classList.add("active");
        break;
      case "repeat":
        this.repeatBtn.classList.add("active");
        break;
    }
  }

  startTimer() {
    const minutes = parseInt(this.timerMinutes.value);
    if (!minutes || minutes <= 0) {
      alert("请输入有效的分钟数（1-999）");
      return;
    }

    this.cancelTimer();

    let remainingSeconds = minutes * 60;
    this.updateTimerStatus(remainingSeconds);

    this.timerInterval = setInterval(() => {
      remainingSeconds--;
      this.updateTimerStatus(remainingSeconds);

      if (remainingSeconds <= 0) {
        this.pause();
        this.cancelTimer();
        this.showNotification("⏰ 定时关闭时间到，音乐已暂停");
      }
    }, 1000);
  }

  cancelTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerStatus.textContent = "";
  }

  updateTimerStatus(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.timerStatus.textContent = `剩余 ${minutes}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  showNotification(message) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("音乐播放器", { body: message });
    } else {
      alert(message);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
}

// 初始化播放器
document.addEventListener("DOMContentLoaded", () => {
  const player = new MusicPlayer();

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});
